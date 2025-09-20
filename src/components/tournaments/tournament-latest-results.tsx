'use client'

import { Calendar, Clock } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

interface Match {
  id: string
  home_team: { name: string } | null
  away_team: { name: string } | null
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
          <div key={match.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-white truncate">
                  {match.home_team?.name || 'TBD'}
                </span>
                <span className="mx-2 text-gray-500">vs</span>
                <span className="font-medium text-white truncate">
                  {match.away_team?.name || 'TBD'}
                </span>
              </div>
              
              {match.status === 'completed' && match.home_score !== null && match.away_score !== null ? (
                <div className="flex items-center justify-center mt-2">
                  <span className="text-lg font-bold text-white">
                    {match.home_score} - {match.away_score}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center mt-2 text-gray-400">
                  {match.scheduled_at ? (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{formatDateTime(match.scheduled_at)}</span>
                    </div>
                  ) : (
                    <span className="text-xs">Por definir</span>
                  )}
                </div>
              )}
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