'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'

type Entry = { id: string, status?: string | null, teams?: { name: string, logo_url?: string | null } | null }

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

export function TournamentTeams({ tournament }: { tournament: { tournament_teams?: Entry[] } }) {
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())
  const entries = (tournament.tournament_teams || []) as Entry[]

  // Get a consistent color for each team based on its ID
  const getTeamColor = (teamId: string) => {
    const index = parseInt(teamId, 36) % placeholderColors.length;
    return placeholderColors[index];
  };

  const handleImageError = (teamId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(teamId));
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4">
      {entries.length === 0 && (
        <p className="text-gray-400">No hay equipos registrados</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map((tt: Entry) => (
          <div key={tt.id} className="border border-gray-700 rounded-xl p-3 text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center border border-gray-600">
                {tt.teams?.logo_url && tt.teams.logo_url !== '' && !imageLoadErrors.has(tt.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={tt.teams.logo_url} 
                    alt={tt.teams.name} 
                    className="w-full h-full object-cover" 
                    onError={() => handleImageError(tt.id)}
                  />
                ) : (
                  <div className={`w-full h-full ${getTeamColor(tt.id)} flex items-center justify-center`}>
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div className="font-semibold">{tt.teams?.name || 'Equipo'}</div>
            </div>
            {tt.status && (
              <div className="text-xs text-gray-400 mt-1">Estado: {tt.status}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
