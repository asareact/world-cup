'use client'

import { useState } from 'react'
import { Match, Team } from '@/lib/database'
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { MatchCard } from './MatchCard'

interface RoundSectionProps {
  roundName: string
  matches: Match[]
  teams: Pick<Team, "id" | "name" | "logo_url">[] | undefined | null
  isExpanded: boolean
  onToggle: (roundName: string) => void
  onViewMatchDetails: (match: Match) => void
  daysOfWeek: string[]
  formatDate: (dateString: string) => string
}

export function RoundSection({ 
  roundName, 
  matches, 
  teams, 
  isExpanded, 
  onToggle, 
  onViewMatchDetails,
  daysOfWeek,
  formatDate
}: RoundSectionProps) {
  // Group matches by date
  const matchesByDate: Record<string, Match[]> = {}
  matches.forEach(match => {
    if (!match.scheduled_at) return
    const dateKey = match.scheduled_at.split('T')[0]
    if (!matchesByDate[dateKey]) {
      matchesByDate[dateKey] = []
    }
    matchesByDate[dateKey].push(match)
  })
  
  // Sort dates
  const sortedDates = Object.keys(matchesByDate).sort()
  
  return (
    <div className="bg-gray-800/40 rounded-2xl overflow-hidden shadow-lg border border-gray-700/50">
      <button
        className={`w-full p-4 flex justify-between items-center bg-gradient-to-r from-gray-800/60 to-gray-900/60 hover:from-gray-700/60 hover:to-gray-800/60 transition-all ${
          isExpanded ? 'border-b border-gray-700/50' : ''
        }`}
        onClick={() => onToggle(roundName)}
      >
        <div className="flex items-center">
          <div className="mr-3">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {roundName.replace('Jornada ', 'Jornada #').replace('Fecha ', 'Fecha #')}
            </h3>
            <p className="text-sm text-gray-400">
              {matches.length} partido{matches.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-green-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-green-400" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-gradient-to-b from-gray-900/10 to-gray-800/20">
          <div className="space-y-5">
            {sortedDates.map(date => {
              const dateMatches = matchesByDate[date]
              const dateObj = new Date(date)
              const dayOfWeek = daysOfWeek[dateObj.getDay()]
              
              return (
                <div key={date} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                  <div className="flex items-center mb-3 pb-2 border-b border-gray-700/40">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-400 mr-2" />
                      <h4 className="text-base font-semibold text-white">
                        {dayOfWeek}, {formatDate(date)}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {dateMatches.map(match => (
                      <MatchCard 
                        key={match.id} 
                        match={match} 
                        teams={teams} 
                        onViewDetails={onViewMatchDetails} 
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}