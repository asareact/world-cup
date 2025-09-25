'use client'

import { useState, useEffect } from 'react'
import { X, User, Users, Calendar as CalendarIcon } from 'lucide-react'

// Assuming Match and Team interfaces are defined locally or imported differently
interface Match {
  id: string
  home_team_id: string | null
  away_team_id: string | null
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_at: string | null
  venue: string | null
  round_name: string | null
  // Add other properties as needed
}

interface Team {
  id: string
  name: string
  logo_url: string | null
  // Add other properties as needed
}

interface MatchDetailsModalProps {
  match: Match | null
  isOpen: boolean
  onClose: () => void
  teams: Pick<Team, "id" | "name" | "logo_url">[] | undefined | null
}

interface Player {
  id?: string
  name?: string
  is_captain?: boolean
}

// Helper function to load and sort team players
const loadAndSortTeamPlayers = async (teamId: string) => {
  try {
    const response = await fetch(`/api/teams/${teamId}/players`)
    if (response.ok) {
      const players = await response.json()
      // Sort players to show captains first
      return [...players].sort((a: Player, b: Player) => {
        if (a.is_captain && !b.is_captain) return -1
        if (!a.is_captain && b.is_captain) return 1
        return 0
      })
    }
    return []
  } catch (error) {
    console.error('Error loading team players:', error)
    return []
  }
}

// Helper function to format time in Cuban timezone
const getNormalizedCubanTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    // Format time in Cuban timezone (UTC-5)
    return date.toLocaleTimeString('es-ES', { 
      timeZone: 'America/Havana',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    return 'Hora no disponible';
  }
};

// Helper function to format date in Cuban timezone
const getNormalizedCubanDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    // Format date in Cuban timezone (UTC-5)
    const formattedDate = date.toLocaleDateString('es-ES', { 
      timeZone: 'America/Havana',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return {
      date: formattedDate,
      time: date.toLocaleTimeString('es-ES', { 
        timeZone: 'America/Havana',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  } catch (error) {
    return { date: 'Fecha no disponible', time: 'Hora no disponible' };
  }
};

export function MatchDetailsModal({ match, isOpen, onClose, teams }: MatchDetailsModalProps) {
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<Player[]>([])
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState({ home: true, away: true })
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home')

  // Load players when match changes
  useEffect(() => {
    if (match && isOpen) {
      loadTeamPlayers()
    }
  }, [match, isOpen])

  const loadTeamPlayers = async () => {
    if (!match) return

    // Reset loading states
    setLoadingPlayers({ home: true, away: true })
    setHomeTeamPlayers([])
    setAwayTeamPlayers([])

    try {
      // Load home team players
      if (match.home_team_id) {
        try {
          const players = await loadAndSortTeamPlayers(match.home_team_id)
          setHomeTeamPlayers(players)
        } catch (error) {
          console.error('Error loading home team players:', error)
        } finally {
          setLoadingPlayers(prev => ({ ...prev, home: false }))
        }
      } else {
        setLoadingPlayers(prev => ({ ...prev, home: false }))
      }

      // Load away team players
      if (match.away_team_id) {
        try {
          const players = await loadAndSortTeamPlayers(match.away_team_id)
          setAwayTeamPlayers(players)
        } catch (error) {
          console.error('Error loading away team players:', error)
        } finally {
          setLoadingPlayers(prev => ({ ...prev, away: false }))
        }
      } else {
        setLoadingPlayers(prev => ({ ...prev, away: false }))
      }
    } catch (error) {
      console.error('Error loading team players:', error)
      setLoadingPlayers({ home: false, away: false })
    }
  }

  if (!isOpen || !match) return null

  // Get team info
  const homeTeam = teams?.find(team => team.id === match.home_team_id) || null
  const awayTeam = teams?.find(team => team.id === match.away_team_id) || null

  // Get current players based on active tab
  const currentPlayers = activeTab === 'home' ? homeTeamPlayers : awayTeamPlayers
  const currentTeam = activeTab === 'home' ? homeTeam : awayTeam
  const isLoading = activeTab === 'home' ? loadingPlayers.home : loadingPlayers.away

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl md:hidden">
        {/* Contenido con scroll completo */}
        <div className="overflow-y-auto flex-grow p-4">
          {/* Header con botón de cierre */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              Detalles del Partido
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Información sintetizada del partido */}
          <div className="bg-gray-700/30 rounded-xl p-4 mb-4 border border-gray-600/50 shadow-lg">
            {/* Equipos y marcador en una fila */}
            <div className="flex items-center justify-between mb-4">
              {/* Equipo Local */}
              <div className="flex flex-col items-center flex-1">
                {homeTeam?.logo_url ? (
                  <img 
                    src={homeTeam.logo_url} 
                    alt={homeTeam.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/30 mb-2"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-2 border-blue-500/30 mb-2">
                    <span className="text-white font-bold text-xl">
                      {homeTeam?.name?.charAt(0) || 'T'}
                    </span>
                  </div>
                )}
                <h4 className="text-sm font-bold text-white text-center max-w-[100px] truncate">
                  {homeTeam?.name || 'Local'}
                </h4>
              </div>
              
              {/* Marcador */}
              <div className="flex items-center mx-2">
                <div className="text-2xl font-bold text-green-400 mx-1">
                  {match.home_score !== null ? match.home_score : '-'}
                </div>
                <div className="text-gray-400 mx-1">-</div>
                <div className="text-2xl font-bold text-green-400 mx-1">
                  {match.away_score !== null ? match.away_score : '-'}
                </div>
              </div>
              
              {/* Equipo Visitante */}
              <div className="flex flex-col items-center flex-1">
                {awayTeam?.logo_url ? (
                  <img 
                    src={awayTeam.logo_url} 
                    alt={awayTeam.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-red-500/30 mb-2"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border-2 border-red-500/30 mb-2">
                    <span className="text-white font-bold text-xl">
                      {awayTeam?.name?.charAt(0) || 'T'}
                    </span>
                  </div>
                )}
                <h4 className="text-sm font-bold text-white text-center max-w-[100px] truncate">
                  {awayTeam?.name || 'Visitante'}
                </h4>
              </div>
            </div>
            
            {/* Estado del partido */}
            <div className={`text-center px-3 py-1.5 rounded-full text-sm font-bold mb-3 ${
              match.status === 'completed' ? 'bg-green-900/50 text-green-300' :
              match.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300 animate-pulse' :
              'bg-blue-900/50 text-blue-300'
            }`}>
              {match.status === 'completed' ? 'Finalizado' : 
               match.status === 'in_progress' ? 'En juego' : 
               'Pendiente'}
            </div>
            
            {/* Fecha y lugar en dos columnas */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {match.scheduled_at && (
                <div className="flex items-center bg-gray-800/30 p-2 rounded-lg">
                  <CalendarIcon className="h-4 w-4 mr-2 text-blue-400 flex-shrink-0" />
                  <div>
                    <div className="text-gray-300">{getNormalizedCubanDateTime(match.scheduled_at).date}</div>
                    <div className="text-gray-400">{getNormalizedCubanTime(match.scheduled_at)}</div>
                  </div>
                </div>
              )}
              {match.venue && (
                <div className="flex items-center bg-gray-800/30 p-2 rounded-lg">
                  <Users className="h-4 w-4 mr-2 text-green-400 flex-shrink-0" />
                  <div className="text-gray-300 truncate">{match.venue}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Tabs de equipos para móviles */}
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`flex-1 py-3 text-center font-medium text-sm ${
                activeTab === 'home' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400'
              }`}
              onClick={() => setActiveTab('home')}
            >
              {homeTeam?.name || 'Local'}
            </button>
            <button
              className={`flex-1 py-3 text-center font-medium text-sm ${
                activeTab === 'away' 
                  ? 'text-red-400 border-b-2 border-red-400' 
                  : 'text-gray-400'
              }`}
              onClick={() => setActiveTab('away')}
            >
              {awayTeam?.name || 'Visitante'}
            </button>
          </div>
          
          {/* Lista de jugadores del equipo activo */}
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50 shadow-lg">
            <div className="flex items-center mb-3 pb-2 border-b border-gray-700/30">
              {currentTeam?.logo_url ? (
                <img 
                  src={currentTeam.logo_url} 
                  alt={currentTeam.name} 
                  className="w-8 h-8 rounded-full object-cover mr-2"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">
                    {currentTeam?.name?.charAt(0) || 'T'}
                  </span>
                </div>
              )}
              <h4 className="text-lg font-bold text-white">
                {currentTeam?.name || (activeTab === 'home' ? 'Equipo Local' : 'Equipo Visitante')}
              </h4>
              <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                activeTab === 'home' 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {activeTab === 'home' ? 'Local' : 'Visitante'}
              </span>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-gray-400 font-medium text-sm uppercase tracking-wide">Jugadores</h5>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="flex items-center py-2 px-3 rounded-lg bg-gray-700/30 animate-pulse">
                      <div className="w-6 h-6 rounded-full bg-gray-700 mr-2 flex-shrink-0"></div>
                      <div className="h-3 bg-gray-700 rounded flex-1"></div>
                    </div>
                  ))}
                </div>
              ) : currentPlayers.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {currentPlayers.map((player, idx) => (
                    <div key={player.id || idx} className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
                        player.is_captain ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gray-700'
                      }`}>
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-white text-sm font-medium truncate">
                        {player.name || `Jugador ${idx + 1}`}
                      </span>
                      {player.is_captain && (
                        <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full whitespace-nowrap">
                          Cap
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4 italic">
                  No hay jugadores registrados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Versión desktop (oculta en móviles) */}
      <div className="hidden md:flex bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex-col shadow-2xl">
        {/* Contenido con scroll completo para desktop */}
        <div className="overflow-y-auto flex-grow p-6">
          {/* Header con botón de cierre */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              Detalles del Partido
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Información principal del partido */}
          <div className="bg-gray-700/30 rounded-2xl p-6 mb-6 border border-gray-600/50 shadow-lg">
            <div className="flex flex-col items-center">
              {/* Equipos */}
              <div className="flex flex-col md:flex-row items-center justify-between w-full gap-8 mb-6">
                {/* Equipo Local */}
                <div className="flex flex-col items-center flex-1">
                  <div className="relative mb-4">
                    {homeTeam?.logo_url ? (
                      <img 
                        src={homeTeam.logo_url} 
                        alt={homeTeam.name} 
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-500/30 shadow-xl"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-blue-500/30 shadow-xl">
                        <span className="text-white font-bold text-3xl">
                          {homeTeam?.name?.charAt(0) || 'T'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Local
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-white text-center max-w-[200px] truncate">
                    {homeTeam?.name || 'Equipo Local'}
                  </h4>
                </div>
                
                {/* VS y marcador */}
                <div className="flex flex-col items-center mx-4">
                  <div className="text-3xl font-bold text-gray-300 bg-gray-800/50 px-8 py-4 rounded-2xl mb-3 border-2 border-gray-600">
                    VS
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-4xl font-bold text-green-400 bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
                      {match.home_score !== null ? match.home_score : '-'}
                    </div>
                    <div className="text-2xl font-bold text-gray-400">-</div>
                    <div className="text-4xl font-bold text-green-400 bg-gray-800/50 px-6 py-3 rounded-xl border border-gray-700">
                      {match.away_score !== null ? match.away_score : '-'}
                    </div>
                  </div>
                </div>
                
                {/* Equipo Visitante */}
                <div className="flex flex-col items-center flex-1">
                  <div className="relative mb-4">
                    {awayTeam?.logo_url ? (
                      <img 
                        src={awayTeam.logo_url} 
                        alt={awayTeam.name} 
                        className="w-24 h-24 rounded-full object-cover border-4 border-red-500/30 shadow-xl"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center border-4 border-red-500/30 shadow-xl">
                        <span className="text-white font-bold text-3xl">
                          {awayTeam?.name?.charAt(0) || 'T'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Visitante
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-white text-center max-w-[200px] truncate">
                    {awayTeam?.name || 'Equipo Visitante'}
                  </h4>
                </div>
              </div>
              
              {/* Estado del partido */}
              <div className={`px-6 py-3 rounded-full text-lg font-bold mb-4 ${
                match.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                match.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300 animate-pulse' :
                'bg-blue-900/50 text-blue-300'
              }`}>
                {match.status === 'completed' ? 'Finalizado' : 
                 match.status === 'in_progress' ? 'En juego' : 
                 'Pendiente'}
              </div>
              
              {/* Fecha y lugar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4 pt-4 border-t border-gray-700/50">
                {match.scheduled_at && (
                  <div className="flex items-center justify-center text-gray-300 bg-gray-800/30 p-3 rounded-xl">
                    <CalendarIcon className="h-5 w-5 mr-3 text-blue-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{getNormalizedCubanDateTime(match.scheduled_at).date}</div>
                      <div className="text-sm text-gray-400">{getNormalizedCubanTime(match.scheduled_at)}</div>
                    </div>
                  </div>
                )}
                {match.venue && (
                  <div className="flex items-center justify-center text-gray-300 bg-gray-800/30 p-3 rounded-xl">
                    <Users className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Lugar</div>
                      <div className="text-sm text-gray-400 truncate max-w-[200px]">{match.venue}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Información de los equipos en dos columnas para desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equipo Local */}
            <div className="bg-gray-800/40 rounded-2xl p-5 border border-gray-700/50 shadow-lg">
              <div className="flex items-center mb-4 pb-3 border-b border-gray-700/30">
                {homeTeam?.logo_url ? (
                  <img 
                    src={homeTeam.logo_url} 
                    alt={homeTeam.name} 
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mr-3">
                    <span className="text-white font-bold">
                      {homeTeam?.name?.charAt(0) || 'T'}
                    </span>
                  </div>
                )}
                <h4 className="text-xl font-bold text-white">
                  {homeTeam?.name || 'Equipo Local'}
                </h4>
                <span className="ml-3 px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full">
                  Local
                </span>
              </div>
              
              <div className="space-y-3">
                <h5 className="text-gray-400 font-medium text-sm uppercase tracking-wide">Jugadores</h5>
                {loadingPlayers.home ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="flex items-center py-2 px-3 rounded-lg bg-gray-700/30 animate-pulse">
                        <div className="w-6 h-6 rounded-full bg-gray-700 mr-2 flex-shrink-0"></div>
                        <div className="h-3 bg-gray-700 rounded flex-1"></div>
                      </div>
                    ))}
                  </div>
                ) : homeTeamPlayers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {homeTeamPlayers.map((player, idx) => (
                      <div key={player.id || idx} className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
                          player.is_captain ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gray-700'
                        }`}>
                          <User className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-white text-sm font-medium truncate">
                          {player.name || `Jugador ${idx + 1}`}
                        </span>
                        {player.is_captain && (
                          <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full whitespace-nowrap">
                            Cap
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4 italic">
                    No hay jugadores registrados
                  </div>
                )}
              </div>
            </div>
            
            {/* Equipo Visitante */}
            <div className="bg-gray-800/40 rounded-2xl p-5 border border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/30">
                <div className="flex items-center">
                  {awayTeam?.logo_url ? (
                    <img 
                      src={awayTeam.logo_url} 
                      alt={awayTeam.name} 
                      className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mr-3">
                      <span className="text-white font-bold">
                        {awayTeam?.name?.charAt(0) || 'T'}
                      </span>
                    </div>
                  )}
                  <h4 className="text-xl font-bold text-white">
                    {awayTeam?.name || 'Equipo Visitante'}
                  </h4>
                </div>
                <span className="px-2.5 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded-full">
                  Visitante
                </span>
              </div>
              
              <div className="space-y-3">
                <h5 className="text-gray-400 font-medium text-sm uppercase tracking-wide">Jugadores</h5>
                {loadingPlayers.away ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, idx) => (
                      <div key={idx} className="flex items-center py-2 px-3 rounded-lg bg-gray-700/30 animate-pulse">
                        <div className="w-6 h-6 rounded-full bg-gray-700 mr-2 flex-shrink-0"></div>
                        <div className="h-3 bg-gray-700 rounded flex-1"></div>
                      </div>
                    ))}
                  </div>
                ) : awayTeamPlayers.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {awayTeamPlayers.map((player, idx) => (
                      <div key={player.id || idx} className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${
                          player.is_captain ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : 'bg-gray-700'
                        }`}>
                          <User className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-white text-sm font-medium truncate">
                          {player.name || `Jugador ${idx + 1}`}
                        </span>
                        {player.is_captain && (
                          <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full whitespace-nowrap">
                            Cap
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4 italic">
                    No hay jugadores registrados
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}