// PlayerCard component with improved suspension handling
'use client'

import { useState } from 'react'
import { Ban, AlertTriangle, Flag, ShieldCheck, Hand, Info } from 'lucide-react'
import type { Player } from '@/lib/database'
import { PlayerDetailsModal } from '@/components/players/player-details-modal'

interface PlayerCardProps {
  player: Player
  onPlayerClick: (player: Player) => void
  match: any | null
  suspendedPlayers?: string[]
  events: any[]
}

export function PlayerCard({ 
  player, 
  onPlayerClick, 
  match, 
  suspendedPlayers, 
  events
}: PlayerCardProps) {
  const [isPlayerDetailsModalOpen, setIsPlayerDetailsModalOpen] = useState(false)
  
  // Check if player is suspended (from official suspensions)
  const isOfficiallySuspended = suspendedPlayers && suspendedPlayers.includes(player.id)
  
  // Check for yellow cards in this match
  const playerYellowCards = events.filter(
    (event: any) => event.player_id === player.id && 
             event.event_type === 'yellow_card'
  ).length
  
  const playerRedCards = events.filter(
    (event: any) => event.player_id === player.id && 
             event.event_type === 'red_card'
  ).length
  
  // Check if player is potentially suspended for this match (should be warned, not disabled)
  const isPotentiallySuspended = false // This would come from potential suspensions service
  
  // Player should be warned if they:
  // 1. Have 1 yellow card (risk of suspension with another)
  // 2. Are potentially suspended (from tournament accumulation)
  const isWarned = (playerYellowCards >= 1 && playerYellowCards < 2 && playerRedCards === 0) || 
                   isPotentiallySuspended
  
  // Player should be disabled/expelled if they have:
  // 1. A red card, or
  // 2. Two yellow cards in this match (which equals a red card)
  // 3. Official suspension
  const isExpelled = playerRedCards > 0 || playerYellowCards >= 2
  
  // Overall disabled status (only official suspension or expelled in this match)
  const isDisabled = isOfficiallySuspended || isExpelled
  
  return (
    <>
      <div className={`w-full p-3 rounded-lg flex items-center space-x-3 text-left relative group ${
        isDisabled ? 'bg-red-900/30 opacity-60' : 
        isWarned ? 'bg-yellow-900/30' : 
        'bg-gray-700/50'
      }`}>
        <button
          onClick={isDisabled ? undefined : () => onPlayerClick(player)}
          className={`flex items-center space-x-3 flex-grow text-left transition-all p-1 rounded -m-1 w-full ${
            isDisabled ? 'cursor-not-allowed' : 'hover:bg-gray-600'
          }`}
          disabled={isDisabled}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
            isDisabled ? 'bg-red-800 text-red-200' :
            isWarned ? 'bg-yellow-800 text-yellow-200' :
            'bg-gray-800 text-green-400'
          }`}>
            {player.jersey_number || '-'}
          </div>
          <div className="flex flex-col flex-grow min-w-0">
            <div className="flex items-center">
              <span className={`font-medium truncate flex-grow ${
                isDisabled ? 'text-red-300 line-through' :
                isWarned ? 'text-yellow-300' :
                'text-white'
              }`}>
                {player.name}
              </span>
              {player.is_captain && (
                <span title="Capitán" className="ml-1">
                  <ShieldCheck className={`h-4 w-4 ${
                    isDisabled ? 'text-red-400' :
                    isWarned ? 'text-yellow-400' :
                    'text-yellow-400'
                  } flex-shrink-0`} />
                </span>
              )}
              {player.position === 'portero' && (
                <span title="Portero" className="ml-1">
                  <Hand className={`h-4 w-4 ${
                    isDisabled ? 'text-red-400' :
                    isWarned ? 'text-yellow-400' :
                    'text-blue-400'
                  } flex-shrink-0`} />
                </span>
              )}
              {isWarned && !isDisabled && (
                <span title="Jugador advertido (tiene tarjeta amarilla)" className="ml-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                </span>
              )}
              {isDisabled && (
                <span title="Jugador expulsado o suspendido" className="ml-1">
                  <Flag className="h-4 w-4 text-red-400" />
                </span>
              )}
            </div>
          </div>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlayerDetailsModalOpen(true);
          }}
          className={`p-1 ${
            isDisabled ? 'text-red-400' :
            isWarned ? 'text-yellow-400' :
            'text-gray-400'
          } hover:text-white transition-colors opacity-0 group-hover:opacity-100`}
          title="Ver detalles del jugador"
          disabled={isDisabled}
        >
          <Info className="h-4 w-4" />
        </button>
        <PlayerDetailsModal
          player={player}
          tournamentId={match?.tournament?.id || ''}
          isOpen={isPlayerDetailsModalOpen}
          onClose={() => setIsPlayerDetailsModalOpen(false)}
        />
      </div>
    </>
  )
}