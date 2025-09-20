'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  logo_url?: string | null
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

export function TournamentTeamLogosBanner({ 
  teams,
  tournamentId
}: { 
  teams: Team[]
  tournamentId?: string
}) {
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())
  const router = useRouter()

  // Normalize team data to handle different structures
  const normalizedTeams = teams.map(team => {
    // Handle cases where team might be nested in tournament_teams
    if (team && typeof team === 'object' && !team.id && (team as any).teams) {
      return (team as any).teams;
    }
    if (team && typeof team === 'object' && !team.id && (team as any).team) {
      return (team as any).team;
    }
    return team;
  }).filter(Boolean); // Remove null/undefined values

  const handleImageError = (teamId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(teamId));
  };

  const handleTeamClick = (teamId: string) => {
    if (tournamentId) {
      router.push(`/teams/${teamId}?tournament=${tournamentId}`)
    }
  };

  // Get a consistent color for each team based on its ID
  const getTeamColor = (teamId: string) => {
    const index = parseInt(teamId, 36) % placeholderColors.length;
    return placeholderColors[index];
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 mb-4 md:p-6 md:mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Equipos Participantes</h2>
      <div className="flex flex-wrap gap-3 justify-center">
        {normalizedTeams.map((team: Team, index: number) => (
          <motion.div
            key={team.id}
            className="relative cursor-pointer group flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredTeamId(team.id)}
            onHoverEnd={() => setHoveredTeamId(null)}
            onClick={() => handleTeamClick(team.id)}
          >
            {/* More rounded team logo */}
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700 overflow-hidden shadow-lg">
              {team.logo_url && team.logo_url !== '' && !imageLoadErrors.has(team.id) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={team.logo_url} 
                  alt={team.name} 
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(team.id)}
                />
              ) : (
                <div className={`w-full h-full ${getTeamColor(team.id)} flex items-center justify-center`}>
                  <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
              )}
            </div>
            {/* Team name caption for mobile */}
            <div className="mt-1 text-xs text-gray-300 text-center truncate w-full max-w-[4rem] md:hidden">
              {team.name}
            </div>
            {/* Team name tooltip with animation for desktop */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ 
                opacity: hoveredTeamId === team.id ? 1 : 0, 
                y: hoveredTeamId === team.id ? 0 : 10,
                scale: hoveredTeamId === team.id ? 1 : 0.8
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300,
                damping: 20
              }}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded-lg text-xs text-white whitespace-nowrap z-50 shadow-lg hidden md:block"
            >
              <div className="relative">
                {team.name}
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-800"></div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}