import { supabase } from '../supabase';
import { Profile } from '../database';

export interface UserProfile extends Omit<Profile,'role'> {
  id: string;
  role: 'superAdmin' | 'capitan' | 'invitado' | 'arbitro';
  email:string
}

export interface PlayerStats {
  id: string;
  player_id: string;
  tournament_id: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  matches_played: number;
  minutes_played: number;
  saves_made: number;
  goals_conceded: number;
  clean_sheets: number;
  matches_appeared: number;
}

export interface PlayerStatsWithDetails extends Omit<PlayerStats, 'created_at' | 'updated_at'> {
  player_name: string;
  player_position: string;
  team_name: string;
  tournament_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PlayerStatsFilter {
  tournament_id?: string;
  team_id?: string;
  player_name?: string;
  position?: string;
  min_goals?: number;
  max_goals?: number;
  min_assists?: number;
  max_assists?: number;
  min_minutes?: number;
  max_minutes?: number;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AdminService {
  /**
   * Get all user profiles for role management
   */
  async getUserProfiles(
    page: number = 1,
    limit: number = 10,
    searchTerm: string = ''
  ): Promise<PaginatedResponse<UserProfile>> {
    // Try user_profiles table first, fall back to profiles table if it doesn't exist
    let tableName = 'user_profiles';
    let query = supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply search filter
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    let { data, error, count } = await query;

    // If user_profiles table doesn't exist, try profiles table
    if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
      tableName = 'profiles';
      let fallbackQuery = supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchTerm) {
        fallbackQuery = fallbackQuery.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      fallbackQuery = fallbackQuery.range(from, to);

      const fallbackResult = await fallbackQuery;
      
      if (fallbackResult.error) {
        throw new Error(`Error fetching user profiles: ${fallbackResult.error.message}`);
      }
      
      data = fallbackResult.data;
      count = fallbackResult.count;
      error = fallbackResult.error;
    }

    if (error && error.code !== '42P01') {
      throw new Error(`Error fetching user profiles: ${error.message}`);
    }

    // Transform the data to match UserProfile interface
    const transformedData = data ? data.map(item => ({
      ...item,
      id: item.id,
      full_name: item.full_name,
      avatar_url: item.avatar_url,
      phone: item.phone,
      role: item.role || 'invitado' // default to invitado if not set
    })) : [];

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return {
      data: transformedData as UserProfile[],
      total: count || 0,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserProfile['role']): Promise<UserProfile> {
    // Try user_profiles table first, fall back to profiles table if it doesn't exist
    let result = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId)
      .select('*')
      .single();

    // If user_profiles table doesn't exist, try profiles table
    if (result.error && (result.error.code === '42P01' || result.error.message.includes('does not exist'))) {
      result = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select('*')
        .single();
    }

    if (result.error) {
      throw new Error(`Error updating user role: ${result.error.message}`);
    }

    return {
      ...result.data,
      role: result.data.role || 'invitado' // ensure role is returned
    } as UserProfile;
  }

  /**
   * Get single user profile by ID
   */
  async getUserProfileById(userId: string): Promise<UserProfile | null> {
    // Try user_profiles table first, fall back to profiles table if it doesn't exist
    let result = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If user_profiles table doesn't exist, try profiles table
    if (result.error && (result.error.code === '42P01' || result.error.message.includes('does not exist'))) {
      result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    }

    if (result.error) {
      if (result.error.code === 'PGRST116') {
        // No row found
        return null;
      }
      throw new Error(`Error fetching user profile: ${result.error.message}`);
    }

    return {
      ...result.data,
      role: result.data.role || 'invitado' // ensure role is returned
    } as UserProfile;
  }

  /**
   * Create or update user profile if it doesn't exist
   */
  async createOrUpdateUserProfile(profile: Pick<UserProfile, 'id' | 'full_name' | 'avatar_url' | 'phone' | 'role'>): Promise<UserProfile> {
    // Try user_profiles table first, fall back to profiles table if it doesn't exist
    let result = await supabase
      .from('user_profiles')
      .upsert(profile, { onConflict: 'id' })
      .select('*')
      .single();

    // If user_profiles table doesn't exist, try profiles table
    if (result.error && (result.error.code === '42P01' || result.error.message.includes('does not exist'))) {
      result = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' })
        .select('*')
        .single();
    }

    if (result.error) {
      throw new Error(`Error creating/updating user profile: ${result.error.message}`);
    }

    return {
      ...result.data,
      role: result.data.role || 'invitado' // ensure role is returned
    } as UserProfile;
  }

  /**
   * Get all player stats with pagination, sorting, and filtering
   */
  async getPlayerStats(
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters: PlayerStatsFilter = {},
    sort: SortParams = { field: 'goals', order: 'desc' }
  ): Promise<PaginatedResponse<PlayerStatsWithDetails>> {
    // Build the main query with joins
    let query = supabase
      .from('player_stats')
      .select(`
        id,
        player_id,
        tournament_id,
        goals,
        assists,
        yellow_cards,
        red_cards,
        matches_played,
        minutes_played,
        saves_made,
        goals_conceded,
        clean_sheets,
        matches_appeared,
        players!inner (
          name,
          position,
          teams!inner (
            name
          )
        ),
        tournaments!inner (
          name
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.tournament_id) {
      query = query.eq('player_stats.tournament_id', filters.tournament_id);
    }
    if (filters.team_id) {
      query = query.eq('players.team_id', filters.team_id);
    }
    if (filters.player_name) {
      query = query.ilike('players.name', `%${filters.player_name}%`);
    }
    if (filters.position) {
      query = query.eq('players.position', filters.position);
    }
    if (filters.min_goals !== undefined) {
      query = query.gte('player_stats.goals', filters.min_goals);
    }
    if (filters.max_goals !== undefined) {
      query = query.lte('player_stats.goals', filters.max_goals);
    }
    if (filters.min_assists !== undefined) {
      query = query.gte('player_stats.assists', filters.min_assists);
    }
    if (filters.max_assists !== undefined) {
      query = query.lte('player_stats.assists', filters.max_assists);
    }
    if (filters.min_minutes !== undefined) {
      query = query.gte('player_stats.minutes_played', filters.min_minutes);
    }
    if (filters.max_minutes !== undefined) {
      query = query.lte('player_stats.minutes_played', filters.max_minutes);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.order === 'asc' });

    // Apply pagination
    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Error fetching player stats: ${error.message}`);
    }

    // Transform the data to match the expected format
    const transformedData = data.map((item: any) => ({
      id: item.id,
      player_id: item.player_id,
      tournament_id: item.tournament_id,
      goals: item.goals,
      assists: item.assists,
      yellow_cards: item.yellow_cards,
      red_cards: item.red_cards,
      matches_played: item.matches_played,
      minutes_played: item.minutes_played,
      saves_made: item.saves_made,
      goals_conceded: item.goals_conceded,
      clean_sheets: item.clean_sheets,
      matches_appeared: item.matches_appeared,
      player_name: item.players.name,
      player_position: item.players.position,
      team_name: item.players.teams.name,
      tournament_name: item.tournaments.name,
    }));

    const totalPages = count ? Math.ceil(count / pagination.limit) : 0;

    return {
      data: transformedData,
      total: count || 0,
      page: pagination.page,
      limit: pagination.limit,
      totalPages
    };
  }

  /**
   * Get single player stats by ID
   */
  async getPlayerStatsById(statsId: string): Promise<PlayerStats | null> {
    const { data, error } = await supabase
      .from('player_stats')
      .select(`
        id,
        player_id,
        tournament_id,
        goals,
        assists,
        yellow_cards,
        red_cards,
        matches_played,
        minutes_played,
        saves_made,
        goals_conceded,
        clean_sheets,
        matches_appeared
      `)
      .eq('id', statsId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found
        return null;
      }
      throw new Error(`Error fetching player stats: ${error.message}`);
    }

    return data as PlayerStats;
  }

  /**
   * Update player stats by ID
   */
  async updatePlayerStats(statsId: string, updates: Partial<PlayerStats>): Promise<PlayerStats> {
    const { data, error } = await supabase
      .from('player_stats')
      .update(updates)
      .eq('id', statsId)
      .select(`
        id,
        player_id,
        tournament_id,
        goals,
        assists,
        yellow_cards,
        red_cards,
        matches_played,
        minutes_played,
        saves_made,
        goals_conceded,
        clean_sheets,
        matches_appeared
      `)
      .single();

    if (error) {
      throw new Error(`Error updating player stats: ${error.message}`);
    }

    return data as PlayerStats;
  }

  /**
   * Create new player stats
   */
  async createPlayerStats(stats: Omit<PlayerStats, 'id'>): Promise<PlayerStats> {
    const { data, error } = await supabase
      .from('player_stats')
      .insert(stats)
      .select(`
        id,
        player_id,
        tournament_id,
        goals,
        assists,
        yellow_cards,
        red_cards,
        matches_played,
        minutes_played,
        saves_made,
        goals_conceded,
        clean_sheets,
        matches_appeared
      `)
      .single();

    if (error) {
      throw new Error(`Error creating player stats: ${error.message}`);
    }

    return data as PlayerStats;
  }

  /**
   * Delete player stats by ID
   */
  async deletePlayerStats(statsId: string): Promise<void> {
    const { error } = await supabase
      .from('player_stats')
      .delete()
      .eq('id', statsId);

    if (error) {
      throw new Error(`Error deleting player stats: ${error.message}`);
    }
  }

  /**
   * Get all unique tournaments for filtering options
   */
  async getTournamentsForFilter(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('tournaments')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching tournaments: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all teams for filtering options
   */
  async getTeamsForFilter(): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching teams: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all unique player positions for filtering options
   */
  async getPositionsForFilter(): Promise<string[]> {
    const { data, error } = await supabase
      .from('players')
      .select('position')
      .is('position', 'not')
      .order('position', { ascending: true });

    if (error) {
      throw new Error(`Error fetching positions: ${error.message}`);
    }

    // Extract unique positions
    const positions = Array.from(new Set(data.map(item => item.position).filter(Boolean))) as string[];
    return positions;
  }

  /**
   * Remove a team from a tournament and all related data
   */
  async removeTeamFromTournament(teamId: string, tournamentId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/admin/remove-team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        team_id: teamId, 
        tournament_id: tournamentId,
        action: 'remove'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error removing team from tournament');
    }

    return result;
  }

  /**
   * Get a preview of what will be affected when removing a team from a tournament
   */
  async previewTeamRemoval(teamId: string, tournamentId: string): Promise<{ success: boolean; summary: any }> {
    const response = await fetch('/api/admin/remove-team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        team_id: teamId, 
        tournament_id: tournamentId,
        action: 'preview'
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error previewing team removal');
    }

    return result;
  }

  /**
   * Get teams that are part of a specific tournament
   */
  async getTeamsInTournament(tournamentId: string): Promise<{ id: string; name: string }[]> {
    const { data, error } = await supabase
      .from('tournament_teams')
      .select(`
        id,
        team_id,
        team:teams!tournament_teams_team_id_fkey (id, name)
      `)
      .eq('tournament_id', tournamentId);

    if (error) {
      throw new Error(`Error fetching teams in tournament: ${error.message}`);
    }

    return data?.map(item => {
      const teamData = Array.isArray(item.team) ? item.team[0] : item.team;
      return {
        id: item.team_id,
        name: teamData?.name || `Team ${item.team_id}`
      };
    }) || [];
  }
}