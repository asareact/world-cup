// React hook to use the potential suspensions service
// EFFICIENT VERSION: Only processes when tournamentId is provided and valid
import { useState, useEffect, useCallback } from 'react'
import { PotentialSuspensionsService, type PotentialSuspension } from '@/lib/suspensions/potential-suspensions-service'

interface UsePotentialSuspensionsOptions {
  matchId?: string
}

export function usePotentialSuspensions(
  tournamentId: string,
  options?: UsePotentialSuspensionsOptions
) {
  const [suspensions, setSuspensions] = useState<PotentialSuspension[]>([])
  const [loading, setLoading] = useState(false) // Only true when actively loading
  const [error, setError] = useState<string | null>(null)
  
  const service = useCallback(() => new PotentialSuspensionsService(), [])

  useEffect(() => {
    const loadSuspensions = async () => {
      // Performance optimization: Don't load if no tournamentId or invalid
      if (!tournamentId || tournamentId.trim() === '') {
        setSuspensions([])
        setLoading(false)
        setError(null)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        const suspensionService = service()
        const result = await suspensionService.detectPotentialSuspensions(
          tournamentId,
          options
        )
        
        setSuspensions(result)
      } catch (err) {
        console.error('Error loading potential suspensions:', err)
        setError('Error al cargar las posibles sanciones')
        setSuspensions([])
      } finally {
        setLoading(false)
      }
    }

    // Performance optimization: Only load when tournamentId is valid
    if (tournamentId && tournamentId.trim() !== '') {
      loadSuspensions()
    } else {
      // Reset state when no valid tournamentId
      setSuspensions([])
      setLoading(false)
      setError(null)
    }
  }, [tournamentId, options?.matchId, service]) // Only depend on tournamentId and matchId

  const refresh = useCallback(async () => {
    // Performance optimization: Don't refresh if no tournamentId
    if (!tournamentId || tournamentId.trim() === '') return
    
    try {
      setLoading(true)
      setError(null)
      
      const suspensionService = service()
      // Clear cache for this tournament before refreshing
      suspensionService.clearTournamentCache(tournamentId)
      
      const result = await suspensionService.detectPotentialSuspensions(
        tournamentId,
        options
      )
      
      setSuspensions(result)
    } catch (err) {
      console.error('Error refreshing potential suspensions:', err)
      setError('Error al actualizar las posibles sanciones')
      setSuspensions([])
    } finally {
      setLoading(false)
    }
  }, [tournamentId, options?.matchId, service])

  return {
    suspensions,
    loading,
    error,
    refresh
  }
}