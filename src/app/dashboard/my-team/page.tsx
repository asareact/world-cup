'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/lib/auth-context'
import { db, Team, Player } from '@/lib/database'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trophy, 
  Calendar, 
  Mail, 
  Phone, 
  Crown,
  Loader2,
  Plus,
  Eye
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

type TeamWithPlayers = Team & { 
  players?: Pick<Player, 'id'|'name'|'position'|'is_active'|'is_captain'>[] 
}

export default function MyTeamPage() {
  const router = useRouter()
  const { user, role } = useAuth()
  const [team, setTeam] = useState<TeamWithPlayers | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTeam = async () => {
      if (!user || role !== 'capitan') {
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Obtener el equipo del capitán
        const teams = await db.getTeams(user.id, role)
        if (teams.length > 0) {
          // Tomar el primer equipo (asumiendo que un capitán solo tiene un equipo)
          const teamData = teams[0]
          setTeam(teamData as TeamWithPlayers)
        } else {
          setTeam(null)
        }
      } catch (err) {
        console.error('Error loading team:', err)
        setError('Error al cargar el equipo')
      } finally {
        setLoading(false)
      }
    }

    loadTeam()
  }, [user, role])

  // Si no es capitán, redirigir
  if (role !== 'capitan') {
    useEffect(() => {
      router.push('/dashboard')
    }, [router])
    return null
  }

  const players = (team?.players || []).filter(p => p.is_active)
  const captain = players.find(p => p.is_captain)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mi Equipo</h1>
            <p className="text-gray-400">Gestiona tu equipo de futsal directamente</p>
          </div>
          {team && (
            <button
              onClick={() => router.push(`/dashboard/teams/${team.id}/edit`)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
            >
              <Edit className="h-4 w-4" />
              <span>Editar Equipo</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-white">Cargando tu equipo...</span>
          </div>
        ) : error ? (
          <div className="bg-red-900/50 border border-red-700 rounded-2xl p-6 text-center">
            <div className="text-red-400 mb-2">Error al cargar el equipo</div>
            <div className="text-gray-300 mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : team ? (
          // Vista de equipo existente
          <div className="space-y-6">
            {/* Información del equipo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center">
                    {team.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{team.name}</h2>
                    {team.description && <p className="text-gray-400 text-sm">{team.description}</p>}
                  </div>
                </div>
                
                {team.contact_email && (
                  <div className="flex items-center space-x-2 text-sm mb-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{team.contact_email}</span>
                  </div>
                )}
                
                {team.contact_phone && (
                  <div className="flex items-center space-x-2 text-sm mb-4">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{team.contact_phone}</span>
                  </div>
                )}
                
                <div className="text-sm text-gray-400 mb-4">
                  Creado el {formatDate(team.created_at)}
                </div>
                
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${
                  players.length >= 7 
                    ? 'bg-green-900/50 text-green-300' 
                    : players.length > 0
                    ? 'bg-yellow-900/50 text-yellow-300'
                    : 'bg-red-900/50 text-red-300'
                }`}>
                  {players.length >= 7 ? '✓ Listo para Torneos' : 
                   players.length > 0 ? `⚠️ Faltan ${7 - players.length} jugadores` : 
                   '❌ Sin jugadores'}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Jugadores:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-white">{players.length}/12</span>
                    <div className="w-16 bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full" 
                        style={{ width: `${(players.length / 12) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2 bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Jugadores activos ({players.length})</h3>
                  {captain && (
                    <div className="text-sm text-yellow-300 flex items-center space-x-2">
                      <Crown className="h-4 w-4" />
                      <span>Capitán: {captain.name}</span>
                    </div>
                  )}
                </div>
                
                {players.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay jugadores en el equipo</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {players.map((player) => (
                      <div 
                        key={player.id} 
                        className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{player.name}</div>
                            <div className="text-xs text-gray-400">{player.position || 'Sin posición'}</div>
                          </div>
                        </div>
                        {player.is_captain && (
                          <Crown className="h-4 w-4 text-yellow-400" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Acciones rápidas */}
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Acciones rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push(`/dashboard/teams/${team.id}/edit`)}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
                >
                  <Edit className="h-8 w-8 text-white mb-2" />
                  <span className="text-white font-medium">Editar equipo</span>
                  <span className="text-blue-200 text-sm mt-1">Nombre, descripción, contacto</span>
                </button>
                
                <button
                  onClick={() => router.push(`/dashboard/teams/${team.id}/edit`)}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 transition-all"
                >
                  <UserPlus className="h-8 w-8 text-white mb-2" />
                  <span className="text-white font-medium">
                    {players.length < 7 ? 'Agregar jugadores' : 'Gestionar jugadores'}
                  </span>
                  <span className="text-green-200 text-sm mt-1">
                    {players.length}/7 para torneos
                  </span>
                </button>
                
                <button
                  onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all"
                >
                  <Eye className="h-8 w-8 text-white mb-2" />
                  <span className="text-white font-medium">Ver detalles</span>
                  <span className="text-purple-200 text-sm mt-1">Información completa</span>
                </button>
              </div>
            </div>
            
            {/* Estadísticas del equipo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{players.length}</p>
                    <p className="text-sm text-gray-400">Total Jugadores</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {players.filter(p => p.position).length}
                    </p>
                    <p className="text-sm text-gray-400">Con posición definida</p>
                  </div>
                  <Trophy className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {players.filter(p => p.is_captain).length}
                    </p>
                    <p className="text-sm text-gray-400">Capitanes</p>
                  </div>
                  <Crown className="h-8 w-8 text-yellow-500" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Vista para crear equipo
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No tienes un equipo aún</h3>
            <p className="text-gray-400 mb-6">
              Como capitán, puedes crear y gestionar tu equipo de futsal.
            </p>
            <button
              onClick={() => router.push('/dashboard/teams/create')}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Crear Mi Equipo</span>
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}