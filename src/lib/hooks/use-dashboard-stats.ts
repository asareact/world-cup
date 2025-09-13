'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth-context'
import { db } from '../database'

export interface DashboardStats {
  totalTournaments: number
  activeTournaments: number
  totalTeams: number
  matchesPlayed: number
}

export interface UpcomingMatch {
  id: string
  homeTeam: string | null
  awayTeam: string | null
  tournament: string
  date: string
  venue: string | null
}

export function useDashboardStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalTournaments: 0,
    activeTournaments: 0,
    totalTeams: 0,
    matchesPlayed: 0
  })
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Fetch dashboard stats
      const statsData = await db.getDashboardStats(user.id)
      setStats(statsData)

      // Fetch upcoming matches
      const matchesData = await db.getUpcomingMatches(user.id, 3)
      const formattedMatches: UpcomingMatch[] = matchesData.map(match => ({
        id: match.id,
        homeTeam: match.home_team?.name || null,
        awayTeam: match.away_team?.name || null,
        tournament: match.tournaments.name,
        date: match.scheduled_at || '',
        venue: match.venue
      }))
      
      setUpcomingMatches(formattedMatches)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Error al cargar las estadísticas')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [user, fetchStats])

  return {
    stats,
    upcomingMatches,
    loading,
    error,
    refetch: fetchStats
  }
}