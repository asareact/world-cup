'use client'

import { useEffect, useState, useCallback } from 'react'
import { db, Tournament, Match, Team } from '@/lib/database'
import { supabase } from '@/lib/supabase'

interface TournamentWithDetails extends Tournament {
  matches?: Match[]
  tournament_teams?: Team[]
}

export function useTournament(tournamentId: string) {
  const [tournament, setTournament] = useState<TournamentWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTournament = useCallback(async () => {
    if (!tournamentId) return
    try {
      setLoading(true)
      setError(null)
      const data = await db.getTournament(tournamentId)
      setTournament(data)
    } catch (e) {
      console.error('Error fetching tournament:', e)
      setError('No se pudo cargar el torneo')
    } finally {
      setLoading(false)
    }
  }, [tournamentId])

  useEffect(() => {
    fetchTournament()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId])

  return { tournament, loading, error, refetch: fetchTournament }
}

export async function getLatestMatches(tournamentId: string, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`id, home_team_id, away_team_id, home_score, away_score, scheduled_at, status,
               home_team:teams!home_team_id(id, name), away_team:teams!away_team_id(id, name)`)
      .eq('tournament_id', tournamentId)
      .order('scheduled_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (e) {
    console.error('Error fetching latest matches:', e)
    return []
  }
}

export type UpcomingMatchRow = {
  match_id: string
  scheduled_at: string | null
  venue: string | null
  round_name: string | null
  home_team_name: string | null
  away_team_name: string | null
}

export type RecentResultRow = UpcomingMatchRow & {
  home_score: number
  away_score: number
}

export async function getUpcomingMatches(tournamentId: string, limit = 5): Promise<UpcomingMatchRow[]> {
  try {
    const { data, error } = await supabase
      .rpc('fn_tournament_upcoming', { _tournament: tournamentId, _limit: limit })
    if (error) throw error
    return (data || []) as UpcomingMatchRow[]
  } catch (e) {
    console.error('Error fetching upcoming via RPC:', e)
    return []
  }
}

export async function getRecentResults(tournamentId: string, limit = 5): Promise<RecentResultRow[]> {
  try {
    const { data, error } = await supabase
      .rpc('fn_tournament_recent_results', { _tournament: tournamentId, _limit: limit })
    if (error) throw error
    return (data || []) as RecentResultRow[]
  } catch (e) {
    console.error('Error fetching recent results via RPC:', e)
    return []
  }
}

export type TopScorerRow = {
  goals: number
  assists?: number | null
  yellow_cards?: number | null
  red_cards?: number | null
  matches_played?: number | null
  minutes_played?: number | null
  player?: { id?: string; name?: string; team_id?: string } | null
  team?: { id?: string; name?: string } | null
}

export async function getTopScorers(tournamentId: string, limit = 10): Promise<TopScorerRow[]> {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select(`goals, assists, yellow_cards, red_cards, matches_played, minutes_played,
               player:players(id,name,team_id,teams(name))`)
      .eq('tournament_id', tournamentId)
      .order('goals', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data ?? []) as TopScorerRow[]
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Top scorers not available:', error)
    }
    return []
  }
}
