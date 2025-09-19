'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/lib/auth-context'
import { db, Team, Player } from '@/lib/database'
import { createClient } from '@/lib/supabase/client'
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
  Check,
  Upload
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

// Posiciones constantes para jugadores de futsal
const PLAYER_POSITIONS = [
  { value: 'portero', label: 'Portero' },
  { value: 'ala', label: 'Ala' },
  { value: 'cierre', label: 'Cierre' },
  { value: 'pivote', label: 'Pivote' }
]

type TeamWithPlayers = Team & { 
  players?: (Pick<Player, 'id'|'name'|'position'|'is_active'|'photo_url'|'jersey_number'> & { is_captain: boolean })[] 
}

export default function MyTeamPage() {
  const router = useRouter()
  const { user, role } = useAuth()
  const supabase = createClient()
  const [team, setTeam] = useState<TeamWithPlayers | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newPlayer, setNewPlayer] = useState({ name: '', jersey_number: '' })
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null)

  // Estados para edición de jugadores
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editingPlayerData, setEditingPlayerData] = useState({ name: '', position: '', photo_url: '', jersey_number: '' })
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<File | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>('')
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null)

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

  const handleTeamLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTeamLogoFile(e.target.files[0])
    }
  }

  const uploadTeamLogo = async () => {
    if (!team || !teamLogoFile) return

    try {
      setSaving(true)
      // Aquí iría la lógica para subir la imagen
      // Por ahora, simulamos la actualización
      const updatedTeam = { ...team, logo_url: URL.createObjectURL(teamLogoFile) }
      setTeam(updatedTeam)
      setTeamLogoFile(null)
      setEditingField(null)
    } catch (err) {
      console.error('Error uploading team logo:', err)
      setError('Error al subir el logo del equipo')
    } finally {
      setSaving(false)
    }
  }

  const addPlayer = async () => {
    if (!team || !newPlayer.name.trim() || !newPlayer.jersey_number.trim()) return

    // Verificar si el número de camiseta ya existe
    const jerseyNumber = parseInt(newPlayer.jersey_number);
    const existingPlayer = players.find(p => p.jersey_number === jerseyNumber);
    if (existingPlayer) {
      setError('Ya existe un jugador con ese número de camiseta');
      return;
    }

    try {
      setAddingPlayer(true)
      const playerData = {
        name: newPlayer.name,
        jersey_number: jerseyNumber,
        position: null,
        team_id: team.id,
        is_active: true,
        is_captain: players.length === 0 // El primer jugador es el capitán
      }
      
      const newPlayerData = await db.createPlayer(playerData)
      
      // Actualizar la lista de jugadores
      setTeam({
        ...team,
        players: [...(team.players || []), { ...newPlayerData, is_captain: players.length === 0 }]
      })
      
      // Resetear el formulario
      setNewPlayer({ name: '', jersey_number: '' })
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
      position: player.position || '',
      photo_url: player.photo_url || '',
      jersey_number: player.jersey_number?.toString() || ''
    })
    setNewPlayerPhoto(null)
    setPreviewPhotoUrl(player.photo_url || '')
  }

  const handlePlayerPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setNewPlayerPhoto(file)
      // Crear URL de previsualización
      const previewUrl = URL.createObjectURL(file)
      setPreviewPhotoUrl(previewUrl)
      // Actualizar también los datos de edición
      setEditingPlayerData(prev => ({ ...prev, photo_url: previewUrl }))
    }
  }

  const saveEditPlayer = async () => {
    console.log('Iniciando saveEditPlayer');
    console.log('team:', team);
    console.log('editingPlayerId:', editingPlayerId);
    console.log('editingPlayerData:', editingPlayerData);
    
    if (!team || !editingPlayerId) {
      console.log('No se puede actualizar: faltan datos de equipo o jugador');
      return;
    }

    // Verificar si el número de camiseta ya existe (excluyendo el jugador actual)
    const jerseyNumber = editingPlayerData.jersey_number ? parseInt(editingPlayerData.jersey_number) : null;
    if (jerseyNumber !== null) {
      const existingPlayer = players.find(p => p.id !== editingPlayerId && p.jersey_number === jerseyNumber);
      if (existingPlayer) {
        setError('Ya existe un jugador con ese número de camiseta');
        return;
      }
    }

    try {
      // Actualizar datos del jugador
      const updates: any = {
        name: editingPlayerData.name,
        position: editingPlayerData.position || null,
        jersey_number: jerseyNumber
      }
      
      console.log('Preparando actualización con datos:', updates);
      
      // Si hay una nueva foto, subirla
      if (newPlayerPhoto) {
        const path = `teams/${team.id}/players/${editingPlayerId}.jpg`
        console.log('Subiendo imagen a:', path)
        const { error: upErr } = await supabase.storage.from('player-photos').upload(path, newPlayerPhoto, { 
          contentType: 'image/jpeg', 
          upsert: true 
        })
        
        if (upErr) {
          console.error('Error subiendo imagen:', upErr)
          setError('Error subiendo imagen: ' + upErr.message)
          return
        }
        
        const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
        // Agregar timestamp para evitar cache
        const timestamp = new Date().getTime()
        updates.photo_url = `${data.publicUrl}?v=${timestamp}`
        console.log('URL de imagen obtenida:', updates.photo_url)
      }
      
      console.log('Actualizando jugador con datos:', updates);
      const result = await db.updatePlayer(editingPlayerId, updates)
      console.log('Resultado de actualización:', result);
      console.log('Jugador actualizado exitosamente en la base de datos');
      
      // Actualizar también editingPlayerData con los nuevos datos
      if (updates.photo_url) {
        setEditingPlayerData(prev => ({ ...prev, ...updates }))
      }
      
      // Pequeño delay para asegurar que los datos se propaguen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar que los datos se guardaron correctamente
      console.log('Recargando datos del equipo para verificar cambios...');
      console.log('Datos del usuario:', user);
      console.log('Rol del usuario:', role);
      
      // Verificar específicamente el jugador actualizado
      try {
        const specificPlayer = await db.getPlayerById(editingPlayerId);
        console.log('Datos del jugador específicamente obtenidos:', specificPlayer);
      } catch (err) {
        console.error('Error obteniendo jugador específico:', err);
      }
      
      const updatedTeams = await db.getTeams(user.id, role);
      console.log('Equipos obtenidos:', updatedTeams);
      if (updatedTeams.length > 0) {
        const updatedTeamData = updatedTeams[0] as TeamWithPlayers;
        console.log('Jugadores actualizados:', updatedTeamData.players);
        // Buscar el jugador específico que acabamos de actualizar
        const updatedPlayer = updatedTeamData.players?.find(p => p.id === editingPlayerId);
        console.log('Jugador específico actualizado:', updatedPlayer);
        
        console.log('Actualizando estado con nuevos datos...');
        setTeam(updatedTeamData);
        console.log('Estado actualizado. Nuevo estado:', updatedTeamData);
        
        // Verificar inmediatamente después de la actualización
        setTimeout(() => {
          console.log('Estado 100ms después:', team);
        }, 100);
      }
      
      setEditingPlayerId(null)
      setNewPlayerPhoto(null)
      setPreviewPhotoUrl('')
      console.log('Estado actualizado localmente');
    } catch (err) {
      console.error('Error updating player:', err)
      setError('Error al actualizar jugador: ' + (err as Error).message)
    }
  }

  const cancelEditPlayer = () => {
    setEditingPlayerId(null)
    setNewPlayerPhoto(null)
    setPreviewPhotoUrl('')
    // Restaurar la foto original en editingPlayerData
    if (editingPlayerId) {
      const player = players.find(p => p.id === editingPlayerId)
      if (player) {
        setEditingPlayerData(prev => ({ ...prev, photo_url: player.photo_url || '' }))
      }
    }
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
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                players.length >= 7 
                  ? 'bg-green-900/50 text-green-300' 
                  : players.length >= 5
                  ? 'bg-yellow-900/50 text-yellow-300'
                  : 'bg-red-900/50 text-red-300'
              }`}>
                {players.length >= 7 ? '✓ Completado' : 
                 players.length >= 5 ? `⚠️ ${players.length}/7 jugadores` : 
                 `❌ ${players.length}/5 mínimo`}
              </div>
              <div className="flex items-center mt-2">
                <div className="w-32 bg-gray-700 rounded-full h-2 mr-2">
                  <div 
                    className={`h-2 rounded-full ${players.length >= 5 ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${Math.min((players.length / 5) * 100, 100)}%` }}
                  />
                </div>
                {players.length >= 5 && players.length < 7 && (
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${((players.length - 5) / 2) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Información del equipo editable */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Información del Equipo</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo y nombre */}
            <div className="flex items-start space-x-4">
              <div className="relative group">
                <div className="w-16 h-16 bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                  {team.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <button
                  onClick={() => document.getElementById('team-logo-input')?.click()}
                  className="absolute -bottom-2 -right-2 bg-gray-600 rounded-full p-1 hover:bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="h-3 w-3 text-white" />
                </button>
                <input
                  id="team-logo-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleTeamLogoChange}
                />
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
                      className="text-xl font-semibold text-white cursor-pointer hover:text-blue-400 flex items-center group"
                      onClick={() => startEdit('name', team.name)}
                    >
                      {team.name}
                      <Edit3 className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p 
                      className="text-gray-400 text-sm cursor-pointer hover:text-gray-300 flex items-center group"
                      onClick={() => startEdit('description', team.description || '')}
                    >
                      {team.description || 'Sin descripción'}
                      <Edit3 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contacto */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 group">
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
                    className="text-gray-300 cursor-pointer hover:text-white text-sm flex items-center flex-1 group"
                    onClick={() => startEdit('contact_email', team.contact_email || '')}
                  >
                    {team.contact_email || 'Sin email'}
                    <Edit3 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 group">
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
                    className="text-gray-300 cursor-pointer hover:text-white text-sm flex items-center flex-1 group"
                    onClick={() => startEdit('contact_phone', team.contact_phone || '')}
                  >
                    {team.contact_phone || 'Sin teléfono'}
                    <Edit3 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  type="number"
                  placeholder="Número de camiseta"
                  value={newPlayer.jersey_number}
                  onChange={(e) => setNewPlayer({...newPlayer, jersey_number: e.target.value})}
                  min="1"
                  max="99"
                  className="bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={addPlayer}
                    disabled={addingPlayer || !newPlayer.name.trim() || !newPlayer.jersey_number.trim()}
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
                      setNewPlayer({ name: '', jersey_number: '' })
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
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">N° Camiseta</th>
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
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                {previewPhotoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img 
                                    src={`${previewPhotoUrl}&v=${new Date().getTime()}`} 
                                    alt={editingPlayerData.name} 
                                    className="w-full h-full object-cover rounded-full" 
                                  />
                                ) : (
                                  <span className="text-xs font-medium text-white">
                                    {editingPlayerData.name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => document.getElementById(`player-photo-${player.id}`)?.click()}
                                className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-0.5 hover:bg-gray-500"
                              >
                                <Edit3 className="h-2 w-2 text-white" />
                              </button>
                              <input
                                id={`player-photo-${player.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePlayerPhotoChange}
                              />
                            </div>
                            <input
                              type="text"
                              value={editingPlayerData.name}
                              onChange={(e) => setEditingPlayerData({...editingPlayerData, name: e.target.value})}
                              className="bg-gray-700 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              {player.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={`${player.photo_url}?v=${new Date().getTime()}`} 
                                  alt={player.name} 
                                  className="w-full h-full object-cover rounded-full" 
                                />
                              ) : (
                                <span className="text-xs font-medium text-white">
                                  {player.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span className="text-white">{player.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingPlayerId === player.id ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={editingPlayerData.jersey_number}
                              onChange={(e) => setEditingPlayerData({...editingPlayerData, jersey_number: e.target.value})}
                              className="bg-gray-700 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="N° camiseta"
                              min="1"
                              max="99"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-300">{player.jersey_number || '—'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingPlayerId === player.id ? (
                          <select
                            value={editingPlayerData.position || ''}
                            onChange={(e) => setEditingPlayerData({...editingPlayerData, position: e.target.value || null})}
                            className="bg-gray-700 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="">Sin posición</option>
                            {PLAYER_POSITIONS.map(pos => (
                              <option key={pos.value} value={pos.value}>{pos.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-gray-300">
                            {player.position 
                              ? PLAYER_POSITIONS.find(p => p.value === player.position)?.label || player.position 
                              : '—'}
                          </span>
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
      </div>
    </DashboardLayout>
  )
}