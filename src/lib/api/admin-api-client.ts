import { UserProfile, PlayerStatsWithDetails, PaginatedResponse, PlayerStatsFilter, SortParams, PaginationParams } from './admin-service';

export interface UpdateUserPayload {
  userId: string;
  role: UserProfile['role'];
}

export interface UpdatePlayerStatsPayload {
  id: string;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  matches_played?: number;
  minutes_played?: number;
  saves_made?: number;
  goals_conceded?: number;
  clean_sheets?: number;
  matches_appeared?: number;
}

export interface CreatePlayerStatsPayload {
  player_id: string;
  tournament_id: string;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  matches_played?: number;
  minutes_played?: number;
  saves_made?: number;
  goals_conceded?: number;
  clean_sheets?: number;
  matches_appeared?: number;
}

export class AdminApiClient {
  private baseUrl = '/api/admin';

  /**
   * User Profiles API methods
   */
  
  async getUserProfiles(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<PaginatedResponse<UserProfile>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    const response = await fetch(`${this.baseUrl}/users?${params}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching user profiles: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async updateUserRole(payload: UpdateUserPayload): Promise<{ success: boolean; data: UserProfile }> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating user role: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Player Stats API methods
   */
  
  async getPlayerStats(
    pagination: PaginationParams = { page: 1, limit: 10 },
    filters: PlayerStatsFilter = {},
    sort: SortParams = { field: 'goals', order: 'desc' }
  ): Promise<PaginatedResponse<PlayerStatsWithDetails>> {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      sortField: sort.field,
      sortOrder: sort.order,
      ...(filters.tournament_id && { tournamentId: filters.tournament_id }),
      ...(filters.team_id && { teamId: filters.team_id }),
      ...(filters.player_name && { playerName: filters.player_name }),
      ...(filters.position && { position: filters.position }),
      ...(filters.min_goals !== undefined && { minGoals: filters.min_goals.toString() }),
      ...(filters.max_goals !== undefined && { maxGoals: filters.max_goals.toString() }),
      ...(filters.min_assists !== undefined && { minAssists: filters.min_assists.toString() }),
      ...(filters.max_assists !== undefined && { maxAssists: filters.max_assists.toString() }),
      ...(filters.min_minutes !== undefined && { minMinutes: filters.min_minutes.toString() }),
      ...(filters.max_minutes !== undefined && { maxMinutes: filters.max_minutes.toString() }),
    });

    const response = await fetch(`${this.baseUrl}/player-stats?${params}`);
    
    if (!response.ok) {
      throw new Error(`Error fetching player stats: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async updatePlayerStats(payload: UpdatePlayerStatsPayload): Promise<{ success: boolean; data: PlayerStatsWithDetails }> {
    const response = await fetch(`${this.baseUrl}/player-stats`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Error updating player stats: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async createPlayerStats(payload: CreatePlayerStatsPayload): Promise<{ success: boolean; data: PlayerStatsWithDetails }> {
    const response = await fetch(`${this.baseUrl}/player-stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Error creating player stats: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async deletePlayerStats(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/player-stats`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting player stats: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getFilterOptions(): Promise<{
    tournaments: { id: string; name: string }[];
    teams: { id: string; name: string }[];
    positions: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/player-stats/filters`);
    
    if (!response.ok) {
      throw new Error(`Error fetching filter options: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Export singleton instance
export const adminApi = new AdminApiClient();