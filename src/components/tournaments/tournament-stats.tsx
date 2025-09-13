'use client'

import { useEffect, useState } from 'react'
import { getTopScorers } from '@/lib/hooks/use-tournament'

type ScorerRow = { goals: number, assists: number, player?: { id: string, name: string }, team?: { id: string, name: string } }

export function TournamentStats({ tournamentId }: { tournamentId: string }) {
  const [scorers, setScorers] = useState<ScorerRow[]>([])

  useEffect(() => {
    getTopScorers(tournamentId, 10).then((rows) => setScorers(rows as unknown as ScorerRow[]))
  }, [tournamentId])

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
      <h3 className="text-white font-semibold mb-3">Goleadores</h3>
      {scorers.length === 0 && (
        <p className="text-gray-400">Sin datos aún</p>
      )}
      <div className="space-y-2">
        {scorers.map((row, idx) => (
          <div key={row.player?.id || idx} className="flex items-center justify-between text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 w-6">{idx + 1}.</span>
              <span className="font-medium">{row.player?.name || 'Jugador'}</span>
              <span className="text-gray-400">({row.team?.name || 'Equipo'})</span>
            </div>
            <div className="font-semibold text-white">{row.goals}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
