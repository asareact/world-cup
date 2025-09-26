'use client'

// Import core libraries and hooks
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// Import custom components
import { MobileNavigation } from '@/components/tournaments/mobile-navigation'
import { PublicTournamentOverview } from '@/components/tournaments/public-tournament-overview'
import { TournamentAnimatedLoader } from '@/components/tournaments/tournament-animated-loader'
import { TournamentGroups } from '@/components/tournaments/tournament-groups'
import { TournamentPublicLayout } from '@/components/tournaments/tournament-public-layout'
import { TournamentRepechage } from '@/components/tournaments/tournament-repechage'
import { TournamentStandings } from '@/components/tournaments/tournament-standings'
import { TournamentTeamDetails } from '@/components/tournaments/tournament-team-details'

// Import hooks and utilities
import { DesktopTeamAvatarRail } from '@/components/tournaments/DesktopTeamAvatarRail'
import { MobileSidebarWrapper } from '@/components/tournaments/MobileSideWrapper'
import { TournamentLatestResults } from '@/components/tournaments/tournament-latest-results'
import { TournamentStatsOverview } from '@/components/tournaments/tournament-stats-overview'
import { TournamentTopScorers } from '@/components/tournaments/tournament-top-scorers'
import { Team } from '@/lib/database'
import { getLatestMatches, getTopScorers, useTournament } from '@/lib/hooks/use-tournament'

interface LatestResultsMatch {
  id: string
  home_team: { name: string } | null
  away_team: { name: string } | null
  home_score: number | null
  away_score: number | null
  scheduled_at: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

interface TournamentTeamEntry {
  id?: string;
  teams?: Team | null;
  team?: Team | null;
  [key: string]: any;
}

const extractTeamsFromEntries = (entries: TournamentTeamEntry[] | null | undefined): Team[] => {
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
      return entry as Team
    })
    .filter((team): team is Team => Boolean(team && team?.id))
}

export default function TournamentPublicPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tournamentId = params?.id
  const { tournament, loading, error } = useTournament(tournamentId)

  const [showLoader, setShowLoader] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [teamDetails, setTeamDetails] = useState<any>(null)
  const [teamPlayers, setTeamPlayers] = useState<any[]>([])



  const [topScorers, setTopScorers] = useState<any[]>([])
  const [latestMatches, setLatestMatches] = useState<LatestResultsMatch[]>([])

  // Get active section from URL query parameter or default to overview
  const section = searchParams.get('section') || 'overview'

  // Determine active section for mobile navigation
  const mobileActiveSection = section

  // Define navigation anchors for both mobile and desktop
  const anchors = [
    { href: `?section=overview`, label: 'Inicio' },
    { href: `?section=standings`, label: 'Tabla' },
    // { href: `?section=groups`, label: 'Grupos' }, // Hidden for now
    { href: `/tournaments/${tournamentId}/public/calendar`, label: 'Calendario' },
    // { href: `?section=repechage`, label: 'Repechaje' }, // Hidden for now
    { href: `?section=top-scorers`, label: 'Goleadores' },
    { href: `?section=ideal-5`, label: 'Ideal 5' },
    { href: `?section=match-stats`, label: 'Estadísticas' },
  ]

  // Mobile navigation handler
  const handleSectionChange = (href: string) => {
    // Check if it's a calendar link (external URL)
    if (href.startsWith('/')) {
      // Navigate to the calendar page
      router.push(href)
      return
    }

    // Handle regular section changes
    const section = href.split('=')[1] || 'overview'

    // Set navigation source as internal
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tournamentNavigationSource', 'internal');
    }

    // Update URL without full page reload
    const url = new URL(window.location.href)
    url.searchParams.set('section', section)
    window.history.pushState({}, '', url.toString())
    // Trigger section change
    window.dispatchEvent(new Event('popstate'))
  }

  // Show loader only when navigating from outside the tournament public pages
  useEffect(() => {
    if (tournamentId && typeof window !== 'undefined') {
      // Check if we're navigating from within tournament pages
      const navigationSource = sessionStorage.getItem('tournamentNavigationSource');
      const isFromInternal = navigationSource === 'internal';

      // Set current navigation source as internal for future navigations within the tournament
      sessionStorage.setItem('tournamentNavigationSource', 'internal');

      // If coming from internal navigation, don't show loader
      if (isFromInternal) {
        return;
      }

      // Show loader for external navigation every time (don't remember it)
      // We show it immediately when we know the tournamentId, then replace with name when available
      setShowLoader(true);
    }

    // Cleanup function to reset navigation source when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('tournamentNavigationSource');
      }
    };
  }, [tournamentId]);

  // Fetch real data
  useEffect(() => {
    if (tournamentId) {
      // Fetch top scorers
      getTopScorers(tournamentId, 10).then((rows: any) => {
        // Map TopScorerRow to TopScorer interface
        const mappedScorers: any[] = rows.map((row: any) => ({
          player_id: row.player?.id || '',
          player_name: row.player?.name || 'Jugador desconocido',
          team_name: row.player?.teams?.name || 'Equipo desconocido', // Corregido: accediendo a través de player
          team_id: row.player?.team_id || '', // Usamos el team_id directamente de player
          goals: row.goals || 0,
          player_photo_url: row.player?.photo_url || null
        })).filter((scorer: any) => scorer.player_id && scorer.player_name);

        setTopScorers(mappedScorers)
      }).catch((err: any) => {
        console.error('Error fetching top scorers:', err)
        setTopScorers([])
      })

      // Fetch latest matches
      getLatestMatches(tournamentId, 5).then((data: any) => {
        // Transform the data to match the component's expected format
        const transformedMatches = (data || []).map((match: any) => ({
          id: match.id,
          home_team: match.home_team ? { name: match.home_team.name } : null,
          away_team: match.away_team ? { name: match.away_team.name } : null,
          home_score: match.home_score,
          away_score: match.away_score,
          scheduled_at: match.scheduled_at,
          status: match.status
        }));
        setLatestMatches(transformedMatches)

      }).catch((err: any) => {
        console.error('Error fetching latest matches:', err)
        setLatestMatches([])
      })
    }
  }, [tournamentId]);

  const handleLoaderComplete = () => {
    setShowLoader(false);
  };

 const fetchTeamDetails = async (teamId: string) => {
    if (!teamId) return;

    try {
      // Fetch team details
      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) throw new Error('Failed to fetch team');

      const teamData = await response.json();

      // For now, set the basic team data with placeholders
      // In a real implementation, this would come from a backend API
      const teamStats = {
        id: teamData.id,
        name: teamData.name,
        logo_url: teamData.logo_url,
        wins: teamData.wins || 0,
        draws: teamData.draws || 0,
        losses: teamData.losses || 0,
        goals_for: teamData.goals_for || 0,
        goals_against: teamData.goals_against || 0,
        points: teamData.points || 0,
        position: teamData.position || 0
      };

      // Fetch team players
      const playersResponse = await fetch(`/api/teams/${teamId}/players`);
      if (playersResponse.ok) {
        const playersData = await playersResponse.json();
        setTeamPlayers(playersData || []);
      } else {
        setTeamPlayers([]);
      }

      setTeamDetails(teamStats);
      setSelectedTeamId(teamId);
    } catch (error) {
      console.error('Error fetching team details:', error);
      // Set basic team data from existing tournament teams as fallback
      const tournamentTeams = extractTeamsFromEntries(tournament?.tournament_teams);
      const tournamentTeam = tournamentTeams.find(t => t.id === teamId);
      if (tournamentTeam) {
        setTeamDetails({
          id: tournamentTeam.id,
          name: tournamentTeam.name,
          logo_url: tournamentTeam.logo_url,
          wins: 0, // Placeholder
          draws: 0, // Placeholder
          losses: 0, // Placeholder
          goals_for: 0, // Placeholder
          goals_against: 0, // Placeholder
          points: 0, // Placeholder
          position: 0 // Placeholder
        });
        setTeamPlayers([]);
      }
      setSelectedTeamId(teamId);
    }
  };

  const handleCloseTeamDetails = () => {
    setSelectedTeamId(null)
    setTeamDetails(null)
    setTeamPlayers([])
  }

  // Set navigation source as external on initial load if not already set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Always show loader on first mount
      const hasShownLoader = sessionStorage.getItem(`tournament_${tournamentId}_loader_shown`);
      if (!hasShownLoader) {
        setShowLoader(true);
        sessionStorage.setItem(`tournament_${tournamentId}_loader_shown`, 'true');
      }
    }
  }, [tournamentId]);

  // Show loader for first visit only
  if (showLoader) {
    return (
      <TournamentAnimatedLoader
        tournamentName={tournament?.name || 'Torneo de Futsal'}
        onComplete={handleLoaderComplete}
      />
    );
  }

  // Show loading spinner while fetching tournament data
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-3 text-white">Cargando torneo...</span>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <TournamentPublicLayout anchors={anchors}>
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            {error || 'Torneo no encontrado'}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Reintentar
          </button>
        </div>
      </TournamentPublicLayout>
    )
  }

  const tournamentTeams = extractTeamsFromEntries(tournament?.tournament_teams)

  return (
    <TournamentPublicLayout anchors={anchors}>
      {/* Mobile Navigation - Hidden on desktop */}
      <MobileNavigation
        anchors={anchors}
        activeSection={section}
        onSectionChange={handleSectionChange}
      />
      <DesktopTeamAvatarRail teams={tournamentTeams} onTeamClick={fetchTeamDetails} key={tournamentId} tournamentId={tournamentId} />

      <div className="grid grid-cols-1 gap-4 pb-20 md:pb-0 md:gap-6 md:grid-cols-4">
        {/* Main Content */}
        <div className="md:col-span-3">
          {section === 'overview' && (
            <div className="space-y-6">
              <PublicTournamentOverview
              fetchTeamDetails={fetchTeamDetails}
                tournament={tournament}
                teams={tournamentTeams}
                matches={Array.isArray(tournament?.matches) ? tournament.matches : []}
                topScorers={topScorers}
                matchesLoading={false}
                onNavigate={handleSectionChange}
              />
            </div>
          )}

          {section === 'standings' && (
            <TournamentStandings
              tournament={tournament}
              teams={tournamentTeams}
              matches={Array.isArray(tournament?.matches) ? tournament.matches : []}
              onTeamClick={fetchTeamDetails}
            />
          )}

          {/* {section === 'groups' && (
            <TournamentGroups 
              tournament={tournament}
              teams={tournamentTeams}
              matches={Array.isArray(tournament?.matches) ? tournament.matches : []}
              onTeamClick={fetchTeamDetails}
            />
          )} */}
          
          {/* {section === 'repechage' && (
            <TournamentRepechage 
              tournament={tournament}
              teams={tournamentTeams}
              matches={Array.isArray(tournament?.matches) ? tournament.matches : []}
            />
          )} */}

          {(section === 'match-stats' || section === 'top-scorers' || section === 'ideal-5') && (
            <TournamentStatsOverview
              tournamentId={tournamentId || ''}
            />
          )}
        </div>

        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="md:col-span-1 hidden md:block">
          <MobileSidebarWrapper>
            <TournamentLatestResults matches={latestMatches} />
            <TournamentTopScorers scorers={topScorers} />
          </MobileSidebarWrapper>
        </div>
      </div>

      {/* Team Details Modal */}
      <TournamentTeamDetails
        team={teamDetails}
        players={teamPlayers}
        isOpen={!!selectedTeamId}
        onClose={handleCloseTeamDetails}
      />
    </TournamentPublicLayout>
  )
}