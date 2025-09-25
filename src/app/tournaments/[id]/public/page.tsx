'use client'

import { TournamentAnimatedLoader } from '@/components/tournaments/tournament-animated-loader'
import { TournamentLatestResults } from '@/components/tournaments/tournament-latest-results'
import { TournamentPublicLayout } from '@/components/tournaments/tournament-public-layout'
import { TournamentTeamDetails } from '@/components/tournaments/tournament-team-details'
import { TournamentMatchStats } from '@/components/tournaments/tournament-match-stats'
import { TournamentStatsOverview } from '@/components/tournaments/tournament-stats-overview'

// Add custom scrollbar styles
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #1f2937; /* gray-800 */
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563; /* gray-600 */
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280; /* gray-500 */
  }
  
  /* For Firefox */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #4b5563 #1f2937;
  }
`
import { TournamentTopLeaders } from '@/components/tournaments/tournament-top-leaders'
import { TournamentTopScorers } from '@/components/tournaments/tournament-top-scorers'
import { getLatestMatches, getTopScorers, useTournament } from '@/lib/hooks/use-tournament'
import { Calendar, Shuffle, Target, Trophy, Shield, Users, BarChart3, Square } from 'lucide-react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
// Mobile-optimized navigation tabs
import { MobileNavigation } from '@/components/tournaments/mobile-navigation'
import { useEffect, useState } from 'react'
import { Match } from '@/lib/database'


interface Team {
  id: string
  name: string
  logo_url?: string | null
}



interface TopScorer {
  player_id: string
  player_name: string
  team_name: string
  team_id: string
  goals: number
  player_photo_url?: string | null
}



const TEAM_PLACEHOLDER_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500'
] as const

const getTeamPlaceholderColor = (teamId: string | undefined | null) => {
  if (!teamId) return TEAM_PLACEHOLDER_COLORS[0]
  const numericId = parseInt(teamId as string, 36)
  if (Number.isNaN(numericId)) return TEAM_PLACEHOLDER_COLORS[0]
  const index = Math.abs(numericId) % TEAM_PLACEHOLDER_COLORS.length
  return TEAM_PLACEHOLDER_COLORS[index]
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

interface StandingsEntry {
  position: number
  team: Team
  played: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

// Interface for generated schedule items
interface ScheduleItem {
  id: string
  date: string
  matches: Match[]
}

const calculateStandings = (teams: Team[], matches: Match[]): StandingsEntry[] => {
  // Initialize standings for all teams
  const standingsMap: Record<string, StandingsEntry> = {};
  
  teams.forEach(team => {
    if (!team?.id) return; // Skip if team id is undefined
    
    standingsMap[team.id] = {
      position: 0, // Will be calculated later
      team,
      played: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0
    };
  });

  // Process completed matches to update stats
  matches
    .filter(match => match?.status === 'completed' && match?.home_score !== null && match?.away_score !== null)
    .forEach(match => {
      if (!match?.home_team || !match?.away_team) return;
      
      // Get the team IDs from the match objects, or find by name if ID is missing
      let homeTeamId = match.home_team?.id || '';
      let awayTeamId = match.away_team?.id || '';
      
      // If no ID, find team by name in our teams array
      if (!homeTeamId && match.home_team?.name) {
        const matchingTeam = teams.find(t => t.name === match.home_team?.name);
        homeTeamId = matchingTeam?.id || '';
      }
      
      if (!awayTeamId && match.away_team?.name) {
        const matchingTeam = teams.find(t => t.name === match.away_team?.name);
        awayTeamId = matchingTeam?.id || '';
      }
      
      if (!homeTeamId || !awayTeamId) return;
      
      const homeScore = match.home_score ?? 0;
      const awayScore = match.away_score ?? 0;
      
      // Update home team stats
      if (standingsMap[homeTeamId]) {
        standingsMap[homeTeamId].played += 1;
        standingsMap[homeTeamId].goalsFor += homeScore;
        standingsMap[homeTeamId].goalsAgainst += awayScore;
        standingsMap[homeTeamId].goalDifference = 
          standingsMap[homeTeamId].goalsFor - standingsMap[homeTeamId].goalsAgainst;
        
        // Calculate points based on match result
        if (homeScore > awayScore) {
          standingsMap[homeTeamId].points += 3; // Home win
        } else if (homeScore === awayScore) {
          standingsMap[homeTeamId].points += 1; // Draw
        }
      }
      
      // Update away team stats
      if (standingsMap[awayTeamId]) {
        standingsMap[awayTeamId].played += 1;
        standingsMap[awayTeamId].goalsFor += awayScore;
        standingsMap[awayTeamId].goalsAgainst += homeScore;
        standingsMap[awayTeamId].goalDifference = 
          standingsMap[awayTeamId].goalsFor - standingsMap[awayTeamId].goalsAgainst;
        
        // Calculate points based on match result
        if (awayScore > homeScore) {
          standingsMap[awayTeamId].points += 3; // Away win
        } else if (awayScore === homeScore) {
          standingsMap[awayTeamId].points += 1; // Draw
        }
      }
    });

  // Convert to array and sort by points, then by goal difference, then by goals scored
  let standingsArray = Object.values(standingsMap).filter(entry => entry !== undefined) as StandingsEntry[];
  
  standingsArray = standingsArray.sort((a, b) => {
    if (!a || !b) return 0; // Handle undefined entries
    if (b.points !== a.points) return b.points - a.points; // Higher points first
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference; // Higher goal difference first
    return b.goalsFor - a.goalsFor; // Higher goals for first
  });

  // Assign positions based on sorted order
  standingsArray.forEach((entry, index) => {
    if (entry) {
      entry.position = index + 1;
    }
  });

  return standingsArray;
};

// Mobile-optimized team logos banner
const MobileTeamLogosBanner = ({ 
  teams,
  tournamentId,
  onTeamClick
}: { 
  teams: Team[]
  tournamentId?: string
  onTeamClick: (teamId: string) => void
}) => {
  // Track logos that fail to load
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

  const handleImageError = (teamId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(teamId));
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 mb-4 md:p-6 md:mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Equipos Participantes</h2>
      <div className="flex overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-4 w-full min-w-max">
          {teams.map((team) => (
            <div 
              key={team.id}
              className="flex-shrink-0 flex flex-col items-center cursor-pointer"
              onClick={() => {
                onTeamClick(team.id);
              }}
            >
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700 overflow-hidden shadow-lg">
                {team.logo_url && team.logo_url !== '' && !imageLoadErrors.has(team.id) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={team.logo_url} 
                    alt={team.name} 
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(team.id)}
                  />
                ) : (
                  <div className={`w-full h-full ${getTeamPlaceholderColor(team.id)} flex items-center justify-center`}>
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-300 text-center max-w-[4rem] truncate">
                {team.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Mobile-optimized tournament overview
const MobileTournamentOverview = ({ 
  tournament,
  teams = [],
  matches = []
}: { 
  tournament: any;
  teams?: any[];
  matches?: any[];
}) => {
  const playedPercentage = tournament?.matches_count && tournament?.matches_count > 0 
    ? Math.round((tournament?.played_matches / tournament?.matches_count) * 100) 
    : 0

  return (
    <div className="space-y-4">
      {/* Tournament Info Card - Mobile Optimized */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{tournament?.name || 'Torneo de Fútbol'}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {tournament?.status === 'active' ? 'Torneo en curso' : 
               tournament?.status === 'completed' ? 'Torneo finalizado' :
               tournament?.status === 'paused' ? 'Torneo pausado' : 'Próximamente'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 text-gray-300">
              <Calendar className="h-4 w-4" />
              <span>
                {tournament?.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'Por definir'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar - Mobile Optimized */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Progreso</span>
            <span className="text-white font-medium">{playedPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${playedPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <span>{tournament?.played_matches || 0} jugados</span>
            <span>{tournament?.matches_count || 0} totales</span>
          </div>
        </div>
        
        {/* Teams Count - Mobile Optimized */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Equipos registrados</span>
            <span className="text-white font-medium">{tournament?.teams_count || 0}</span>
          </div>
        </div>
      </div>
      
      {/* Quick Links Grid - Mobile Optimized */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Acceso Rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '#standings', label: 'Tabla', icon: Trophy, color: 'green' },
            { href: '#groups', label: 'Grupos', icon: Users, color: 'blue' },
            { href: '#repechage', label: 'Repechaje', icon: Shuffle, color: 'purple' },
            { href: '#top-scorers', label: 'Goleadores', icon: Target, color: 'yellow' },
          ].map((link) => {
            const Icon = link.icon
            return (
              <a
                key={link.href}
                href={link.href}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 hover:border-green-500/50 transition-all group"
              >
                <div className="flex items-center space-x-2">
                  <div className={`flex-shrink-0 p-2 bg-${link.color}-600/20 rounded-lg group-hover:bg-${link.color}-600/30 transition-colors`}>
                    <Icon className={`h-4 w-4 text-${link.color}-400`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white group-hover:text-green-400 transition-colors text-sm">
                      {link.label}
                    </h3>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
      
      {/* No Results Message - Mobile Optimized */}
      {tournament?.played_matches === 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
          <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">¡Próximamente!</h3>
          <p className="text-gray-400 text-sm">
            Este torneo aún no tiene resultados disponibles. 
            ¡Vuelve pronto para ver las estadísticas!
          </p>
        </div>
      )}
    </div>
  )
}

const DesktopTeamAvatarRail = ({
  teams,
  tournamentId,
  onTeamClick,
}: {
  teams: Team[]
  tournamentId?: string
  onTeamClick: (teamId: string) => void
}) => {
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

  if (!teams.length) return null

  const maxVisible = 14
  const visibleTeams = teams.slice(0, maxVisible)

  const handleImageError = (teamId: string) => {
    setImageLoadErrors((prev) => {
      const updated = new Set(prev)
      updated.add(teamId)
      return updated
    })
  }

  const handleTeamRedirect = (teamId: string) => {
    onTeamClick(teamId);
  }

  return (
    <div className="hidden md:block">
      <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
        {visibleTeams.map((team) => (
          <div key={team.id} className="relative group">
            <button
              type="button"
              onClick={() => handleTeamRedirect(team.id)}
              className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-green-500/60 hover:shadow-green-500/20"
              aria-label={`Ver detalles de ${team.name}`}
            >
              {team.logo_url && team.logo_url !== '' && !imageLoadErrors.has(team.id) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.logo_url as string}
                  alt={team.name}
                  className="h-full w-full rounded-full object-cover"
                  onError={() => handleImageError(team.id)}
                />
              ) : (
                <div className={`flex h-full w-full items-center rounded-full justify-center ${getTeamPlaceholderColor(team.id)}`}>
                  <Shield className="h-8 w-8 text-white" />
                </div>
              )}
            </button>
            <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className="relative bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 min-w-max shadow-lg shadow-black/30">
                <div className="text-xs font-semibold text-white whitespace-nowrap">{team.name}</div>
                <div className="text-xs text-gray-400 whitespace-nowrap">Haz clic para ver</div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900/95 border-t border-l border-gray-700"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
const DesktopTournamentLanding = ({
  tournament,
  teams = [],
  matches = [],
  topScorers = [],
  onNavigate,
}: {
  tournament: any
  teams?: Team[]
  matches?: any[]
  topScorers?: TopScorer[]
  onNavigate: (section: string) => void
}) => {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const tournamentId = params?.id
  const totalTeams = teams.length
  const normalizedMatches: Match[] = Array.isArray(matches) ? (matches.filter(Boolean) as Match[]) : []
  const playedMatches = normalizedMatches.filter((match) => match?.status === 'completed').length
  const totalMatches = normalizedMatches.length
  const scheduledMatches = normalizedMatches.filter((match) => match?.status === 'scheduled').length
  const upcomingMatch = normalizedMatches
    .filter((match) => match?.status === 'scheduled' && match?.scheduled_at)
    .sort((a, b) => {
      const aDate = a?.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY
      const bDate = b?.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY
      return aDate - bDate
    })[0]

  const topScorer = topScorers[0]

  const statusThemes: Record<string, { label: string; badge: string }> = {
    active: { label: 'Torneo en curso', badge: 'border-green-400/40 bg-green-500/10 text-green-200' },
    completed: { label: 'Torneo finalizado', badge: 'border-blue-400/40 bg-blue-500/10 text-blue-200' },
    paused: { label: 'Torneo pausado', badge: 'border-yellow-400/40 bg-yellow-500/10 text-yellow-200' },
    draft: { label: 'Proximamente', badge: 'border-gray-500/40 bg-gray-500/10 text-gray-200' },
  }
  const status = tournament?.status || 'draft'
  const statusTheme = statusThemes[status] || statusThemes.draft

  const startDateLabel = tournament?.start_date
    ? new Date(tournament.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Fecha por definir'

  const handleNavigate = (target: string) => {
    if (target === 'calendar') {
      // Navigate to the calendar page
      if (tournamentId && typeof tournamentId === 'string') {
        router.push(`/tournaments/${encodeURIComponent(tournamentId)}/public/calendar`)
      }
    } else {
      onNavigate(target)
    }
  }

  const quickLinks = [
    {
      section: 'standings',
      title: 'Tabla general',
      description: 'Revisa la posicion de cada equipo.',
      icon: Trophy,
    },
    {
      section: 'groups',
      title: 'Fase de grupos',
      description: 'Sigue la configuracion y los cruces.',
      icon: Users,
    },
    {
      section: 'calendar',
      title: 'Calendario',
      description: 'Consulta las fechas de los partidos.',
      icon: Calendar,
    },
    {
      section: 'repechage',
      title: 'Repechaje',
      description: 'Controla las llaves adicionales.',
      icon: Shuffle,
    },
    {
      section: 'match-stats', // Redirigido de top-scorers
      title: 'Goleadores',
      description: 'Ranking de anotadores del torneo.',
      icon: Target,
    },
    {
      section: 'match-stats', // Redirigido de ideal-5
      title: 'Ideal 5',
      description: 'Seleccion de quinteto destacado.',
      icon: Shield,
    },
    {
      section: 'match-stats',
      title: 'Estadísticas',
      description: 'Estadísticas detalladas de partidos.',
      icon: BarChart3,
    },
  ]

  return (
    <div className="hidden md:flex flex-col space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 px-16 py-14">
        <div className="absolute left-12 top-12 h-40 w-40 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-16">
          <div className="max-w-xl space-y-6">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${statusTheme.badge}`}>
              {statusTheme.label}
            </span>
            <h1 className="text-4xl font-bold text-white leading-tight">{tournament?.name || 'Torneo de futsal'}</h1>
            <p className="text-base text-gray-300">
              {tournament?.description || 'Comparte una experiencia profesional con tu equipo y sigue cada instancia de la competencia en tiempo real.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-4 py-2">
                <Calendar className="h-4 w-4 text-green-300" />
                <span>{startDateLabel}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-4 py-2">
                <Users className="h-4 w-4 text-green-300" />
                <span>{totalTeams} equipos</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-4 py-2">
                <Trophy className="h-4 w-4 text-green-300" />
                <span>{playedMatches} partidos jugados</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleNavigate('standings')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Ver tabla
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('match-stats')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/60 px-5 py-3 text-sm font-semibold text-green-200 transition hover:border-green-400 hover:bg-green-500/10 hover:text-white"
              >
                Estadísticas
              </button>
            </div>
          </div>
          <div className="grid w-80 grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
              <p className="text-sm text-gray-400">Partidos totales</p>
              <p className="mt-2 text-3xl font-bold text-white">{totalMatches}</p>
              <p className="mt-1 text-xs text-gray-500">Incluye programados y finalizados</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
              <p className="text-sm text-gray-400">Partidos pendientes</p>
              <p className="mt-2 text-3xl font-bold text-white">{Math.max(totalMatches - playedMatches, 0)}</p>
              <p className="mt-1 text-xs text-gray-500">Aun por disputarse</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
              <p className="text-sm text-gray-400">Partidos jugados</p>
              <p className="mt-2 text-3xl font-bold text-white">{playedMatches}</p>
              <p className="mt-1 text-xs text-gray-500">Resultados confirmados</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5">
              <p className="text-sm text-gray-400">Partidos programados</p>
              <p className="mt-2 text-3xl font-bold text-white">{scheduledMatches}</p>
              <p className="mt-1 text-xs text-gray-500">Con fecha definida</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {quickLinks.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.section}
              type="button"
              onClick={() => handleNavigate(item.section)}
              className="group rounded-2xl border border-gray-800 bg-gray-900/70 p-6 text-left transition hover:border-green-500/40 hover:bg-gray-900 flex flex-col h-full"
            >
              <div className="flex justify-between items-start flex-shrink-0">
                <div className="rounded-xl bg-green-500/10 p-3 text-green-300 transition group-hover:bg-green-500/20">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col flex-grow justify-between">
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{item.description}</p>
                </div>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-green-300 group-hover:text-green-200">
                  Ver seccion
                </span>
              </div>
            </button>
          )
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Figura destacada</h3>
            <Target className="h-5 w-5 text-green-300" />
          </div>
          {topScorer ? (
            <div className="mt-6 space-y-2">
              <p className="text-2xl font-bold text-white">{topScorer.player_name}</p>
              <p className="text-sm text-gray-400">{topScorer.team_name}</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-200">
                {topScorer.goals} goles
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-400">Aun no hay goleadores destacados. Vuelve mas tarde para ver las estadisticas.</p>
          )}
        </div>
        <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Proximo partido</h3>
            <Calendar className="h-5 w-5 text-green-300" />
          </div>
          {upcomingMatch ? (
            <div className="mt-6 space-y-3">
              <p className="text-xl font-semibold text-white">
                {upcomingMatch.home_team?.name || 'Equipo A'} vs {upcomingMatch.away_team?.name || 'Equipo B'}
              </p>
              <p className="text-sm text-gray-400">
                {upcomingMatch.scheduled_at
                  ? new Date(upcomingMatch.scheduled_at).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Horario por definir'}
              </p>
              <button
                type="button"
                onClick={() => handleNavigate('standings')}
                className="inline-flex items-center gap-2 text-sm font-medium text-green-300 transition hover:text-green-200"
              >
                Ver detalles
              </button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-400">No hay partidos programados por el momento. Una vez confirmado el calendario lo veras aqui.</p>
          )}
        </div>
      </section>
    </div>
  )
}
// Mobile-optimized sidebar components wrapper
const MobileSidebarWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="space-y-4 md:space-y-6">
      {children}
    </div>
  )
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
  interface LatestResultsMatch {
    id: string
    home_team: { name: string } | null
    away_team: { name: string } | null
    home_score: number | null
    away_score: number | null
    scheduled_at: string | null
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  }
  
  const [topScorers, setTopScorers] = useState<TopScorer[]>([])
  const [latestMatches, setLatestMatches] = useState<LatestResultsMatch[]>([])
  
  // Get active section from URL query parameter or default to overview
  const section = searchParams.get('section') || 'overview'
  
  // Determine active section for mobile navigation
  const mobileActiveSection = section
  
  // Define navigation anchors for both mobile and desktop
  const anchors = [
    { href: `?section=overview`, label: 'Inicio' },
    { href: `?section=standings`, label: 'Tabla' },
    { href: `?section=groups`, label: 'Grupos' },
    { href: `/tournaments/${tournamentId}/public/calendar`, label: 'Calendario' },
    { href: `?section=repechage`, label: 'Repechaje' },
    { href: `?section=match-stats`, label: 'Goleadores' }, // Redirigido a estadísticas
    { href: `?section=match-stats`, label: 'Ideal 5' }, // Redirigido a estadísticas
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
        const mappedScorers: TopScorer[] = rows.map((row: any) => ({
          player_id: row.player?.id || '',
          player_name: row.player?.name || 'Jugador desconocido',
          team_name: row.player?.teams?.name || 'Equipo desconocido', // Corregido: accediendo a través de player
          team_id: row.player?.team_id || '', // Usamos el team_id directamente de player
          goals: row.goals || 0,
          player_photo_url: row.player?.photo_url || null
        })).filter((scorer: TopScorer) => scorer.player_id && scorer.player_name);
        
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
  
  // Mobile-optimized team click handler
  const handleTeamClick = (teamId: string) => {
    if (tournamentId) {
      window.location.href = `/teams/${teamId}?tournament=${tournamentId}`
    }
  }
  
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
      const tournamentTeam = extractTeamsFromEntries(tournament?.tournament_teams).find(t => t.id === teamId);
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
      <DesktopTeamAvatarRail
        teams={tournamentTeams}
        tournamentId={tournamentId}
        onTeamClick={fetchTeamDetails}
      />
      
      <div className="grid grid-cols-1 gap-4 pb-20 md:pb-0 md:gap-6 md:grid-cols-4">
        {/* Main Content */}
        <div className="md:col-span-3">
          {section === 'overview' && (
            <div className="space-y-4 md:space-y-10">
              <div className="space-y-4 md:hidden">
                <MobileTeamLogosBanner 
                  teams={tournamentTeams} 
                  tournamentId={tournamentId}
                  onTeamClick={fetchTeamDetails}
                />
                <MobileTournamentOverview 
                  tournament={{
                    id: tournament?.id || '',
                    name: tournament?.name || '',
                    status: tournament?.status || 'draft',
                    start_date: tournament?.start_date || null,
                    end_date: tournament?.end_date || null,
                    teams_count: tournament?.tournament_teams?.length || 0,
                    matches_count: tournament?.matches?.length || 0,
                    played_matches: tournament?.matches?.filter((m: any) => m.status === 'completed').length || 0,
                    rules: tournament?.rules || undefined
                  }}
                  teams={tournament?.tournament_teams || []}
                  matches={tournament?.matches || []}
                />
              </div>
              <DesktopTournamentLanding 
                tournament={tournament}
                teams={tournamentTeams}
                matches={tournament?.matches || []}
                topScorers={topScorers}
                onNavigate={handleSectionChange}
              />
            </div>
          )}
          
          {section === 'standings' && (
            <div id="standings" className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
              <h2 className="text-xl font-bold text-white mb-4">Tabla de Posiciones</h2>
              {(tournament?.tournament_teams?.length || 0) >= 9 ? (
                <div className="overflow-x-auto">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-3 px-4 text-left text-gray-400 font-medium text-sm">Pos</th>
                          <th className="py-3 px-4 text-left text-gray-400 font-medium text-sm">Equipo</th>
                          <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">PJ</th>
                          <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">Pts</th>
                          <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">GF</th>
                          <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">GC</th>
                          <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">DG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculateStandings(
                          extractTeamsFromEntries(tournament?.tournament_teams) || [],
                          tournament?.matches || []
                        ).map((entry) => (
                          entry ? (
                          <tr 
                            key={entry.team?.id || `standings-${entry.position}`} 
                            className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors cursor-pointer"
                            onClick={() => {
                              if (entry?.team?.id) {
                                fetchTeamDetails(entry.team.id);
                              }
                            }}
                          >
                            <td className="py-3 px-4 text-gray-300 font-medium">{entry.position || 0}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                                  {entry?.team?.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                      src={entry.team.logo_url} 
                                      alt={entry.team.name || 'Equipo'} 
                                      className="w-full h-full object-cover" 
                                    />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center ${getTeamPlaceholderColor(entry.team?.id || '')}`}>
                                      <Shield className="h-4 w-4 text-white" />
                                    </div>
                                  )}
                                </div>
                                <span className="text-white font-medium">{entry.team?.name || 'Equipo desconocido'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">{entry.played || 0}</td>
                            <td className="py-3 px-4 text-center text-white font-bold">{entry.points || 0}</td>
                            <td className="py-3 px-4 text-center text-gray-300">{entry.goalsFor || 0}</td>
                            <td className="py-3 px-4 text-center text-gray-300">{entry.goalsAgainst || 0}</td>
                            <td className="py-3 px-4 text-center text-gray-300 font-medium">{entry.goalDifference !== undefined && entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference || 0}</td>
                          </tr>
                          ) : null
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Mobile Table */}
                  <div className="md:hidden">
                    <div className="space-y-3">
                      {calculateStandings(
                        extractTeamsFromEntries(tournament?.tournament_teams) || [],
                        tournament?.matches || []
                      ).map((entry) => (
                        entry ? (
                        <div 
                          key={entry.team?.id || `standings-${entry.position}`} 
                          className="bg-gray-800/50 rounded-xl p-3 flex items-center justify-between hover:bg-gray-800 transition-colors cursor-pointer"
                          onClick={() => {
                              fetchTeamDetails(entry.team.id);
                            }}
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                              {entry?.team?.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={entry.team.logo_url} 
                                  alt={entry.team.name || 'Equipo'} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center ${getTeamPlaceholderColor(entry.team?.id || '')}`}>
                                  <Shield className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm">{entry.position || 0}</div>
                              <div className="text-xs text-gray-400">PJ: {entry.played || 0} | Pts: {entry.points || 0}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-white">{entry.goalsFor || 0}:{entry.goalsAgainst || 0}</div>
                            <div className="text-xs text-gray-400">DG: {entry.goalDifference !== undefined && entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference || 0}</div>
                          </div>
                        </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                    <Trophy className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Tabla de Posiciones</h3>
                  <p className="text-gray-400 mb-4">La tabla de posiciones se mostrará aquí una vez que haya al menos 9 equipos inscritos.</p>
                  <div className="bg-gray-800/50 rounded-xl p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Equipos registrados</span>
                        <span className="text-white font-medium">{tournament?.tournament_teams?.length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Equipos necesarios</span>
                        <span className="text-white font-medium">9</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Estado del torneo</span>
                        <span className="text-white font-medium capitalize">
                          {tournament?.status === 'active' ? 'En curso' : 
                           tournament?.status === 'completed' ? 'Finalizado' :
                           tournament?.status === 'paused' ? 'Pausado' : 'Próximamente'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {section === 'groups' && (
            <div id="groups" className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
              <h2 className="text-xl font-bold text-white mb-4">Fase de Grupos</h2>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                  <Users className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Fase de Grupos</h3>
                <p className="text-gray-400 mb-4">La fase de grupos se organizará cuando se complete el registro de equipos.</p>
                <div className="bg-gray-800/50 rounded-xl p-4 max-w-md mx-auto">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Equipos necesarios</span>
                      <span className="text-white font-medium">8-16</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Equipos registrados</span>
                      <span className="text-white font-medium">{tournament?.tournament_teams?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Estado</span>
                      <span className="text-white font-medium">
                        {(tournament?.tournament_teams?.length || 0) >= 8 ? 'Suficientes equipos' : 'Faltan equipos'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {section === 'repechage' && (
            <div id="repechage" className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
              <h2 className="text-xl font-bold text-white mb-4">Repechaje</h2>
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                  <Shuffle className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Repechaje</h3>
                <p className="text-gray-400 mb-4">El repechaje se activará cuando concluya la fase de grupos.</p>
                <div className="bg-gray-800/50 rounded-xl p-4 max-w-md mx-auto">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Fase actual</span>
                      <span className="text-white font-medium">Registro</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Equipos clasificados</span>
                      <span className="text-white font-medium">0/{tournament?.tournament_teams?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {(section === 'top-scorers' || section === 'ideal-5') && (
            <div id={section === 'top-scorers' ? 'top-scorers' : 'ideal-5'}>
              <TournamentStatsOverview tournamentId={tournamentId || ''} />
              <div className="mt-8">
                <TournamentMatchStats tournamentId={tournamentId || ''} />
              </div>
            </div>
          )}
          
          {section === 'match-stats' && (
            <div id="match-stats">
              <TournamentStatsOverview tournamentId={tournamentId || ''} />
              <div className="mt-8">
                <TournamentMatchStats tournamentId={tournamentId || ''} />
              </div>
            </div>
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


























