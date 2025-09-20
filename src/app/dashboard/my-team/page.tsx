'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/lib/auth-context'
import { db, Team, Player } from '@/lib/database'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  Edit3, 
  X, 
  Mail, 
  Phone, 
  Crown,
  Loader2,
  Plus,
  Trash2,
  Check,
  Upload,
  Shield
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

// Posiciones constantes para jugadores de futsal
const PLAYER_POSITIONS = [
  { value: 'portero', label: 'Portero' },
  { value: 'ala', label: 'Ala' },
  { value: 'cierre', label: 'Cierre' },
  { value: 'pivote', label: 'Pivote' }
]

type PlayerInTeam = Pick<Player, 'id'|'name'|'position'|'is_active'|'photo_url'|'jersey_number'> & { is_captain: boolean };

type TeamWithPlayers = Team & { 
  players?: PlayerInTeam[]
}

type PlayerFormTouched = {
  name: boolean;
  jersey_number: boolean;
}

const createEmptyNewPlayer = (): {
  name: string;
  jersey_number: string;
  position: Player['position'];
  birth_date: string;
  photo_url: string | null;
} => ({
  name: '',
  jersey_number: '',
  position: null,
  birth_date: '',
  photo_url: null
})

const createInitialTouchedState = (): PlayerFormTouched => ({
  name: false,
  jersey_number: false
})

const hasDatabaseErrorCode = (error: unknown): error is { code: string } => {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
}

const parsePlayerPosition = (value: string): Player['position'] => {
  if (value === '') {
    return null
  }

  if (value === 'portero' || value === 'ala' || value === 'cierre' || value === 'pivote') {
    return value
  }

  return null
}

export default function MyTeamPage() {
  const router = useRouter()
  const { user, role } = useAuth()
  const supabase = createClient()
  const [team, setTeam] = useState<TeamWithPlayers | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<keyof Team | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newPlayer, setNewPlayer] = useState(createEmptyNewPlayer())
  const [newPlayerTouched, setNewPlayerTouched] = useState<PlayerFormTouched>(createInitialTouchedState())
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null)

  // Estados para edición de jugadores
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editingPlayerData, setEditingPlayerData] = useState<{
    name: string;
    position: Player['position'];
    photo_url: string | null;
    jersey_number: string;
  }>({ name: '', position: null, photo_url: null, jersey_number: '' })
  const [editingPlayerTouched, setEditingPlayerTouched] = useState<PlayerFormTouched>(createInitialTouchedState())
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<File | null>(null)
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>('')
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null)
  // Estados para modal de edición de logo
  const [showLogoModal, setShowLogoModal] = useState(false)
  // Estados para modal de foto de jugador
  const [showPlayerPhotoModal, setShowPlayerPhotoModal] = useState(false)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)
  // Estados para modal de agregar jugador
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false)

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
  useEffect(() => {
    if (!role) {
      return
    }

    if (role !== 'capitan') {
      router.push('/dashboard')
    }
  }, [role, router])

  if (role && role !== 'capitan') {
    return null
  }

  const players = (team?.players || []).filter(p => p.is_active)
  const captain = players.find(p => p.is_captain)

  const normalizedNewPlayerName = newPlayer.name.trim()
  const normalizedNewPlayerNameLower = normalizedNewPlayerName.toLowerCase()
  const isNewPlayerNameDuplicate = normalizedNewPlayerName.length > 0 &&
    players.some(p => p.name.trim().toLowerCase() === normalizedNewPlayerNameLower)
  const newPlayerNameError = normalizedNewPlayerName.length === 0
    ? 'El nombre es obligatorio'
    : isNewPlayerNameDuplicate
      ? 'Ya existe un jugador con ese nombre'
      : null

  const newPlayerJerseyText = newPlayer.jersey_number.trim()
  const parsedNewPlayerJerseyNumber = newPlayerJerseyText ? parseInt(newPlayerJerseyText, 10) : Number.NaN
  const newPlayerJerseyNumberValue = Number.isNaN(parsedNewPlayerJerseyNumber) ? null : parsedNewPlayerJerseyNumber
  const newPlayerJerseyNumberError = (() => {
    if (!newPlayerJerseyText) {
      return 'El número de camiseta es obligatorio'
    }

    if (Number.isNaN(parsedNewPlayerJerseyNumber)) {
      return 'Ingresa un número válido'
    }

    if (parsedNewPlayerJerseyNumber < 1 || parsedNewPlayerJerseyNumber > 99) {
      return 'El número debe estar entre 1 y 99'
    }

    if (players.some(p => p.jersey_number === parsedNewPlayerJerseyNumber)) {
      return 'Ya existe un jugador con ese número'
    }

    return null
  })()

  const hasNewPlayerErrors = Boolean(newPlayerNameError || newPlayerJerseyNumberError)

  const otherPlayers = editingPlayerId ? players.filter(p => p.id !== editingPlayerId) : []
  const normalizedEditingName = editingPlayerData.name.trim()
  const normalizedEditingNameLower = normalizedEditingName.toLowerCase()
  const editingNameError = editingPlayerId
    ? normalizedEditingName.length === 0
      ? 'El nombre es obligatorio'
      : otherPlayers.some(p => p.name.trim().toLowerCase() === normalizedEditingNameLower)
        ? 'Ya existe un jugador con ese nombre'
        : null
    : null

  const editingJerseyText = editingPlayerData.jersey_number.trim()
  const parsedEditingJerseyNumber = editingJerseyText ? parseInt(editingJerseyText, 10) : Number.NaN
  const editingJerseyNumberValue = Number.isNaN(parsedEditingJerseyNumber) ? null : parsedEditingJerseyNumber
  const editingJerseyNumberError = editingPlayerId
    ? editingJerseyText.length === 0
      ? 'El número de camiseta es obligatorio'
      : Number.isNaN(parsedEditingJerseyNumber)
        ? 'Ingresa un número válido'
        : parsedEditingJerseyNumber < 1 || parsedEditingJerseyNumber > 99
          ? 'El número debe estar entre 1 y 99'
          : otherPlayers.some(p => p.jersey_number === parsedEditingJerseyNumber)
            ? 'Ya existe un jugador con ese número'
            : null
    : null

  const hasEditingErrors = Boolean(editingNameError || editingJerseyNumberError)
  const showNewPlayerNameError = newPlayerTouched.name && Boolean(newPlayerNameError)
  const showNewPlayerJerseyError = newPlayerTouched.jersey_number && Boolean(newPlayerJerseyNumberError)
  const showEditingNameError = editingPlayerTouched.name && Boolean(editingNameError)
  const showEditingJerseyError = editingPlayerTouched.jersey_number && Boolean(editingJerseyNumberError)

  const startEdit = (field: keyof Team, value: string) => {
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
      // Subir la imagen al storage de Supabase
      const path = `teams/${team.id}/logo.jpg`
      const { error: upErr } = await supabase.storage.from('team-logos').upload(path, teamLogoFile, { 
        contentType: 'image/jpeg', 
        upsert: true 
      })
      
      if (upErr) {
        console.error('Error uploading team logo:', upErr)
        setError('Error subiendo logo del equipo: ' + upErr.message)
        return
      }
      
      // Obtener la URL pública de la imagen
      const { data } = supabase.storage.from('team-logos').getPublicUrl(path)
      // Agregar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const logoUrl = `${data.publicUrl}?v=${timestamp}`
      
      // Actualizar el equipo en la base de datos
      const updatedTeamData = await db.updateTeam(team.id, { logo_url: logoUrl })
      
      // Actualizar el estado local
      setTeam({ ...team, ...updatedTeamData, logo_url: logoUrl })
      setTeamLogoFile(null)
      
      // Mostrar éxito brevemente y luego cerrar la modal
      setTimeout(() => {
        setShowLogoModal(false)
      }, 1000)
    } catch (err) {
      console.error('Error uploading team logo:', err)
      setError('Error al subir el logo del equipo: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handlePlayerPhotoUpload = async () => {
    if (!team || !newPlayerPhoto || !currentPlayerId) return

    try {
      setSaving(true)
      // Subir la imagen al storage de Supabase
      const path = `teams/${team.id}/players/${currentPlayerId}.jpg`
      const { error: upErr } = await supabase.storage.from('player-photos').upload(path, newPlayerPhoto, { 
        contentType: 'image/jpeg', 
        upsert: true 
      })
      
      if (upErr) {
        console.error('Error uploading player photo:', upErr)
        setError('Error subiendo foto del jugador: ' + upErr.message)
        return
      }
      
      // Obtener la URL pública de la imagen
      const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
      // Agregar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const photoUrl = `${data.publicUrl}?v=${timestamp}`
      
      // Actualizar el jugador en la base de datos
      await db.updatePlayer(currentPlayerId, { photo_url: photoUrl })
      
      // Actualizar el estado local
      const updatedPlayers = (team.players || []).map(p => 
        p.id === currentPlayerId 
          ? { ...p, photo_url: photoUrl } 
          : p
      )
      
      setTeam({ ...team, players: updatedPlayers })
      
      // Cerrar la modal
      setShowPlayerPhotoModal(false)
      setNewPlayerPhoto(null)
      setCurrentPlayerId(null)
    } catch (err) {
      console.error('Error uploading player photo:', err)
      setError('Error al subir la foto del jugador: ' + (err as Error).message)
    } finally {
      setSaving(false)
    }
  }
  const addPlayer = async () => {
    if (!team) {
      return
    }

    if (hasNewPlayerErrors || newPlayerJerseyNumberValue === null) {
      setNewPlayerTouched({ name: true, jersey_number: true })
      return
    }

    try {
      setSaving(true)
      
      // Primero crear el jugador sin la foto
      const playerData = {
        name: normalizedNewPlayerName,
        jersey_number: newPlayerJerseyNumberValue,
        position: newPlayer.position,
        birth_date: newPlayer.birth_date || null,
        photo_url: null, // Inicialmente null, se actualizará después
        team_id: team.id,
        is_active: true,
        is_captain: players.length === 0 // El primer jugador es el capitán
      }
      
      console.log('Creando jugador con datos:', playerData);
      const newPlayerData = await db.createPlayer(playerData)
      console.log('Jugador creado:', newPlayerData);
      
      // Si hay una foto, subirla y actualizar el jugador
      let finalPhotoUrl = null
      if (newPlayerPhoto && newPlayerData.id) {
        const path = `teams/${team.id}/players/${newPlayerData.id}.jpg`
        console.log('Subiendo imagen a:', path);
        const { error: upErr } = await supabase.storage.from('player-photos').upload(path, newPlayerPhoto, { 
          contentType: 'image/jpeg', 
          upsert: true 
        })
        
        if (upErr) {
          console.error('Error subiendo imagen:', upErr);
          setError('Error subiendo foto: ' + upErr.message);
        } else {
          const { data } = supabase.storage.from('player-photos').getPublicUrl(path)
          const timestamp = new Date().getTime()
          finalPhotoUrl = `${data.publicUrl}?v=${timestamp}`
          console.log('URL de imagen obtenida:', finalPhotoUrl);
          
          // Actualizar el jugador con la URL de la foto
          console.log('Actualizando jugador con foto:', newPlayerData.id, finalPhotoUrl);
          await db.updatePlayer(newPlayerData.id, { photo_url: finalPhotoUrl })
        }
      }
      
      // Actualizar la lista de jugadores
      const playerWithPhoto = { 
        ...newPlayerData, 
        photo_url: finalPhotoUrl,
        is_captain: players.length === 0 
      }
      
      setTeam({
        ...team,
        players: [...(team.players || []), playerWithPhoto]
      })
      
      // Cerrar la modal y resetear el formulario
      setShowAddPlayerModal(false)
      setNewPlayer(createEmptyNewPlayer())
      setNewPlayerTouched(createInitialTouchedState())
      setNewPlayerPhoto(null)
    } catch (err) {
      console.error('Error adding player:', err)
      // Mostrar mensaje de error más específico
      if (hasDatabaseErrorCode(err) && err.code === '42501') {
        setError('No tienes permisos para agregar jugadores. Contacta al administrador.');
      } else if (err instanceof Error) {
        setError('Error al agregar jugador: ' + err.message)
      } else {
        setError('Error al agregar jugador')
      }
    } finally {
      setSaving(false)
    }
  }

  const startEditPlayer = (player: PlayerInTeam) => {
    setEditingPlayerId(player.id)
    setEditingPlayerData({
      name: player.name,
      position: player.position,
      photo_url: player.photo_url ?? null,
      jersey_number: player.jersey_number?.toString() || ''
    })
    setEditingPlayerTouched(createInitialTouchedState())
    setNewPlayerPhoto(null)
    setPreviewPhotoUrl(player.photo_url ?? '')
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

    if (hasEditingErrors || editingJerseyNumberValue === null) {
      setEditingPlayerTouched({ name: true, jersey_number: true })
      return
    }

    try {
      // Actualizar datos del jugador
      const updates: Partial<Player> = {
        name: normalizedEditingName,
        position: editingPlayerData.position,
        jersey_number: editingJerseyNumberValue
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
      
      if (!user) {
        setError('La sesión del usuario no es válida. Vuelve a iniciar sesión.')
        return
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
      setEditingPlayerTouched(createInitialTouchedState())
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
    setEditingPlayerTouched(createInitialTouchedState())
    setNewPlayerPhoto(null)
    setPreviewPhotoUrl('')
    // Restaurar la foto original en editingPlayerData
    if (editingPlayerId) {
      const player = players.find(p => p.id === editingPlayerId)
      if (player) {
        setEditingPlayerData(prev => ({ ...prev, photo_url: player.photo_url ?? null }))
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <div className="w-16 h-16 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-gray-600">
                  {team.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-green-500 flex items-center justify-center">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowLogoModal(true)}
                  className="absolute -bottom-2 -right-2 bg-gray-600 rounded-full p-1 hover:bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
                >
                  <Edit3 className="h-3 w-3 text-white" />
                </button>
                <button
                  onClick={() => setShowLogoModal(true)}
                  className="absolute -bottom-2 -right-2 bg-gray-600 rounded-full p-1 hover:bg-gray-500 md:hidden"
                >
                  <Edit3 className="h-3 w-3 text-white" />
                </button>
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
                      <Edit3 className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100" />
                      <Edit3 className="h-4 w-4 ml-2 md:hidden" />
                    </h3>
                    <p 
                      className="text-gray-400 text-sm cursor-pointer hover:text-gray-300 flex items-center group"
                      onClick={() => startEdit('description', team.description || '')}
                    >
                      {team.description || 'Sin descripción'}
                      <Edit3 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100" />
                      <Edit3 className="h-3 w-3 ml-1 md:hidden" />
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
                  <div className="flex items-center justify-between w-full">
                    <span 
                      className="text-gray-300 cursor-pointer hover:text-white text-sm flex items-center group flex-1"
                      onClick={() => startEdit('contact_email', team.contact_email || '')}
                    >
                      {team.contact_email || 'Sin email'}
                      <Edit3 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100" />
                      <Edit3 className="h-3 w-3 ml-1 md:hidden" />
                    </span>
                  </div>
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
                  <div className="flex items-center justify-between w-full">
                    <span 
                      className="text-gray-300 cursor-pointer hover:text-white text-sm flex items-center group flex-1"
                      onClick={() => startEdit('contact_phone', team.contact_phone || '')}
                    >
                      {team.contact_phone || 'Sin teléfono'}
                      <Edit3 className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100" />
                      <Edit3 className="h-3 w-3 ml-1 md:hidden" />
                    </span>
                  </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-white">Jugadores ({players.length})</h2>
            <button
              onClick={() => {
                setNewPlayer(createEmptyNewPlayer())
                setNewPlayerPhoto(null)
                setNewPlayerTouched(createInitialTouchedState())
                setShowAddPlayerModal(true)
              }}
              className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm justify-center"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar jugador</span>
            </button>
          </div>

          {/* Lista de jugadores - Vista de tabla en escritorio, cards en móvil */}
          {players.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay jugadores en el equipo</p>
            </div>
          ) : (
            <>
              {/* Vista de tabla para escritorio */}
              <div className="hidden md:block overflow-x-auto">
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
                            <div className="flex flex-col space-y-1">
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
                                  onChange={(e) => {
                                    if (!editingPlayerTouched.name) {
                                      setEditingPlayerTouched(prev => ({ ...prev, name: true }))
                                    }
                                    const value = e.target.value
                                    setEditingPlayerData(prev => ({ ...prev, name: value }))
                                  }}
                                  onBlur={() => setEditingPlayerTouched(prev => ({ ...prev, name: true }))}
                                  className={`bg-gray-700 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 border ${
                                    showEditingNameError ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-blue-500'
                                  }`}
                                  autoFocus
                                />
                              </div>
                              {showEditingNameError && editingNameError && (
                                <p className="text-xs text-red-400">{editingNameError}</p>
                              )}
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
                                onChange={(e) => {
                                  if (!editingPlayerTouched.jersey_number) {
                                    setEditingPlayerTouched(prev => ({ ...prev, jersey_number: true }))
                                  }
                                  const value = e.target.value
                                  setEditingPlayerData(prev => ({ ...prev, jersey_number: value }))
                                }}
                                onBlur={() => setEditingPlayerTouched(prev => ({ ...prev, jersey_number: true }))}
                                className={`bg-gray-700 text-white px-2 py-1 rounded w-full focus:outline-none focus:ring-2 border text-sm ${
                                  showEditingJerseyError ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-blue-500'
                                }`}
                                placeholder="N° camiseta"
                                min="1"
                                max="99"
                              />
                              {showEditingJerseyError && editingJerseyNumberError && (
                                <p className="text-xs text-red-400">{editingJerseyNumberError}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">{player.jersey_number || '—'}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {editingPlayerId === player.id ? (
                            <select
                              value={editingPlayerData.position ?? ''}
                              onChange={(e) => setEditingPlayerData({
                                ...editingPlayerData,
                                position: parsePlayerPosition(e.target.value)
                              })}
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
                                disabled={hasEditingErrors}
                                className={`p-1 text-green-400 rounded ${
                                  hasEditingErrors
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-green-900/50'
                                }`}
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

              {/* Vista de cards para móviles */}
              <div className="md:hidden space-y-4">
                {players.map((player) => (
                  <div key={player.id} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                    {editingPlayerId === player.id ? (
                      // Vista de edición de jugador
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-white">Editar Jugador</h3>
                          <div className="flex space-x-1">
                            <button
                              onClick={saveEditPlayer}
                              disabled={hasEditingErrors}
                              className={`p-2 rounded-full ${
                                hasEditingErrors
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-green-900/50 text-green-400'
                              }`}
                            >
                              <Check className="h-5 w-5" />
                            </button>
                            <button
                              onClick={cancelEditPlayer}
                              className="p-2 rounded-full hover:bg-gray-600 text-gray-400"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center space-y-3">
                          <div className="relative">
                            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                              {previewPhotoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={`${previewPhotoUrl}&v=${new Date().getTime()}`} 
                                  alt={editingPlayerData.name} 
                                  className="w-full h-full object-cover rounded-full" 
                                />
                              ) : (
                                <span className="text-lg font-medium text-white">
                                  {editingPlayerData.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => document.getElementById(`player-photo-${player.id}`)?.click()}
                              className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-1 hover:bg-gray-500"
                            >
                              <Edit3 className="h-3 w-3 text-white" />
                            </button>
                            <input
                              id={`player-photo-${player.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handlePlayerPhotoChange}
                            />
                          </div>
                          
                          <div className="w-full space-y-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                              <input
                                type="text"
                                value={editingPlayerData.name}
                                onChange={(e) => {
                                  if (!editingPlayerTouched.name) {
                                    setEditingPlayerTouched(prev => ({ ...prev, name: true }))
                                  }
                                  const value = e.target.value
                                  setEditingPlayerData(prev => ({ ...prev, name: value }))
                                }}
                                onBlur={() => setEditingPlayerTouched(prev => ({ ...prev, name: true }))}
                                className={`w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 border ${
                                  showEditingNameError ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-blue-500'
                                }`}
                              />
                              {showEditingNameError && editingNameError && (
                                <p className="mt-1 text-xs text-red-400">{editingNameError}</p>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">N° Camiseta</label>
                                <input
                                  type="number"
                                  value={editingPlayerData.jersey_number}
                                  onChange={(e) => {
                                    if (!editingPlayerTouched.jersey_number) {
                                      setEditingPlayerTouched(prev => ({ ...prev, jersey_number: true }))
                                    }
                                    const value = e.target.value
                                    setEditingPlayerData(prev => ({ ...prev, jersey_number: value }))
                                  }}
                                  onBlur={() => setEditingPlayerTouched(prev => ({ ...prev, jersey_number: true }))}
                                  className={`w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 border ${
                                    showEditingJerseyError ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-blue-500'
                                  }`}
                                  placeholder="1-99"
                                  min="1"
                                  max="99"
                                />
                                {showEditingJerseyError && editingJerseyNumberError && (
                                  <p className="mt-1 text-xs text-red-400">{editingJerseyNumberError}</p>
                                )}
                              </div>
                              
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Posición</label>
                                <select
                                  value={editingPlayerData.position ?? ''}
                                  onChange={(e) => setEditingPlayerData({
                                    ...editingPlayerData,
                                    position: parsePlayerPosition(e.target.value)
                                  })}
                                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Sin posición</option>
                                  {PLAYER_POSITIONS.map(pos => (
                                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Vista normal de jugador
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                            {player.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={`${player.photo_url}?v=${new Date().getTime()}`} 
                                alt={player.name} 
                                className="w-full h-full object-cover rounded-full" 
                              />
                            ) : (
                              <span className="text-sm font-medium text-white">
                                {player.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-white">{player.name}</h3>
                              {player.is_captain && (
                                <div className="flex items-center text-yellow-400">
                                  <Crown className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3 text-sm text-gray-400">
                              <span>N° {player.jersey_number || '—'}</span>
                              <span>
                                {player.position 
                                  ? PLAYER_POSITIONS.find(p => p.value === player.position)?.label || player.position 
                                  : 'Sin posición'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => startEditPlayer(player)}
                            className="p-2 rounded-full hover:bg-gray-600 text-gray-400"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deletePlayer(player.id)}
                            disabled={deletingPlayerId === player.id}
                            className="p-2 rounded-full hover:bg-red-900/50 text-gray-400 disabled:opacity-50"
                          >
                            {deletingPlayerId === player.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal de edición de logo del equipo */}
      {showLogoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Actualizar Logo del Equipo</h3>
              <button
                onClick={() => {
                  setShowLogoModal(false)
                  setTeamLogoFile(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center md:w-32 md:h-32 border-2 border-gray-600">
                  {teamLogoFile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={URL.createObjectURL(teamLogoFile)} 
                      alt="Nuevo logo" 
                      className="w-full h-full object-cover" 
                    />
                  ) : team?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={team.logo_url} 
                      alt={team.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Users className="h-12 w-12 text-gray-400 md:h-16 md:w-16" />
                  )}
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="logo-upload-input"
                  onChange={handleTeamLogoChange}
                />
                
                <button
                  onClick={() => document.getElementById('logo-upload-input')?.click()}
                  className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full justify-center"
                >
                  <Upload className="h-4 w-4" />
                  <span>{teamLogoFile ? 'Cambiar imagen' : 'Seleccionar imagen'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3">
              <button
                onClick={() => {
                  setShowLogoModal(false)
                  setTeamLogoFile(null)
                }}
                className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={uploadTeamLogo}
                disabled={!teamLogoFile || saving}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de edición de foto de jugador */}
      {showPlayerPhotoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Actualizar Foto del Jugador</h3>
              <button
                onClick={() => {
                  setShowPlayerPhotoModal(false)
                  setNewPlayerPhoto(null)
                  setCurrentPlayerId(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center md:w-32 md:h-32">
                  {newPlayerPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={URL.createObjectURL(newPlayerPhoto)} 
                      alt="Nueva foto" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <Users className="h-12 w-12 text-gray-400 md:h-16 md:w-16" />
                  )}
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="player-photo-upload-input"
                  onChange={handlePlayerPhotoChange}
                />
                
                <button
                  onClick={() => document.getElementById('player-photo-upload-input')?.click()}
                  className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full justify-center"
                >
                  <Upload className="h-4 w-4" />
                  <span>{newPlayerPhoto ? 'Cambiar imagen' : 'Seleccionar imagen'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3">
              <button
                onClick={() => {
                  setShowPlayerPhotoModal(false)
                  setNewPlayerPhoto(null)
                  setCurrentPlayerId(null)
                }}
                className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePlayerPhotoUpload}
                disabled={!newPlayerPhoto || saving}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de agregar jugador */}
      {showAddPlayerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Agregar Nuevo Jugador</h3>
              <button
                onClick={() => {
                  setShowAddPlayerModal(false)
                  setNewPlayer(createEmptyNewPlayer())
                  setNewPlayerTouched(createInitialTouchedState())
                  setNewPlayerPhoto(null)
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) => {
                    if (!newPlayerTouched.name) {
                      setNewPlayerTouched(prev => ({ ...prev, name: true }))
                    }
                    setNewPlayer({ ...newPlayer, name: e.target.value })
                  }}
                  onBlur={() => setNewPlayerTouched(prev => ({ ...prev, name: true }))}
                  className={`w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 border ${
                    showNewPlayerNameError ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-blue-500'
                  }`}
                  placeholder="Nombre completo del jugador"
                />
                {showNewPlayerNameError && newPlayerNameError && (
                  <p className="mt-1 text-xs text-red-400">{newPlayerNameError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Número de camiseta *</label>
                <input
                  type="number"
                  value={newPlayer.jersey_number}
                  onChange={(e) => {
                    if (!newPlayerTouched.jersey_number) {
                      setNewPlayerTouched(prev => ({ ...prev, jersey_number: true }))
                    }
                    setNewPlayer({ ...newPlayer, jersey_number: e.target.value })
                  }}
                  onBlur={() => setNewPlayerTouched(prev => ({ ...prev, jersey_number: true }))}
                  min="1"
                  max="99"
                  className={`w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 border ${
                    showNewPlayerJerseyError ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-blue-500'
                  }`}
                  placeholder="1-99"
                />
                {showNewPlayerJerseyError && newPlayerJerseyNumberError && (
                  <p className="mt-1 text-xs text-red-400">{newPlayerJerseyNumberError}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Posición</label>
                <select
                  value={newPlayer.position ?? ''}
                  onChange={(e) => setNewPlayer({
                    ...newPlayer,
                    position: parsePlayerPosition(e.target.value)
                  })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin posición</option>
                  <option value="portero">Portero</option>
                  <option value="ala">Ala</option>
                  <option value="cierre">Cierre</option>
                  <option value="pivote">Pivote</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Foto del jugador</label>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-gray-700 rounded-xl overflow-hidden flex items-center justify-center md:w-32 md:h-32">
                    {newPlayerPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={URL.createObjectURL(newPlayerPhoto)} 
                        alt="Foto del jugador" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <Users className="h-12 w-12 text-gray-400 md:h-16 md:w-16" />
                    )}
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="new-player-photo-upload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setNewPlayerPhoto(e.target.files[0])
                      }
                    }}
                  />
                  
                  <button
                    onClick={() => document.getElementById('new-player-photo-upload')?.click()}
                    className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors w-full justify-center"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{newPlayerPhoto ? 'Cambiar foto' : 'Seleccionar foto'}</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3">
              <button
                onClick={() => {
                  setShowAddPlayerModal(false)
                  setNewPlayer(createEmptyNewPlayer())
                  setNewPlayerTouched(createInitialTouchedState())
                  setNewPlayerPhoto(null)
                }}
                className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addPlayer}
                disabled={saving || hasNewPlayerErrors}
                className={`flex-1 py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
                  saving || hasNewPlayerErrors
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Agregando...
                  </>
                ) : (
                  'Agregar jugador'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
