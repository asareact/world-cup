'use client'

import { useEffect, useState, useCallback } from 'react'
import { db } from '@/lib/database'
import { supabase } from '@/lib/supabase'

type TournamentShape = unknown

export function useTournament(tournamentId: string) {
  const [tournament, setTournament] = useState<TournamentShape | null>(null)
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

export async function getTopScorers(tournamentId: string, limit = 10) {
  try {
    // player_stats joined with players and teams for display
    const { data, error } = await supabase
      .from('player_stats')
      .select(`goals, assists, yellow_cards, red_cards, matches_played, minutes_played,
               player:players(id,name,team_id), team:teams!inner(id,name)`, { count: 'exact' })
      .eq('tournament_id', tournamentId)
      .order('goals', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (e) {
    console.error('Error fetching top scorers:', e)
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
