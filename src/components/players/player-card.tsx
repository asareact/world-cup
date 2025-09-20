'use client'

import { useState } from 'react'
import { Users, Shield, Target, Award } from 'lucide-react'

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

export function PlayerCard({ player }: { player: Player }) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-600">
            {player.photo_url && player.photo_url !== '' && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={player.photo_url} 
                alt={player.name} 
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <Users className="h-6 w-6 md:h-8 md:w-8 text-gray-500" />
            )}
          </div>
          {player.is_captain && (
            <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-green-600 rounded-full flex items-center justify-center">
              <Shield className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate text-sm md:text-base">{player.name}</h3>
          {player.jersey_number && (
            <div className="text-sm text-gray-400">#{player.jersey_number}</div>
          )}
          {player.position && (
            <div className="text-sm text-gray-400 capitalize">{player.position}</div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center space-x-3 text-sm">
          <div className="flex items-center space-x-1 text-gray-400">
            <Target className="h-4 w-4" />
            <span>{player.goals}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <Award className="h-4 w-4" />
            <span>{player.assists}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {player.matches_played} partidos
        </div>
      </div>
    </div>
  )
}