// Suspension logic service

import { supabase } from '@/lib/supabase';
import { MatchEvent } from './database';
import { PlayerSuspension, PlayerSuspensionService } from './database/player-suspensions';

export interface PlayerCardRecord {
  playerId: string;
  matchId: string;
  yellowCards: number;
  redCard: boolean;
  events: MatchEvent[];
}

export interface SuspensionRule {
  type: 'yellow_accumulated' | 'yellow_consecutive' | 'red_direct' | 'red_two_yellow';
  matches: number;
  description: string;
}

export interface NewsGenerationContext {
  tournament: any;
  teams: any[];
  matches: any[];
  topScorers: any[];
  standings: any[];
}

export class SuspensionLogicService {
  private suspensionService: PlayerSuspensionService;

  constructor() {
    this.suspensionService = new PlayerSuspensionService();
  }

  // Suspension rules as defined in requirements
  private readonly SUSPENSION_RULES: Record<string, SuspensionRule> = {
    yellow_accumulated: {
      type: 'yellow_accumulated',
      matches: 1,
      description: '3 amarillas acumuladas en el torneo'
    },
    yellow_consecutive: {
      type: 'yellow_consecutive',
      matches: 1,
      description: 'Dos amarillas en partidos consecutivos distintos'
    },
    red_direct: {
      type: 'red_direct',
      matches: 2,
      description: 'Roja directa'
    },
    red_two_yellow: {
      type: 'red_two_yellow',
      matches: 2,
      description: 'Acumulación de dos amarillas que resulta en roja'
    }
  };

  // Process match events to detect suspensions
  async processMatchEvents(
    matchId: string,
    tournamentId: string,
    playerEvents: PlayerCardRecord[]
  ): Promise<{ success: boolean; message?: string }> {
    try {
      for (const playerRecord of playerEvents) {
        const playerId = playerRecord.playerId;
        
        // Skip if player already has an active suspension
        const { data: activeSuspensions } = await this.suspensionService.getActivePlayerSuspensions(playerId, tournamentId);
        
        // Check for red card (direct red or two yellows in same match)
        if (playerRecord.redCard) {
          // Check if it's a direct red card
          const isDirectRed = playerRecord.events.some(event => 
            event.event_type === 'red_card' && !event.description?.includes('acumulada')
          );
          
          if (isDirectRed) {
            // Direct red card suspension
            await this.createSuspension({
              player_id: playerId,
              tournament_id: tournamentId,
              match_id: matchId,
              reason: 'Tarjeta roja directa',
              suspension_type: 'red_direct',
              suspension_matches: 2,
              served: false
            });
          } else {
            // Two yellows resulting in red card
            await this.createSuspension({
              player_id: playerId,
              tournament_id: tournamentId,
              match_id: matchId,
              reason: 'Acumulación de dos tarjetas amarillas',
              suspension_type: 'red_two_yellow',
              suspension_matches: 2,
              served: false
            });
          }
        } 
        // Check for yellow card accumulation in same match (two yellows leading to red)
        else if (playerRecord.yellowCards >= 2) {
          await this.createSuspension({
            player_id: playerId,
            tournament_id: tournamentId,
            match_id: matchId,
            reason: 'Acumulación de dos tarjetas amarillas en el mismo partido que resulta en roja',
            suspension_type: 'red_two_yellow',
            suspension_matches: 2,
            served: false
          });
        }
        // Check for consecutive yellow cards (requires checking previous match)
        else if (playerRecord.yellowCards === 1) {
          // Check if player had a yellow in their previous match
          const hadPreviousYellow = await this.checkPreviousMatchYellow(playerId, matchId, tournamentId);
          
          if (hadPreviousYellow) {
            await this.createSuspension({
              player_id: playerId,
              tournament_id: tournamentId,
              match_id: matchId,
              reason: 'Dos tarjetas amarillas en partidos consecutivos',
              suspension_type: 'yellow_consecutive',
              suspension_matches: 1,
              served: false
            });
          }
        }
        
        // Check for accumulated 3 yellow cards total in the tournament (yellow_accumulated)
        await this.checkAndCreateThreeYellowSuspension(playerId, matchId, tournamentId);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error processing match events for suspensions:', error);
      return { success: false, message: 'Error al procesar eventos del partido' };
    }
  }

  // Check if player had a yellow card in their previous match
  private async checkPreviousMatchYellow(
    playerId: string,
    currentMatchId: string,
    tournamentId: string
  ): Promise<boolean> {
    try {
      // Get the current match to determine date ordering
      const { data: currentMatch, error: currentMatchError } = await supabase
        .from('matches')
        .select('scheduled_at')
        .eq('id', currentMatchId)
        .single();
      
      if (currentMatchError || !currentMatch) {
        return false;
      }
      
      // Get all matches for this tournament ordered by date
      const { data: allMatches, error: matchesError } = await supabase
        .from('matches')
        .select('id, scheduled_at')
        .eq('tournament_id', tournamentId)
        .order('scheduled_at', { ascending: true });
      
      if (matchesError || !allMatches || allMatches.length === 0) {
        return false;
      }
      
      // Find the index of current match
      const currentIndex = allMatches.findIndex(m => m.id === currentMatchId);
      
      // If this is the first match, no previous match
      if (currentIndex <= 0) {
        return false;
      }
      
      // Get the previous match
      const previousMatch = allMatches[currentIndex - 1];
      
      // Check if the player received a yellow card in the previous match
      const { data: previousEvents, error: eventsError } = await supabase
        .from('match_events')
        .select('*')
        .eq('match_id', previousMatch.id)
        .eq('player_id', playerId)
        .eq('event_type', 'yellow_card');
      
      if (eventsError) {
        console.error('Error fetching previous match events:', eventsError);
        return false;
      }
      
      // Player had at least one yellow card in previous match
      return (previousEvents?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking previous match yellow card:', error);
      return false;
    }
  }

  // Check and create suspension if player has accumulated 3 yellow cards in tournament
  private async checkAndCreateThreeYellowSuspension(
    playerId: string,
    currentMatchId: string,
    tournamentId: string
  ): Promise<void> {
    try {
      // Get all matches for this tournament to get match IDs
      const { data: tournamentMatches, error: matchesError } = await supabase
        .from('matches')
        .select('id')
        .eq('tournament_id', tournamentId);

      if (matchesError || !tournamentMatches) {
        console.error('Error fetching tournament matches:', matchesError);
        return;
      }

      const tournamentMatchIds = tournamentMatches.map(m => m.id);

      // Get all yellow cards for this player in the tournament
      const { data: allPlayerEvents, error: eventsError } = await supabase
        .from('match_events')
        .select('*')
        .eq('player_id', playerId)
        .eq('event_type', 'yellow_card')
        .in('match_id', tournamentMatchIds)
        .order('created_at', { ascending: true });

      if (eventsError || !allPlayerEvents) {
        console.error('Error fetching player events for 3-yellow check:', eventsError);
        return;
      }

      // Count total yellow cards
      const totalYellowCards = allPlayerEvents.length;

      // If player has 3 or more yellow cards, create suspension
      if (totalYellowCards >= 3) {
        // Check if this suspension already exists to avoid duplicates
        const { data: existingSuspensions } = await this.suspensionService.getPlayerSuspensions(playerId, tournamentId);
        const hasThreeYellowSuspension = existingSuspensions?.some(s => s.suspension_type === 'yellow_accumulated');
        
        if (!hasThreeYellowSuspension) {
          await this.createSuspension({
            player_id: playerId,
            tournament_id: tournamentId,
            match_id: currentMatchId,
            reason: `Acumulación de 3 tarjetas amarillas en el torneo (${totalYellowCards} amarillas)`,
            suspension_type: 'yellow_accumulated',
            suspension_matches: 1,
            served: false
          });
        }
      }
    } catch (error) {
      console.error('Error checking 3-yellow suspension:', error);
    }
  }

  // Create a new suspension record
  private async createSuspension(suspension: Omit<PlayerSuspension, 'id' | 'created_at'>) {
    const { error } = await this.suspensionService.createSuspension(suspension);
    if (error) {
      console.error('Error creating suspension:', error);
      throw error;
    }
  }

  // Get active suspensions for a player
  async getPlayerActiveSuspensions(playerId: string, tournamentId: string) {
    const { data, error } = await this.suspensionService.getActivePlayerSuspensions(playerId, tournamentId);
    if (error) {
      console.error('Error fetching player suspensions:', error);
      return [];
    }
    return data || [];
  }

  // Get all active suspensions for a tournament
  async getTournamentActiveSuspensions(tournamentId: string) {
    const { data, error } = await this.suspensionService.getTournamentActiveSuspensions(tournamentId);
    if (error) {
      console.error('Error fetching tournament suspensions:', error);
      return [];
    }
    return data || [];
  }

  // Serve a suspension (mark as completed)
  async serveSuspension(suspensionId: string) {
    const { error } = await this.suspensionService.serveSuspension(suspensionId);
    if (error) {
      console.error('Error serving suspension:', error);
      throw error;
    }
  }

  // Check if a player is currently suspended
  async isPlayerSuspended(playerId: string, tournamentId: string): Promise<boolean> {
    const activeSuspensions = await this.getPlayerActiveSuspensions(playerId, tournamentId);
    return activeSuspensions && activeSuspensions.length > 0 || false;
  }

  // Get suspension rules information
  getSuspensionRules(): Record<string, SuspensionRule> {
    return { ...this.SUSPENSION_RULES };
  }
  
  // Reset player suspension counters when they serve their suspension
  async resetPlayerSuspensionCounters(playerId: string, tournamentId: string) {
    try {
      // This would be used when a player serves their suspension
      // In a real implementation, we might want to track consecutive yellow cards
      // For now, we'll just log that the player has served their suspension
      console.log(`Player ${playerId} has served their suspension in tournament ${tournamentId}`);
      return { success: true };
    } catch (error) {
      console.error('Error resetting player suspension counters:', error);
      return { success: false, message: 'Error al reiniciar contadores de sanciones' };
    }
  }
  
  // Generate daily news based on tournament context
  async generateDailyNews(context: NewsGenerationContext) {
    // This would generate various types of news based on the tournament data
    // For now, we'll return an empty array as the main logic is in the news generator
    return [];
  }
}