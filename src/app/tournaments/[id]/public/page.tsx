'use client'

import { TournamentAnimatedLoader } from '@/components/tournaments/tournament-animated-loader'
import { TournamentLatestResults } from '@/components/tournaments/tournament-latest-results'
import { TournamentPublicLayout } from '@/components/tournaments/tournament-public-layout'
import { TournamentTeamDetails } from '@/components/tournaments/tournament-team-details'
import { TournamentTopLeaders } from '@/components/tournaments/tournament-top-leaders'
import { TournamentTopScorers } from '@/components/tournaments/tournament-top-scorers'
import { getLatestMatches, getTopScorers, useTournament } from '@/lib/hooks/use-tournament'
import { Calendar, Shuffle, Target, Trophy, Shield, Users } from 'lucide-react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
// Mobile-optimized navigation tabs
import { MobileNavigation } from '@/components/tournaments/mobile-navigation'
import { useEffect, useState } from 'react'


interface Team {
  id: string
  name: string
  logo_url?: string | null
}

interface Match {
  id: string
  home_team: { name: string } | null
  away_team: { name: string } | null
  home_score: number | null
  away_score: number | null
  scheduled_at: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
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

const getTeamPlaceholderColor = (teamId: string) => {
  if (!teamId) return TEAM_PLACEHOLDER_COLORS[0]
  const numericId = parseInt(teamId, 36)
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
    .filter((team): team is Team => Boolean(team && team.id))
}
// Mobile-optimized team logos banner
const MobileTeamLogosBanner = ({ 
  teams,
  tournamentId
}: { 
  teams: Team[]
  tournamentId?: string
}) => {
  // Track logos that fail to load
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

  const handleImageError = (teamId: string) => {
    setImageLoadErrors(prev => new Set(prev).add(teamId));
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 mb-4 md:p-6 md:mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">Equipos Participantes</h2>
      <div className="flex flex-wrap gap-3 justify-center">
        {teams.map((team) => (
          <div 
            key={team.id}
            className="relative cursor-pointer group"
            onClick={() => {
              if (tournamentId) {
                window.location.href = `/teams/${team.id}?tournament=${tournamentId}`
              }
            }}
          >
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-700 overflow-hidden shadow-lg">
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
                  <Shield className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
              )}
            </div>
            {/* Team name caption for mobile, tooltip for desktop */}
            <div className="mt-1 text-xs text-gray-300 text-center truncate w-full max-w-[4rem] md:hidden">
              {team.name}
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded-lg text-xs text-white whitespace-nowrap z-50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 hidden md:block">
              <div className="relative">
                {team.name}
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-800"></div>
              </div>
            </div>
          </div>
        ))}
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
  const playedPercentage = tournament.matches_count > 0 
    ? Math.round((tournament.played_matches / tournament.matches_count) * 100) 
    : 0

  return (
    <div className="space-y-4">
      {/* Tournament Info Card - Mobile Optimized */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{tournament.name}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {tournament.status === 'active' ? 'Torneo en curso' : 
               tournament.status === 'completed' ? 'Torneo finalizado' :
               tournament.status === 'paused' ? 'Torneo pausado' : 'PrÃ³ximamente'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 text-gray-300">
              <Calendar className="h-4 w-4" />
              <span>
                {tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'Por definir'}
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
            <span>{tournament.played_matches} jugados</span>
            <span>{tournament.matches_count} totales</span>
          </div>
        </div>
        
        {/* Teams Count - Mobile Optimized */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Equipos registrados</span>
            <span className="text-white font-medium">{tournament.teams_count}</span>
          </div>
        </div>
      </div>
      
      {/* Quick Links Grid - Mobile Optimized */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Acceso RÃ¡pido</h2>
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
      {tournament.played_matches === 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 text-center">
          <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Â¡PrÃ³ximamente!</h3>
          <p className="text-gray-400 text-sm">
            Este torneo aÃºn no tiene resultados disponibles. 
            Â¡Vuelve pronto para ver las estadÃ­sticas!
          </p>
        </div>
      )}
    </div>
  )
}

const DesktopTeamAvatarRail = ({
  teams,
  tournamentId,
}: {
  teams: Team[]
  tournamentId?: string
}) => {
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

  if (!teams.length) return null

  const maxVisible = 12
  const visibleTeams = teams.slice(0, maxVisible)
  const hiddenCount = Math.max(teams.length - visibleTeams.length, 0)

  const handleImageError = (teamId: string) => {
    setImageLoadErrors((prev) => {
      const updated = new Set(prev)
      updated.add(teamId)
      return updated
    })
  }

  const handleTeamRedirect = (teamId: string) => {
    if (tournamentId) {
      window.location.href = `/teams/${teamId}?tournament=${tournamentId}`
    }
  }

  return (
    <div className="hidden md:block">
      <div className="mb-10 flex flex-wrap items-center justify-center gap-6 rounded-3xl border border-gray-900 bg-gray-900/60 px-8 py-6">
        {visibleTeams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => handleTeamRedirect(team.id)}
            className="group relative flex h-16 w-16 items-center justify-center rounded-full border border-gray-800 bg-gray-950/70 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-green-500/60 hover:shadow-green-500/20"
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
              <div className={`flex h-full w-full items-center rounded-full border border-gray-800 justify-center ${getTeamPlaceholderColor(team.id)}`}>
                <Shield className="h-10 w-10 text-white" />
              </div>
            )}
            <div className="pointer-events-none absolute left-1/2 top-full z-50 hidden w-40 -translate-x-1/2 translate-y-3 rounded-xl border border-gray-800 bg-gray-950/95 px-3 py-2 text-center shadow-xl shadow-black/40 opacity-0 transition duration-200 group-hover:block group-hover:opacity-100">
              <span className="block text-xs font-semibold text-white">{team.name}</span>
              <span className="mt-1 block text-xs text-gray-400">Haz clic para ver</span>
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rotate-45 border border-gray-800 bg-gray-950"></span>
            </div>
          </button>
        ))}
        {hiddenCount > 0 && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gray-800 bg-gray-900 text-sm font-semibold text-gray-300">
            +{hiddenCount}
          </div>
        )}
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
    onNavigate(target)
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
      section: 'repechage',
      title: 'Repechaje',
      description: 'Controla las llaves adicionales.',
      icon: Shuffle,
    },
    {
      section: 'top-scorers',
      title: 'Goleadores',
      description: 'Ranking de anotadores del torneo.',
      icon: Target,
    },
    {
      section: 'ideal-5',
      title: 'Ideal 5',
      description: 'Seleccion de quinteto destacado.',
      icon: Shield,
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
                onClick={() => handleNavigate('top-scorers')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/60 px-5 py-3 text-sm font-semibold text-green-200 transition hover:border-green-400 hover:bg-green-500/10 hover:text-white"
              >
                Goleadores
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
              className="group rounded-2xl border border-gray-800 bg-gray-900/70 p-6 text-left transition hover:border-green-500/40 hover:bg-gray-900"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-green-500/10 p-3 text-green-300 transition group-hover:bg-green-500/20">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-400">{item.description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-green-300 group-hover:text-green-200">
                Ver seccion
              </span>
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
  const [topScorers, setTopScorers] = useState<TopScorer[]>([])
  const [latestMatches, setLatestMatches] = useState<Match[]>([])
  
  // Get active section from URL query parameter or default to overview
  const section = searchParams.get('section') || 'overview'
  
  // Define navigation anchors for both mobile and desktop
  const anchors = [
    { href: `?section=overview`, label: 'Inicio' },
    { href: `?section=standings`, label: 'Tabla' },
    { href: `?section=groups`, label: 'Grupos' },
    { href: `?section=repechage`, label: 'Repechaje' },
    { href: `?section=top-scorers`, label: 'Goleadores' },
    { href: `?section=ideal-5`, label: 'Ideal 5' },
  ]
  
  // Mobile navigation handler
  const handleSectionChange = (newSection: string) => {
    // Set navigation source as internal
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tournamentNavigationSource', 'internal');
    }
    
    // Update URL without full page reload
    const url = new URL(window.location.href)
    url.searchParams.set('section', newSection)
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
          team_name: row.team?.name || 'Equipo desconocido',
          team_id: row.team?.id || '',
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
        setLatestMatches(data || [])
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
        activeSection={section} 
        onSectionChange={handleSectionChange} 
      />
      <DesktopTeamAvatarRail
        teams={tournamentTeams}
        tournamentId={tournamentId}
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
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
                  <Trophy className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tabla de Posiciones</h3>
                <p className="text-gray-400 mb-4">La tabla de posiciones se mostrarÃ¡ aquÃ­ una vez que comience el torneo.</p>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Equipos registrados</span>
                      <span className="text-white font-medium">{tournament?.tournament_teams?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Estado del torneo</span>
                      <span className="text-white font-medium capitalize">
                        {tournament?.status === 'active' ? 'En curso' : 
                         tournament?.status === 'completed' ? 'Finalizado' :
                         tournament?.status === 'paused' ? 'Pausado' : 'PrÃ³ximamente'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
                <p className="text-gray-400 mb-4">La fase de grupos se organizarÃ¡ cuando se complete el registro de equipos.</p>
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
                <p className="text-gray-400 mb-4">El repechaje se activarÃ¡ cuando concluya la fase de grupos.</p>
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
              <TournamentTopLeaders 
                topScorers={topScorers}
                topAssists={[]}
                ideal5={[]}
              />
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


























