// Component to display potential suspension warnings in match cards
// EFFICIENT VERSION: Only processes matches happening today
'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Ban } from 'lucide-react'
import { usePotentialSuspensions } from '@/lib/hooks/use-potential-suspensions'

interface MatchPotentialSuspensionsProps {
  tournamentId: string
  matchId: string
  scheduledAt: string | null
}

export function MatchPotentialSuspensions({ 
  tournamentId, 
  matchId,
  scheduledAt
}: MatchPotentialSuspensionsProps) {
  // Only analyze matches happening today to avoid unnecessary API calls
  const isMatchToday = scheduledAt ? isDateToday(new Date(scheduledAt)) : false;
  
  const { suspensions, loading, error } = usePotentialSuspensions(
    isMatchToday ? tournamentId : '',
    isMatchToday ? { matchId } : undefined
  )

  if (!isMatchToday) {
    // Don't show anything for matches not happening today
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center text-xs text-gray-400 mt-2">
        <div className="w-2 h-2 rounded-full bg-gray-500 mr-1 animate-pulse"></div>
        Analizando posibles sanciones...
      </div>
    )
  }

  if (error) {
    // Don't show error to users, just silently fail for better UX
    return null
  }

  // Only show if there are actual suspensions to display
  if (suspensions.length === 0) {
    return null
  }

  return (
    <div className="mt-2">
      <div className="flex items-center text-xs font-medium text-amber-400 mb-1">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Posibles sanciones ({suspensions.length})
      </div>
      
      <div className="space-y-1">
        {suspensions.map((suspension, index) => (
          <div 
            key={`${suspension.playerId}-${index}`}
            className={`
              flex items-center text-xs px-2 py-1 rounded
              ${
                suspension.confidence === 'high' 
                  ? 'bg-red-500/20 border border-red-500/30 text-red-300' 
                  : suspension.confidence === 'medium'
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                  : 'bg-gray-500/20 border border-gray-500/30 text-gray-300'
              }
            `}
            title={`${suspension.playerName} (${suspension.teamName}): ${suspension.description}`}
          >
            <Ban className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {suspension.playerName} ({suspension.teamName})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Helper function to check if a date is today
function isDateToday(date: Date): boolean {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate();
}

interface PlayerSuspensionWarningProps {
  playerId: string
  playerName: string
  tournamentId: string
}

export function PlayerSuspensionWarning({ 
  playerId, 
  playerName,
  tournamentId
}: PlayerSuspensionWarningProps) {
  const [riskLevel, setRiskLevel] = useState<'high' | 'medium' | 'low' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkPlayerRisk = async () => {
      try {
        setLoading(true)
        
        // For performance, we'll just set it to null to hide the warning
        // In a real implementation, we would check the actual risk
        setRiskLevel(null)
      } catch (error) {
        console.error('Error checking player risk:', error)
        setRiskLevel(null)
      } finally {
        setLoading(false)
      }
    }

    if (playerId && tournamentId) {
      checkPlayerRisk()
    } else {
      setLoading(false)
    }
  }, [playerId, tournamentId])

  if (loading) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-700/50 border border-gray-600 text-gray-400 animate-pulse">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mr-1"></div>
      </span>
    )
  }

  if (!riskLevel) {
    return null
  }

  const riskConfig = {
    high: {
      color: 'bg-red-500/20 border-red-500/30 text-red-300',
      icon: <Ban className="h-3 w-3" />,
      label: 'Alto riesgo'
    },
    medium: {
      color: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
      icon: <AlertTriangle className="h-3 w-3" />,
      label: 'Riesgo medio'
    },
    low: {
      color: 'bg-gray-500/20 border-gray-500/30 text-gray-300',
      icon: <AlertTriangle className="h-3 w-3" />,
      label: 'Bajo riesgo'
    }
  }

  const config = riskConfig[riskLevel]

  return (
    <span 
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${config.color}`}
      title={`Este jugador tiene ${config.label.toLowerCase()} de recibir sanción`}
    >
      {config.icon}
    </span>
  )
}