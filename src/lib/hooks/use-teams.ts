'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../auth-context'
import { db, Team, Player } from '../database'

export interface TeamWithPlayers extends Team {
  players: Player[]
  playerCount: number
}

export function useTeams() {
  const { user } = useAuth()
  const [teams, setTeams] = useState<TeamWithPlayers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeams = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      
      const data = await db.getTeams(user.id)
      
      // Transform data to include player count
      const teamsWithPlayers: TeamWithPlayers[] = data.map(team => ({
        ...team,
        players: team.players || [],
        playerCount: team.players?.filter((p: Player) => p.is_active).length || 0
      }))

      setTeams(teamsWithPlayers)
    } catch (err) {
      console.error('Error fetching teams:', err)
      setError('Error al cargar los equipos')
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async (team: Omit<Team, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    if (!user) throw new Error('Usuario no autenticado')

    try {
      const newTeam = await db.createTeam({
        ...team,
        created_by: user.id
      })
      
      // Refresh teams list
      fetchTeams()
      
      return newTeam
    } catch (err) {
      console.error('Error creating team:', err)
      throw new Error('Error al crear el equipo')
    }
  }

  const updateTeam = async (id: string, updates: Partial<Team>) => {
    try {
      const updatedTeam = await db.updateTeam(id, updates)
      
      // Refresh teams list
      fetchTeams()
      
      return updatedTeam
    } catch (err) {
      console.error('Error updating team:', err)
      throw new Error('Error al actualizar el equipo')
    }
  }

  const deleteTeam = async (id: string) => {
    try {
      await db.deleteTeam(id)
      
      // Refresh teams list
      fetchTeams()
    } catch (err) {
      console.error('Error deleting team:', err)
      throw new Error('Error al eliminar el equipo')
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [user])

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam
  }
}
