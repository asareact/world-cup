'use client'

import { PlayerCard } from '@/components/players/player-card'
import { db } from '@/lib/database'
import { ArrowLeft, Mail, Phone, Shield, Users } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Player {
  id: string
  name: string
  jersey_number: number | null
  position: string | null
  photo_url: string | null
  goals: number
  assists: number
  matches_played: number
  is_captain: boolean
}

interface Team {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  players: Player[]
  is_captain?: boolean
}

interface MatchResult {
  id: string
  scheduled_at: string
  opponent: string
  opponent_logo: string | null
  home_score: number
  away_score: number
  result: 'win' | 'loss' | 'draw'
  round_name: string | null
}

export default function TeamDetailsPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [team, setTeam] = useState<Team | null>(null)
  const [results, setResults] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get tournamentId from query params if available (for back navigation)
  const tournamentId = searchParams.get('tournament')
  const backUrl = tournamentId ? `/tournaments/${tournamentId}/public` : '/'

  useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Fetch team details with players
        const teamData = await db.getTeam(params.id)
        setTeam(teamData)
        
        // Fetch team results in tournaments
        // This would be implemented with proper database queries
        const mockResults: MatchResult[] = [
          {
            id: '1',
            scheduled_at: '2023-06-15T18:00:00Z',
            opponent: 'Equipo Rivales',
            opponent_logo: null,
            home_score: 3,
            away_score: 1,
            result: 'win',
            round_name: 'Jornada 1'
          },
          {
            id: '2',
            scheduled_at: '2023-06-22T20:00:00Z',
            opponent: 'Otro Equipo',
            opponent_logo: null,
            home_score: 2,
            away_score: 2,
            result: 'draw',
            round_name: 'Jornada 2'
          }
        ]
        setResults(mockResults)
        
      } catch (err) {
        console.error('Error fetching team data:', err)
        setError('Error al cargar los datos del equipo')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-3 text-white">Cargando equipo...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              {error || 'Equipo no encontrado'}
            </div>
            <button 
              onClick={() => router.back()} 
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => router.push(backUrl)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
        </div>

        <div className="space-y-8">
          {/* Team Header */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-700">
                  {team.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={team.logo_url} 
                      alt={team.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-teal-500 flex items-center justify-center">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{team.name}</h1>
                  {team.description && (
                    <p className="text-gray-400 mt-1">{team.description}</p>
                  )}
                  {team.is_captain && (
                    <div className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
                      <Shield className="h-3 w-3 mr-1" />
                      Capitán
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {team.contact_email && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{team.contact_email}</span>
                  </div>
                )}
                {team.contact_phone && (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{team.contact_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">5</div>
              <div className="text-sm text-gray-400">Jugadores</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">2</div>
              <div className="text-sm text-gray-400">Victorias</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">1</div>
              <div className="text-sm text-gray-400">Empates</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">7</div>
              <div className="text-sm text-gray-400">Goles</div>
            </div>
          </div>

          {/* Players Section */}
          <div id="players" className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Jugadores</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.players.map((player) => (
                <PlayerCard key={player.id} player={player} />
              ))}
            </div>
          </div>

          {/* Results Section */}
          <div id="results" className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Últimos Resultados</h2>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span>{result.round_name || 'Partido'}</span>
                      <span>{new Date(result.scheduled_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                          {team.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={team.logo_url} 
                              alt={team.name} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Users className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <span className="font-medium text-white">{team.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-white">
                          {result.home_score} - {result.away_score}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-white">{result.opponent}</span>
                        <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
                          {result.opponent_logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={result.opponent_logo} 
                              alt={result.opponent} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Users className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
                    result.result === 'win' ? 'bg-green-900/50 text-green-300' :
                    result.result === 'draw' ? 'bg-gray-700 text-gray-300' :
                    'bg-red-900/50 text-red-300'
                  }`}>
                    {result.result === 'win' ? 'Victoria' : 
                     result.result === 'draw' ? 'Empate' : 'Derrota'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}