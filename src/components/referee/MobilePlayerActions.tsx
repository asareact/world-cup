// Mobile player actions button with vertical dots menu for event management
'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Edit3, Trash2 } from 'lucide-react'
import type { Player } from '@/lib/database'
import type { LiveMatchEvent } from '@/lib/hooks/use-match-state'

interface MobilePlayerActionsProps {
  player: Player
  events: LiveMatchEvent[]
  onEditEvent: (eventId: string) => void
  onDeleteEvent: (eventId: string) => void
}

export function MobilePlayerActions({ 
  player, 
  events,
  onEditEvent,
  onDeleteEvent
}: MobilePlayerActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Get player events
  const playerEvents = events.filter(event => event.player_id === player.id)
  
  // Event display configuration
  const eventDisplay: Record<string, { icon: string; color: string; label: string }> = {
    goal: { icon: '⚽', color: 'text-green-400', label: 'Gol' },
    yellow_card: { icon: '🟨', color: 'text-yellow-400', label: 'Amarilla' },
    red_card: { icon: '🟥', color: 'text-red-400', label: 'Roja' },
    own_goal: { icon: '🥅', color: 'text-red-400', label: 'Autogol' },
    assist: { icon: '🤝', color: 'text-blue-400', label: 'Asistencia' },
    save: { icon: '🧤', color: 'text-blue-400', label: 'Atajada' },
  }
  
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
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-1 text-gray-400 hover:text-white rounded-full transition-colors"
        title="Acciones del jugador"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute right-0 bottom-full mb-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-2 text-xs font-semibold text-gray-300 border-b border-gray-700">
            Eventos de {player.name}
          </div>
          
          {/* Player Events List */}
          {playerEvents.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {playerEvents.map((event) => {
                const displayInfo = eventDisplay[event.event_type] || { 
                  icon: '🔹', 
                  color: 'text-gray-400', 
                  label: 'Evento' 
                }
                
                return (
                  <div 
                    key={event.id} 
                    className="px-4 py-2 border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-300 flex-grow">
                        <span className={`mr-2 ${displayInfo.color}`}>{displayInfo.icon}</span>
                        <span className="truncate">{displayInfo.label}</span>
                        <span className="ml-1 text-xs text-gray-500">{event.minute}'</span>
                      </div>
                      <div className="flex space-x-1 ml-2 flex-shrink-0">
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
                    {event.assist_player_id && (
                      <div className="text-xs text-gray-500 mt-1 ml-6">
                        Asistencia: {event.assist_player_id}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-gray-500 text-center">
              Sin eventos registrados
            </div>
          )}
        </div>
      )}
    </div>
  )
}