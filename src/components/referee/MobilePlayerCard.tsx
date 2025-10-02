// Mobile Player Card with Options Button
'use client'

import { useState } from 'react'
import { Flag, ShieldCheck, Hand, AlertTriangle, Info } from 'lucide-react'
import type { Player } from '@/lib/database'
import type { LiveMatchEvent } from '@/lib/hooks/use-match-state'
import { MobilePlayerActions } from '@/components/referee/MobilePlayerActions'

interface MobilePlayerCardProps {
  player: Player
  onPlayerClick: (player: Player) => void
  match: any | null
  suspendedPlayers?: string[]
  events: LiveMatchEvent[]
  players: Player[] // All players for assist name lookup
  onEditEvent: (eventId: string) => void
  onDeleteEvent: (eventId: string) => void
}

export function MobilePlayerCard({ 
  player, 
  onPlayerClick, 
  match, 
  suspendedPlayers, 
  events,
  players,
  onEditEvent,
  onDeleteEvent
}: MobilePlayerCardProps) {
  // Check if player is suspended (from official suspensions)
  const isOfficiallySuspended = suspendedPlayers && suspendedPlayers.includes(player.id)
  
  // Check for yellow cards in this match
  const playerYellowCards = events.filter(
    event => event.player_id === player.id && 
             event.event_type === 'yellow_card'
  ).length
  
  const playerRedCards = events.filter(
    event => event.player_id === player.id && 
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
  
  // Group events by type for this player (both events received and given)
  const playerEventsReceived = events.filter(event => event.player_id === player.id);
  const playerEventsGiven = events.filter(event => event.assist_player_id === player.id);
  
  // Combine both received and given events
  const playerEvents = [...playerEventsReceived, ...playerEventsGiven];
  
  // Count events by type
  const eventCounts: Record<string, number> = {};
  playerEventsReceived.forEach(event => {
    eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
  });
  
  // Count assists given
  const assistCount = playerEventsGiven.length;
  if (assistCount > 0) {
    eventCounts['assist'] = (eventCounts['assist'] || 0) + assistCount;
  }
  
  // Get event icons with counts
  const eventIcons = [] as any[];
  const eventDisplay: Record<string, { icon: string; color: string }> = {
    goal: { icon: '⚽', color: 'text-green-400' },
    yellow_card: { icon: '🟨', color: 'text-yellow-400' },
    red_card: { icon: '🟥', color: 'text-red-400' },
    own_goal: { icon: '🥅', color: 'text-red-400' },
    assist: { icon: '🤝', color: 'text-blue-400' },
    save: { icon: '🧤', color: 'text-blue-400' },
  };
  
  Object.entries(eventCounts).forEach(([eventType, count]) => {
    const displayInfo = eventDisplay[eventType];
    if (displayInfo && count > 0) {
      eventIcons.push({
        icon: displayInfo.icon,
        color: displayInfo.color,
        count: count,
        type: eventType
      });
    }
  });
  
  return (
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
              {/* Show event icons for mobile view */}
              {eventIcons.length > 0 && (
                <span className="ml-2 inline-flex items-center space-x-1">
                  {eventIcons.map((event, index) => (
                    <span key={index} className="inline-flex items-center text-xs">
                      <span className={event.color}>{event.icon}</span>
                      {event.count > 1 && (
                        <span className="ml-0.5 text-xs">x{event.count}</span>
                      )}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center mt-1">
            {player.is_captain && (
              <span title="Capitán" className="mr-2">
                <ShieldCheck className={`h-5 w-5 ${
                  isDisabled ? 'text-red-400' :
                  isWarned ? 'text-yellow-400' :
                  'text-yellow-400'
                } flex-shrink-0`} />
              </span>
            )}
            {player.position === 'portero' && (
              <span title="Portero" className="mr-2">
                <Hand className={`h-5 w-5 ${
                  isDisabled ? 'text-red-400' :
                  isWarned ? 'text-yellow-400' :
                  'text-blue-400'
                } flex-shrink-0`} />
              </span>
            )}
            {isWarned && !isDisabled && (
              <span title="Jugador advertido (tiene tarjeta amarilla)" className="mr-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              </span>
            )}
            {isDisabled && (
              <span title="Jugador expulsado o suspendido">
                <Flag className="h-4 w-4 text-red-400" />
              </span>
            )}
          </div>
        </div>
      </button>
      
      {/* Mobile Actions Button (Three Dots Vertical) */}
      <MobilePlayerActions 
        player={player}
        events={events}
        players={players}
        onEditEvent={onEditEvent}
        onDeleteEvent={onDeleteEvent}
      />
    </div>
  )
}