'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Mail, 
  Phone, 
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  Loader2
} from 'lucide-react'
import { useTeams, TeamWithPlayers } from '@/lib/hooks/use-teams'
import { useRouter } from 'next/navigation'

export function TeamManagement() {
  const { teams, loading, error, deleteTeam } = useTeams()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'incomplete' | 'ready'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (team.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'incomplete' && team.playerCount > 0 && team.playerCount < 7) ||
                         (filterType === 'ready' && team.playerCount >= 7)
    
    return matchesSearch && matchesFilter
  })

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${name}"?`)) return
    
    try {
      setDeletingId(id)
      await deleteTeam(id)
    } catch (err) {
      alert('Error al eliminar el equipo')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-white">Cargando equipos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Equipos</h1>
          <p className="text-gray-400">Administra tus equipos de futsal</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/teams/create')}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg transform hover:scale-105"
        >
          <Plus className="h-5 w-5" />
          <span>Agregar Equipo</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-4 py-3 rounded-xl border transition-all ${
              filterType === 'all' 
                ? 'border-blue-500 bg-blue-500/20 text-blue-300' 
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterType('incomplete')}
            className={`px-4 py-3 rounded-xl border transition-all ${
              filterType === 'incomplete'
                ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                : 'border-yellow-600 text-yellow-300 hover:bg-yellow-900/20'
            }`}
          >
            Necesitan Jugadores
          </button>
          <button 
            onClick={() => setFilterType('ready')}
            className={`px-4 py-3 rounded-xl border transition-all ${
              filterType === 'ready'
                ? 'border-green-500 bg-green-500/20 text-green-300'
                : 'border-green-600 text-green-300 hover:bg-green-900/20'
            }`}
          >
            Listos
          </button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{teams.length}</p>
              <p className="text-sm text-gray-400">Total Equipos</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {teams.reduce((sum, team) => sum + team.playerCount, 0)}
              </p>
              <p className="text-sm text-gray-400">Total Jugadores</p>
            </div>
            <UserPlus className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {teams.filter(team => team.playerCount >= 7).length}
              </p>
              <p className="text-sm text-gray-400">Listos para Torneos</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {teams.filter(team => team.playerCount > 0 && team.playerCount < 7).length}
              </p>
              <p className="text-sm text-gray-400">Necesitan Jugadores</p>
            </div>
            <UserPlus className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTeams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all"
            >
              {/* Team Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{team.description}</p>
                  )}
                </div>
                <button className="p-1 text-gray-400 hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Team Info */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Jugadores:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-white">{team.playerCount}/12</span>
                    <div className="w-16 bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full" 
                        style={{ width: `${(team.playerCount / 12) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {team.contact_email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-300 truncate">{team.contact_email}</span>
                  </div>
                )}
                
                {team.contact_phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-300">{team.contact_phone}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Creado:</span>
                  <span className="text-white">
                    {new Date(team.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              {/* Team Status Badges */}
              <div className="mb-4 space-y-2">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  team.playerCount >= 7 
                    ? 'bg-green-900/50 text-green-300' 
                    : team.playerCount > 0
                    ? 'bg-yellow-900/50 text-yellow-300'
                    : 'bg-red-900/50 text-red-300'
                }`}>
                  {team.playerCount >= 7 ? '✓ Listo para Torneos' : 
                   team.playerCount > 0 ? `⚠️ Faltan ${7 - team.playerCount} jugadores` : 
                   '❌ Sin jugadores'}
                </div>
                
                {team.playerCount >= 7 && (
                  <div className="text-xs text-gray-400">
                    Mínimo para competir: 7/12 jugadores
                  </div>
                )}
                
                {team.playerCount > 0 && team.playerCount < 7 && (
                  <div className="text-xs text-yellow-400">
                    No elegible para torneos hasta completar 7 jugadores
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => router.push(`/dashboard/teams/${team.id}/edit`)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                    team.playerCount < 7
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>{team.playerCount < 7 ? 'Completar' : 'Gestionar'}</span>
                </button>
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => router.push(`/dashboard/teams/${team.id}/edit`)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleDeleteTeam(team.id, team.name)}
                  disabled={deletingId === team.id}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === team.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm 
              ? 'No se encontraron equipos' 
              : filterType === 'incomplete' 
                ? 'No hay equipos que necesiten jugadores'
              : filterType === 'ready'
                ? 'No hay equipos listos para torneos'
              : 'No tienes equipos aún'
            }
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm 
              ? 'Intenta cambiar el término de búsqueda o filtro'
              : filterType === 'incomplete'
                ? 'Todos tus equipos están completos o vacíos'
              : filterType === 'ready'
                ? 'Completa equipos con al menos 7 jugadores para que aparezcan aquí'
              : 'Crea tu primer equipo para comenzar a gestionar jugadores'
            }
          </p>
          {!searchTerm && filterType === 'all' && (
            <button
              onClick={() => router.push('/dashboard/teams/create')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Crear Mi Primer Equipo
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}