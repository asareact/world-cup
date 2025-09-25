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
    <div className="border border-gray-700 rounded-xl overflow-hidden shadow-lg">
      <button
        className={`w-full p-4 flex justify-between items-center bg-gradient-to-r from-gray-800 to-gray-900/80 hover:from-gray-700 hover:to-gray-800 transition-all ${
          isExpanded ? 'border-b border-gray-700' : ''
        }`}
        onClick={() => onToggle(roundName)}
      >
        <h3 className="text-lg font-bold text-white flex items-center">
          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-transparent bg-clip-text font-extrabold mr-3">
            {roundName.replace('Jornada ', 'Jornada #').replace('Fecha ', 'Fecha #')}
          </span>
          <span className="text-sm font-normal text-gray-300 bg-gray-700/50 px-2.5 py-1 rounded-full">
            {matches.length} partido{matches.length !== 1 ? 's' : ''}
          </span>
        </h3>
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-green-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-green-400" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 bg-gradient-to-b from-gray-900/20 to-gray-800/30">
          <div className="space-y-6">
            {sortedDates.map(date => {
              const dateMatches = matchesByDate[date]
              const dateObj = new Date(date)
              const dayOfWeek = daysOfWeek[dateObj.getDay()]
              
              return (
                <div key={date} className="border border-gray-700/70 rounded-xl p-4 mb-4 bg-gray-800/20">
                  <div className="flex items-center mb-4 pb-2 border-b border-gray-700/40">
                    <div className="flex items-center bg-gradient-to-r from-blue-900/40 to-purple-900/40 px-4 py-2 rounded-lg">
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