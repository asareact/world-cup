import { useEffect, useState } from 'react'
import { getTournamentIdealFive, type IdealFiveRoundResult } from '@/lib/tournaments/ideal-five-service'

export function useIdealFive(tournamentId?: string | null) {
  const [rounds, setRounds] = useState<IdealFiveRoundResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tournamentId) {
      setRounds([])
      setLoading(false)
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    getTournamentIdealFive(tournamentId)
      .then((data) => {
        if (!isMounted) return
        setRounds(data)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Error fetching ideal five data:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar el ideal 5')
        setRounds([])
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [tournamentId])

  return { rounds, loading, error }
}
