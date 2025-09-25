'use client'

import { useState, useEffect } from 'react'
import { Match, Team } from '@/lib/database'
import { Calendar, Clock, Users, Edit3, Save, X } from 'lucide-react'

interface TournamentCalendarProps {
  tournamentId: string
  teams: Pick<Team, "id" | "name" | "logo_url">[] | undefined | null
  initialMatches: Match[] | undefined | null
  isAdmin: boolean
  startDate?: Date  // Optional start date for scheduling
  leagueTimeZone?: string  // Optional timezone for scheduling
}

interface MatchSlot {
  time: string
  match: Match | null
}

interface DaySchedule {
  date: string
  dayOfWeek: string
  slots: MatchSlot[]
}

// Spanish days mapping
const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Time slots for matches (updated to match requirements)
const timeSlots = ['20:00', '21:00', '22:00']

// Helper function to format date with timezone
const formatDateWithTimezone = (date: Date, timeZone?: string): string => {
  if (timeZone) {
    return date.toLocaleDateString('en-CA', { timeZone });
  }
  return date.toISOString().split('T')[0];
}

// Helper function to get day of week in timezone
const getDayOfWeekWithTimezone = (date: Date, timeZone?: string): number => {
  if (timeZone) {
    return new Date(date.toLocaleString('en-US', { timeZone })).getDay();
  }
  return date.getDay();
}

// Function to validate teams for the calendar component (works with partial Team type)
const validateTeamsForCalendar = (teams: Pick<Team, "id" | "name" | "logo_url">[]): { isValid: boolean; error?: string } => {
  if (!Array.isArray(teams)) {
    return { isValid: false, error: 'Teams must be an array' };
  }
  
  if (teams.length < 3) {
    return { isValid: false, error: 'Tournament requires at least 3 teams' };
  }
  
  // Check for duplicate names
  const names = teams.map(t => t.name?.trim().toLowerCase() || '');
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== teams.length) {
    return { isValid: false, error: 'Team names must be unique' };
  }
  
  // Check for empty or whitespace-only names
  for (const team of teams) {
    const normalizedName = team.name?.trim();
    if (!normalizedName || normalizedName.length === 0) {
      return { isValid: false, error: 'Team names cannot be empty or contain only spaces' };
    }
  }
  
  return { isValid: true };
};

// Function to validate teams
const validateTeams = (teams: Team[]): { isValid: boolean; error?: string } => {
  if (!Array.isArray(teams)) {
    return { isValid: false, error: 'Teams must be an array' };
  }
  
  if (teams.length < 3) {
    return { isValid: false, error: 'Tournament requires at least 3 teams' };
  }
  
  // Check for duplicate names
  const names = teams.map(t => t.name?.trim().toLowerCase() || '');
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== teams.length) {
    return { isValid: false, error: 'Team names must be unique' };
  }
  
  // Check for empty or whitespace-only names
  for (const team of teams) {
    const normalizedName = team.name?.trim();
    if (!normalizedName || normalizedName.length === 0) {
      return { isValid: false, error: 'Team names cannot be empty or contain only spaces' };
    }
  }
  
  return { isValid: true };
};

// Function to generate proper round-robin pairings using the circle method
const generateRoundRobinPairings = (teams: Pick<Team, "id" | "name" | "logo_url">[]): { round: number; matches: [string, string][] }[] => {
  const validation = validateTeamsForCalendar(teams);
  if (!validation.isValid) {
    console.error(validation.error);
    return [];
  }

  const rounds: { round: number; matches: [string, string][] }[] = [];
  const teamList = [...teams]; // Copy array to avoid mutating original
  const isOdd = teamList.length % 2 === 1;
  
  // If odd number of teams, add a "bye" placeholder
  if (isOdd) {
    teamList.push({ id: 'bye', name: 'BYE', logo_url: null } as Team);
  }
  
  const n = teamList.length;
  const numRounds = n - 1;
  
  for (let round = 0; round < numRounds; round++) {
    const roundMatches: [string, string][] = [];
    
    // Fix first position (team at index 0) and rotate others
    for (let i = 0; i < n / 2; i++) {
      const team1 = teamList[i];
      const team2 = teamList[n - 1 - i];
      
      // If either team is BYE, skip this match (it's a bye)
      if (team1.id !== 'bye' && team2.id !== 'bye') {
        // Alternate home/away to ensure fairness
        const homeId = round % 2 === 0 ? team1.id : team2.id;
        const awayId = round % 2 === 0 ? team2.id : team1.id;
        roundMatches.push([homeId, awayId]);
      }
    }
    
    rounds.push({
      round: round + 1,
      matches: roundMatches
    });
    
    // Rotate teams for next round (keep first position fixed)
    const firstTeam = teamList[0];
    const rotatedTeams = [firstTeam, teamList[n - 1], ...teamList.slice(1, n - 1)];
    teamList.splice(0, n, ...rotatedTeams);
  }
  
  return rounds;
}

// Function to generate schedule with proper round handling
const generateSchedule = (teams: Pick<Team, "id" | "name" | "logo_url">[], startDate?: Date, leagueTimeZone?: string): DaySchedule[] => {
  if (!Array.isArray(teams) || teams.length < 3) return []; // Minimum 3 teams required
  
  const roundPairings = generateRoundRobinPairings(teams);
  
  // Start from next Monday or provided startDate, considering timezone
  const scheduleStart = startDate ? new Date(startDate) : new Date();
  const nextMonday = new Date(scheduleStart);
  
  if (!startDate) {
    // If we're already past Monday in the current week, go to next Monday
    const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  }
  
  const schedules: DaySchedule[] = [];
  
  // Process each round, ensuring all matches from the same round are scheduled contiguously
  for (const roundData of roundPairings) {
    const { round, matches } = roundData;
    
    // Schedule all matches for this round contiguously
    for (const [homeId, awayId] of matches) {
      // Find the next available time slot (Monday-Thursday, 20:00/21:00/22:00)
      let dayOffset = 0;
      
      while (true) {
        const scheduleDate = new Date(nextMonday);
        scheduleDate.setDate(nextMonday.getDate() + dayOffset);
        
        // Only schedule on Monday-Thursday
        const dayOfWeek = getDayOfWeekWithTimezone(scheduleDate, leagueTimeZone);
        if (dayOfWeek !== 1 && dayOfWeek !== 2 && dayOfWeek !== 3 && dayOfWeek !== 4) {
          dayOffset++;
          continue;
        }
        
        // Format date according to timezone if provided
        const dateStr = formatDateWithTimezone(scheduleDate, leagueTimeZone);
        
        // Find or create the day's schedule
        let daySchedule = schedules.find(d => d.date === dateStr);
        if (!daySchedule) {
          // Get day of week name for display
          const dayOfWeekForDisplay = getDayOfWeekWithTimezone(scheduleDate, leagueTimeZone);
          
          daySchedule = {
            date: dateStr,
            dayOfWeek: daysOfWeek[dayOfWeekForDisplay],
            slots: timeSlots.map(time => ({ time, match: null }))
          };
          schedules.push(daySchedule);
        }
        
        // Find next available time slot
        const availableSlotIndex = daySchedule.slots.findIndex(slot => slot.match === null);
        if (availableSlotIndex !== -1) {
          // Found available slot, add the match
          const time = timeSlots[availableSlotIndex];
          
          // Generate the scheduled_at ISO string considering timezone
          // We need to create a date object with the correct timezone
          let scheduledAt: string;
          if (leagueTimeZone) {
            // Create new Date object that represents the time in the specified timezone
            const localTime = new Date(`${dateStr}T${time}:00`);
            // Convert to the specific timezone
            scheduledAt = new Date(localTime.toLocaleString('en-US', { timeZone: leagueTimeZone })).toISOString();
          } else {
            scheduledAt = `${dateStr}T${time}:00`;
          }
          
          // Generate a unique ID for the match
          const matchId = `temp_${dateStr}_${time}_${homeId}_${awayId}`;
          
          daySchedule.slots[availableSlotIndex] = {
            time,
            match: {
              id: matchId,
              tournament_id: '', // Will be filled in when saving
              home_team_id: homeId,
              away_team_id: awayId,
              scheduled_at: scheduledAt,
              venue: 'Por definir',
              round_name: `Jornada ${round}`,
              status: 'scheduled',
              home_score: 0,
              away_score: 0,
              winner_team_id: null,
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              home_team: teams.find(t => t.id === homeId) || null,
              away_team: teams.find(t => t.id === awayId) || null,
            }
          };
          
          // Successfully placed the match, break the search loop
          break;
        } else {
          // No available slots in this day, move to next day
          dayOffset++;
        }
      }
    }
  }
  
  return schedules;
}

// Function to convert matches to schedule format
const convertMatchesToSchedule = (matches: Match[]): DaySchedule[] => {
  if (!Array.isArray(matches) || matches.length === 0) return []
  
  const scheduleMap: Record<string, DaySchedule> = {}
  
  matches.forEach(match => {
    if (!match?.scheduled_at) return
    
    const date = match.scheduled_at.split('T')[0]
    if (!scheduleMap[date]) {
      const dateObj = new Date(date)
      scheduleMap[date] = {
        date,
        dayOfWeek: daysOfWeek[dateObj.getDay()],
        slots: timeSlots.map(time => ({ time, match: null }))
      }
    }
    
    // Find the time slot for this match
    const time = match.scheduled_at.split('T')[1].substring(0, 5) // HH:MM
    const slotIndex = scheduleMap[date].slots.findIndex(slot => slot.time === time)
    if (slotIndex !== -1) {
      scheduleMap[date].slots[slotIndex].match = match
    }
  })
  
  return Object.values(scheduleMap).sort((a, b) => a.date.localeCompare(b.date))
}

export function TournamentCalendar({ tournamentId, teams, initialMatches, isAdmin, startDate, leagueTimeZone }: TournamentCalendarProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Initialize schedule
  useEffect(() => {
    const safeTeams = Array.isArray(teams) ? teams : []
    const safeMatches = Array.isArray(initialMatches) ? initialMatches : []
    
    if (safeTeams.length > 0 && safeMatches.length === 0) {
      // Validate teams before generating schedule
      // Convert Pick<Team, ...> to basic validation format
      const validation = validateTeamsForCalendar(safeTeams);
      if (!validation.isValid) {
        console.error('Team validation failed:', validation.error);
        setSchedules([]);
      } else {
        // Generate schedule automatically for new tournaments
        const newSchedules = generateSchedule(safeTeams, startDate, leagueTimeZone)
        setSchedules(newSchedules)
      }
    } else {
      // Convert existing matches to schedule format
      const existingSchedules = convertMatchesToSchedule(safeMatches)
      setSchedules(existingSchedules)
    }
    
    setIsLoading(false)
  }, [teams, initialMatches, startDate, leagueTimeZone])
  
  // Function to save schedule to database
  const saveSchedule = async () => {
    if (!isEditing) return
    
    setIsLoading(true)
    
    try {
      // Prepare the schedule data for API
      const scheduleData = {
        teams: teams || [],
        startDate,
        leagueTimeZone
      };
      
      const response = await fetch(`/api/tournaments/${tournamentId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule');
      }
      
      const result = await response.json();
      console.log('Schedule saved successfully:', result);
      
      setIsEditing(false);
      // Optionally refetch data after saving
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Function to handle match time change (for admin users)
  const handleTimeChange = (date: string, oldTime: string, newTime: string) => {
    if (!isAdmin || !isEditing) return
    
    setSchedules(prev => 
      Array.isArray(prev) ? prev.map(day => {
        if (day.date !== date) return day
        
        const newSlots = [...day.slots]
        const oldSlotIndex = newSlots.findIndex(slot => slot.time === oldTime)
        const newSlotIndex = newSlots.findIndex(slot => slot.time === newTime)
        
        if (oldSlotIndex !== -1 && newSlotIndex !== -1) {
          // Swap matches between time slots
          const temp = newSlots[oldSlotIndex].match
          newSlots[oldSlotIndex].match = newSlots[newSlotIndex].match
          newSlots[newSlotIndex].match = temp
        }
        
        return { ...day, slots: newSlots }
      }) : []
    )
  }
  
  // Get team name by ID
  const getTeamName = (teamId: string) => {
    if (!Array.isArray(teams)) return 'Equipo'
    const team = teams.find(t => t.id === teamId)
    return team?.name || 'Equipo'
  }

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Cargando calendario...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-green-400 mr-3" />
          <h2 className="text-xl font-bold text-white">Calendario de Partidos</h2>
        </div>
        
        {isAdmin && (
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={saveSchedule}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Calendario
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  // Generate schedule automatically when clicking Generate
                  const safeTeams = Array.isArray(teams) ? teams : [];
                  if (safeTeams.length > 0) {
                    const newSchedules = generateSchedule(safeTeams, startDate, leagueTimeZone);
                    setSchedules(newSchedules);
                    setIsEditing(true);
                  } else {
                    alert('No hay equipos registrados para generar el calendario');
                  }
                }}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Generar Calendario
              </button>
            )}
          </div>
        )}
      </div>
      
      {Array.isArray(schedules) && schedules.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay partidos programados</h3>
          <p className="text-gray-400">
            {isAdmin 
              ? "Haz clic en 'Editar' para generar el calendario de partidos" 
              : "El calendario de partidos estará disponible próximamente"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.isArray(schedules) && schedules.map((day) => (
            <div key={day.date} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center mb-4">
                <h3 className="text-lg font-semibold text-white">{day.dayOfWeek}</h3>
                <span className="ml-2 text-sm text-gray-400">{day.date}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {day.slots.map((slot) => (
                  <div 
                    key={`${day.date}-${slot.time}`} 
                    className={`p-4 rounded-lg border ${
                      slot.match 
                        ? 'border-green-500/30 bg-green-900/10' 
                        : 'border-gray-700 bg-gray-800/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-white">{slot.time}</span>
                      </div>
                      
                      {isAdmin && isEditing && slot.match && (
                        <select
                          value={slot.time}
                          onChange={(e) => handleTimeChange(day.date, slot.time, e.target.value)}
                          className="text-xs bg-gray-700 text-white rounded px-2 py-1"
                        >
                          {Array.isArray(timeSlots) && timeSlots.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    {slot.match ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium truncate max-w-[100px]">
                            {slot.match.home_team?.name || 'Local'}
                          </span>
                          <span className="text-gray-400">vs</span>
                          <span className="text-white font-medium truncate max-w-[100px]">
                            {slot.match.away_team?.name || 'Visitante'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-center pt-2">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            Local
                          </div>
                          <span className="mx-4 text-gray-600">-</span>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            Visitante
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        {isAdmin && isEditing ? 'Partido libre' : 'Sin partido'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Info box for non-admin users */}
      {!isAdmin && Array.isArray(schedules) && schedules.length > 0 && (
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>Nota:</strong> Esta vista es solo lectura. 
            Los horarios y fechas pueden ser modificados por los administradores.
          </p>
        </div>
      )}
    </div>
  )
}