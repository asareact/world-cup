'use client'

import { useState, useEffect, useCallback } from 'react'
import { db, Player } from '../database'

export const FUTSAL_POSITIONS = {
  portero: 'Portero',
  cierre: 'Cierre',
  ala: 'Ala',
  pivote: 'Pívot'
} as const

export type FutsalPosition = keyof typeof FUTSAL_POSITIONS

export function usePlayers(teamId: string | null) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = useCallback(async () => {
    if (!teamId) {
      console.log('usePlayers: No teamId provided, skipping fetch')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await db.getPlayers(teamId)
      setPlayers(data)
    } catch (err) {
      console.error('Error fetching players:', err)
      setError('Error al cargar los jugadores')
    } finally {
      setLoading(false)
    }
  }, [teamId])

  const createPlayer = async (player: Omit<Player, 'id' | 'created_at' | 'updated_at'>) => {
    if (!teamId) throw new Error('Team ID requerido')

    // Verificar límite de jugadores
    if (players.filter(p => p.is_active).length >= 12) {
      throw new Error('Un equipo no puede tener más de 12 jugadores activos')
    }

    // Verificar número de camiseta único
    if (player.jersey_number && players.some(p => p.jersey_number === player.jersey_number && p.is_active)) {
      throw new Error('Este número de camiseta ya está en uso')
    }

    try {
      const newPlayer = await db.createPlayer({
        ...player,
        team_id: teamId
      })
      // Actualizar inmediatamente el estado local para mejor UX
      setPlayers(prevPlayers => {
        const updatedPlayers = [...prevPlayers, newPlayer]
        
        // Si es capitán, desmarcar otros capitanes
        if (newPlayer.is_captain) {
          return updatedPlayers.map(p => ({
            ...p,
            is_captain: p.id === newPlayer.id
          }))
        }
        
        return updatedPlayers
      })
      // No forzamos refetch inmediato; confiamos en la actualización optimista
      return newPlayer
    } catch {
      if (err instanceof Error) {
        throw err
      }
      throw new Error('Error al crear el jugador')
    }
  }

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    try {
      // Si estamos actualizando el capitán, manejar la lógica especial
      if (updates.is_captain === true) {
        // Actualizar inmediatamente todos los jugadores para desmarcar otros capitanes
        setPlayers(prevPlayers => 
          prevPlayers.map(p => ({
            ...p,
            is_captain: p.id === id
          }))
        )
      }
      await db.updatePlayer(id, updates)
      // No hacemos refetch; el estado ya fue actualizado de forma optimista
      return { id, ...updates } as Partial<Player>
    } catch {
      // Revertir el cambio local si falla
      await fetchPlayers()
      throw new Error('Error al actualizar el jugador')
    }
  }

  const deletePlayer = async (id: string) => {
    try {
      // Actualizar inmediatamente el estado local
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== id))
      await db.deletePlayer(id)
      // No hacemos refetch inmediato; el estado ya se actualizó localmente
    } catch {
      // Revertir el cambio local si falla
      await fetchPlayers()
      throw new Error('Error al eliminar el jugador')
    }
  }

  const setCaptain = async (playerId: string) => {
    try {
      console.log('usePlayers: Setting captain for player:', playerId)
      
      // Actualizar inmediatamente en el estado local para mejor UX
      setPlayers(prevPlayers => 
        prevPlayers.map(p => ({
          ...p,
          is_captain: p.id === playerId
        }))
      )
      
      // El trigger de la base de datos automáticamente desmarcará otros capitanes
      await updatePlayer(playerId, { is_captain: true })
      
      console.log('usePlayers: Captain set successfully')
    } catch (err) {
      console.error('Error setting captain:', err)
      // Revertir el cambio local si falla
      await fetchPlayers()
      throw new Error('Error al establecer capitán')
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [teamId, fetchPlayers])

  const captain = players.find(p => p.is_captain)
  const activePlayers = players.filter(p => p.is_active)
  const availableNumbers = Array.from({length: 99}, (_, i) => i + 1)
    .filter(num => !players.some(p => p.jersey_number === num && p.is_active))

  return {
    players,
    activePlayers,
    captain,
    availableNumbers,
    loading,
    error,
    refetch: fetchPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    setCaptain
  }
}
