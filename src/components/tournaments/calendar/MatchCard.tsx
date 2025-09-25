'use client'

import { useState } from 'react'
import { Match, Team } from '@/lib/database'
import { Clock, Users } from 'lucide-react'
import { getNormalizedCubanTime } from '@/lib/utils/time-utils'

interface MatchCardProps {
  match: Match
  teams: Pick<Team, "id" | "name" | "logo_url">[] | undefined | null
  onViewDetails: (match: Match) => void
}

export function MatchCard({ match, teams, onViewDetails }: MatchCardProps) {
  // Get team info
  const homeTeam = Array.isArray(teams) ? teams.find(team => team.id === match.home_team_id) : null
  const awayTeam = Array.isArray(teams) ? teams.find(team => team.id === match.away_team_id) : null

  // Get match time
  const originalTime = match.scheduled_at ? match.scheduled_at.split('T')[1].substring(0, 5) : 'Por definir'
  const normalizedTime = match.scheduled_at ? getNormalizedCubanTime(match.scheduled_at) : 'Por definir'

  return (
    <div 
      className="p-4 rounded-xl border border-gray-600 bg-gradient-to-r from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 transition-all duration-200 shadow-md hover:shadow-lg"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex items-center justify-between sm:justify-start mb-3 sm:mb-0">
          <div className="flex items-center bg-gray-800/60 px-3 py-1.5 rounded-lg">
            <Clock className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
            <span className="font-semibold text-white">{normalizedTime}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 mx-4">
          <div className="flex items-center">
            <div className="flex items-center flex-1 min-w-0">
              {homeTeam?.logo_url ? (
                <img 
                  src={homeTeam.logo_url} 
                  alt={homeTeam.name} 
                  className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {homeTeam?.name?.charAt(0) || 'T'}
                  </span>
                </div>
              )}
              <span className="text-white font-medium truncate flex-1 min-w-0">
                {homeTeam?.name || 'TBD'}
              </span>
            </div>
            
            <span className="text-green-400 font-bold mx-3 flex-shrink-0 text-lg">vs</span>
            
            <div className="flex items-center flex-1 min-w-0 justify-end">
              <span className="text-white font-medium truncate flex-1 min-w-0 text-right">
                {awayTeam?.name || 'TBD'}
              </span>
              {awayTeam?.logo_url ? (
                <img 
                  src={awayTeam.logo_url} 
                  alt={awayTeam.name} 
                  className="w-8 h-8 rounded-full object-cover ml-2 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center ml-2 flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {awayTeam?.name?.charAt(0) || 'T'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="min-w-[80px] text-center">
          {match.status === 'completed' ? (
            <div className="text-xl font-bold text-green-400 bg-green-900/30 px-3 py-1 rounded-lg">
              {match.home_score} - {match.away_score}
            </div>
          ) : (
            <div className="text-sm font-medium min-w-[80px]">
              {match.status === 'in_progress' ? (
                <span className="text-yellow-400 bg-yellow-900/30 px-2.5 py-1 rounded-full">En juego</span>
              ) : (
                <span className="text-blue-400 bg-blue-900/30 px-2.5 py-1 rounded-full">Pendiente</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={() => onViewDetails(match)}
        className="mt-3 w-full py-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium underline decoration-transparent hover:decoration-blue-400"
      >
        Ver detalles
      </button>
    </div>
  )
}