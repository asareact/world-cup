'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/lib/auth-context'
import { db, Team, Player } from '@/lib/database'
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Save, 
  X, 
  Mail, 
  Phone, 
  Crown,
  Loader2,
  Plus,
  Trash2,
  Check
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newPlayer, setNewPlayer] = useState({ name: '', position: '' })
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null)

  // Estados para edición de jugadores
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editingPlayerData, setEditingPlayerData] = useState({ name: '', position: '' })

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

  const startEdit = (field: string, value: string) => {
    setEditingField(field)
    setEditValue(value)
  }

  const saveEdit = async () => {
    if (!team || !editingField) return

    try {
      setSaving(true)
      const updates = { [editingField]: editValue }
      const updatedTeam = await db.updateTeam(team.id, updates)
      setTeam({ ...team, ...updatedTeam })
      setEditingField(null)
    } catch (err) {
      console.error('Error updating team:', err)
      setError('Error al actualizar el equipo')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditingField(null)
  }

  const addPlayer = async () => {
    if (!team || !newPlayer.name.trim()) return

    try {
      setAddingPlayer(true)
      const playerData = {
        name: newPlayer.name,
        position: newPlayer.position || null,
        team_id: team.id,
        is_active: true,
        is_captain: players.length === 0 // El primer jugador es el capitán
      }
      
      const newPlayerData = await db.createPlayer(playerData)
      
      // Actualizar la lista de jugadores
      setTeam({
        ...team,
        players: [...(team.players || []), newPlayerData]
      })
      
      // Resetear el formulario
      setNewPlayer({ name: '', position: '' })
    } catch (err) {
      console.error('Error adding player:', err)
      setError('Error al agregar jugador')
    } finally {
      setAddingPlayer(false)
    }
  }

  const startEditPlayer = (player: any) => {
    setEditingPlayerId(player.id)
    setEditingPlayerData({
      name: player.name,
      position: player.position || ''
    })
  }

  const saveEditPlayer = async () => {
    if (!team || !editingPlayerId) return

    try {
      await db.updatePlayer(editingPlayerId, {
        name: editingPlayerData.name,
        position: editingPlayerData.position || null
      })
      
      // Actualizar la lista de jugadores
      const updatedPlayers = (team.players || []).map(p => 
        p.id === editingPlayerId 
          ? { ...p, name: editingPlayerData.name, position: editingPlayerData.position || null } 
          : p
      )
      
      setTeam({ ...team, players: updatedPlayers })
      setEditingPlayerId(null)
    } catch (err) {
      console.error('Error updating player:', err)
      setError('Error al actualizar jugador')
    }
  }

  const cancelEditPlayer = () => {
    setEditingPlayerId(null)
  }

  const deletePlayer = async (playerId: string) => {
    if (!team || !confirm('¿Estás seguro de que quieres eliminar este jugador?')) return

    try {
      setDeletingPlayerId(playerId)
      await db.deletePlayer(playerId)
      
      // Actualizar la lista de jugadores
      const updatedPlayers = (team.players || []).filter(p => p.id !== playerId)
      setTeam({ ...team, players: updatedPlayers })
    } catch (err) {
      console.error('Error deleting player:', err)
      setError('Error al eliminar jugador')
    } finally {
      setDeletingPlayerId(null)
    }
  }

  const makeCaptain = async (playerId: string) => {
    if (!team) return

    try {
      // Remover capitán actual
      if (captain) {
        await db.updatePlayer(captain.id, { is_captain: false })
      }
      
      // Hacer capitán al nuevo jugador
      await db.updatePlayer(playerId, { is_captain: true })
      
      // Actualizar la lista de jugadores
      const updatedPlayers = (team.players || []).map(p => ({
        ...p,
        is_captain: p.id === playerId
      }))
      
      setTeam({ ...team, players: updatedPlayers })
    } catch (err) {
      console.error('Error updating captain:', err)
      setError('Error al actualizar capitán')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-3 text-white">Cargando tu equipo...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    )
  }

  if (!team) {
    // Vista para crear equipo
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mi Equipo</h1>
            <p className="text-gray-400">Gestiona tu equipo de futsal directamente</p>
          </div>
        </div>

        {/* Información del equipo editable */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Información del Equipo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo y nombre */}
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                {team.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                {editingField === 'name' ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="p-2 text-green-400 hover:bg-green-900/50 rounded-lg"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 
                      className="text-xl font-semibold text-white cursor-pointer hover:text-blue-400 flex items-center"
                      onClick={() => startEdit('name', team.name)}
                    >
                      {team.name}
                      <Edit3 className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100" />
                    </h3>
                    <p 
                      className="text-gray-400 text-sm cursor-pointer hover:text-gray-300"
                      onClick={() => startEdit('description', team.description || '')}
                    >
                      {team.description || 'Sin descripción'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                {editingField === 'contact_email' ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="email"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 bg-gray-700 text-white px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="p-1 text-green-400 hover:bg-green-900/50 rounded"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 text-gray-400 hover:bg-gray-700 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span 
                    className="text-gray-300 cursor-pointer hover:text-white text-sm flex-1"
                    onClick={() => startEdit('contact_email', team.contact_email || '')}
                  >
                    {team.contact_email || 'Sin email'}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                {editingField === 'contact_phone' ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="tel"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 bg-gray-700 text-white px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="p-1 text-green-400 hover:bg-green-900/50 rounded"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 text-gray-400 hover:bg-gray-700 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <span 
                    className="text-gray-300 cursor-pointer hover:text-white text-sm flex-1"
                    onClick={() => startEdit('contact_phone', team.contact_phone || '')}
                  >
                    {team.contact_phone || 'Sin teléfono'}
                  </span>
                )}
              </div>
              
              <div className="text-sm text-gray-400">
                Creado el {formatDate(team.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Jugadores */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Jugadores ({players.length})</h2>
            <button
              onClick={() => setAddingPlayer(true)}
              className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          </div>

          {/* Formulario para agregar jugador */}
          {addingPlayer && (
            <div className="mb-4 p-4 bg-gray-700/50 rounded-xl">
              <h3 className="text-white font-medium mb-3">Agregar nuevo jugador</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nombre del jugador"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({...newPlayer, name: e.target.value})}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Posición"
                  value={newPlayer.position}
                  onChange={(e) => setNewPlayer({...newPlayer, position: e.target.value})}
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={addPlayer}
                    disabled={addingPlayer || !newPlayer.name.trim()}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {addingPlayer ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setAddingPlayer(false)
                      setNewPlayer({ name: '', position: '' })
                    }}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de jugadores */}
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay jugadores en el equipo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Jugador</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Posición</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Capitán</th>
                    <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => (
                    <tr key={player.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 px-4">
                        {editingPlayerId === player.id ? (
                          <input
                            type="text"
                            value={editingPlayerData.name}
                            onChange={(e) => setEditingPlayerData({...editingPlayerData, name: e.target.value})}
                            className="bg-gray-700 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {player.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-white">{player.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingPlayerId === player.id ? (
                          <input
                            type="text"
                            value={editingPlayerData.position}
                            onChange={(e) => setEditingPlayerData({...editingPlayerData, position: e.target.value})}
                            className="bg-gray-700 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-300">{player.position || '—'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {player.is_captain ? (
                          <div className="flex items-center text-yellow-400">
                            <Crown className="h-4 w-4 mr-1" />
                            <span className="text-xs">Capitán</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => makeCaptain(player.id)}
                            className="text-gray-400 hover:text-yellow-400 text-sm"
                          >
                            Hacer capitán
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingPlayerId === player.id ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={saveEditPlayer}
                              className="p-1 text-green-400 hover:bg-green-900/50 rounded"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditPlayer}
                              className="p-1 text-gray-400 hover:bg-gray-700 rounded"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => startEditPlayer(player)}
                              className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deletePlayer(player.id)}
                              disabled={deletingPlayerId === player.id}
                              className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/50 rounded disabled:opacity-50"
                            >
                              {deletingPlayerId === player.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Estado del equipo */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Estado del Equipo</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
              <div className="text-sm text-gray-400 mt-2">
                Progreso: {players.length}/7 jugadores necesarios
              </div>
            </div>
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${Math.min((players.length / 7) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}