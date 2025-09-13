'use client'

import { useState, useEffect } from 'react'
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

  const fetchPlayers = async () => {
    if (!teamId) {
      console.log('usePlayers: No teamId provided, skipping fetch')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('usePlayers: Fetching players for team:', teamId)
      const data = await db.getPlayers(teamId)
      console.log('usePlayers: Fetched players:', data)
      setPlayers(data)
    } catch (err) {
      console.error('Error fetching players:', err)
      setError('Error al cargar los jugadores')
    } finally {
      setLoading(false)
    }
  }

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
      console.log('usePlayers: Creating player with data:', { ...player, team_id: teamId })
      
      const newPlayer = await db.createPlayer({
        ...player,
        team_id: teamId
      })
      
      console.log('usePlayers: Player created successfully:', newPlayer)
      
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
      
      // También hacer fetch para asegurar sincronización
      setTimeout(() => fetchPlayers(), 100)
      
      return newPlayer
    } catch (err) {
      console.error('Error creating player:', err)
      if (err instanceof Error) {
        throw err
      }
      throw new Error('Error al crear el jugador')
    }
  }

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    try {
      console.log('usePlayers: Updating player:', id, updates)
      
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
      
      const updatedPlayer = await db.updatePlayer(id, updates)
      
      console.log('usePlayers: Player updated successfully:', updatedPlayer)
      
      // Hacer un fetch delayed para asegurar sincronización con DB
      setTimeout(() => fetchPlayers(), 100)
      
      return updatedPlayer
    } catch (err) {
      console.error('Error updating player:', err)
      // Revertir el cambio local si falla
      await fetchPlayers()
      throw new Error('Error al actualizar el jugador')
    }
  }

  const deletePlayer = async (id: string) => {
    try {
      console.log('usePlayers: Deleting player:', id)
      
      // Actualizar inmediatamente el estado local
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== id))
      
      await db.deletePlayer(id)
      
      console.log('usePlayers: Player deleted successfully')
      
      // Hacer fetch para asegurar sincronización
      setTimeout(() => fetchPlayers(), 100)
    } catch (err) {
      console.error('Error deleting player:', err)
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
  }, [teamId])

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