'use client'

import { Trophy, Users, Calendar, Play, Pause, CheckCircle, ShieldCheck, MapPin, Eye } from 'lucide-react'

import type { Tournament } from '@/lib/database'
import { formatDate } from '@/lib/utils'
import { JoinRequestButton } from './join-request-button'

export function TournamentHeader({ tournament, teamsCount, canJoin, role }: {
  tournament: Tournament & { venue?: string }
  teamsCount: number,
  onFollow?: () => void,
  isFollowing?: boolean,
  canJoin?: boolean,
  role?: string,
}) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-600 text-gray-200',
    active: 'bg-green-600 text-green-100',
    completed: 'bg-blue-600 text-blue-100',
    paused: 'bg-yellow-600 text-yellow-100',
  }

  const statusLabel: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activo',
    completed: 'Finalizado',
    paused: 'Pausado',
  }

  const formatLabel: Record<string, string> = {
    single_elimination: 'Eliminación Simple',
    double_elimination: 'Eliminación Doble',
    round_robin: 'Todos contra Todos',
    groups: 'Fase de Grupos',
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{tournament.name}</h1>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[tournament.status] || 'bg-gray-600 text-gray-200'}`}>
                {statusLabel[tournament.status] || tournament.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {tournament.start_date ? formatDate(tournament.start_date) : 'Por definir'}
                  {tournament.end_date ? <> - {formatDate(tournament.end_date)}</> : null}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" />
                <span>{formatLabel[tournament.format]}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{teamsCount}/{tournament.max_teams} equipos</span>
              </div>
              {tournament.venue && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{tournament.venue}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canJoin && (
            <JoinRequestButton tournamentId={tournament.id} />
          )}
          {/* View Public Page button for captains and superAdmins */}
          {(role === 'capitan' || role === 'superAdmin') && (
            <button
              onClick={() => window.open(`/tournaments/${tournament.id}/public`, '_blank')}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 flex items-center gap-1 text-sm"
            >
              <Eye className="h-4 w-4" />
              <span>Ver Pública</span>
            </button>
          )}
        </div>
      </div>
      {tournament.description && (
        <p className="text-gray-300 mt-4">{tournament.description}</p>
      )}
    </div>
  )
}





