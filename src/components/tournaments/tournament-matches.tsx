'use client'

type MatchRow = {
  id: string
  scheduled_at: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  home_score: number
  away_score: number
  home_team?: { name: string, logo_url?: string | null } | null
  away_team?: { name: string, logo_url?: string | null } | null
}

export function TournamentMatches({ tournament }: { tournament: { matches?: MatchRow[] } }) {
  const matches = (tournament.matches || []).sort((a: MatchRow, b: MatchRow) => {
    return new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()
  })

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
      <div className="grid grid-cols-1 gap-3">
        {matches.length === 0 && (
          <p className="text-gray-400">No hay partidos para mostrar</p>
        )}
        {matches.map((m: MatchRow) => (
          <div key={m.id} className="flex items-center justify-between text-gray-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
                  {m.home_team?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.home_team.logo_url} alt={m.home_team?.name || 'Local'} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <span className="font-medium">{m.home_team?.name || 'TBD'}</span>
              </div>
              <span className="text-gray-500">vs</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center">
                  {m.away_team?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.away_team.logo_url} alt={m.away_team?.name || 'Visita'} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <span className="font-medium">{m.away_team?.name || 'TBD'}</span>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {m.status === 'completed' ? (
                <span className="text-white font-semibold">{m.home_score} - {m.away_score}</span>
              ) : m.scheduled_at ? (
                new Date(m.scheduled_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
              ) : 'Por definir'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
