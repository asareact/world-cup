import { supabase } from './supabase'

// Types matching our Supabase schema
export interface Tournament {
  id: string
  name: string
  description: string | null
  creator_id: string
  status: 'draft' | 'active' | 'completed' | 'paused'
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups'
  max_teams: number
  start_date: string | null
  end_date: string | null
  registration_deadline: string | null
  rules: string | null
  prize_description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  captain_id: string | null
  created_by: string
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  team_id: string
  name: string
  jersey_number: number | null
  position: 'portero' | 'cierre' | 'ala' | 'pivote' | null
  birth_date: string | null
  photo_url: string | null
  is_captain: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  tournament_id: string
  home_team_id: string | null
  away_team_id: string | null
  scheduled_at: string | null
  venue: string | null
  round_name: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  home_score: number
  away_score: number
  winner_team_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TournamentTeam {
  id: string
  tournament_id: string
  team_id: string
  registered_at: string
  status: 'registered' | 'confirmed' | 'withdrawn'
  group_name: string | null
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: 'superAdmin' | 'capitan' | 'invitado'
  created_at: string
  updated_at: string
}

export interface JoinRequest {
  id: string
  tournament_id: string
  team_id: string
  requester_id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  message: string | null
  decided_by: string | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

// Database service class
export class DatabaseService {
  private client = supabase

  // Tournament operations
  async getTournaments(userId: string) {
    const { data, error } = await this.client
      .from('tournaments')
      .select(`
        *,
        tournament_teams!inner(
          team_id,
          teams(name)
        ),
        matches(
          id,
          status,
          home_score,
          away_score
        )
      `)
      .or(`creator_id.eq.${userId},is_public.eq.true`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getTournament(id: string) {
    const { data, error } = await this.client
      .from('tournaments')
      .select(`
        *,
        tournament_teams(
          *,
          teams(*)
        ),
        matches(
          *,
          home_team:teams!matches_home_team_id_fkey(name, logo_url),
          away_team:teams!matches_away_team_id_fkey(name, logo_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createTournament(tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.client
      .from('tournaments')
      .insert(tournament)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTournament(id: string, updates: Partial<Tournament>) {
    const { data, error } = await this.client
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteTournament(id: string) {
    const { error } = await this.client
      .from('tournaments')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Team operations
  async getTeam(id: string) {
    const { data, error } = await this.client
      .from('teams')
      .select(`
        *,
        players(
          id,
          name,
          position,
          is_active,
          is_captain
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async getTeams(userId: string) {
    const { data, error } = await this.client
      .from('teams')
      .select(`
        *,
        players(
          id,
          name,
          position,
          is_active
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.client
      .from('teams')
      .insert(team)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTeam(id: string, updates: Partial<Team>) {
    const { data, error } = await this.client
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteTeam(id: string) {
    const { error } = await this.client
      .from('teams')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Team reference checks (matches that reference a team)
  async countTeamReferences(teamId: string) {
    const getCount = async (column: 'home_team_id' | 'away_team_id' | 'winner_team_id') => {
      const { count, error } = await this.client
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq(column, teamId)
      if (error) throw error
      return count || 0
    }

    const [home, away, winner] = await Promise.all([
      getCount('home_team_id'),
      getCount('away_team_id'),
      getCount('winner_team_id')
    ])

    return { home, away, winner, total: home + away + winner }
  }

  // Player operations
  async getPlayers(teamId: string) {
    const { data, error } = await this.client
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('jersey_number', { ascending: true })

    if (error) throw error
    return data || []
  }

  async createPlayer(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.client
      .from('players')
      .insert(player)
      .select('*')
      .single()

    if (error) throw error
    return data
  }

  async updatePlayer(id: string, updates: Partial<Player>) {
    const { error } = await this.client
      .from('players')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }

  async deletePlayer(id: string) {
    const { error } = await this.client
      .from('players')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Match operations
  async getMatches(tournamentId: string) {
    const { data, error } = await this.client
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        winner_team:teams!matches_winner_team_id_fkey(name)
      `)
      .eq('tournament_id', tournamentId)
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  async createMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.client
      .from('matches')
      .insert(match)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateMatch(id: string, updates: Partial<Match>) {
    const { data, error } = await this.client
      .from('matches')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Tournament team operations
  async registerTeamForTournament(tournamentId: string, teamId: string) {
    const { data, error } = await this.client
      .from('tournament_teams')
      .insert({
        tournament_id: tournamentId,
        team_id: teamId,
        status: 'registered'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async unregisterTeamFromTournament(tournamentId: string, teamId: string) {
    const { error } = await this.client
      .from('tournament_teams')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId)

    if (error) throw error
  }

  // Join Requests (tournament participation)
  async createJoinRequest(tournamentId: string, teamId: string, requesterId: string, message?: string) {
    const { data, error } = await this.client
      .from('tournament_join_requests')
      .insert({
        tournament_id: tournamentId,
        team_id: teamId,
        requester_id: requesterId,
        message: message || null
      })
      .select()
      .single()

    if (error) throw error
    return data as JoinRequest
  }

  async getJoinRequest(tournamentId: string, teamId: string) {
    const { data, error } = await this.client
      .from('tournament_join_requests')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error
    return (data && data[0]) as JoinRequest | undefined
  }

  async getPendingJoinRequestsForAdmin(userId: string) {
    const { data, error } = await this.client
      .from('tournament_join_requests')
      .select(`
        *,
        team:teams!inner(id,name,logo_url),
        tournament:tournaments!inner(id,name,creator_id)
      `)
      .eq('status', 'pending')
      .eq('tournaments.creator_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as (JoinRequest & { team: { id: string, name: string, logo_url: string | null }, tournament: { id: string, name: string, creator_id: string } })[]
  }

  async approveJoinRequest(requestId: string, decidedBy: string) {
    const { data, error } = await this.client
      .from('tournament_join_requests')
      .update({ status: 'approved', decided_by: decidedBy, decided_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single()
    if (error) throw error
    return data as JoinRequest
  }

  async rejectJoinRequest(requestId: string, decidedBy: string) {
    const { data, error } = await this.client
      .from('tournament_join_requests')
      .update({ status: 'rejected', decided_by: decidedBy, decided_at: new Date().toISOString() })
      .eq('id', requestId)
      .select()
      .single()
    if (error) throw error
    return data as JoinRequest
  }

  async cancelJoinRequest(requestId: string) {
    const { data, error } = await this.client
      .from('tournament_join_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .select()
      .single()
    if (error) throw error
    return data as JoinRequest
  }

  // Dashboard statistics
  async getDashboardStats(userId: string) {
    // Get tournaments count
    const { count: tournamentsCount, error: tournamentsError } = await this.client
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)

    if (tournamentsError) throw tournamentsError

    // Get active tournaments count
    const { count: activeTournamentsCount, error: activeError } = await this.client
      .from('tournaments')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .eq('status', 'active')

    if (activeError) throw activeError

    // Get teams count
    const { count: teamsCount, error: teamsError } = await this.client
      .from('teams')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)

    if (teamsError) throw teamsError

    // Get matches count
    const { count: matchesCount, error: matchesError } = await this.client
      .from('matches')
      .select('*, tournaments!inner(*)', { count: 'exact', head: true })
      .eq('tournaments.creator_id', userId)
      .eq('status', 'completed')

    if (matchesError) throw matchesError

    return {
      totalTournaments: tournamentsCount || 0,
      activeTournaments: activeTournamentsCount || 0,
      totalTeams: teamsCount || 0,
      matchesPlayed: matchesCount || 0
    }
  }

  // Public tournaments listing for browsing (no management)
  async getPublicTournaments() {
    const { data, error } = await this.client
      .from('tournaments')
      .select(`
        *,
        tournament_teams(id),
        matches(id)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    type PublicTournamentRow = Tournament & {
      tournament_teams?: { id: string }[] | null
      matches?: { id: string }[] | null
    }
    return (data || []).map((t: PublicTournamentRow) => ({
      ...t,
      teamsCount: Array.isArray(t.tournament_teams) ? t.tournament_teams.length : 0,
      matchesCount: Array.isArray(t.matches) ? t.matches.length : 0,
    }))
  }

  async getUpcomingMatches(userId: string, limit = 5) {
    const { data, error } = await this.client
      .from('matches')
      .select(`
        *,
        tournaments!inner(name, creator_id),
        home_team:teams!matches_home_team_id_fkey(name, logo_url),
        away_team:teams!matches_away_team_id_fkey(name, logo_url)
      `)
      .eq('tournaments.creator_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  // Profile operations
  async getProfile(userId: string) {
    // Try user_profiles first (some setups use this name), fallback to profiles
    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      const fallback = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (fallback.error) throw fallback.error
      return fallback.data
    }
    return data
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    // Primero verificamos si el perfil existe
    const { data: existingProfile, error: fetchError } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError)
      throw new Error(`Error al verificar el perfil: ${fetchError.message}`)
    }
    
    // Si el perfil no existe, lo creamos primero
    if (!existingProfile) {
      const { error: insertError } = await this.client
        .from('profiles')
        .insert({
          id: userId,
          ...updates
        })
      
      if (insertError) {
        console.error('Error creating profile:', insertError)
        throw new Error(`Error al crear el perfil: ${insertError.message}`)
      }
      
      // Obtenemos el perfil recién creado
      const { data: newProfile, error: selectError } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (selectError) {
        console.error('Error selecting new profile:', selectError)
        throw new Error(`Error al obtener el perfil creado: ${selectError.message}`)
      }
      
      return newProfile
    }
    
    // Si el perfil existe, lo actualizamos
    const { data, error } = await this.client
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      
    if (error) {
      console.error('Database update profile error:', error)
      throw new Error(`Error al actualizar el perfil: ${error.message}`)
    }
    
    // Verificamos que haya datos retornados
    if (!data || data.length === 0) {
      // Si no hay datos, obtenemos el perfil actualizado
      const { data: updatedProfile, error: selectError } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (selectError) {
        console.error('Error selecting updated profile:', selectError)
        throw new Error(`Error al obtener el perfil actualizado: ${selectError.message}`)
      }
      
      return updatedProfile
    }
    
    // Si hay datos, los retornamos (puede ser un array o un objeto)
    return Array.isArray(data) ? data[0] : data
  }

  // Real-time subscriptions
  subscribeTournamentChanges(userId: string, callback: (payload: unknown) => void) {
    return this.client
      .channel('tournament-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `creator_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }

  subscribeMatchChanges(tournamentId: string, callback: (payload: unknown) => void) {
    return this.client
      .channel('match-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `tournament_id=eq.${tournamentId}`
        },
        callback
      )
      .subscribe()
  }

  // Realtime: join requests changes (pending only). RLS limita filas visibles por admin.
  subscribeJoinRequestChanges(callback: (payload: unknown) => void) {
    return this.client
      .channel('join-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_join_requests',
          filter: 'status=eq.pending'
        },
        callback
      )
      .subscribe()
  }
}

// Export singleton instance
export const db = new DatabaseService()
