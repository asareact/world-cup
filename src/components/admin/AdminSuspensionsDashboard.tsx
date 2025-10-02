// Dashboard component to show potential suspensions for tournament admins
'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Calendar, Users, Ban } from 'lucide-react'
import { PotentialSuspensionsService, type PotentialSuspension } from '@/lib/suspensions/potential-suspensions-service'
import { usePotentialSuspensions } from '@/lib/hooks/use-potential-suspensions'

interface AdminSuspensionsDashboardProps {
  tournamentId: string
}

export function AdminSuspensionsDashboard({ 
  tournamentId 
}: AdminSuspensionsDashboardProps) {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'all'>('today')
  const [groupBy, setGroupBy] = useState<'match' | 'player' | 'team'>('match')
  
  const { suspensions, loading, error, refresh } = usePotentialSuspensions(
    tournamentId,
    { 
      matchId: undefined // Currently not filtering by specific match
    }
  )

  // Group suspensions based on selected grouping
  const groupedSuspensions = groupSuspensions(suspensions, groupBy)

  if (loading) {
    return (
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-400 ml-4">Analizando posibles sanciones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6">
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Error al cargar</h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            {error}
          </p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Análisis de Posibles Sanciones
            </h2>
            <p className="text-gray-400 text-sm">
              Jugadores en riesgo de recibir sanciones
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-gray-700/60 rounded-lg p-1">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                dateRange === 'today'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                dateRange === 'week'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Esta semana
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                dateRange === 'all'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Todos
            </button>
          </div>
          
          <div className="flex bg-gray-700/60 rounded-lg p-1">
            <button
              onClick={() => setGroupBy('match')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                groupBy === 'match'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Por partido
            </button>
            <button
              onClick={() => setGroupBy('team')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                groupBy === 'team'
                  ? 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Por equipo
            </button>
          </div>
        </div>
      </div>
      
      {suspensions.length === 0 ? (
        <div className="text-center py-10">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No hay sanciones potenciales</h3>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            No se encontraron jugadores en riesgo de recibir sanciones en los próximos partidos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
              <div className="flex items-center">
                <div className="mr-3 p-2 bg-red-500/20 rounded-lg">
                  <Ban className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Alto riesgo</p>
                  <p className="text-white font-bold text-xl">
                    {suspensions.filter(s => s.confidence === 'high').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
              <div className="flex items-center">
                <div className="mr-3 p-2 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Medio riesgo</p>
                  <p className="text-white font-bold text-xl">
                    {suspensions.filter(s => s.confidence === 'medium').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50">
              <div className="flex items-center">
                <div className="mr-3 p-2 bg-gray-500/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total jugadores</p>
                  <p className="text-white font-bold text-xl">
                    {suspensions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(groupedSuspensions).map(([groupKey, groupSuspensions]) => (
              <div 
                key={groupKey} 
                className="bg-gray-700/30 rounded-xl p-4 border border-gray-600/50"
              >
                <div className="flex items-center mb-3 pb-2 border-b border-gray-600/30">
                  <h3 className="text-base font-bold text-white">
                    {getGroupTitle(groupKey, groupBy, groupSuspensions[0])}
                  </h3>
                  <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-600/50 text-gray-300">
                    {groupSuspensions.length} {groupSuspensions.length === 1 ? 'jugador' : 'jugadores'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {groupSuspensions.map((suspension, index) => (
                    <div 
                      key={`${suspension.playerId}-${index}`}
                      className={`
                        flex items-center justify-between p-3 rounded-lg
                        ${
                          suspension.confidence === 'high' 
                            ? 'bg-red-500/10 border border-red-500/20' 
                            : suspension.confidence === 'medium'
                            ? 'bg-amber-500/10 border border-amber-500/20'
                            : 'bg-gray-600/10 border border-gray-600/20'
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          <Ban 
                            className={`
                              h-4 w-4
                              ${
                                suspension.confidence === 'high' 
                                  ? 'text-red-400' 
                                  : suspension.confidence === 'medium'
                                  ? 'text-amber-400'
                                  : 'text-gray-400'
                              }
                            `} 
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {suspension.playerName}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {suspension.teamName} • {suspension.reason}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {suspension.confidence === 'high' ? 'Alto' : 
                           suspension.confidence === 'medium' ? 'Medio' : 'Bajo'} riesgo
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions for grouping
function groupSuspensions(
  suspensions: PotentialSuspension[],
  groupBy: 'match' | 'player' | 'team'
): Record<string, PotentialSuspension[]> {
  const groups: Record<string, PotentialSuspension[]> = {}
  
  suspensions.forEach(suspension => {
    let key: string
    
    switch (groupBy) {
      case 'match':
        key = suspension.matchId
        break
      case 'team':
        key = suspension.teamId
        break
      case 'player':
      default:
        key = suspension.playerId
        break
    }
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(suspension)
  })
  
  return groups
}

function getGroupTitle(
  groupKey: string, 
  groupBy: 'match' | 'player' | 'team',
  firstSuspension: PotentialSuspension
): string {
  switch (groupBy) {
    case 'match':
      return `Partido: ${firstSuspension.teamName} vs ${getOpponentTeam(firstSuspension.matchId, firstSuspension.teamId)}`
    case 'team':
      return `Equipo: ${firstSuspension.teamName}`
    case 'player':
    default:
      return `Jugador: ${firstSuspension.playerName}`
  }
}

function getOpponentTeam(matchId: string, teamId: string): string {
  // This would need to be implemented to get the opponent team name
  // For now, we'll return a placeholder
  return 'Equipo rival'
}