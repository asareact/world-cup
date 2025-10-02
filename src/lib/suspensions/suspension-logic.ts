import { supabase } from '@/lib/supabase';
import type { MatchEvent, PlayerSuspension } from '@/lib/database';
import { PlayerSuspensionService } from '@/lib/database/player-suspensions';

// Define suspension types
export type SuspensionType = 'yellow_accumulated' | 'yellow_consecutive' | 'red_direct' | 'red_two_yellow';

// Interface for suspension detection logic
export interface SuspensionCheckResult {
  hasSuspension: boolean;
  suspensionType?: SuspensionType;
  suspensionMatches?: number;
  reason?: string;
  matchId?: string;
  playerId?: string;
  tournamentId?: string;
}

// Service class for suspension detection logic
export class SuspensionLogicService {
  private suspensionService: PlayerSuspensionService;

  constructor() {
    this.suspensionService = new PlayerSuspensionService();
  }

  /**
   * Analyze match events to detect and create suspensions based on:
   * 1. Red card (direct) - 2 match suspension
   * 2. Double yellow in same match - 1 match suspension  
   * 3. Two consecutive yellows in different matches - 1 match suspension
   */
  async processMatchEventsForSuspensions(matchId: string, tournamentId: string, events: MatchEvent[]) {
    // Get the match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('home_team_id, away_team_id, tournament_id')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('Error fetching match for suspension processing:', matchError);
      return;
    }

    // Process each team's players separately
    const homeTeamId = match.home_team_id;
    const awayTeamId = match.away_team_id;

    // Get all players for both teams in this match
    const { data: matchPlayers, error: playersError } = await supabase
      .from('players')
      .select('id, team_id')
      .or(`team_id.eq.${homeTeamId},team_id.eq.${awayTeamId}`);

    if (playersError || !matchPlayers) {
      console.error('Error fetching players for suspension processing:', playersError);
      return;
    }

    // Process suspensions for each player in the match
    for (const player of matchPlayers) {
      await this.processPlayerSuspensions(player.id, matchId, tournamentId, events);
    }
  }

  private async processPlayerSuspensions(playerId: string, matchId: string, tournamentId: string, events: MatchEvent[]) {
    // Step 1: Check for direct red card in this match
    const redCardEvent = events.find(
      event => event.player_id === playerId && 
              event.event_type === 'red_card' &&
              event.match_id === matchId
    );

    if (redCardEvent) {
      // Direct red card = 2 match suspension
      await this.createSuspensionIfNotExists(
        playerId, 
        tournamentId, 
        matchId, 
        'red_direct', 
        2, 
        'Tarjeta roja directa'
      );
      return; // If red card, no need to check other suspension types
    }

    // Step 2: Check for two yellow cards in the same match (red_two_yellow)
    const yellowCardsInMatch = events.filter(
      event => event.player_id === playerId && 
              event.event_type === 'yellow_card' &&
              event.match_id === matchId
    );

    if (yellowCardsInMatch.length >= 2) {
      // Two yellows in same match result in red card = 2 match suspension
      await this.createSuspensionIfNotExists(
        playerId, 
        tournamentId, 
        matchId, 
        'red_two_yellow', 
        2, 
        'Acumulación de dos tarjetas amarillas en el mismo partido que resulta en roja'
      );
    } else if (yellowCardsInMatch.length === 1) {
      // If only 1 yellow in this match, might be part of consecutive yellow risk
      // (but we already handle that above with checkConsecutiveYellowCards)
    }

    // Get all matches for this tournament to get match IDs and dates (for proper join)
    const { data: tournamentMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, scheduled_at')
      .eq('tournament_id', tournamentId)
      .order('scheduled_at', { ascending: true });

    if (matchesError || !tournamentMatches) {
      console.error('Error fetching tournament matches for player events:', matchesError);
      return;
    }

    const tournamentMatchIds = tournamentMatches.map(m => m.id);

    // Get all match events for this player in the tournament
    const { data: allPlayerEvents, error: eventsError } = await supabase
      .from('match_events')
      .select('*')
      .eq('player_id', playerId)
      .in('match_id', tournamentMatchIds)
      .order('created_at', { ascending: true });

    if (eventsError || !allPlayerEvents) {
      console.error('Error fetching player events for suspension checks:', eventsError);
      return;
    }

    // Step 3: Check for consecutive yellows in different matches
    // Check if this player received yellow cards in consecutive matches
    const consecutiveYellowResult = await this.checkConsecutiveYellowCards(
      playerId, 
      tournamentId, 
      tournamentMatches, 
      allPlayerEvents, 
      matchId
    );

    if (consecutiveYellowResult) {
      await this.createSuspensionIfNotExists(
        playerId, 
        tournamentId, 
        matchId, 
        'yellow_consecutive', 
        1, 
        'Dos tarjetas amarillas consecutivas en partidos diferentes'
      );
    }

    // Step 4: Check for accumulated 3 yellow cards total in the tournament (yellow_accumulated)
    const totalYellowCards = allPlayerEvents.filter(
      event => event.event_type === 'yellow_card' && 
              event.player_id === playerId
    ).length;

    if (totalYellowCards >= 3) {
      // Check if we already have a 3-yellow suspension to avoid duplicates
      const { data: existingSuspensions } = await this.suspensionService.getPlayerSuspensions(playerId, tournamentId);
      const hasYellowThreeSuspension = existingSuspensions?.some(s => s.suspension_type === 'yellow_accumulated');
      
      if (!hasYellowThreeSuspension) {
        await this.createSuspensionIfNotExists(
          playerId, 
          tournamentId, 
          matchId, 
          'yellow_accumulated', 
          1, 
          `Acumulación de 3 tarjetas amarillas en el torneo (${totalYellowCards} amarillas)`
        );
      }
    }
  }

  private async checkConsecutiveYellowCards(
    playerId: string,
    tournamentId: string,
    tournamentMatches: { id: string; scheduled_at: string }[],
    allPlayerEvents: MatchEvent[],
    currentMatchId: string
  ): Promise<boolean> {
    // Filter for yellow cards only
    const yellowCardEvents = allPlayerEvents.filter(
      event => event.event_type === 'yellow_card' && 
              event.player_id === playerId
    );

    if (yellowCardEvents.length < 1) {
      return false; // Not enough yellow cards for consecutive check
    }

    // Sort matches by date to identify the sequence
    const sortedMatches = [...tournamentMatches].sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

    // Find the index of current match in the sequence
    const currentMatchIndex = sortedMatches.findIndex(m => m.id === currentMatchId);
    if (currentMatchIndex <= 0) {
      return false; // Can't have consecutive yellow if this is the first match
    }

    // Get the last match the player participated in before this one
    let previousMatchId: string | null = null;
    for (let i = currentMatchIndex - 1; i >= 0; i--) {
      const matchEvents = allPlayerEvents.filter(e => e.match_id === sortedMatches[i].id);
      if (matchEvents.length > 0) {
        previousMatchId = sortedMatches[i].id;
        break;
      }
    }

    if (!previousMatchId) {
      return false; // Player didn't play in previous matches
    }

    // Check if player got yellow cards in both the previous and current match
    const prevMatchYellow = allPlayerEvents.some(
      event => event.match_id === previousMatchId && 
              event.event_type === 'yellow_card' && 
              event.player_id === playerId
    );

    const currentMatchYellow = allPlayerEvents.some(
      event => event.match_id === currentMatchId && 
              event.event_type === 'yellow_card' && 
              event.player_id === playerId
    );

    return prevMatchYellow && currentMatchYellow;
  }

  private async createSuspensionIfNotExists(
    playerId: string,
    tournamentId: string,
    matchId: string,
    suspensionType: SuspensionType,
    suspensionMatches: number,
    reason: string
  ) {
    // Check if this exact suspension already exists
    const { data: existingSuspensions, error: fetchError } = await this.suspensionService.getPlayerSuspensions(playerId, tournamentId);
    
    if (fetchError) {
      console.error('Error checking existing suspensions:', fetchError);
      return;
    }

    // Check if a similar suspension already exists for this match
    const existingSimilar = existingSuspensions?.find(
      s => s.player_id === playerId && 
           s.match_id === matchId && 
           s.suspension_type === suspensionType
    );

    if (existingSimilar) {
      console.log(`Suspension already exists for player ${playerId} in match ${matchId}, type: ${suspensionType}`);
      return;
    }

    // Create the new suspension
    await this.suspensionService.createSuspension({
      player_id: playerId,
      tournament_id: tournamentId,
      match_id: matchId,
      suspension_type: suspensionType,
      suspension_matches: suspensionMatches,
      reason: reason,
      served: false
    });
  }

  /**
   * Update suspension status when a player serves matches
   * This method should be called when matches are played to determine if
   * a player has served their suspension
   */
  async updatePlayerSuspensionStatus(playerId: string, tournamentId: string, matchesPlayedCount: number) {
    // Get active suspensions for the player
    const { data: activeSuspensions, error } = await this.suspensionService.getActivePlayerSuspensions(playerId, tournamentId);
    
    if (error || !activeSuspensions) {
      console.error('Error fetching active suspensions:', error);
      return;
    }

    // Only process if the player has active suspensions
    if (activeSuspensions.length === 0) {
      return;
    }

    // Calculate total suspension matches remaining
    let totalSuspensionMatches = 0;
    for (const suspension of activeSuspensions) {
      // For each suspension, determine how many matches remain to be served
      // In this implementation, we assume each suspension is served by playing matches
      totalSuspensionMatches += suspension.suspension_matches;
    }

    // If the player has played enough matches to serve all suspensions, mark them as served
    for (const suspension of activeSuspensions) {
      // In a real implementation, we'd need more complex logic to determine
      // if specific suspensions have been served based on when they were issued
      // For now, we'll mark all suspensions as served if the player has played
      // enough matches total in the tournament
      if (matchesPlayedCount >= suspension.suspension_matches) {
        await this.suspensionService.serveSuspension(suspension.id);
      }
    }
  }

  /**
   * Check if a player is currently suspended (has active suspensions)
   */
  async isPlayerSuspended(playerId: string, tournamentId: string): Promise<boolean> {
    const { data: activeSuspensions, error } = await this.suspensionService.getActivePlayerSuspensions(playerId, tournamentId);
    
    if (error) {
      console.error('Error checking player suspension status:', error);
      return false;
    }

    return (activeSuspensions && activeSuspensions.length > 0) || false;
  }

  /**
   * Get remaining suspension matches for a player
   */
  async getPlayerRemainingSuspensionMatches(playerId: string, tournamentId: string): Promise<number> {
    const { data: activeSuspensions, error } = await this.suspensionService.getActivePlayerSuspensions(playerId, tournamentId);
    
    if (error) {
      console.error('Error getting player remaining suspension matches:', error);
      return 0;
    }

    if (!activeSuspensions || activeSuspensions.length === 0) {
      return 0;
    }

    // Sum up all remaining matches across all active suspensions
    return activeSuspensions.reduce((total, suspension) => total + suspension.suspension_matches, 0);
  }
}