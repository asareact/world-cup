'use client'

import { Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Player {
  id: string
  name: string
  jersey_number: number | null
  position: string | null
  photo_url: string | null
  goals: number
  assists: number
  matches_played: number
  is_captain: boolean
}

interface Team {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  players: Player[]
  is_captain?: boolean
}

export function TeamCard({ team }: { team: Team }) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/teams/${team.id}`)
  }

  return (
    <div 
      className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 cursor-pointer hover:bg-gray-800/70 transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600">
            {team.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={team.logo_url} 
                alt={team.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-purple-500 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
          {team.is_captain && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <Shield className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{team.name}</h3>
          {team.description && (
            <p className="text-sm text-gray-400 truncate">{team.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-500">
              {team.players.length} jugadores
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>{team.players.reduce((sum, p) => sum + p.goals, 0)} goles</span>
              <span>•</span>
              <span>{team.players.reduce((sum, p) => sum + p.matches_played, 0)} partidos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}