import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/database'
import type { Match } from '@/lib/database'

// Extender el tipo Match para incluir la informaciÃ³n del torneo que se va a cargar
interface MatchWithTournament extends Match {
  tournament: {
    id: string;
    name: string;
  } | null;
}

export function useMatches() {
  const [matches, setMatches] = useState<MatchWithTournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMatches = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Asegurarse de que getAllMatches devuelva el tipo correcto
      const data = await db.getAllMatches() as MatchWithTournament[];
      setMatches(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch matches'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  // Agrupar los partidos por jornada (round_name)
  const groupedMatches = matches.reduce((acc, match) => {
    const round = match.round_name || 'Sin Jornada'
    if (!acc[round]) {
      acc[round] = []
    }
    acc[round].push(match)
    return acc
  }, {} as Record<string, MatchWithTournament[]>)

  return { groupedMatches, isLoading, error, refetch: fetchMatches }
}
