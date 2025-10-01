// Component to display player events in mobile view
'use client'

import { useState, useEffect } from 'react'
import type { LiveMatchEvent } from '@/lib/hooks/use-match-state'
import type { Player } from '@/lib/database'

interface MobilePlayerEventsProps {
  events: LiveMatchEvent[]
  players: Player[]
  teamId: string
  teamName: string
}

export function MobilePlayerEvents({ 
  events, 
  players, 
  teamId,
  teamName
}: MobilePlayerEventsProps) {
  // Filter events for this team
  const teamEvents = events.filter(event => event.team_id === teamId)
  
  // Group events by player
  const playerEvents: Record<string, LiveMatchEvent[]> = {}
  teamEvents.forEach(event => {
    if (!playerEvents[event.player_id]) {
      playerEvents[event.player_id] = []
    }
    playerEvents[event.player_id].push(event)
  })

  // Get player names
  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId)
    return player ? player.name.split(' ')[0] : 'Jugador'
  }

  // Get event icons
  const getEventIcon = (eventType: string) => {
    const icons: Record<string, string> = {
      goal: '⚽',
      yellow_card: '🟨',
      red_card: '🟥',
      own_goal: '🥅',
      assist: '🤝',
      save: '🧤',
    }
    return icons[eventType] || '🔹'
  }

  // Check if player is suspended/expelled
  const isPlayerSuspended = (playerId: string) => {
    const playerEvents = playerEvents[playerId] || []
    const yellowCards = playerEvents.filter(e => e.event_type === 'yellow_card').length
    const redCards = playerEvents.filter(e => e.event_type === 'red_card').length
    
    // Player is expelled if they have a red card or 2 yellow cards
    return redCards > 0 || yellowCards >= 2
  }

  return (
    <div className="md:hidden w-full">
      <h3 className="text-sm font-semibold text-center text-gray-300 mb-2 truncate border-b border-gray-700 pb-1">
        {teamName}
      </h3>
      
      {Object.entries(playerEvents).length === 0 ? (
        <div className="text-center text-gray-500 text-xs py-2">
          No hay eventos
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(playerEvents).map(([playerId, events]) => {
            const playerName = getPlayerName(playerId)
            const isSuspended = isPlayerSuspended(playerId)
            
            return (
              <div 
                key={playerId} 
                className={`p-2 rounded-lg ${
                  isSuspended ? 'bg-red-900/30 opacity-60' : 'bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${isSuspended ? 'text-red-300 line-through' : 'text-white'}`}>
                    {playerName}
                  </span>
                  {isSuspended && (
                    <span className="text-xs bg-red-600/50 text-red-200 px-1.5 py-0.5 rounded-full">
                      Expulsado
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {events.map((event, index) => (
                    <span 
                      key={index} 
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        event.event_type === 'goal' ? 'bg-green-600/50 text-green-200' :
                        event.event_type === 'yellow_card' ? 'bg-yellow-600/50 text-yellow-200' :
                        event.event_type === 'red_card' ? 'bg-red-600/50 text-red-200' :
                        'bg-gray-600/50 text-gray-200'
                      }`}
                      title={`${event.event_type} en minuto ${event.minute}`}
                    >
                      {getEventIcon(event.event_type)}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}