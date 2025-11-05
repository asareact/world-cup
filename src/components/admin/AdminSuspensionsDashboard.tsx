'use client'

import { useState, useEffect } from 'react'
import { db, PlayerSuspension } from '@/lib/database'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  X, 
  Edit3, 
  Check, 
  Trash2, 
  Plus, 
  Shield, 
  Calendar, 
  Flag,
  Loader2
} from 'lucide-react'

// Tipo extendido para suspensiones con información de jugador
type PlayerSuspensionWithPlayer = PlayerSuspension & {
  player?: {
    id: string;
    name: string;
    team_id: string;
    teams?: {
      name: string;
    }
  }
}

export default function AdminSuspensionsDashboard() {
  const router = useRouter()
  const { user, role } = useAuth()
  const [suspensions, setSuspensions] = useState<PlayerSuspensionWithPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddSuspension, setShowAddSuspension] = useState(false)
  const [editingSuspension, setEditingSuspension] = useState<PlayerSuspension | null>(null)
  const [deletingSuspensionId, setDeletingSuspensionId] = useState<string | null>(null)

  // Estados para el formulario de suspensión
  const [suspensionForm, setSuspensionForm] = useState({
    player_id: '',
    tournament_id: '',
    match_id: '',
    reason: '',
    suspension_type: 'red_direct' as 'red_direct' | 'red_two_yellow' | 'yellow_accumulated' | 'yellow_consecutive',
    suspension_matches: 1,
    served: false
  })
  
  // Estados para datos de selección
  const [tournaments, setTournaments] = useState<{id: string, name: string}[]>([])
  const [matches, setMatches] = useState<{id: string, home_team_name: string, away_team_name: string, scheduled_at: string}[]>([])
  const [roundMatches, setRoundMatches] = useState<{[key: string]: any[]}>({})
  const [showMatchesModal, setShowMatchesModal] = useState(false)
  const [availableRounds, setAvailableRounds] = useState<string[]>([])
  const [selectedRound, setSelectedRound] = useState('')
  const [players, setPlayers] = useState<{id: string, name: string, team_name: string}[]>([])
  const [allTournamentPlayers, setAllTournamentPlayers] = useState<{id: string, name: string, team_name: string}[]>([])
  const [loadingTournaments, setLoadingTournaments] = useState(false)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(false)

  // Tipos de suspensiones disponibles con descripciones
  const suspensionTypes = [
    { value: 'red_direct', label: 'Roja Directa', description: 'Tarjeta roja directa (2 partidos)' },
    { value: 'red_two_yellow', label: 'Doble Amarilla', description: 'Acumulación de 2 amarillas (1 partido)' },
    { value: 'yellow_accumulated', label: 'Acumulación', description: '3 amarillas en torneo (1 partido)' },
    { value: 'yellow_consecutive', label: 'Consecutivas', description: '2 amarillas consecutivas (1 partido)' }
  ]

  useEffect(() => {
    if (!user || role !== 'superAdmin') {
      router.push('/dashboard')
      return
    }
    
    loadSuspensions()
  }, [user, role, router])

  const loadSuspensions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Obtener suspensiones con detalles básicos primero
      const supabase = createClient()
      const { data: suspensionsData, error } = await supabase
        .from('player_suspensions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Obtener detalles de los jugadores para cada suspensión
      const suspensionsWithPlayers = []
      if (suspensionsData) {
        for (const suspension of suspensionsData) {
          // Obtener datos del jugador
          const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('id, name, team_id, teams!inner(name)')
            .eq('id', suspension.player_id)
            .single()
          
          if (!playerError && playerData) {
            suspensionsWithPlayers.push({
              ...suspension,
              player: playerData
            })
          } else {
            suspensionsWithPlayers.push({
              ...suspension,
              player: { name: 'Jugador desconocido', teams: { name: 'Equipo desconocido' } }
            })
          }
        }
      }
      
      setSuspensions(suspensionsWithPlayers)
    } catch (err) {
      console.error('Error loading suspensions:', err)
      setError('Error al cargar las suspensiones')
    } finally {
      setLoading(false)
    }
  }

  // Cargar torneos para el selector
  const loadTournaments = async () => {
    if (loadingTournaments) return
    try {
      setLoadingTournaments(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('name')
      
      if (error) throw error
      setTournaments(data || [])
    } catch (err) {
      console.error('Error loading tournaments:', err)
      setError('Error al cargar los torneos')
    } finally {
      setLoadingTournaments(false)
    }
  }

  // Cargar partidos para el torneo seleccionado y organizar por jornadas
  const loadMatches = async (tournamentId: string) => {
    if (loadingMatches || !tournamentId) return
    try {
      setLoadingMatches(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          scheduled_at,
          round_name,
          home_team_id,
          away_team_id
        `)
        .eq('tournament_id', tournamentId)
        .order('scheduled_at', { ascending: false })
      
      if (error) throw error
      
      // Para cada partido, obtener los nombres de los equipos
      const matchesWithTeamNames = []
      for (const match of data) {
        // Obtener nombre del equipo local
        const { data: homeTeam, error: homeTeamError } = await supabase
          .from('teams')
          .select('name')
          .eq('id', match.home_team_id)
          .single()
        
        // Obtener nombre del equipo visitante
        const { data: awayTeam, error: awayTeamError } = await supabase
          .from('teams')
          .select('name')
          .eq('id', match.away_team_id)
          .single()
        
        matchesWithTeamNames.push({
          id: match.id,
          scheduled_at: match.scheduled_at,
          round_name: match.round_name || 'Sin jornada',
          home_team_name: homeTeam?.name || 'Equipo desconocido',
          away_team_name: awayTeam?.name || 'Equipo desconocido'
        })
      }
      
      // Agrupar por jornadas
      const groupedByRound: {[key: string]: any[]} = {}
      const roundsSet = new Set<string>()
      
      matchesWithTeamNames.forEach(match => {
        const round = match.round_name
        if (!groupedByRound[round]) {
          groupedByRound[round] = []
        }
        groupedByRound[round].push(match)
        roundsSet.add(round)
      })
      
      setMatches(matchesWithTeamNames)
      setRoundMatches(groupedByRound)
      // Ordenar jornadas numéricamente si son del tipo "Jornada X"
      const sortedRounds = Array.from(roundsSet).sort((a, b) => {
        // Extraer números de las jornadas si siguen el patrón "Jornada X"
        const numA = a.match(/Jornada\s*(\d+)/i)?.[1]
        const numB = b.match(/Jornada\s*(\d+)/i)?.[1]
        
        if (numA && numB) {
          return parseInt(numA) - parseInt(numB)
        }
        
        // Si no se puede extraer número, ordenar alfabéticamente
        return a.localeCompare(b)
      })
      
      setAvailableRounds(sortedRounds)
      
      // Seleccionar la jornada actual si existe
      const today = new Date().toISOString().split('T')[0]
      const currentRound = Object.keys(groupedByRound).find(round => 
        groupedByRound[round].some((match: any) => match.scheduled_at.startsWith(today))
      )
      
      if (currentRound) {
        setSelectedRound(currentRound)
      } else if (Array.from(roundsSet).length > 0) {
        setSelectedRound(Array.from(roundsSet)[0]) // Primera jornada por defecto
      } else {
        setSelectedRound('')
      }
    } catch (err) {
      console.error('Error loading matches:', err)
      setError('Error al cargar los partidos')
    } finally {
      setLoadingMatches(false)
    }
  }

  // Cargar jugadores para el selector
  const loadPlayers = async () => {
    if (loadingPlayers) return
    try {
      setLoadingPlayers(true)
      const supabase = createClient()
      
      let query = supabase
        .from('players')
        .select(`
          id,
          name,
          team_id
        `)
        .order('name')
      
      // Si hay un torneo seleccionado, cargar solo jugadores de equipos en ese torneo
      if (suspensionForm.tournament_id) {
        // Primero obtener los equipos del torneo
        const { data: tournamentTeams, error: teamsError } = await supabase
          .from('tournament_teams')
          .select('team_id')
          .eq('tournament_id', suspensionForm.tournament_id)
        
        if (teamsError) throw teamsError
        
        if (tournamentTeams && tournamentTeams.length > 0) {
          const teamIds = tournamentTeams.map(tt => tt.team_id)
          query = query.in('team_id', teamIds)
        }
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      // Para cada jugador, obtener el nombre del equipo
      const playersWithTeamNames = []
      for (const player of data) {
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('name')
          .eq('id', player.team_id)
          .single()
        
        playersWithTeamNames.push({
          id: player.id,
          name: player.name,
          team_name: team?.name || 'Equipo desconocido'
        })
      }
      
      setAllTournamentPlayers(playersWithTeamNames)
      setPlayers(playersWithTeamNames) // Mostrar todos los jugadores del torneo por defecto
      
      // Si hay un partido seleccionado, filtrar a jugadores de ese partido
      if (suspensionForm.match_id) {
        await loadMatchPlayers(suspensionForm.match_id)
      }
    } catch (err) {
      console.error('Error loading players:', err)
      setError('Error al cargar los jugadores')
    } finally {
      setLoadingPlayers(false)
    }
  }
  
  // Función para cargar solo jugadores del partido
  const loadMatchPlayers = async (matchId: string) => {
    if (!matchId) return
    
    setLoadingPlayers(true)
    const supabase = createClient()
    
    try {
      // Obtener el partido para identificar los equipos
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          home_team_id,
          away_team_id
        `)
        .eq('id', matchId)
        .single()
      
      if (matchError) throw matchError
      
      // Obtener jugadores de ambos equipos del partido
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select(`
          id,
          name,
          team_id,
          teams!inner(name)
        `)
        .or(`team_id.eq.${match.home_team_id},team_id.eq.${match.away_team_id}`)
        .order('name')
      
      if (playersError) throw playersError
      
      // Para cada jugador, obtener el nombre del equipo
      const playersWithTeamNames = []
      for (const player of players) {
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('name')
          .eq('id', player.team_id)
          .single()
        
        playersWithTeamNames.push({
          id: player.id,
          name: player.name,
          team_name: team?.name || 'Equipo desconocido'
        })
      }
      
      setPlayers(playersWithTeamNames)
    } catch (err) {
      console.error('Error loading match players:', err)
      setError('Error al cargar los jugadores del partido')
    } finally {
      setLoadingPlayers(false)
    }
  }

  // Efecto para cargar torneos y jugadores al abrir el modal de agregar suspensión
  useEffect(() => {
    if (showAddSuspension) {
      loadTournaments()
      loadPlayers()
    }
  }, [showAddSuspension])

  // Efecto para cargar partidos cuando se selecciona un torneo
  useEffect(() => {
    if (suspensionForm.tournament_id) {
      loadMatches(suspensionForm.tournament_id)
      // También cargar todos los jugadores del torneo
      loadPlayers()
    } else {
      setMatches([]) // Limpiar partidos si no hay torneo seleccionado
      setRoundMatches({})
      setAvailableRounds([])
      setSelectedRound('')
      // Cargar todos los jugadores cuando no hay torneo seleccionado
      loadPlayers()
    }
  }, [suspensionForm.tournament_id])
  
  // Efecto para limpiar el partido seleccionado cuando cambia el torneo
  useEffect(() => {
    if (!suspensionForm.tournament_id) {
      setSuspensionForm(prev => ({...prev, match_id: '', player_id: ''}))
      setPlayers([]) // Limpiar jugadores cuando no hay torneo
      setAllTournamentPlayers([])
    }
  }, [suspensionForm.tournament_id])

  const filteredSuspensions = suspensions.filter(suspension => 
    suspension.player?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suspension.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suspension.player?.teams?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddSuspension = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('player_suspensions')
        .insert([suspensionForm])
        .select()
        .single()

      if (error) throw error

      setSuspensions([data, ...suspensions])
      setShowAddSuspension(false)
      setSuspensionForm({
        player_id: '',
        tournament_id: '',
        match_id: '',
        reason: '',
        suspension_type: 'red_direct',
        suspension_matches: 1,
        served: false
      })
    } catch (err) {
      console.error('Error adding suspension:', err)
      setError('Error al agregar la suspensión')
    }
  }

  const handleUpdateSuspension = async () => {
    if (!editingSuspension) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('player_suspensions')
        .update({
          reason: suspensionForm.reason,
          suspension_type: suspensionForm.suspension_type,
          suspension_matches: suspensionForm.suspension_matches,
          served: suspensionForm.served
        })
        .eq('id', editingSuspension.id)
        .select()
        .single()

      if (error) throw error

      setSuspensions(suspensions.map(s => s.id === editingSuspension.id ? data : s))
      setEditingSuspension(null)
    } catch (err) {
      console.error('Error updating suspension:', err)
      setError('Error al actualizar la suspensión')
    }
  }

  const handleDeleteSuspension = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta suspensión?')) return

    try {
      const supabase = createClient()
      setDeletingSuspensionId(id)
      const { error } = await supabase
        .from('player_suspensions')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuspensions(suspensions.filter(s => s.id !== id))
    } catch (err) {
      console.error('Error deleting suspension:', err)
      setError('Error al eliminar la suspensión')
    } finally {
      setDeletingSuspensionId(null)
    }
  }

  const toggleSuspensionStatus = async (suspension: PlayerSuspension) => {
    try {
      const supabase = createClient()
      const newServedStatus = !suspension.served
      const { data, error } = await supabase
        .from('player_suspensions')
        .update({ served: newServedStatus })
        .eq('id', suspension.id)
        .select()
        .single()

      if (error) throw error

      setSuspensions(suspensions.map(s => s.id === suspension.id ? data : s))
    } catch (err) {
      console.error('Error toggling suspension status:', err)
      setError('Error al actualizar el estado de la suspensión')
    }
  }

  // Función para seleccionar un partido
  const selectMatch = async (matchId: string) => {
    setSuspensionForm({...suspensionForm, match_id: matchId})
    setShowMatchesModal(false)
    
    // Cargar solo jugadores de los equipos del partido
    if (matchId) {
      await loadMatchPlayers(matchId)
    }
  }

  if (role && role !== 'superAdmin') {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-white">Cargando suspensiones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-yellow-500" />
            Panel de Suspensiones
          </h1>
          <p className="text-gray-400">Gestiona las suspensiones de jugadores</p>
        </div>
        <button
          onClick={() => setShowAddSuspension(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Suspensión</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
          <div className="text-red-400">{error}</div>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar jugadores, equipos o razones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">{suspensions.length}</div>
          <div className="text-gray-400">Suspensiones Totales</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">
            {suspensions.filter(s => !s.served).length}
          </div>
          <div className="text-gray-400">Pendientes</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">
            {suspensions.filter(s => s.served).length}
          </div>
          <div className="text-gray-400">Cumplidas</div>
        </div>
      </div>

      {/* Lista de suspensiones */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Suspensiones Registradas</h2>
        
        {filteredSuspensions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {searchTerm ? 'No se encontraron suspensiones coincidentes' : 'No hay suspensiones registradas'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Jugador</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Equipo</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Torneo</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Partidos</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Estado</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuspensions.map((suspension) => (
                  <tr key={suspension.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Flag className="h-4 w-4 text-red-500" />
                        <span className="text-white">{suspension.player?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300">{suspension.player?.teams?.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1 text-sm text-gray-300">
                        <Calendar className="h-3 w-3" />
                        <span>ID: {suspension.tournament_id?.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300">
                        {suspensionTypes.find(t => t.value === suspension.suspension_type)?.label || suspension.suspension_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300">{suspension.suspension_matches} partidos</span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleSuspensionStatus(suspension)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          suspension.served 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-yellow-900/50 text-yellow-300'
                        }`}
                      >
                        {suspension.served ? 'Cumplida' : 'Pendiente'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingSuspension(suspension)
                            setSuspensionForm({
                              player_id: suspension.player_id,
                              tournament_id: suspension.tournament_id || '',
                              match_id: suspension.match_id || '',
                              reason: suspension.reason || '',
                              suspension_type: suspension.suspension_type as any,
                              suspension_matches: suspension.suspension_matches,
                              served: suspension.served
                            })
                          }}
                          className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-900/50 rounded"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSuspension(suspension.id)}
                          disabled={deletingSuspensionId === suspension.id}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/50 rounded disabled:opacity-50"
                        >
                          {deletingSuspensionId === suspension.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar suspensión */}
      {showAddSuspension && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Agregar Suspensión</h3>
              <button
                onClick={() => {
                  setShowAddSuspension(false)
                  setSuspensionForm({
                    player_id: '',
                    tournament_id: '',
                    match_id: '',
                    reason: '',
                    suspension_type: 'red_direct',
                    suspension_matches: 1,
                    served: false
                  })
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Jugador *</label>
                {loadingPlayers ? (
                  <div className="w-full bg-gray-700 px-3 py-2 rounded-lg">
                    <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <select
                    value={suspensionForm.player_id}
                    onChange={(e) => setSuspensionForm({...suspensionForm, player_id: e.target.value})}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar jugador</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({player.team_name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Torneo</label>
                {loadingTournaments ? (
                  <div className="w-full bg-gray-700 px-3 py-2 rounded-lg">
                    <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <select
                    value={suspensionForm.tournament_id}
                    onChange={(e) => {
                      setSuspensionForm({
                        ...suspensionForm, 
                        tournament_id: e.target.value,
                        match_id: '' // Limpiar partido seleccionado al cambiar torneo
                      })
                    }}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar torneo (opcional)</option>
                    {tournaments.map(tournament => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Partido</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={suspensionForm.match_id ? 
                      matches.find(m => m.id === suspensionForm.match_id)?.home_team_name + 
                      ' vs ' + 
                      matches.find(m => m.id === suspensionForm.match_id)?.away_team_name +
                      ' (' + new Date(matches.find(m => m.id === suspensionForm.match_id)?.scheduled_at || '').toLocaleDateString() + ')' 
                      : 'Seleccionar partido...'}
                    readOnly
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    onClick={() => {
                      if (suspensionForm.tournament_id && Object.keys(roundMatches).length > 0) {
                        setShowMatchesModal(true)
                      }
                    }}
                    placeholder="Seleccionar partido..."
                    disabled={!suspensionForm.tournament_id}
                  />
                  {!suspensionForm.tournament_id && (
                    <span className="text-xs text-gray-400">Primero seleccione un torneo</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Suspensión *</label>
                <select
                  value={suspensionForm.suspension_type}
                  onChange={(e) => setSuspensionForm({...suspensionForm, suspension_type: e.target.value as any})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {suspensionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label} - {type.description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Partidos de Suspensión *</label>
                <input
                  type="number"
                  min="1"
                  value={suspensionForm.suspension_matches}
                  onChange={(e) => setSuspensionForm({...suspensionForm, suspension_matches: parseInt(e.target.value) || 1})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Razón</label>
                <textarea
                  value={suspensionForm.reason}
                  onChange={(e) => setSuspensionForm({...suspensionForm, reason: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Razón de la suspensión"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="served"
                  checked={suspensionForm.served}
                  onChange={(e) => setSuspensionForm({...suspensionForm, served: e.target.checked})}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="served" className="ml-2 text-sm text-gray-300">
                  Suspensión cumplida
                </label>
              </div>
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setShowAddSuspension(false)
                  setSuspensionForm({
                    player_id: '',
                    tournament_id: '',
                    match_id: '',
                    reason: '',
                    suspension_type: 'red_direct',
                    suspension_matches: 1,
                    served: false
                  })
                }}
                className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSuspension}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Suspensión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para seleccionar partido por jornadas */}
      {showMatchesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Seleccionar Partido</h3>
              <button
                onClick={() => setShowMatchesModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {availableRounds.length > 0 ? (
              <div className="space-y-4">
                {/* Tabs para seleccionar jornada */}
                <div className="flex overflow-x-auto pb-2 space-x-2">
                  {availableRounds.map((round, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedRound(round)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                        selectedRound === round
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {round}
                    </button>
                  ))}
                </div>

                {/* Partidos de la jornada seleccionada */}
                {selectedRound && roundMatches[selectedRound] && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-white">Partidos en {selectedRound}</h4>
                    {roundMatches[selectedRound].map((match) => (
                      <div 
                        key={match.id}
                        onClick={() => selectMatch(match.id)}
                        className="p-4 bg-gray-700 rounded-lg border border-gray-600 hover:bg-gray-600 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">
                              {match.home_team_name} vs {match.away_team_name}
                            </div>
                            <div className="text-sm text-gray-400">
                              {new Date(match.scheduled_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-400 mr-2">
                              {match.id.substring(0, 8)}...
                            </span>
                            {suspensionForm.match_id === match.id && (
                              <Check className="h-5 w-5 text-green-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                {loadingMatches ? 'Cargando partidos...' : 'No hay partidos disponibles para este torneo'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para editar suspensión */}
      {editingSuspension && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Editar Suspensión</h3>
              <button
                onClick={() => {
                  setEditingSuspension(null)
                  setSuspensionForm({
                    player_id: '',
                    tournament_id: '',
                    match_id: '',
                    reason: '',
                    suspension_type: 'red_direct',
                    suspension_matches: 1,
                    served: false
                  })
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Razón</label>
                <textarea
                  value={suspensionForm.reason}
                  onChange={(e) => setSuspensionForm({...suspensionForm, reason: e.target.value})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Suspensión</label>
                <select
                  value={suspensionForm.suspension_type}
                  onChange={(e) => setSuspensionForm({...suspensionForm, suspension_type: e.target.value as any})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {suspensionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label} - {type.description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Partidos de Suspensión</label>
                <input
                  type="number"
                  min="1"
                  value={suspensionForm.suspension_matches}
                  onChange={(e) => setSuspensionForm({...suspensionForm, suspension_matches: parseInt(e.target.value) || 1})}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editServed"
                  checked={suspensionForm.served}
                  onChange={(e) => setSuspensionForm({...suspensionForm, served: e.target.checked})}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editServed" className="ml-2 text-sm text-gray-300">
                  Suspensión cumplida
                </label>
              </div>
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => {
                  setEditingSuspension(null)
                  setSuspensionForm({
                    player_id: '',
                    tournament_id: '',
                    match_id: '',
                    reason: '',
                    suspension_type: 'red_direct',
                    suspension_matches: 1,
                    served: false
                  })
                }}
                className="flex-1 bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateSuspension}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}