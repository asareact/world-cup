// Database service for player suspensions
import { supabase } from '@/lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

// Types matching our Supabase schema
export interface PlayerSuspension {
  id: string;
  player_id: string;
  tournament_id: string;
  match_id: string | null;
  reason: string | null;
  suspension_type: 'yellow_accumulated' | 'yellow_consecutive' | 'red_direct' | 'red_two_yellow';
  suspension_matches: number;
  served: boolean;
  created_at: string;
}

// Service class for player suspension operations
export class PlayerSuspensionService {
  // Get all suspensions for a player in a tournament
  async getPlayerSuspensions(playerId: string, tournamentId: string): Promise<{ data: PlayerSuspension[] | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('player_suspensions')
      .select('*')
      .eq('player_id', playerId)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Get active suspensions for a player in a tournament
  async getActivePlayerSuspensions(playerId: string, tournamentId: string): Promise<{ data: PlayerSuspension[] | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('player_suspensions')
      .select('*')
      .eq('player_id', playerId)
      .eq('tournament_id', tournamentId)
      .eq('served', false)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Get all active suspensions for a tournament
  async getTournamentActiveSuspensions(tournamentId: string): Promise<{ data: PlayerSuspension[] | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('player_suspensions')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('served', false)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Create a new suspension
  async createSuspension(suspension: Omit<PlayerSuspension, 'id' | 'created_at'>): Promise<{ data: PlayerSuspension | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('player_suspensions')
      .insert(suspension)
      .select()
      .single();

    return { data, error };
  }

  // Mark suspension as served
  async serveSuspension(suspensionId: string): Promise<{ data: PlayerSuspension | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('player_suspensions')
      .update({ served: true })
      .eq('id', suspensionId)
      .select()
      .single();

    return { data, error };
  }

  // Delete a suspension (for corrections)
  async deleteSuspension(suspensionId: string): Promise<{ error: PostgrestError | null }> {
    const { error } = await supabase
      .from('player_suspensions')
      .delete()
      .eq('id', suspensionId);

    return { error };
  }

  // Get suspension by ID
  async getSuspensionById(suspensionId: string): Promise<{ data: PlayerSuspension | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('player_suspensions')
      .select('*')
      .eq('id', suspensionId)
      .single();

    return { data, error };
  }

  // Get player's suspension history with match details
  async getPlayerSuspensionHistory(playerId: string, tournamentId: string): Promise<{ data: any[] | null; error: PostgrestError | null }> {
    const { data, error } = await supabase
      .from('player_suspensions')
      .select(`
        *,
        matches!inner(*)
      `)
      .eq('player_id', playerId)
      .eq('matches.tournament_id', tournamentId)
      .order('created_at', { ascending: false });

    return { data, error };
  }
  
  // Get suspended players for a specific team in a tournament
  async getTeamSuspendedPlayers(teamId: string, tournamentId: string): Promise<{ data: any[] | null; error: PostgrestError | null }> {
    try {
      // First get all players for the team
      const { data: teamPlayers, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .eq('team_id', teamId);
      
      if (playersError) {
        return { data: null, error: playersError };
      }
      
      if (!teamPlayers || teamPlayers.length === 0) {
        return { data: [], error: null };
      }
      
      // Get active suspensions for these players in the tournament
      const playerIds = teamPlayers.map(p => p.id);
      const { data: suspensions, error: suspensionsError } = await supabase
        .from('player_suspensions')
        .select(`
          *,
          player_id
        `)
        .in('player_id', playerIds)
        .eq('tournament_id', tournamentId)
        .eq('served', false)
        .order('created_at', { ascending: false });
      
      if (suspensionsError) {
        return { data: null, error: suspensionsError };
      }

      if (!suspensions || suspensions.length === 0) {
        return { data: [], error: null };
      }

      // Get player details separately
      const suspensionPlayerIds = [...new Set(suspensions.map(s => s.player_id))].filter(Boolean) as string[];
      
      let playerDetails: any[] = [];
      if (suspensionPlayerIds.length > 0) {
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select(`
            id,
            name,
            team_id,
            teams!inner(name)
          `)
          .in('id', suspensionPlayerIds);
          
        if (playersError) {
          console.error('Error fetching player details:', playersError);
          return { data: null, error: playersError };
        } else {
          playerDetails = playersData || [];
        }
      }

      // Combine suspension and player data
      const suspendedPlayers = suspensions.map(suspension => {
        const playerDetail = playerDetails.find(p => p.id === suspension.player_id);
        return {
          ...suspension,
          players: playerDetail,
          player_name: playerDetail?.name || 'Jugador',
          team_name: playerDetail?.teams?.name || 'Equipo'
        };
      });
      
      return { data: suspendedPlayers, error: null };
    } catch (error) {
      console.error('Error fetching team suspended players:', error);
      return { data: null, error: error as PostgrestError };
    }
  }
  
  // Get all suspended players in a tournament with team info
  async getAllTournamentSuspendedPlayers(tournamentId: string): Promise<{ data: any[] | null; error: PostgrestError | null }> {
    try {
      // First get active suspensions with player IDs only
      const { data: suspensions, error: suspensionsError } = await supabase
        .from('player_suspensions')
        .select(`
          *,
          player_id
        `)
        .eq('tournament_id', tournamentId)
        .eq('served', false)
        .order('created_at', { ascending: false });
      
      if (suspensionsError) {
        return { data: null, error: suspensionsError };
      }

      if (!suspensions || suspensions.length === 0) {
        return { data: [], error: null };
      }

      // Get player details separately
      const playerIds = [...new Set(suspensions.map(s => s.player_id))].filter(Boolean) as string[];
      
      let playerDetails: any[] = [];
      if (playerIds.length > 0) {
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select(`
            id,
            name,
            team_id,
            teams!inner(name)
          `)
          .in('id', playerIds);
          
        if (playersError) {
          console.error('Error fetching player details:', playersError);
          return { data: null, error: playersError };
        } else {
          playerDetails = playersData || [];
        }
      }

      // Combine suspension and player data
      const suspendedPlayers = suspensions.map(suspension => {
        const playerDetail = playerDetails.find(p => p.id === suspension.player_id);
        return {
          ...suspension,
          players: playerDetail,
          player_name: playerDetail?.name || 'Jugador',
          team_name: playerDetail?.teams?.name || 'Equipo'
        };
      });
      
      return { data: suspendedPlayers, error: null };
    } catch (error) {
      console.error('Error fetching all tournament suspended players:', error);
      return { data: null, error: error as PostgrestError };
    }
  }
}