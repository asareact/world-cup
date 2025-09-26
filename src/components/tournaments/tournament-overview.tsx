'use client'

import { Calendar, Clock, Trophy, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { UpcomingMatchRow, RecentResultRow } from '@/lib/hooks/use-tournament'
import { getUpcomingMatches, getRecentResults } from '@/lib/hooks/use-tournament'

type MatchRow = {
  id: string
  scheduled_at: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  home_team?: { name: string } | null
  away_team?: { name: string } | null
  home_score: number
  away_score: number
}

export function TournamentOverview({ tournament }: { tournament: { id?: string, matches?: MatchRow[], tournament_teams?: unknown[], rules?: string, start_date?: string | null, end_date?: string | null, registration_deadline?: string | null } }) {
  const matches: MatchRow[] = tournament.matches || []
  const played = matches.filter((m: MatchRow) => m.status === 'completed').length
  const scheduled = matches.filter((m: MatchRow) => m.status === 'scheduled').length
  const inProgress = matches.filter((m: MatchRow) => m.status === 'in_progress').length
  const total = matches.length

  const [upcoming, setUpcoming] = useState<UpcomingMatchRow[]>([])
  const [recent, setRecent] = useState<RecentResultRow[]>([])
  useEffect(() => {
    if (!tournament.id) return
    getUpcomingMatches(tournament.id, 5).then(setUpcoming)
    getRecentResults(tournament.id, 5).then(setRecent)
  }, [tournament.id])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={Trophy} label="Partidos" value={`${played}/${total}`} />
          <Stat icon={Clock} label="En juego" value={`${inProgress}`} />
          <Stat icon={Calendar} label="Programados" value={`${scheduled}`} />
          <Stat icon={Users} label="Equipos" value={`${tournament.tournament_teams?.length || 0}`} />
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-3">Próximos partidos</h3>
          {upcoming.length === 0 && (
            <p className="text-gray-400">No hay partidos programados</p>
          )}
          <div className="space-y-3">
            {upcoming.map((m) => (
              <div key={m.match_id} className="flex items-center justify-between text-gray-300">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{m.home_team_name || 'TBD'}</span>
                  <span className="text-gray-500">vs</span>
                  <span className="font-medium">{m.away_team_name || 'TBD'}</span>
                </div>
                <div className="text-sm text-gray-400">
                  {m.scheduled_at ? formatDateTime(m.scheduled_at) : 'Por definir'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-3">Últimos resultados</h3>
          {recent.length === 0 && (
            <p className="text-gray-400">Aún no hay resultados</p>
          )}
          <div className="space-y-3">
            {recent.map((m) => (
              <div key={m.match_id} className="flex items-center justify-between text-gray-300">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{m.home_team_name || 'TBD'}</span>
                  <span className="text-gray-500">vs</span>
                  <span className="font-medium">{m.away_team_name || 'TBD'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-white font-semibold">{m.home_score} - {m.away_score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-3">Reglamento</h3>
          {tournament.rules ? (
            <TournamentRules rules={tournament.rules} />
          ) : (
            <p className="text-gray-400 text-sm">Reglamento no especificado</p>
          )}
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
          <h3 className="text-white font-semibold mb-3">Cronograma</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>Inicio: {tournament.start_date ? formatDate(tournament.start_date) : 'Por definir'}</li>
            <li>Fin: {tournament.end_date ? formatDate(tournament.end_date) : 'Por definir'}</li>
            <li>Inscripción: {tournament.registration_deadline ? formatDate(tournament.registration_deadline) : 'Abierta'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

import type { ComponentType } from 'react'

function Stat({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>, label: string, value: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <div className="text-white font-semibold">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </div>
  )
}

function TournamentRules({ rules }: { rules: string }) {
  let parsedRules;
  try {
    parsedRules = JSON.parse(rules);
  } catch {
    // If parsing fails, display as plain text
    return <p className="text-gray-300 whitespace-pre-wrap text-sm">{rules}</p>;
  }

  // Handle league_repechage format
  if (parsedRules.type === "league_repechage" && parsedRules.notes) {
    return (
      <div className="space-y-3">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <h4 className="font-medium text-white mb-2">Fase de Grupos</h4>
          <p className="text-sm text-gray-300">
            {parsedRules.notes[0]}
          </p>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-white">Clasificación</h4>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
              <span className="text-sm text-gray-300">{parsedRules.notes[1]}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-300">{parsedRules.notes[2]}</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
              <span className="text-sm text-gray-300">{parsedRules.notes[3]}</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-3">
          <h4 className="font-medium text-white mb-2">Fase Eliminatoria</h4>
          <p className="text-sm text-gray-300">
            {parsedRules.notes[4]}
          </p>
        </div>
        
        <div className="pt-2 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Sistema adaptativo: El formato se ajusta automáticamente según la cantidad de equipos inscritos.
          </p>
        </div>
      </div>
    );
  }

  // Default fallback for other formats
  if (parsedRules.notes && Array.isArray(parsedRules.notes)) {
    return (
      <ul className="space-y-2">
        {parsedRules.notes.map((note: string, index: number) => (
          <li key={index} className="flex items-start space-x-2">
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
            <span className="text-sm text-gray-300">{note}</span>
          </li>
        ))}
      </ul>
    );
  }

  // If no notes array, display as JSON
  return <pre className="text-gray-300 text-sm whitespace-pre-wrap">{JSON.stringify(parsedRules, null, 2)}</pre>;
}

export { TournamentRules };