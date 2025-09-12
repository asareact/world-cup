'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../auth-context'
import { db, Tournament, Match } from '../database'

export interface TournamentWithStats extends Tournament {
  teams: number
  matches: {
    total: number
    played: number
    remaining: number
  }
  progress: number
}

export function useTournaments() {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState<TournamentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTournaments = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const data = await db.getTournaments(user.id)
      
      // Transform data to include stats
      const tournamentsWithStats: TournamentWithStats[] = data.map(tournament => {
        const teams = tournament.tournament_teams?.length || 0
        const matches = tournament.matches || []
        const playedMatches = matches.filter((m: Match) => m.status === 'completed').length
        const totalMatches = matches.length
        const remainingMatches = totalMatches - playedMatches
        const progress = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0

        return {
          ...tournament,
          teams,
          matches: {
            total: totalMatches,
            played: playedMatches,
            remaining: remainingMatches
          },
          progress
        }
      })

      setTournaments(tournamentsWithStats)
    } catch (err) {
      console.error('Error fetching tournaments:', err)
      setError('Error al cargar los torneos')
    } finally {
      setLoading(false)
    }
  }

  const createTournament = async (tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at' | 'creator_id'>) => {
    if (!user) throw new Error('Usuario no autenticado')

    try {
      const newTournament = await db.createTournament({
        ...tournament,
        creator_id: user.id
      })
      
      // Refresh tournaments list
      fetchTournaments()
      
      return newTournament
    } catch (err) {
      console.error('Error creating tournament:', err)
      throw new Error('Error al crear el torneo')
    }
  }

  const updateTournament = async (id: string, updates: Partial<Tournament>) => {
    try {
      const updatedTournament = await db.updateTournament(id, updates)
      
      // Refresh tournaments list
      fetchTournaments()
      
      return updatedTournament
    } catch (err) {
      console.error('Error updating tournament:', err)
      throw new Error('Error al actualizar el torneo')
    }
  }

  const deleteTournament = async (id: string) => {
    try {
      await db.deleteTournament(id)
      
      // Refresh tournaments list
      fetchTournaments()
    } catch (err) {
      console.error('Error deleting tournament:', err)
      throw new Error('Error al eliminar el torneo')
    }
  }

  useEffect(() => {
    fetchTournaments()
  }, [user])

  return {
    tournaments,
    loading,
    error,
    refetch: fetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament
  }
}
