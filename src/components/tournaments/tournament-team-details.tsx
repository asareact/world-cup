'use client'

import { X, Shield, Target, Award, Calendar } from 'lucide-react'
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-700">
                {team.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={team.logo_url} 
                    alt={team.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{team.name}</h2>
                {team.position && (
                  <p className="text-sm text-gray-400">
                    {team.position}° en la tabla
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Team Stats */}
          <div className="p-6 border-b border-gray-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{team.points || 0}</div>
                <div className="text-sm text-gray-400">Puntos</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {team.wins || 0}-{team.draws || 0}-{team.losses || 0}
                </div>
                <div className="text-sm text-gray-400">P/D/E</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {team.goals_for || 0}:{team.goals_against || 0}
                </div>
                <div className="text-sm text-gray-400">GF:GC</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white">{players.length}</div>
                <div className="text-sm text-gray-400">Jugadores</div>
              </div>
            </div>
          </div>
          
          {/* Players List */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Jugadores</h3>
            <div className="space-y-3">
              {players.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No hay jugadores registrados</p>
              ) : (
                players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                        {player.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={player.photo_url} 
                            alt={player.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-white">
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{player.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          {player.jersey_number && (
                            <span>#{player.jersey_number}</span>
                          )}
                          {player.position && (
                            <span>{player.position}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Player Stats */}
                    <div className="flex items-center space-x-3 text-sm">
                      {player.goals !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Target className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{player.goals}</span>
                        </div>
                      )}
                      {player.assists !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Award className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{player.assists}</span>
                        </div>
                      )}
                      {player.matches_played !== undefined && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{player.matches_played}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}