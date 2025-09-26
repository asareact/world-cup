'use client'

import { useTournament } from '@/lib/hooks/use-tournament'
import { useTeams } from '@/lib/hooks/use-teams'
import { useAuth } from '@/lib/auth-context'
import { TournamentRoundCalendar } from '@/components/tournaments/calendar'
import { Match } from '@/lib/database'

type MatchRow = {
  id: string
  scheduled_at: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  home_score: number
  away_score: number
  home_team?: { name: string, logo_url?: string | null } | null
  away_team?: { name: string, logo_url?: string | null } | null
}

interface Tournament {
  id: string
  name: string
  creator_id: string
  status: 'draft' | 'active' | 'completed' | 'paused'
  matches?: MatchRow[]
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'groups'
  start_date?: string | null
}


export function TournamentMatches({ tournament }: { tournament: Tournament }) {
  const { teams } = useTeams()
  const { tournament: fullTournament } = useTournament(tournament.id)
  const { user } = useAuth() // Get current user from auth context

  // If the tournament has matches, use them; otherwise use the matches from the prop
  const matches = fullTournament?.matches || tournament.matches || []
  const teamsData = teams || []

  // Determine if the user is an admin (tournament creator)
  const isTournamentAdmin = user?.id === tournament.creator_id;

  const handleScheduleGenerated = (updatedMatches: any[]) => {
    // Optionally trigger a refresh of the tournament data in the parent component
    // This could involve calling a function to refetch tournament data
    console.log('Schedule updated with', updatedMatches.length, 'matches');
  };

  return (
    <TournamentRoundCalendar 
      tournamentId={tournament.id}
      teams={teamsData}
      initialMatches={matches as Match[]}
      isAdmin={isTournamentAdmin}
      startDate={tournament.start_date ? new Date(tournament.start_date) : undefined}
      onScheduleGenerated={handleScheduleGenerated}
    />
  )
}



