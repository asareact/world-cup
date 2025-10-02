// Mobile player options button with vertical dots menu
'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Edit3, Trash2 } from 'lucide-react'
import type { Player } from '@/lib/database'
import type { LiveMatchEvent } from '@/lib/hooks/use-match-state'

interface MobilePlayerOptionsButtonProps {
  player: Player
  match: any | null
  events: LiveMatchEvent[]
  suspendedPlayers?: string[]
  onEditEvent: (eventId: string) => void
  onDeleteEvent: (eventId: string) => void
}

export function MobilePlayerOptionsButton({ 
  player, 
  match, 
  events, 
  suspendedPlayers,
  onEditEvent,
  onDeleteEvent
}: MobilePlayerOptionsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
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
  
  // Group events by type for this player
  const playerEvents = events.filter(event => event.player_id === player.id)
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  // Toggle menu visibility
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }
  
  // Handle event editing
  const handleEditEventClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onEditEvent(eventId)
    setIsOpen(false)
  }
  
  // Handle event deletion
  const handleDeleteEventClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteEvent(eventId)
    setIsOpen(false)
  }
  
  // Event display configuration
  const eventDisplay: Record<string, { icon: string; color: string }> = {
    goal: { icon: '⚽', color: 'text-green-400' },
    yellow_card: { icon: '🟨', color: 'text-yellow-400' },
    red_card: { icon: '🟥', color: 'text-red-400' },
    own_goal: { icon: '🥅', color: 'text-red-400' },
    assist: { icon: '🤝', color: 'text-blue-400' },
    save: { icon: '🧤', color: 'text-blue-400' },
  }
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className={`p-1 rounded-full transition-colors ${
          isDisabled ? 'text-red-400' :
          isWarned ? 'text-yellow-400' :
          'text-gray-400'
        } hover:text-white`}
        title="Opciones del jugador"
        disabled={isDisabled}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 bottom-full mb-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Player Events Header */}
          <div className="px-4 py-2 text-xs font-semibold text-gray-300 border-b border-gray-700">
            Eventos de {player.name}
          </div>
          
          {/* Player Events */}
          {playerEvents.length > 0 ? (
            playerEvents.map((event) => {
              const displayInfo = eventDisplay[event.event_type] || { 
                icon: '🔹', 
                color: 'text-gray-400' 
              }
              
              return (
                <div 
                  key={event.id} 
                  className="px-4 py-2 flex items-center justify-between hover:bg-gray-700/50"
                >
                  <div className="flex items-center text-sm text-gray-300 flex-grow">
                    <span className={`${displayInfo.color} mr-2`}>{displayInfo.icon}</span>
                    <span className="truncate">{displayInfo.icon} {event.minute}'</span>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={(e) => handleEditEventClick(event.id, e)}
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                      title="Editar evento"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteEventClick(event.id, e)}
                      className="p-1 text-red-400 hover:text-red-300 rounded transition-colors"
                      title="Eliminar evento"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="px-4 py-2 text-xs text-gray-500 text-center">
              Sin eventos registrados
            </div>
          )}
        </div>
      )}
    </div>
  )
}