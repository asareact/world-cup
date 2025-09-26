// src/components/tournaments/tournament-stats-overview.tsx
'use client'

import { BarChart3, Target, Award, Square, Users } from 'lucide-react'
import { useTournamentStats } from '@/lib/hooks/use-tournament-stats'

interface TournamentStatsOverviewProps {
  tournamentId: string
}

export function TournamentStatsOverview({ tournamentId }: TournamentStatsOverviewProps) {
  const { stats, loading, error } = useTournamentStats(tournamentId)

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-4">
        <p className="text-red-400">Error al cargar estadísticas: {error || 'No disponibles'}</p>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Goles totales',
      value: stats.totalGoals,
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Asistencias',
      value: stats.totalAssists,
      icon: Award,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Tarjetas amarillas',
      value: stats.totalYellowCards,
      icon: Square,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Tarjetas rojas',
      value: stats.totalRedCards,
      icon: Square,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-green-400" />
          Estadísticas del Torneo
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div 
                key={index} 
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-green-500/30 transition-colors"
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="ml-3">
                    <p className="text-gray-400 text-sm">{stat.title}</p>
                    <p className="text-white font-bold text-lg">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Scorers - Ordered first */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center">
          <Target className="h-4 w-4 mr-2 text-green-400" />
          Goleadores
        </h3>
        {stats.topScorers.length > 0 ? (
          <div className="space-y-3">
            {stats.topScorers.slice(0, 5).map((scorer, index) => (
              <div key={scorer.player_id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                    {scorer.player_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={scorer.player_photo_url}
                        alt={scorer.player_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {scorer.player_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{scorer.player_name}</div>
                    <div className="text-gray-400 text-xs">{scorer.team_name}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-green-400 font-bold text-lg">{scorer.goals}</span>
                  <span className="text-gray-500 text-sm">g</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-2">No hay goles registrados</p>
        )}
      </div>

      {/* Top Assists - Ordered second */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center">
          <Award className="h-4 w-4 mr-2 text-blue-400" />
          Asistidores
        </h3>
        {stats.topAssists.length > 0 ? (
          <div className="space-y-3">
            {stats.topAssists.slice(0, 5).map((assist, index) => (
              <div key={assist.player_id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                    {assist.player_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={assist.player_photo_url}
                        alt={assist.player_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-white">
                        {assist.player_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{assist.player_name}</div>
                    <div className="text-gray-400 text-xs">{assist.team_name}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-blue-400 font-bold text-lg">{assist.assists}</span>
                  <span className="text-gray-500 text-sm">a</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-2">No hay asistencias registradas</p>
        )}
      </div>

      {/* Top Cards - Yellow - Ordered third */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center">
          <Square className="h-4 w-4 mr-2 text-yellow-400" />
          Tarjetas Amarillas
        </h3>
        {stats.topCards.length > 0 ? (
          <div className="space-y-3">
            {stats.topCards
              .filter(card => card.yellow_cards > 0)
              .sort((a, b) => b.yellow_cards - a.yellow_cards)
              .slice(0, 5)
              .map((card, index) => (
                <div key={card.player_id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                      {card.player_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.player_photo_url}
                          alt={card.player_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-white">
                          {card.player_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{card.player_name}</div>
                      <div className="text-gray-400 text-xs">{card.team_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400 font-bold text-lg">{card.yellow_cards}</span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-2">No hay tarjetas amarillas</p>
        )}
      </div>

      {/* Top Cards - Red - Ordered fourth */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center">
          <Square className="h-4 w-4 mr-2 text-red-400" />
          Tarjetas Rojas
        </h3>
        {stats.topCards.length > 0 ? (
          <div className="space-y-3">
            {stats.topCards
              .filter(card => card.red_cards > 0)
              .sort((a, b) => b.red_cards - a.red_cards)
              .slice(0, 5)
              .map((card, index) => (
                <div key={card.player_id} className="flex items-center justify-between p-2 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                      {card.player_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={card.player_photo_url}
                          alt={card.player_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-white">
                          {card.player_name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{card.player_name}</div>
                      <div className="text-gray-400 text-xs">{card.team_name}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-400 font-bold text-lg">{card.red_cards}</span>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm py-2">No hay tarjetas rojas</p>
        )}
      </div>
    </div>
  )
}