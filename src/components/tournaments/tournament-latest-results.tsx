'use client'

import { Target, Clock } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

interface Match {
  id: string
  home_team: { name: string; logo_url?: string | null } | null
  away_team: { name: string; logo_url?: string | null } | null
  home_score: number | null
  away_score: number | null
  scheduled_at: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

export function TournamentLatestResults({ 
  matches,
  title = "Últimos Resultados",
  showAllLink = true
}: { 
  matches: Match[]
  title?: string
  showAllLink?: boolean
}) {
  // State to track which images failed to load
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  
  // Helper function to create 3-letter abbreviation ignoring spaces and special characters
  const getAbbreviation = (name: string | undefined) => {
    if (!name) return '???';
    // Remove spaces and special characters, then take first 3 characters and uppercase
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
    return cleanName.substring(0, 3).toUpperCase();
  };

  // Handler for when an image fails to load
  const handleImageError = (matchId: string, team: 'home' | 'away') => {
    setFailedImages(prev => ({
      ...prev,
      [`${matchId}-${team}`]: true
    }));
  };

  if (matches.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <p className="text-gray-400 text-center py-4 text-sm">Aún no hay resultados disponibles</p>
        {showAllLink && (
          <Link 
            href="#matches" 
            className="block text-center text-sm text-green-400 hover:text-green-300 mt-2"
          >
            Ver todos los partidos
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {showAllLink && (
          <Link 
            href="#matches" 
            className="text-sm text-green-400 hover:text-green-300"
          >
            Ver todos
          </Link>
        )}
      </div>
      
      <div className="space-y-3">
        {matches.map((match) => (
          <div key={match.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-all duration-200">
            <div className="flex-1 min-w-0">
              {/* Teams with logos and abbreviations */}
              <div className="flex items-center justify-between">
                {/* Home Team */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600">
                    {match.home_team?.logo_url && !failedImages[`${match.id}-home`] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={match.home_team.logo_url} 
                        alt={match.home_team.name || 'Equipo local'} 
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(match.id, 'home')}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {match.home_team?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white mt-1 tracking-wider">
                    {getAbbreviation(match.home_team?.name)}
                  </span>
                </div>
                
                {/* Score */}
                <div className="flex flex-col items-center">
                  <span className="text-gray-500 text-xs">VS</span>
                  {match.status === 'completed' && match.home_score !== null && match.away_score !== null ? (
                    <span className="text-lg font-bold text-white mt-1">
                      {match.home_score} - {match.away_score}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs mt-1">-</span>
                  )}
                </div>
                
                {/* Away Team */}
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600">
                    {match.away_team?.logo_url && !failedImages[`${match.id}-away`] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={match.away_team.logo_url} 
                        alt={match.away_team.name || 'Equipo visitante'} 
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(match.id, 'away')}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                        {match.away_team?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white mt-1 tracking-wider">
                    {getAbbreviation(match.away_team?.name)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {showAllLink && (
        <Link 
          href="#matches" 
          className="block text-center text-sm text-green-400 hover:text-green-300 mt-3 pt-3 border-t border-gray-800"
        >
          Ver todos los resultados
        </Link>
      )}
    </div>
  )
}