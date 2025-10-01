// Modal to display and manage player events
'use client'

import { useState } from 'react'
import { X, Edit3, Trash2, Goal, Flag, Hand, AlertTriangle, Users, Calendar, Ban } from 'lucide-react'
import type { LiveMatchEvent } from '@/lib/hooks/use-match-state'
import type { Player, Team } from '@/lib/database'

interface PlayerEventsModalProps {
  player: Player
  team: Team
  events: LiveMatchEvent[]
  isOpen: boolean
  onClose: () => void
  onEditEvent: (eventId: string) => void
  onDeleteEvent: (eventId: string) => void
}

export function PlayerEventsModal({ 
  player, 
  team, 
  events, 
  isOpen, 
  onClose,
  onEditEvent,
  onDeleteEvent
}: PlayerEventsModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  
  // Filter events for this player
  const playerEvents = events.filter(event => event.player_id === player.id)
  
  // Get event display info
  const getEventDisplayInfo = (eventType: string) => {
    const eventTypes: Record<string, { icon: React.ReactNode, color: string, label: string }> = {
      goal: { icon: <Goal className="h-4 w-4" />, color: 'bg-green-500/20 text-green-400', label: 'Gol' },
      yellow_card: { icon: <Flag className="h-4 w-4" />, color: 'bg-yellow-500/20 text-yellow-400', label: 'Tarjeta Amarilla' },
      red_card: { icon: <Flag className="h-4 w-4" />, color: 'bg-red-500/20 text-red-400', label: 'Tarjeta Roja' },
      own_goal: { icon: <Goal className="h-4 w-4" />, color: 'bg-red-500/20 text-red-400', label: 'Autogol' },
      assist: { icon: <Users className="h-4 w-4" />, color: 'bg-blue-500/20 text-blue-400', label: 'Asistencia' },
      save: { icon: <Hand className="h-4 w-4" />, color: 'bg-blue-500/20 text-blue-400', label: 'Atajada' },
    }
    
    return eventTypes[eventType] || { icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-gray-500/20 text-gray-400', label: 'Evento' }
  }
  
  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold">
              {player.jersey_number || '-'}
            </div>
            <div>
              <h3 className="font-bold text-white">{player.name}</h3>
              <p className="text-sm text-gray-400">{team.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {playerEvents.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">No hay eventos registrados para este jugador</p>
            </div>
          ) : (
            <div className="space-y-3">
              {playerEvents.map((event) => {
                const eventInfo = getEventDisplayInfo(event.event_type)
                
                return (
                  <div 
                    key={event.id}
                    className={`p-3 rounded-lg border ${eventInfo.color.replace('text-', 'border-').replace('/20', '/30')} bg-gray-700/30`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${eventInfo.color}`}>
                          {eventInfo.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white">{eventInfo.label}</h4>
                            <span className="text-xs text-gray-400">
                              {event.minute}' ({formatTime(event.timestamp)})
                            </span>
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-gray-300 mt-1">{event.description}</p>
                          )}
                          
                          {event.assist_player_id && (
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <Users className="h-3 w-3 mr-1" />
                              <span>Asistencia</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={() => onEditEvent(event.id)}
                          className="p-1.5 hover:bg-gray-600 rounded transition-colors"
                          title="Editar evento"
                        >
                          <Edit3 className="h-4 w-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => onDeleteEvent(event.id)}
                          className="p-1.5 hover:bg-red-900/50 rounded transition-colors"
                          title="Eliminar evento"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {playerEvents.length} evento{playerEvents.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}