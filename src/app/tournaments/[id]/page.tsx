'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useTournament } from '@/lib/hooks/use-tournament'
import { TournamentHeader } from '@/components/tournaments/tournament-header'
import type { Tournament } from '@/lib/database'
import { TournamentTabs } from '@/components/tournaments/tournament-tabs'
import { TournamentOverview } from '@/components/tournaments/tournament-overview'
import { TournamentMatches } from '@/components/tournaments/tournament-matches'
import { TournamentTeams } from '@/components/tournaments/tournament-teams'
import { TournamentStats } from '@/components/tournaments/tournament-stats'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/lib/auth-context'
import { useTeams } from '@/lib/hooks/use-teams'
import { db } from '@/lib/database'

type MatchRow = {
  id: string
  scheduled_at: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  home_score: number
  away_score: number
  home_team?: { name: string } | null
  away_team?: { name: string } | null
}

type TournamentLite = {
  id: string
  name: string
  status: 'draft' | 'active' | 'completed' | 'paused'
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups'
  max_teams: number
  tournament_teams?: { id: string }[]
  matches?: MatchRow[]
  rules?: string
  venue?: string
  start_date?: string | null
  end_date?: string | null
  registration_deadline?: string | null
}

export default function TournamentPublicPage() {
  const params = useParams<{ id: string }>()
  const tournamentId = params?.id
  const { tournament, loading, error, refetch } = useTournament(tournamentId)
  const { role } = useAuth()
  const { teams } = useTeams()

  const [tab, setTab] = useState('overview')
  const [following, setFollowing] = useState(false)
  const [joining, setJoining] = useState(false)

  const t = (tournament || {}) as Partial<TournamentLite>
  const teamsCount = t.tournament_teams?.length || 0
  const hasCapacity = !!t && (
    (t.max_teams || 0) > teamsCount
  )

  const myTeamOptions = useMemo(() => teams || [], [teams])
  const canJoin = role === 'capitan' && hasCapacity && myTeamOptions.length > 0

  const handleFollow = () => setFollowing(v => !v)

  const handleJoin = async () => {
    if (!canJoin || !tournament) return
    const team = myTeamOptions[0]
    try {
      setJoining(true)
      await db.registerTeamForTournament((t as TournamentLite).id!, team.id)
      await refetch()
      alert('Equipo registrado en el torneo')
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'No se pudo unir al torneo')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-gray-300">Cargando torneo...</div>
      </DashboardLayout>
    )
  }

  if (error || !tournament) {
    return (
      <DashboardLayout>
        <div className="text-gray-300">{error || 'Torneo no encontrado'}</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <TournamentHeader
          tournament={t as Tournament}
          teamsCount={teamsCount}
          onFollow={handleFollow}
          isFollowing={following}
          canJoin={canJoin && !joining}
          onJoin={handleJoin}
        />

        <TournamentTabs active={tab} onChange={setTab} />

        {tab === 'overview' && <TournamentOverview tournament={tournament} />}
        {tab === 'matches' && <TournamentMatches tournament={tournament} />}
        {tab === 'standings' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 text-gray-300">
            Tabla/Clasificación próximamente
          </div>
        )}
        {tab === 'teams' && <TournamentTeams tournament={tournament} />}
        {tab === 'stats' && <TournamentStats tournamentId={tournament.id} />}
        {tab === 'rules' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 text-gray-300">
            <h3 className="text-white font-semibold mb-3">Reglamento</h3>
            <p className="text-gray-300 whitespace-pre-wrap text-sm">{tournament.rules || 'Reglamento no especificado'}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
