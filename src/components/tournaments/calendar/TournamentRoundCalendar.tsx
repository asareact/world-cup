'use client'

import { useState, useEffect, useMemo } from 'react'
import { Match, Team } from '@/lib/database'
import { Calendar as CalendarIcon, Edit3, Save, X } from 'lucide-react'
import { RoundSection } from './RoundSection'
import { MatchDetailsModal } from './MatchDetailsModal'

interface TournamentRoundCalendarProps {
  tournamentId: string
  teams: Pick<Team, "id" | "name" | "logo_url">[] | undefined | null
  initialMatches: Match[] | undefined | null
  isAdmin: boolean
  startDate?: Date
  leagueTimeZone?: string
  onScheduleGenerated?: (matches: Match[]) => void
}

// Spanish days mapping
const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
}

// Group matches by round
const groupMatchesByRound = (matches: Match[] | undefined | null) => {
  if (!matches || !Array.isArray(matches) || matches.length === 0) {
    return []
  }

  // Group by round_name
  const grouped: Record<string, Match[]> = {}
  matches.forEach(match => {
    const roundName = match.round_name || 'Sin jornada'
    if (!grouped[roundName]) {
      grouped[roundName] = []
    }
    grouped[roundName].push(match)
  })

  // Sort rounds by name so they appear in order (Jornada 1, Jornada 2, etc.)
  return Object.entries(grouped).sort(([a], [b]) => {
    const roundA = parseInt(a.replace('Jornada ', '').replace('Fecha ', ''))
    const roundB = parseInt(b.replace('Jornada ', '').replace('Fecha ', ''))
    return (roundA || 0) - (roundB || 0)
  })
}

// Function to determine which round should be expanded by default
const getDefaultExpandedRound = (matches: Match[] | undefined | null) => {
  if (!matches || !Array.isArray(matches) || matches.length === 0) {
    return 'Jornada 1' // Default to first round if no matches exist
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Find matches happening today
  const todayMatches = matches.filter(match => {
    if (!match.scheduled_at) return false
    const matchDate = new Date(match.scheduled_at)
    const matchDateOnly = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate())
    return matchDateOnly.getTime() === today.getTime()
  })

  if (todayMatches.length > 0) {
    // If there are matches today, show the round for today's matches
    return todayMatches[0].round_name || null
  }

  // Find upcoming matches (sorted by date)
  const upcomingMatches = matches
    .filter(match => match.scheduled_at && new Date(match.scheduled_at) >= now)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())

  if (upcomingMatches.length > 0) {
    // If there are upcoming matches, show the next one
    return upcomingMatches[0].round_name || null
  }

  // If no upcoming matches, show the last round (most recent or final)
  const lastMatches = matches
    .filter(match => match.scheduled_at && new Date(match.scheduled_at) < now)
    .sort((a, b) => new Date(b.scheduled_at!).getTime() - new Date(a.scheduled_at!).getTime())
  
  if (lastMatches.length > 0) {
    return lastMatches[0].round_name || null
  }

  // Fallback to first round
  return matches[0].round_name || 'Jornada 1'
}

export function TournamentRoundCalendar({ 
  tournamentId, 
  teams, 
  initialMatches, 
  isAdmin,
  startDate,
  leagueTimeZone,
  onScheduleGenerated
}: TournamentRoundCalendarProps) {
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [localMatches, setLocalMatches] = useState<Match[] | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [showMatchDetails, setShowMatchDetails] = useState(false)
  
  // Use local matches if available, otherwise use initial matches
  const currentMatches = localMatches || initialMatches;
  
  const rounds = useMemo(() => {
    return groupMatchesByRound(currentMatches)
  }, [currentMatches])

  const defaultExpandedRound = useMemo(() => {
    return getDefaultExpandedRound(currentMatches)
  }, [currentMatches])

  // Initialize expanded rounds
  useEffect(() => {
    if (rounds.length > 0) {
      const initialExpanded: Record<string, boolean> = {}
      rounds.forEach(([roundName]) => {
        initialExpanded[roundName] = roundName === defaultExpandedRound
      })
      setExpandedRounds(initialExpanded)
    }
    setIsLoading(false)
  }, [rounds, defaultExpandedRound])

  const toggleRound = (roundName: string) => {
    setExpandedRounds(prev => ({
      ...prev,
      [roundName]: !prev[roundName]
    }))
  }

  // Function to save schedule to database
  const saveSchedule = async () => {
    if (!isEditing) return
    
    setIsLoading(true)
    
    try {
      // Prepare the schedule data for API
      const scheduleData = {
        teams: teams || [],
        startDate,
        leagueTimeZone: leagueTimeZone || 'America/Havana'
      };
      
      const response = await fetch(`/api/tournaments/${tournamentId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule');
      }
      
      const result = await response.json();
      console.log('Schedule saved successfully:', result);
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  // Function to handle viewing match details
  const handleViewMatchDetails = (match: Match) => {
    setSelectedMatch(match);
    setShowMatchDetails(true);
  }

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Cargando calendario...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/40 border border-gray-800/50 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl">
            <CalendarIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Calendario de Partidos
          </h2>
        </div>
        
        {isAdmin && (
          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={saveSchedule}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span className="text-sm">Guardar</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all"
                >
                  <X className="h-4 w-4 mr-2" />
                  <span className="text-sm">Cancelar</span>
                </button>
              </>
            ) : (
              <button
                onClick={async () => {
                  // Generate schedule automatically when clicking Generate
                  if (teams && teams.length > 0) {
                    // Prepare the schedule data for API to generate the schedule
                    const scheduleData = {
                      teams: teams || [],
                      startDate,
                      leagueTimeZone: leagueTimeZone || 'America/Havana'
                    };
                    
                    setIsLoading(true);
                    try {
                      const response = await fetch(`/api/tournaments/${tournamentId}/schedule`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(scheduleData)
                      });
                      
                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to generate schedule');
                      }
                      
                      const result = await response.json();
                      console.log('Schedule generated successfully:', result);
                      
                      // Since we can't directly update initialMatches prop, we need to reload data
                      // This will be handled by the parent component updating its state
                      // For now, we'll just show a success message
                      
                      // Fetch updated matches after generation
                      const matchesResponse = await fetch(`/api/tournaments/${tournamentId}/matches`);
                      if (matchesResponse.ok) {
                        const updatedMatches = await matchesResponse.json();
                        setLocalMatches(updatedMatches);
                        
                        // Call the callback if provided
                        if (onScheduleGenerated) {
                          onScheduleGenerated(updatedMatches);
                        }
                        
                        console.log('Calendario actualizado con éxito');
                      } else {
                        // If we can't fetch updated matches, reload the page
                        window.location.reload();
                      }
                    } catch (error: any) {
                      console.error('Error generating schedule:', error);
                      alert('Error generando el calendario: ' + error.message);
                    } finally {
                      setIsLoading(false);
                    }
                  } else {
                    alert('No hay equipos registrados para generar el calendario');
                  }
                }}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                <span className="text-sm">Generar</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      {rounds.length === 0 ? (
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <CalendarIcon className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No hay partidos programados</h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            {isAdmin 
              ? "Haz clic en 'Generar' para crear el calendario de partidos" 
              : "El calendario de partidos estará disponible próximamente"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rounds.map(([roundName, matches]) => (
            <RoundSection
              key={roundName}
              roundName={roundName}
              matches={matches}
              teams={teams}
              isExpanded={expandedRounds[roundName] || false}
              onToggle={toggleRound}
              onViewMatchDetails={handleViewMatchDetails}
              daysOfWeek={daysOfWeek}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
      
      {/* Info box for non-admin users */}
      {!isAdmin && rounds.length > 0 && (
        <div className="mt-5 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
          <p className="text-blue-300 text-xs">
            <strong>Nota:</strong> Esta vista es solo lectura. 
            Los horarios y fechas pueden ser modificados por los administradores.
          </p>
        </div>
      )}
      
      {/* Modal de detalles del partido */}
      <MatchDetailsModal
        match={selectedMatch}
        isOpen={showMatchDetails}
        onClose={() => setShowMatchDetails(false)}
        teams={teams}
      />
    </div>
  )
}