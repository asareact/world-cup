'use client'

import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/database'
import type { MatchEvent } from '@/lib/database'

// Define the shape of a single event recorded by the referee
export interface LiveMatchEvent {
  id: string;
  player_id: string;
  team_id: string;
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'own_goal' | 'assist';
  timestamp: number;
  minute: number;
  description: string | null;
  assist_player_id: string | null;
}

// Define the overall state of the match being refereed
interface MatchState {
  time: number; // Time in seconds for the current half
  isRunning: boolean;
  currentHalf: 'first' | 'second' | 'finished';
  score: { home: number; away: number };
  events: LiveMatchEvent[];
  isFinalizing: boolean;
}

const MATCH_DURATION_MINUTES = 25;

export function useMatchState(matchId: string, homeTeamId?: string, awayTeamId?: string) {
  const [state, setState] = useState<MatchState | null>(null);

  const getLocalStorageKey = useCallback(() => `match-state-${matchId}`, [matchId]);

  // Load state from Local Storage on initial mount
  useEffect(() => {
    if (!matchId) return;
    try {
      const savedState = localStorage.getItem(getLocalStorageKey());
      if (savedState) {
        const parsedState = JSON.parse(savedState) as MatchState;
        // Safely add property if loading state from a previous version
        if (typeof parsedState.isFinalizing === 'undefined') {
          parsedState.isFinalizing = false;
        }
        setState(parsedState);
      } else {
        // Initialize with default state if nothing is saved
        setState({
          time: MATCH_DURATION_MINUTES * 60,
          isRunning: false,
          currentHalf: 'first',
          score: { home: 0, away: 0 },
          events: [],
          isFinalizing: false,
        });
      }
    } catch (error) {
      console.error("Failed to load match state from local storage:", error);
      // Initialize with default state in case of error
       setState({
          time: MATCH_DURATION_MINUTES * 60,
          isRunning: false,
          currentHalf: 'first',
          score: { home: 0, away: 0 },
          events: [],
          isFinalizing: false,
        });
    }
  }, [matchId, getLocalStorageKey]);

  // Save state to Local Storage whenever it changes
  useEffect(() => {
    if (state && matchId) {
      try {
        localStorage.setItem(getLocalStorageKey(), JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save match state to local storage:", error);
      }
    }
  }, [state, matchId, getLocalStorageKey]);

  // Timer logic
  useEffect(() => {
    if (!state || !state.isRunning) {
      return;
    }

    const timerInterval = setInterval(() => {
      setState(prevState => {
        if (!prevState) return null;

        if (prevState.time > 0) {
          return { ...prevState, time: prevState.time - 1 };
        }

        // Time's up for the current half
        if (prevState.currentHalf === 'first') {
          return {
            ...prevState,
            isRunning: false,
            currentHalf: 'second',
            time: MATCH_DURATION_MINUTES * 60, // Reset for second half
          };
        } else {
          return {
            ...prevState,
            isRunning: false,
            currentHalf: 'finished',
          };
        }
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [state]);

  const startTimer = () => {
    if (state && !state.isRunning && state.currentHalf !== 'finished') {
      setState({ ...state, isRunning: true });
    }
  };

  const pauseTimer = () => {
    if (state && state.isRunning) {
      setState({ ...state, isRunning: false });
    }
  };

  const stopTimer = () => {
    if (state) {
      setState({
        ...state,
        isRunning: false,
        time: MATCH_DURATION_MINUTES * 60, // Reset to initial time
        currentHalf: 'first', // Reset to first half
        score: { home: 0, away: 0 }, // Reset score
        events: [], // Clear all events
      });
    }
  };

  const addEvent = useCallback((event: Omit<LiveMatchEvent, 'timestamp' | 'minute' | 'id'>) => {
    setState(prevState => {
      if (!prevState) return null;

      // Calculate the minute of the event
      const elapsedSeconds = (MATCH_DURATION_MINUTES * 60) - prevState.time;
      const currentMinute = Math.floor(elapsedSeconds / 60) + 1;
      const minuteOfMatch = prevState.currentHalf === 'first' 
        ? currentMinute 
        : MATCH_DURATION_MINUTES + currentMinute;

      const newEvent: LiveMatchEvent = { 
        ...event, 
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
        minute: minuteOfMatch, 
        timestamp: Date.now() 
      };
      
      // Update score based on event
      const newScore = { ...prevState.score };
      if (newEvent.event_type === 'goal') {
        if (newEvent.team_id === homeTeamId) {
          newScore.home += 1;
        } else if (newEvent.team_id === awayTeamId) {
          newScore.away += 1;
        }
      } else if (newEvent.event_type === 'own_goal') {
        if (newEvent.team_id === homeTeamId) {
          newScore.away += 1; // Other team gets the point
        } else if (newEvent.team_id === awayTeamId) {
          newScore.home += 1;
        }
      }

      return {
        ...prevState,
        events: [...prevState.events, newEvent],
        score: newScore,
      };
    });
  }, [homeTeamId, awayTeamId]);

  const deleteEvent = (eventId: string) => {
    setState(prevState => {
      if (!prevState || prevState.events.length === 0) return prevState;

      const eventToDelete = prevState.events.find(event => event.id === eventId);
      if (!eventToDelete) return prevState;

      const newEvents = prevState.events.filter(event => event.id !== eventId);
      const newScore = { ...prevState.score };

      if (eventToDelete.event_type === 'goal') {
        if (eventToDelete.team_id === homeTeamId) {
          newScore.home = Math.max(0, newScore.home - 1);
        } else if (eventToDelete.team_id === awayTeamId) {
          newScore.away = Math.max(0, newScore.away - 1);
        }
      } else if (eventToDelete.event_type === 'own_goal') {
        if (eventToDelete.team_id === homeTeamId) {
          newScore.away = Math.max(0, newScore.away - 1); // Other team gets the point
        } else if (eventToDelete.team_id === awayTeamId) {
          newScore.home = Math.max(0, newScore.home - 1);
        }
      }

      return {
        ...prevState,
        events: newEvents,
        score: newScore,
      };
    });
  };

  const editEvent = (eventId: string, updatedEvent: Partial<Omit<LiveMatchEvent, 'id' | 'timestamp' | 'minute'>>) => {
    setState(prevState => {
      if (!prevState || prevState.events.length === 0) return prevState;

      const eventToEdit = prevState.events.find(event => event.id === eventId);
      if (!eventToEdit) return prevState;

      const newEvents = prevState.events.map(event => 
        event.id === eventId 
          ? { ...event, ...updatedEvent } as LiveMatchEvent 
          : event
      );

      // Recalculate score since the event type might have changed
      let newScore = { home: 0, away: 0 };
      newEvents.forEach(event => {
        if (event.event_type === 'goal') {
          if (event.team_id === homeTeamId) {
            newScore.home += 1;
          } else if (event.team_id === awayTeamId) {
            newScore.away += 1;
          }
        } else if (event.event_type === 'own_goal') {
          if (event.team_id === homeTeamId) {
            newScore.away += 1; // Other team gets the point
          } else if (event.team_id === awayTeamId) {
            newScore.home += 1;
          }
        }
      });

      return {
        ...prevState,
        events: newEvents,
        score: newScore,
      };
    });
  };

  const undoLastEvent = () => {
    setState(prevState => {
      if (!prevState || prevState.events.length === 0) return prevState;

      const lastEvent = prevState.events[prevState.events.length - 1];
      const newEvents = prevState.events.slice(0, -1);
      const newScore = { ...prevState.score };

      if (lastEvent.event_type === 'goal') {
        if (lastEvent.team_id === homeTeamId) {
          newScore.home = Math.max(0, newScore.home - 1);
        } else if (lastEvent.team_id === awayTeamId) {
          newScore.away = Math.max(0, newScore.away - 1);
        }
      } else if (lastEvent.event_type === 'own_goal') {
        if (lastEvent.team_id === homeTeamId) {
          newScore.away = Math.max(0, newScore.away - 1);
        } else if (lastEvent.team_id === awayTeamId) {
          newScore.home = Math.max(0, newScore.home - 1);
        }
      }

      return {
        ...prevState,
        events: newEvents,
        score: newScore,
      };
    });
  };

  const finalizeMatch = async (playerIds: string[]) => {
    if (!state || !matchId) {
      console.error("Cannot finalize, state or matchId is missing.");
      alert("Error: No se puede finalizar el partido, falta el estado o el ID.");
      return;
    }

    setState(prevState => prevState ? { ...prevState, isFinalizing: true } : null);

    try {
      await db.saveMatchResults(
        matchId,
        state.score.home,
        state.score.away,
        state.events,
        playerIds
      );
      
      localStorage.removeItem(getLocalStorageKey());
      alert("Partido finalizado y estadísticas guardadas exitosamente.");
      setState(prevState => prevState ? { ...prevState, isRunning: false, currentHalf: 'finished', isFinalizing: false } : null);

    } catch (error) {
      console.error("Failed to finalize match:", error);
      alert(`Error al guardar las estadísticas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setState(prevState => prevState ? { ...prevState, isFinalizing: false } : null);
    }
  };

  return {
    state,
    actions: {
      startTimer,
      pauseTimer,
      stopTimer,
      addEvent,
      undoLastEvent,
      deleteEvent,
      editEvent,
      finalizeMatch,
    },
  };
}
