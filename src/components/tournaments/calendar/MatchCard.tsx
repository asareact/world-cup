'use client'

import { useState } from 'react'
import { Match, Team } from '@/lib/database'
import { Clock } from 'lucide-react'
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
  const normalizedTime = match.scheduled_at ? getNormalizedCubanTime(match.scheduled_at) : 'Por definir'

  return (
    <div 
      className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 border border-gray-700/50 rounded-2xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/30 cursor-pointer"
      onClick={() => onViewDetails(match)}
    >
      {/* Header with time and status - Centered for both mobile and desktop */}
      <div className="flex items-center justify-center mb-4">
        <div className="flex items-center bg-gray-700/60 px-3 py-1.5 rounded-lg">
          <Clock className="h-4 w-4 text-green-400 mr-2" />
          <span className="text-white font-medium text-sm">{normalizedTime}</span>
        </div>
        <div className="ml-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            match.status === 'completed' ? 'bg-green-900/50 text-green-300' :
            match.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300' :
            'bg-blue-900/50 text-blue-300'
          }`}>
            {match.status === 'completed' ? 'Finalizado' : 
             match.status === 'in_progress' ? 'En juego' : 
             'Pendiente'}
          </span>
        </div>
      </div>

      {/* Match Teams - Teams on sides with score perfectly centered */}
      <div className="flex items-center justify-between">
        {/* Home Team - Left side */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {homeTeam?.logo_url ? (
            <img 
              src={homeTeam.logo_url} 
              alt={homeTeam.name} 
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-blue-500/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 border-2 border-blue-500/30">
              <span className="text-white font-bold text-sm">
                {homeTeam?.name ? homeTeam.name.substring(0, 3).toUpperCase() : 'TBD'}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-medium text-sm sm:hidden truncate">
              {homeTeam?.name ? homeTeam.name.substring(0, 3).toUpperCase() : 'TBD'}
            </p>
            <p className="text-white font-medium hidden sm:block text-base truncate">
              {homeTeam?.name || 'TBD'}
            </p>
          </div>
        </div>
        
        {/* Score in center - Perfectly centered with fixed width */}
        <div className="mx-4 flex-shrink-0">
          {match.status === 'completed' ? (
            <div className="text-2xl sm:text-3xl font-bold text-green-400 min-w-[80px] text-center">
              {match.home_score} - {match.away_score}
            </div>
          ) : (
            <span className="text-gray-400 text-base sm:text-lg font-medium min-w-[80px] text-center block">VS</span>
          )}
        </div>
        
        {/* Away Team - Right side */}
        <div className="flex items-center space-x-3 flex-1 min-w-0 justify-end">
          <div className="min-w-0 text-right">
            <p className="text-white font-medium text-sm sm:hidden truncate">
              {awayTeam?.name ? awayTeam.name.substring(0, 3).toUpperCase() : 'TBD'}
            </p>
            <p className="text-white font-medium hidden sm:block text-base truncate">
              {awayTeam?.name || 'TBD'}
            </p>
          </div>
          {awayTeam?.logo_url ? (
            <img 
              src={awayTeam.logo_url} 
              alt={awayTeam.name} 
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-red-500/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 border-2 border-red-500/30">
              <span className="text-white font-bold text-sm">
                {awayTeam?.name ? awayTeam.name.substring(0, 3).toUpperCase() : 'TBD'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* "Ver detalles" button is now handled by the whole card being clickable */}
      <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-center">
        <span className="text-blue-400 text-xs font-medium">Ver detalles →</span>
      </div>
    </div>
  )
}