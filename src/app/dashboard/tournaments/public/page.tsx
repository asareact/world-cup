'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useTournaments } from '@/lib/hooks/use-tournaments'
import { formatDate } from '@/lib/utils'
import { Search, Filter, Trophy, Users, Calendar, Eye, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

const statusLabels = {
  draft: 'Borrador',
  active: 'Activo',
  completed: 'Finalizado',
  paused: 'Pausado'
}

const statusColors = {
  draft: 'bg-gray-600 text-gray-300',
  active: 'bg-green-600 text-green-100',
  completed: 'bg-blue-600 text-blue-100',
  paused: 'bg-yellow-600 text-yellow-100'
}

const formatLabels = {
  single_elimination: 'Eliminación Simple',
  double_elimination: 'Eliminación Doble',
  round_robin: 'Todos contra Todos',
  groups: 'Fase de Grupos'
}

function TournamentRulesPreview({ rules }: { rules: string }) {
  let parsedRules;
  try {
    parsedRules = JSON.parse(rules);
  } catch {
    return null;
  }

  // Handle league_repechage format
  if (parsedRules.type === "league_repechage" && parsedRules.notes) {
    return (
      <div className="text-xs text-gray-400">
        <div className="flex items-center space-x-1">
          <span>Clasificación:</span>
          <span className="text-green-400">{parsedRules.directSlots} directos</span>
          <span>•</span>
          <span className="text-yellow-400">{parsedRules.repechageSlots} repechaje</span>
          <span>•</span>
          <span className="text-red-400">{parsedRules.eliminatedSlots} eliminados</span>
        </div>
      </div>
    );
  }

  return null;
}

export default function PublicTournamentsPage() {
  const { tournaments, loading, error } = useTournaments()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tournament.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || tournament.status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          <span className="ml-3 text-white">Cargando torneos...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Reintentar
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Torneos Disponibles</h1>
          <p className="text-gray-400">Explora los torneos de futsal disponibles</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar torneos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borradores</option>
              <option value="active">Activos</option>
              <option value="completed">Finalizados</option>
              <option value="paused">Pausados</option>
            </select>
          </div>
        </div>

        {/* Tournament Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{tournaments.length}</p>
                <p className="text-sm text-gray-400">Total Torneos</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {tournaments.filter(t => t.status === 'active').length}
                </p>
                <p className="text-sm text-gray-400">Activos</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {tournaments.reduce((sum, t) => sum + t.teams, 0)}
                </p>
                <p className="text-sm text-gray-400">Total Equipos</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {tournaments.reduce((sum, t) => sum + t.matches.played, 0)}
                </p>
                <p className="text-sm text-gray-400">Partidos Jugados</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-green-500/50 transition-all"
            >
              {/* Tournament Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{tournament.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{tournament.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tournament.status]}`}>
                    {statusLabels[tournament.status]}
                  </span>
                </div>
              </div>

              {/* Tournament Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Formato:</span>
                  <span className="text-white">{formatLabels[tournament.format]}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Equipos:</span>
                  <span className="text-white">{tournament.teams}/{tournament.max_teams}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Partidos:</span>
                  <span className="text-white">{tournament.matches.played}/{tournament.matches.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Inicio:</span>
                  <span className="text-white">
                    {tournament.start_date ? formatDate(tournament.start_date) : 'No definido'}
                  </span>
                </div>
                {tournament.rules && (
                  <div className="pt-2 border-t border-gray-700">
                    <TournamentRulesPreview rules={tournament.rules} />
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {tournament.status !== 'draft' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Progreso</span>
                    <span>{tournament.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                      style={{ width: `${tournament.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={() => router.push(`/tournaments/${tournament.id}`)}
                className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Ver Detalles</span>
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTournaments.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No se encontraron torneos' : 'No hay torneos disponibles'}
            </h3>
            <p className="text-gray-400">
              {searchTerm || filterStatus !== 'all' 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Actualmente no hay torneos disponibles para inscribirse'
              }
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
