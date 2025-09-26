'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import type { Team } from '@/lib/database'

const TEAM_PLACEHOLDER_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
] as const

export const getTeamPlaceholderColor = (teamId: string) => {
  const numericId = parseInt(teamId, 36)
  const index = Math.abs(numericId) % TEAM_PLACEHOLDER_COLORS.length
  return TEAM_PLACEHOLDER_COLORS[index]
}

export const DesktopTeamAvatarRail = ({
  teams,
  tournamentId,
  onTeamClick,
}: {
  teams: Team[]
  tournamentId?: string
  onTeamClick: (teamId: string) => void
}) => {
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

  if (!teams.length) return null

  const maxVisible = 14
  const visibleTeams = teams.slice(0, maxVisible)

  const handleImageError = (teamId: string) => {
    setImageLoadErrors((prev) => {
      const updated = new Set(prev)
      updated.add(teamId)
      return updated
    })
  }

  const handleTeamRedirect = (teamId: string) => {
    onTeamClick(teamId)
  }

  return (
    <div className="hidden md:block">
      <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
        {visibleTeams.map((team) => (
          <div key={team.id} className="relative group">
            <button
              type="button"
              onClick={() => handleTeamRedirect(team.id)}
              className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-green-500/60 hover:shadow-green-500/20"
              aria-label={`Ver detalles de ${team.name}`}
            >
              {team.logo_url && team.logo_url !== '' && !imageLoadErrors.has(team.id) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.logo_url as string}
                  alt={team.name}
                  className="h-full w-full rounded-full object-cover"
                  onError={() => handleImageError(team.id)}
                />
              ) : (
                <div className={`flex h-full w-full items-center rounded-full justify-center ${getTeamPlaceholderColor(team.id)}`}>
                  <Shield className="h-8 w-8 text-white" />
                </div>
              )}
            </button>
            <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="relative bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 min-w-max shadow-lg shadow-black/30">
                <div className="text-xs font-semibold text-white whitespace-nowrap">{team.name}</div>
                <div className="text-xs text-gray-400 whitespace-nowrap">Haz clic para ver</div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900/95 border-t border-l border-gray-700"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}