'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { Shield } from 'lucide-react'

type MatchRow = {
  id: string
  scheduled_at: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  home_score: number
  away_score: number
  home_team?: { name: string, logo_url?: string | null } | null
  away_team?: { name: string, logo_url?: string | null } | null
}

// Predefined colors for team placeholders
const placeholderColors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500'
];

export function TournamentMatches({ tournament }: { tournament: { matches?: MatchRow[] } }) {
  const [, setImageLoadErrors] = useState<Set<string>>(new Set())
  const matches = (tournament.matches || []).sort((a: MatchRow, b: MatchRow) => {
    return new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()
  })

  // Get a consistent color for each team based on its ID
  const getTeamColor = (teamName: string) => {
    // Generate a hash from the team name to get a consistent color
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % placeholderColors.length;
    return placeholderColors[index];
  };

  const handleImageError = (teamId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(teamId));
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
      <div className="grid grid-cols-1 gap-3">
        {matches.length === 0 && (
          <p className="text-gray-400">No hay partidos para mostrar</p>
        )}
        {matches.map((m: MatchRow) => (
          <div key={m.id} className="flex items-center justify-between text-gray-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center border border-gray-600">
                  {m.home_team?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={m.home_team.logo_url} 
                      alt={m.home_team?.name || 'Local'} 
                      className="w-full h-full object-cover" 
                      onError={() => handleImageError(`home-${m.id}`)}
                    />
                  ) : (
                    <div className={`w-full h-full ${getTeamColor(m.home_team?.name || 'Local')} flex items-center justify-center`}>
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <span className="font-medium">{m.home_team?.name || 'TBD'}</span>
              </div>
              <span className="text-gray-500">vs</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full overflow-hidden flex items-center justify-center border border-gray-600">
                  {m.away_team?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={m.away_team.logo_url} 
                      alt={m.away_team?.name || 'Visita'} 
                      className="w-full h-full object-cover" 
                      onError={() => handleImageError(`away-${m.id}`)}
                    />
                  ) : (
                    <div className={`w-full h-full ${getTeamColor(m.away_team?.name || 'Visita')} flex items-center justify-center`}>
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <span className="font-medium">{m.away_team?.name || 'TBD'}</span>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {m.status === 'completed' ? (
                <span className="text-white font-semibold">{m.home_score} - {m.away_score}</span>
              ) : m.scheduled_at ? (
                formatDateTime(m.scheduled_at)
              ) : 'Por definir'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



