'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Trophy, 
  Users, 
  Calendar, 
  MoreHorizontal,
  Play,
  Edit,
  Trash2,
  Copy,
  Eye,
  Loader2,
  LayoutGrid,
  GitBranch,
  Check
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTournaments } from '@/lib/hooks/use-tournaments'
import type { TournamentWithStats } from '@/lib/hooks/use-tournaments'
import { formatDate } from '@/lib/utils'

type TournamentTypeOption = {
  id: 'league' | 'cup' | 'hybrid'
  label: string
  description: string
  highlights: string[]
  formatLabel: string
  icon: typeof Trophy
  accent: string
}

const formatLabels = {
  single_elimination: 'Eliminación Simple',
  double_elimination: 'Eliminación Doble',
  round_robin: 'Todos contra Todos',
  groups: 'Fase de Grupos'
}

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

const tournamentTypeOptions: TournamentTypeOption[] = [
  {
    id: 'league',
    label: 'Liga',
    description: 'Formato todos contra todos con tabla de posiciones y calendario balanceado.',
    highlights: ['Fase regular completa', 'Tabla de posiciones', 'Rondas de ida y vuelta opcionales'],
    formatLabel: 'Round Robin',
    icon: LayoutGrid,
    accent: 'from-sky-500 to-blue-600'
  },
  {
    id: 'cup',
    label: 'Copa',
    description: 'Eliminación directa con fases de llaves y definición rápida del campeón.',
    highlights: ['Llaves configurables', 'Partidos únicos o ida/vuelta', 'Posibilidad de tercer puesto'],
    formatLabel: 'Eliminación Directa',
    icon: Trophy,
    accent: 'from-emerald-500 to-green-600'
  },
  {
    id: 'hybrid',
    label: 'Híbrido',
    description: 'Combina grupos clasificatorios con fases finales eliminatorias.',
    highlights: ['Grupos por rendimiento', 'Clasificación automática', 'Definición en formato copa'],
    formatLabel: 'Grupos + Eliminación',
    icon: GitBranch,
    accent: 'from-purple-500 to-pink-500'
  }
]

export function TournamentManagement() {
  const { tournaments, loading, error, deleteTournament, updateTournament } = useTournaments()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTournamentType, setSelectedTournamentType] = useState<TournamentTypeOption | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string, type: 'success'|'error' } | null>(null)

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tournament.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || tournament.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleDeleteTournament = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este torneo?')) return

  try {
    setDeletingId(id)
    await deleteTournament(id)
    setToast({ message: 'Torneo eliminado', type: 'success' })
    setTimeout(() => setToast(null), 2000)
  } catch {
    setToast({ message: 'Error al eliminar el torneo', type: 'error' })
    setTimeout(() => setToast(null), 2000)
  } finally {
    setDeletingId(null)
  }
  }

  const resolveMinimumTeams = (tournament: TournamentWithStats) => {
    if (tournament.rules) {
      try {
        const parsed = JSON.parse(tournament.rules)
        if (parsed && typeof parsed.minTeams === 'number') {
          return parsed.minTeams
        }
      } catch (error) {
        console.warn('No se pudo interpretar las reglas del torneo', error)
      }
    }
    return 2
  }

  const handleStartTournament = async (tournament: TournamentWithStats) => {
    try {
      setUpdatingStatusId(tournament.id)
      const minTeams = resolveMinimumTeams(tournament)
      const currentTeams = tournament.teams
      const hasMinimum = currentTeams >= minTeams

      const nextStatus = hasMinimum ? 'active' : 'paused'
      await updateTournament(tournament.id, { status: nextStatus })

      if (hasMinimum) {
        setToast({ message: 'Torneo activado. Puedes generar el fixture.', type: 'success' })
      } else {
        setToast({
          message: `El torneo quedó esperando cupo mínimo (${currentTeams}/${minTeams}).`,
          type: 'success'
        })
      }
    } catch (error) {
      console.error('Error al actualizar estado del torneo', error)
      setToast({ message: 'No se pudo actualizar el estado del torneo', type: 'error' })
    } finally {
      setTimeout(() => setToast(null), 2200)
      setUpdatingStatusId(null)
    }
  }

  const handleOpenCreateModal = () => {
    setSelectedTournamentType(null)
    setShowCreateModal(true)
  }

  const handleSelectTournamentType = (option: TournamentTypeOption) => {
    setSelectedTournamentType(option)
  }

  const handleProceedToCreate = () => {
    if (!selectedTournamentType) return
    setShowCreateModal(false)
    router.push(`/dashboard/tournaments/create?type=${selectedTournamentType.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="ml-3 text-white">Cargando torneos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Selecciona el tipo de torneo</h2>
                <p className="text-gray-400 mt-1 text-sm">
                  Elige el formato base que mejor se adapte a la competencia que vas a organizar.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white rounded-full p-2 hover:bg-gray-800 transition-colors"
                aria-label="Cerrar"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {tournamentTypeOptions.map((option) => {
                const Icon = option.icon
                const isSelected = selectedTournamentType?.id === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectTournamentType(option)}
                    className={`relative text-left rounded-2xl border p-5 bg-gray-800/60 transition-all ${
                      isSelected
                        ? 'border-green-500/80 shadow-lg shadow-green-500/20'
                        : 'border-gray-700 hover:border-green-500/60 hover:shadow-lg hover:shadow-green-500/10'
                    }`}
                  >
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${option.accent} mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{option.label}</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{option.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {option.highlights.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs text-gray-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
                      <span>
                        Formato base: <span className="font-semibold text-white">{option.formatLabel}</span>
                      </span>
                      {isSelected && <Check className="h-5 w-5 text-green-400" />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProceedToCreate}
                disabled={!selectedTournamentType}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedTournamentType
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.message}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Torneos</h1>
          <p className="text-gray-400">Administra tus torneos de futsal</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          <span>Crear Torneo</span>
        </button>
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
            <Play className="h-8 w-8 text-blue-500" />
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
        {filteredTournaments.map((tournament, index) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
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
                <button className="p-1 text-gray-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
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
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${tournament.progress}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {(tournament.status === 'draft' || tournament.status === 'paused') ? (
                <button
                  onClick={() => handleStartTournament(tournament)}
                  disabled={updatingStatusId === tournament.id}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                    updatingStatusId === tournament.id
                      ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {updatingStatusId === tournament.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span>{tournament.status === 'draft' ? 'Iniciar' : 'Verificar cupo'}</span>
                </button>
              ) : tournament.status === 'active' ? (
                <button className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  <Eye className="h-4 w-4" />
                  <span>Ver</span>
                </button>
              ) : (
                <button className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                  <Eye className="h-4 w-4" />
                  <span>Revisar</span>
                </button>
              )}
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <Edit className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <Copy className="h-4 w-4" />
              </button>
              <button 
                onClick={() => handleDeleteTournament(tournament.id)}
                disabled={deletingId === tournament.id}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === tournament.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTournaments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No se encontraron torneos' : 'No tienes torneos aún'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Intenta cambiar los filtros de búsqueda'
              : 'Crea tu primer torneo para comenzar a gestionar competencias'
            }
          </p>
          {(!searchTerm && filterStatus === 'all') && (
            <button
              onClick={handleOpenCreateModal}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all"
            >
              Crear Mi Primer Torneo
            </button>
          )}
        </motion.div>
      )}
      </div>
    </>
  )
}
