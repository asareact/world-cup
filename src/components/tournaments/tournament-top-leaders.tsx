'use client'

import { Users, Target, Award, Shield, Calendar } from 'lucide-react'

interface TopScorer {
  player_id: string
  player_name: string
  team_name: string
  team_id: string
  goals: number
  player_photo_url?: string | null
}

interface TopAssist {
  player_id: string
  player_name: string
  team_name: string
  team_id: string
  assists: number
  player_photo_url?: string | null
}

interface IdealPlayer {
  player_id: string
  player_name: string
  team_name: string
  team_id: string
  position: string
  rating: number
  player_photo_url?: string | null
}

export function TournamentTopLeaders({ 
  topScorers = [],
  topAssists = [],
  ideal5 = []
}: { 
  topScorers?: TopScorer[]
  topAssists?: TopAssist[]
  ideal5?: IdealPlayer[]
}) {
  return (
    <div className="space-y-8">
      {/* Top Scorers Section */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Target className="h-5 w-5 text-green-400" />
          <h2 className="text-xl font-bold text-white">Máximos Goleadores</h2>
        </div>
        
        {topScorers.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aún no hay goles registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Pos</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Jugador</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Equipo</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Goles</th>
                </tr>
              </thead>
              <tbody>
                {topScorers.map((scorer, index) => (
                  <tr key={scorer.player_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="text-white font-medium">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                          {scorer.player_photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={scorer.player_photo_url} 
                              alt={scorer.player_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-white">
                              {scorer.player_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-white font-medium">{scorer.player_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300">{scorer.team_name}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
                        {scorer.goals}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Top Assists Section */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Award className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Mayores Asistidores</h2>
        </div>
        
        {topAssists.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aún no hay asistencias registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Pos</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Jugador</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Equipo</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Asistencias</th>
                </tr>
              </thead>
              <tbody>
                {topAssists.map((assist, index) => (
                  <tr key={assist.player_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="text-white font-medium">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                          {assist.player_photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={assist.player_photo_url} 
                              alt={assist.player_name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-medium text-white">
                              {assist.player_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-white font-medium">{assist.player_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300">{assist.team_name}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
                        {assist.assists}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Ideal 5 Section */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Shield className="h-5 w-5 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Ideal 5 del Torneo</h2>
        </div>
        
        {ideal5.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aún no se ha seleccionado el Ideal 5</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ideal5.map((player, index) => (
              <div key={player.player_id} className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="relative inline-block">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden mx-auto mb-3">
                    {player.player_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={player.player_photo_url} 
                        alt={player.player_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-medium text-white">
                        {player.player_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900">
                    {index + 1}
                  </div>
                </div>
                <h3 className="font-medium text-white mb-1">{player.player_name}</h3>
                <p className="text-xs text-gray-400 mb-2">{player.position}</p>
                <p className="text-xs text-gray-300">{player.team_name}</p>
                <div className="mt-2 flex items-center justify-center">
                  <Calendar className="h-3 w-3 text-gray-500 mr-1" />
                  <span className="text-xs text-gray-400">{player.rating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}