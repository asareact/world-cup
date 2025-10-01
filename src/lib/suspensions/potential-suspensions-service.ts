// Service to detect potentially suspended players for upcoming matches
// EFFICIENT VERSION: Only fetches data for current day matches
import { supabase } from '@/lib/supabase';

// Type definitions
export interface PotentialSuspension {
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  matchId: string;
  reason: string;
  suspensionType: 'yellow_risk' | 'red_risk' | 'accumulation_risk';
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export class PotentialSuspensionsService {
  // Cache for performance optimization (10 minutes)
  private static cache: Map<string, { data: PotentialSuspension[]; timestamp: number }> = new Map();
  private static readonly CACHE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  /**
   * Fetch potential suspensions for matches on current date only
   * EFFICIENT IMPLEMENTATION: Only processes today's matches
   * Detects players at risk of suspension based on prior events
   * @param tournamentId The tournament to analyze
   * @param options Optional parameters:
   *   - matchId: Specific match to analyze (if not provided, analyzes current date)
   */
  async detectPotentialSuspensions(
    tournamentId: string,
    options?: {
      matchId?: string;
    }
  ): Promise<PotentialSuspension[]> {
    try {
      // Create cache key
      const cacheKey = `${tournamentId}-${options?.matchId || 'today'}-performance`;
      
      // Check cache first
      const cached = PotentialSuspensionsService.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < PotentialSuspensionsService.CACHE_TIMEOUT) {
        return cached.data;
      }

      // Get matches for current date only (or specific match if provided)
      let matchesQuery = supabase
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          scheduled_at
        `)
        .eq('tournament_id', tournamentId)
        .eq('status', 'scheduled');

      if (options?.matchId) {
        // If specific match requested, filter by matchId
        matchesQuery = matchesQuery.eq('id', options?.matchId);
      } else {
        // Only get matches for TODAY (typical 3 matches per day)
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        matchesQuery = matchesQuery
          .gte('scheduled_at', startOfDay.toISOString())
          .lte('scheduled_at', endOfDay.toISOString());
      }

      // Order by scheduled time and limit to 5 matches (should be max 3 per day)
      matchesQuery = matchesQuery
        .order('scheduled_at', { ascending: true })
        .limit(5);

      const { data: matches, error: matchesError } = await matchesQuery;

      if (matchesError || !matches || matches.length === 0) {
        // Cache empty result
        PotentialSuspensionsService.cache.set(cacheKey, { 
          data: [], 
          timestamp: Date.now() 
        });
        return [];
      }

      // Get all unique team IDs from today's matches
      const teamIds = [
        ...new Set(matches.flatMap(m => [m.home_team_id, m.away_team_id]).filter(Boolean))
      ] as string[];

      // Get team names
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', teamIds);

      if (teamsError || !teamsData) {
        // Cache empty result
        PotentialSuspensionsService.cache.set(cacheKey, { 
          data: [], 
          timestamp: Date.now() 
        });
        return [];
      }

      // Create team map for quick lookup
      const teamMap = new Map<string, string>();
      teamsData.forEach(team => {
        teamMap.set(team.id, team.name);
      });

      // Get all players for teams playing today
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select(`
          id,
          name,
          team_id,
          teams(name)
        `)
        .in('team_id', teamIds);

      if (playersError || !players) {
        // Cache empty result
        PotentialSuspensionsService.cache.set(cacheKey, { 
          data: [], 
          timestamp: Date.now() 
        });
        return [];
      }

      // NEW LOGIC: Detect players at risk of suspension
      const potentialSuspensions: PotentialSuspension[] = [];

      // Step 1: Find all yellow card events in the tournament for players
      // First get match IDs for the tournament
      const { data: tournamentMatches, error: tournamentMatchesError } = await supabase
        .from('matches')
        .select('id')
        .eq('tournament_id', tournamentId);

      if (tournamentMatchesError) {
        console.error('Error fetching tournament matches for yellow card analysis:', tournamentMatchesError);
      }

      const tournamentMatchIds = tournamentMatches?.map(m => m.id) || [];

      const { data: yellowCardEvents, error: yellowError } = await supabase
        .from('match_events')
        .select(`
          player_id
        `)
        .eq('event_type', 'yellow_card')
        .in('match_id', tournamentMatchIds)
        .in('player_id', players.map(p => p.id));

      // Count yellow cards per player
      const yellowCardCounts: Record<string, number> = {};
      if (yellowCardEvents) {
        yellowCardEvents.forEach(event => {
          if (event.player_id) {
            yellowCardCounts[event.player_id] = (yellowCardCounts[event.player_id] || 0) + 1;
          }
        });
      }

      if (yellowError) {
        console.error('Error fetching yellow card events:', yellowError);
      } else if (yellowCardEvents) {
        // Process each player who has yellow cards
        const playersWithYellows = [...new Set(yellowCardEvents.map(e => e.player_id).filter(Boolean))];
        for (const playerId of playersWithYellows) {
          const player = players.find(p => p.id === playerId);
          const yellowCount = yellowCardCounts[playerId] || 0;
          if (player) {
            // Only show as risk if they have 1 or 2 yellow cards (on the way to 3)
            if (yellowCount < 3) {
              potentialSuspensions.push({
                playerId: player.id,
                playerName: player.name || 'Jugador',
                teamId: player.team_id,
                teamName: teamMap.get(player.team_id) || 'Equipo',
                matchId: matches[0]?.id || '',
                reason: `Riesgo de suspensión por acumulación (${yellowCount}/3 amarillas)`,
                suspensionType: 'yellow_risk',
                description: `Este jugador ya tiene ${yellowCount} tarjeta(s) amarilla(s) en el torneo y está en riesgo de suspensión al llegar a 3`,
                confidence: 'medium'
              });
            }
          }
        }
      }

      // Step 2: Find players who received yellow cards in recent matches (consecutive yellow risk)
      const { data: recentYellowEvents, error: recentYellowError } = await supabase
        .from('match_events')
        .select(`
          player_id,
          match_id
        `)
        .eq('event_type', 'yellow_card')
        .in('match_id', tournamentMatchIds)
        .in('player_id', players.map(p => p.id));

      if (recentYellowError) {
        console.error('Error fetching recent yellow events:', recentYellowError);
      } else if (recentYellowEvents) {
        // For each player with recent yellow, check if they're playing today
        const playerIdsWithYellows = [...new Set(recentYellowEvents.map(e => e.player_id).filter(Boolean))];
        for (const playerId of playerIdsWithYellows) {
          const player = players.find(p => p.id === playerId);
          if (player) {
            // Check if this player's team is playing today
            const isPlayingToday = matches.some(
              m => m.home_team_id === player.team_id || m.away_team_id === player.team_id
            );
            
            if (isPlayingToday) {
              // This creates a potential consecutive yellow card situation
              potentialSuspensions.push({
                playerId: player.id,
                playerName: player.name || 'Jugador',
                teamId: player.team_id,
                teamName: teamMap.get(player.team_id) || 'Equipo',
                matchId: matches.find(m => 
                  m.home_team_id === player.team_id || m.away_team_id === player.team_id
                )?.id || matches[0]?.id || '',
                reason: 'Riesgo de suspensión por amarillas consecutivas',
                suspensionType: 'accumulation_risk',
                description: `Este jugador recibió amarilla en un partido anterior y está en riesgo de suspensión por recibir otra hoy`,
                confidence: 'high'
              });
            }
          }
        }
      }

      // Step 3: Get active suspensions for context (players currently suspended)
      const { data: activeSuspensions, error: suspensionsError } = await supabase
        .from('player_suspensions')
        .select(`
          id,
          player_id,
          match_id,
          reason,
          suspension_type
        `)
        .eq('tournament_id', tournamentId)
        .eq('served', false)
        .in('player_id', players.map(p => p.id));
      
      if (suspensionsError) {
        console.error('Error fetching active suspensions:', suspensionsError);
      } else if (activeSuspensions) {
        for (const suspension of activeSuspensions) {
          const player = players.find(p => p.id === suspension.player_id);
          if (player) {
            potentialSuspensions.push({
              playerId: player.id,
              playerName: player.name || 'Jugador',
              teamId: player.team_id,
              teamName: teamMap.get(player.team_id) || 'Equipo',
              matchId: suspension.match_id || matches[0]?.id || '',
              reason: suspension.reason || 'Jugador suspendido actualmente',
              suspensionType: suspension.suspension_type as 'yellow_risk' | 'red_risk' | 'accumulation_risk',
              description: `Este jugador está actualmente suspendido y no puede jugar`,
              confidence: 'high'
            });
          }
        }
      }

      // Consolidate multiple risks for the same player into a single entry
      const playerMap = new Map<string, PotentialSuspension>();
      
      for (const risk of potentialSuspensions) {
        const existingRisk = playerMap.get(risk.playerId);
        
        if (existingRisk) {
          // Combine descriptions and set the highest risk type and confidence
          existingRisk.description = `${existingRisk.description} / ${risk.description}`;
          existingRisk.suspensionType = risk.suspensionType; // Update to the latest risk type detected
          // Use the higher confidence level
          existingRisk.confidence = existingRisk.confidence === 'high' || risk.confidence === 'high' ? 'high' : 
                                   existingRisk.confidence === 'medium' || risk.confidence === 'medium' ? 'medium' : 'low';
        } else {
          playerMap.set(risk.playerId, risk);
        }
      }
      
      const uniquePotentialSuspensions = Array.from(playerMap.values());

      // Cache the result
      PotentialSuspensionsService.cache.set(cacheKey, { 
        data: uniquePotentialSuspensions, 
        timestamp: Date.now() 
      });

      return uniquePotentialSuspensions;
    } catch (error) {
      console.error('Error detecting potential suspensions:', error);
      return [];
    }
  }
  
  /**
   * Clear the cache for a specific tournament
   */
  clearTournamentCache(tournamentId: string): void {
    // Remove all cache entries for this tournament
    for (const key of PotentialSuspensionsService.cache.keys()) {
      if (key.startsWith(tournamentId)) {
        PotentialSuspensionsService.cache.delete(key);
      }
    }
  }

  /**
   * Check if tournament data is cached and still valid
   */
  isTournamentCached(tournamentId: string): boolean {
    for (const key of PotentialSuspensionsService.cache.keys()) {
      if (key.startsWith(tournamentId)) {
        const cached = PotentialSuspensionsService.cache.get(key);
        if (cached && Date.now() - cached.timestamp < PotentialSuspensionsService.CACHE_TIMEOUT) {
          return true;
        }
      }
    }
    return false;
  }
}