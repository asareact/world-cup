'use client'

import { Users } from 'lucide-react'

type Entry = { id: string, status?: string | null, teams?: { name: string, logo_url?: string | null } | null }

export function TournamentTeams({ tournament }: { tournament: { tournament_teams?: Entry[] } }) {
  const entries = (tournament.tournament_teams || []) as Entry[]
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
      {entries.length === 0 && (
        <p className="text-gray-400">No hay equipos registrados</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map((tt: Entry) => (
          <div key={tt.id} className="border border-gray-700 rounded-xl p-3 text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-700 overflow-hidden flex items-center justify-center">
                {tt.teams?.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tt.teams.logo_url} alt={tt.teams.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="font-semibold">{tt.teams?.name || 'Equipo'}</div>
            </div>
            {tt.status && (
              <div className="text-xs text-gray-400 mt-1">Estado: {tt.status}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
