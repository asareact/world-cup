'use client'

import { Target, Users } from 'lucide-react'
import Link from 'next/link'

interface TopScorer {
  player_id: string
  player_name: string
  team_name: string
  team_id: string
  goals: number
  player_photo_url?: string | null
}

export function TournamentTopScorers({ 
  scorers,
  showAllLink = true
}: { 
  scorers: TopScorer[]
  showAllLink?: boolean
}) {
  if (scorers.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Máximos Goleadores</h3>
        <p className="text-gray-400 text-center py-4 text-sm">Aún no hay goles registrados</p>
        {showAllLink && (
          <Link 
            href="#top-scorers" 
            className="block text-center text-sm text-green-400 hover:text-green-300 mt-2"
          >
            Ver tabla completa
          </Link>
        )}
      </div>
    )
  }

  const top3 = scorers.slice(0, 3)

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Máximos Goleadores</h3>
        {showAllLink && (
          <Link 
            href="#top-scorers" 
            className="text-sm text-green-400 hover:text-green-300"
          >
            Ver todos
          </Link>
        )}
      </div>
      
      <div className="space-y-3">
        {top3.map((scorer, index) => (
          <div key={scorer.player_id} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-800/30 transition-colors">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
              {index === 0 ? (
                <Target className="h-3 w-3 text-yellow-400" />
              ) : index === 1 ? (
                <Target className="h-3 w-3 text-gray-300" />
              ) : index === 2 ? (
                <Target className="h-3 w-3 text-amber-700" />
              ) : (
                <span className="text-xs text-gray-400">{index + 1}</span>
              )}
            </div>
            
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                {scorer.player_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={scorer.player_photo_url} 
                    alt={scorer.player_name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{scorer.player_name}</p>
              <p className="text-xs text-gray-400 truncate">{scorer.team_name}</p>
            </div>
            
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
                {scorer.goals} {scorer.goals === 1 ? 'gol' : 'goles'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {showAllLink && (
        <Link 
          href="#top-scorers" 
          className="block text-center text-sm text-green-400 hover:text-green-300 mt-3 pt-3 border-t border-gray-800"
        >
          Ver tabla completa de goleadores
        </Link>
      )}
    </div>
  )
}