'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTournament } from '@/lib/hooks/use-tournament'
import { useAuth } from '@/lib/auth-context'
import { TournamentPublicLayout } from '@/components/tournaments/tournament-public-layout'
import { Loader2 } from 'lucide-react'
import type { Team, Match } from '@/lib/database'
import { TournamentRoundCalendar } from '@/components/tournaments/calendar'

export default function TournamentCalendarPage() {
  const params = useParams<{ id: string }>()
  const tournamentId = params?.id
  const { tournament, loading, error } = useTournament(tournamentId)
  
  const { user } = useAuth()
  const isAdmin = user?.id === tournament?.creator_id

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <TournamentPublicLayout anchors={[]}>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-red-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error al cargar el calendario</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </TournamentPublicLayout>
    )
  }

  if (!tournament) {
    return (
      <TournamentPublicLayout anchors={[]}>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Torneo no encontrado</h2>
          <p className="text-gray-400">No se pudo encontrar el torneo solicitado.</p>
        </div>
      </TournamentPublicLayout>
    )
  }

  // Extract teams from tournament data
  const extractTeamsFromEntries = (entries: any[] | null | undefined) => {
    if (!Array.isArray(entries)) return []

    return entries
      .map((entry) => {
        if (!entry) return null
        if (typeof entry === 'object' && 'teams' in entry && entry.teams) {
          return entry.teams
        }
        if (typeof entry === 'object' && 'team' in entry && entry.team) {
          return entry.team
        }
        return entry
      })
      .filter((team): team is Team => Boolean(team && typeof team === 'object' && 'id' in team && 'name' in team))
  }

  const tournamentTeams = extractTeamsFromEntries(tournament?.tournament_teams)

  return (
    <TournamentPublicLayout anchors={[
      { href: `/tournaments/${tournamentId}/public?section=overview`, label: 'Inicio' },
      { href: `/tournaments/${tournamentId}/public?section=standings`, label: 'Tabla' },
      { href: `/tournaments/${tournamentId}/public?section=groups`, label: 'Grupos' },
      { href: `/tournaments/${tournamentId}/public/calendar`, label: 'Calendario' },
      { href: `/tournaments/${tournamentId}/public?section=repechage`, label: 'Repechaje' },
      { href: `/tournaments/${tournamentId}/public?section=top-scorers`, label: 'Goleadores' },
      { href: `/tournaments/${tournamentId}/public?section=ideal-5`, label: 'Ideal 5' },
    ]}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Calendario - {tournament.name}
          </h1>
          <p className="text-gray-400 mt-2">
            Partidos programados para el torneo
          </p>
        </div>
        
        <TournamentRoundCalendar 
          tournamentId={tournamentId || ''}
          teams={Array.isArray(tournamentTeams) ? tournamentTeams : []}
          initialMatches={Array.isArray(tournament?.matches) ? tournament.matches : []}
          isAdmin={isAdmin}
        />
      </div>
    </TournamentPublicLayout>
  )
}