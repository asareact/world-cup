import { Tournament, Team, Player, Match, JoinRequest, Profile } from '../database'

// API Client para comunicarse con los endpoints de la API
class ApiClient {
  private baseUrl: string
  private defaultHeaders: HeadersInit

  constructor() {
    this.baseUrl = '/api'
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${url}`, error)
      throw error
    }
  }

  // Tournament endpoints
  async getTournaments(): Promise<Tournament[]> {
    return this.request<Tournament[]>('/tournaments')
  }

  async getTournament(id: string): Promise<Tournament> {
    return this.request<Tournament>(`/tournaments/${id}`)
  }

  async createTournament(tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>): Promise<Tournament> {
    return this.request<Tournament>('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournament),
    })
  }

  async updateTournament(id: string, updates: Partial<Tournament>): Promise<Tournament> {
    return this.request<Tournament>(`/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteTournament(id: string): Promise<void> {
    return this.request<void>(`/tournaments/${id}`, {
      method: 'DELETE',
    })
  }

  // Team endpoints
  async getTeams(): Promise<Team[]> {
    return this.request<Team[]>('/teams')
  }

  async getTeam(id: string): Promise<Team> {
    return this.request<Team>(`/teams/${id}`)
  }

  async createTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>): Promise<Team> {
    return this.request<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    })
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team> {
    return this.request<Team>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteTeam(id: string): Promise<void> {
    return this.request<void>(`/teams/${id}`, {
      method: 'DELETE',
    })
  }

  // Player endpoints
  async getPlayers(teamId: string): Promise<Player[]> {
    return this.request<Player[]>(`/teams/${teamId}/players`)
  }

  async createPlayer(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>): Promise<Player> {
    return this.request<Player>(`/players`, {
      method: 'POST',
      body: JSON.stringify(player),
    })
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<void> {
    return this.request<void>(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deletePlayer(id: string): Promise<void> {
    return this.request<void>(`/players/${id}`, {
      method: 'DELETE',
    })
  }

  // Match endpoints
  async getMatches(tournamentId: string): Promise<Match[]> {
    return this.request<Match[]>(`/tournaments/${tournamentId}/matches`)
  }

  async createMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>): Promise<Match> {
    return this.request<Match>(`/matches`, {
      method: 'POST',
      body: JSON.stringify(match),
    })
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match> {
    return this.request<Match>(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // Join request endpoints
  async createJoinRequest(tournamentId: string, teamId: string, message?: string): Promise<JoinRequest> {
    return this.request<JoinRequest>(`/tournaments/${tournamentId}/join-requests`, {
      method: 'POST',
      body: JSON.stringify({ teamId, message }),
    })
  }

  async approveJoinRequest(requestId: string): Promise<JoinRequest> {
    return this.request<JoinRequest>(`/join-requests/${requestId}/approve`, {
      method: 'POST',
    })
  }

  async rejectJoinRequest(requestId: string): Promise<JoinRequest> {
    return this.request<JoinRequest>(`/join-requests/${requestId}/reject`, {
      method: 'POST',
    })
  }

  // Profile endpoints
  async getProfile(): Promise<Profile> {
    return this.request<Profile>('/profile')
  }

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    return this.request<Profile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // Special operations
  async generateTournamentFixture(tournamentId: string): Promise<Match[]> {
    return this.request<Match[]>(`/tournaments/${tournamentId}/generate-fixture`, {
      method: 'POST',
    })
  }

  async registerTeamForTournament(tournamentId: string, teamId: string): Promise<void> {
    return this.request<void>(`/tournaments/${tournamentId}/register`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    })
  }

  async unregisterTeamFromTournament(tournamentId: string, teamId: string): Promise<void> {
    return this.request<void>(`/tournaments/${tournamentId}/unregister`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()