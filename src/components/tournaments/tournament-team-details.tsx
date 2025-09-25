'use client'

import { X, Shield, Target, Award, Calendar, User, Users, Trophy, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: string
  name: string
  position: string | null
  jersey_number: number | null
  photo_url?: string | null
  goals?: number
  assists?: number
  matches_played?: number
}

interface Team {
  id: string
  name: string
  logo_url?: string | null
  wins?: number
  draws?: number
  losses?: number
  goals_for?: number
  goals_against?: number
  points?: number
  position?: number
}

export function TournamentTeamDetails({ 
  team,
  players,
  isOpen,
  onClose
}: { 
  team: Team
  players: Player[]
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) return null

  // Calculate stats for additional info
  const totalGames = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);
  const winRate = totalGames > 0 
    ? Math.round(((team.wins || 0) / totalGames) * 100)
    : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-800 rounded-3xl w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-gray-900/90 to-gray-950/90 backdrop-blur-xl border-b border-gray-800 p-5 md:p-6 flex items-center justify-between z-10">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-700 shadow-lg">
                {team.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={team.logo_url} 
                    alt={team.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                    <Shield className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{team.name}</h2>
                {team.position !== undefined && team.position > 0 && (
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center bg-gray-800/60 px-2 py-1 rounded-full">
                      <Trophy className="h-3 w-3 text-yellow-400 mr-1" />
                      <span className="text-xs text-gray-300">
                        {team.position}° en la tabla
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/60 rounded-full transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Team Stats - Enhanced */}
          <div className="p-5 md:p-6 bg-gradient-to-r from-gray-900/50 to-gray-900/30 border-b border-gray-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-gradient-to-br from-green-900/40 to-green-800/30 rounded-xl p-3 text-center border border-green-800/30">
                <div className="text-xl md:text-2xl font-bold text-green-400">{team.points || 0}</div>
                <div className="text-xs md:text-sm text-green-200/80">Pts</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 rounded-xl p-3 text-center border border-blue-800/30">
                <div className="text-xl md:text-2xl font-bold text-blue-400">
                  {team.wins || 0}-{team.draws || 0}-{team.losses || 0}
                </div>
                <div className="text-xs md:text-sm text-blue-200/80">G-E-P</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/30 rounded-xl p-3 text-center border border-purple-800/30">
                <div className="text-xl md:text-2xl font-bold text-purple-400">
                  {team.goals_for || 0}:{team.goals_against || 0}
                </div>
                <div className="text-xs md:text-sm text-purple-200/80">GF:GC</div>
              </div>
              <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/30 rounded-xl p-3 text-center border border-amber-800/30">
                <div className="text-xl md:text-2xl font-bold text-amber-400">{players.length}</div>
                <div className="text-xs md:text-sm text-amber-200/80">Jug</div>
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-800/40 rounded-lg p-3 text-center border border-gray-700">
                <div className="text-lg font-semibold text-white">{winRate}%</div>
                <div className="text-xs text-gray-400">Efectividad</div>
              </div>
              <div className="bg-gray-800/40 rounded-lg p-3 text-center border border-gray-700">
                <div className="text-lg font-semibold text-white">
                  {team.goals_for !== undefined && team.goals_against !== undefined
                    ? (team.goals_for - team.goals_against)
                    : 0}
                </div>
                <div className="text-xs text-gray-400">Diferencia de goles</div>
              </div>
            </div>
          </div>
          
          {/* Players List */}
          <div className="p-5 md:p-6 overflow-y-auto max-h-[50vh] custom-scrollbar">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-400" />
                Jugadores
              </h3>
              <span className="text-sm text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                {players.length} {players.length === 1 ? 'jugador' : 'jugadores'}
              </span>
            </div>
            
            <div className="space-y-3">
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <p className="text-gray-400">No hay jugadores registrados</p>
                  <p className="text-gray-500 text-sm mt-1">El equipo aún no ha completado su plantilla</p>
                </div>
              ) : (
                players.map((player) => (
                  <motion.div 
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/40 to-gray-800/20 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600">
                          {player.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={player.photo_url} 
                              alt={player.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-white">
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {player.jersey_number !== null && player.jersey_number !== undefined && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-gray-900">
                            {player.jersey_number}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-white">{player.name}</p>
                        <div className="flex items-center space-x-3 text-xs text-gray-400">
                          {player.position && (
                            <span className="flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              {player.position}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Player Stats */}
                    <div className="flex items-center space-x-2 md:space-x-3">
                      {player.goals !== undefined && (
                        <div className="flex items-center space-x-1 bg-gradient-to-br from-orange-900/40 to-orange-800/30 px-2 py-1 rounded-full border border-orange-800/30">
                          <Target className="h-3 w-3 text-orange-400" />
                          <span className="text-xs font-medium text-orange-300">{player.goals}</span>
                        </div>
                      )}
                      {player.assists !== undefined && (
                        <div className="flex items-center space-x-1 bg-gradient-to-br from-blue-900/40 to-blue-800/30 px-2 py-1 rounded-full border border-blue-800/30">
                          <Award className="h-3 w-3 text-blue-400" />
                          <span className="text-xs font-medium text-blue-300">{player.assists}</span>
                        </div>
                      )}
                      {player.matches_played !== undefined && (
                        <div className="flex items-center space-x-1 bg-gradient-to-br from-purple-900/40 to-purple-800/30 px-2 py-1 rounded-full border border-purple-800/30">
                          <Calendar className="h-3 w-3 text-purple-400" />
                          <span className="text-xs font-medium text-purple-300">{player.matches_played}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}