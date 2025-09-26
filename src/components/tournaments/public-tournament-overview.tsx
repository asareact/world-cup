'use client';

import { Calendar, Trophy, Users, Shuffle, Target, Shield, BarChart3, Star, Award, Timer, Activity } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Team } from '@/lib/database';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { getTeamPlaceholderColor } from './DesktopTeamAvatarRail';

// Define the Match interface that matches the TournamentLatestResults component expectations
interface TournamentMatch {
  id: string;
  home_team?: { name: string } | null;
  away_team?: { name: string } | null;
  home_score: number | null;
  away_score: number | null;
  scheduled_at: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

interface PublicTournamentOverviewProps {
  tournament: any;
  teams: Team[];
  matches: TournamentMatch[];
  topScorers: any[];
  matchesLoading: boolean;
  onNavigate: (section: string) => void;
  fetchTeamDetails: (teamId: string) => void;
}

export function PublicTournamentOverview({ 
  tournament,
  teams,
  matches,
  topScorers,
  matchesLoading,
  onNavigate, 
  fetchTeamDetails
}: PublicTournamentOverviewProps) {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tournamentId = params?.id;

  return (
    <div className="space-y-6 md:space-y-12">
      {/* Mobile Overview */}
      <div className="space-y-6 md:hidden">
        <MobileTournamentOverview
        tournament={tournament}
        teams={teams}
        matches={matches as TournamentMatch[]}
        onNavigate={onNavigate}
        fetchTeamDetails={fetchTeamDetails}
      />
      </div>

      {/* Desktop Overview */}
      <DesktopTournamentOverview
        tournament={tournament}
        teams={teams}
        matches={matches as TournamentMatch[]}
        topScorers={topScorers}
        onNavigate={onNavigate}
      />
    </div>
  )
}

interface MobileTournamentOverviewProps {
  tournament: any;
  teams: Team[];
  matches: TournamentMatch[];
  onNavigate: (section: string) => void;
  fetchTeamDetails: (teamId: string) => void;
}

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

const MobileTournamentOverview = ({
  tournament,
  teams,
  matches,
  onNavigate,
  fetchTeamDetails
}: MobileTournamentOverviewProps) => {
  const playedPercentage = tournament?.matches_count && tournament?.matches_count > 0
    ? Math.round((tournament?.played_matches / tournament?.matches_count) * 100)
    : 0;

  // Get the last 3 completed matches
  const lastMatches = matches
    .filter(match => match?.status === 'completed')
    .sort((a, b) => {
      const aDate = a?.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.NEGATIVE_INFINITY;
      const bDate = b?.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.NEGATIVE_INFINITY;
      return bDate - aDate; // Sort in descending order (most recent first)
    })
    .slice(0, 3);

  // Create a team lookup map for efficient logo retrieval
  const teamLookup = new Map(teams.map(team => [team.name, team]));

  // Animation variants for mobile
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <>
      <MobileTeamLogosBanner onTeamClick={fetchTeamDetails} teams={teams} key={tournament.id} tournamentId={tournament.id} />
      <motion.div
        className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-5 relative overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-4 -left-4 w-16 h-16 rounded-full bg-green-500/10 blur-lg"></div>
          <div className="absolute bottom-4 -right-4 w-24 h-24 rounded-full bg-emerald-500/10 blur-lg"></div>
          <div className="absolute top-1/2 right-4 w-8 h-8 rounded-full bg-blue-500/10 blur-md"></div>
        </div>

        <motion.div className="relative z-10" variants={itemVariants}>
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">{tournament?.name || 'Torneo de Fútbol'}</h1>
              <p className="text-gray-400 text-sm mt-1">
                {tournament?.status === 'active' ? 'Torneo en curso' :
                  tournament?.status === 'completed' ? 'Torneo finalizado' :
                    tournament?.status === 'paused' ? 'Torneo pausado' : 'Próximamente'}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-300">
                <Calendar className="h-4 w-4" />
                <span>
                  {tournament?.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'Por definir'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Animated Progress Bar */}
        <motion.div
          className="mt-5"
          variants={itemVariants}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400">Progreso del torneo</span>
            <span className="text-white font-medium">{playedPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${playedPercentage}%` }}
              transition={{
                duration: 1.2,
                ease: "easeOut"
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>{tournament?.played_matches || 0} jugados</span>
            <span>{tournament?.matches_count || 0} totales</span>
          </div>
        </motion.div>

        {/* Last 3 Matches */}
      <motion.div 
        className="mt-6"
        variants={itemVariants}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-semibold text-white mb-3">Últimos Partidos</h2>
        {lastMatches.length > 0 ? (
          <div className="space-y-3">
            {lastMatches.map((match, index) => (
              <motion.div
                key={match.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-3"
                variants={itemVariants}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {/* Team logo - using approach similar to MobileTeamLogosBanner */}
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        {match.home_team && teamLookup.get(match.home_team.name)?.logo_url ? (
                          <img 
                            src={teamLookup.get(match.home_team.name)!.logo_url!} 
                            alt={match.home_team.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                            {match.home_team?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-white font-medium">
                        {match.home_team?.name ? match.home_team.name.substring(0, 3).toUpperCase() : '???' }
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-white mx-2">
                      {match.home_score ?? '?'} - {match.away_score ?? '?'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-white font-medium text-right">
                        {match.away_team?.name ? match.away_team.name.substring(0, 3).toUpperCase() : '???' }
                      </span>
                      {/* Team logo - using approach similar to MobileTeamLogosBanner */}
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                        {match.away_team && teamLookup.get(match.away_team.name)?.logo_url ? (
                          <img 
                            src={teamLookup.get(match.away_team.name)!.logo_url!} 
                            alt={match.away_team.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                            {match.away_team?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2 flex justify-center">
                  {match.scheduled_at
                    ? new Date(match.scheduled_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Fecha por definir'}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 text-sm">Aún no se han jugado partidos</p>
          </div>
        )}
      </motion.div>

        {/* Quick Access Section (Separated) */}
        <motion.div
          className="mt-6 pt-6 border-t border-gray-700"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delayChildren: 0.6 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Acceso Rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '#standings', label: 'Tabla', icon: Trophy, color: 'green' },
              { href: '#groups', label: 'Grupos', icon: Users, color: 'blue' },
              { href: '#repechage', label: 'Repechaje', icon: Shuffle, color: 'purple' },
              { href: '#match-stats', label: 'Goleadores', icon: Target, color: 'yellow' },
            ].map((link, index) => {
              const Icon = link.icon;
              return (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 hover:border-green-500/70 hover:bg-gray-800/70 transition-all group"
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0 p-2 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 transition-colors">
                      <Icon className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white group-hover:text-green-400 transition-colors text-sm">
                        {link.label}
                      </h3>
                    </div>
                  </div>
                </motion.a>
              )
            })}
          </div>
        </motion.div>

        {/* Animated No Results Message */}
        {tournament?.played_matches === 0 && (
          <motion.div
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 text-center mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">¡Próximamente!</h3>
            <p className="text-gray-400 text-sm">
              Este torneo aún no tiene resultados disponibles.
              ¡Vuelve pronto para ver las estadísticas!
            </p>
          </motion.div>
        )}
      </motion.div>
    </>
  )
};

interface DesktopTournamentOverviewProps {
  tournament: any;
  teams: Team[];
  matches: TournamentMatch[];
  topScorers: any[];
  onNavigate: (section: string) => void;
}

const DesktopTournamentOverview = ({
  tournament,
  teams,
  matches,
  topScorers,
  onNavigate
}: DesktopTournamentOverviewProps) => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tournamentId = params?.id;
  const totalTeams = teams.length;
  const normalizedMatches: TournamentMatch[] = Array.isArray(matches) ? (matches.filter(Boolean) as TournamentMatch[]) : [];
  const playedMatches = normalizedMatches.filter((match) => match?.status === 'completed').length;
  const totalMatches = normalizedMatches.length;
  const scheduledMatches = normalizedMatches.filter((match) => match?.status === 'scheduled').length;
  const upcomingMatch = normalizedMatches
    .filter((match) => match?.status === 'scheduled' && match?.scheduled_at)
    .sort((a, b) => {
      const aDate = a?.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      const bDate = b?.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.POSITIVE_INFINITY;
      return aDate - bDate;
    })[0];

  const topScorer = topScorers[0];

  const statusThemes: Record<string, { label: string; badge: string }> = {
    active: { label: 'Torneo en curso', badge: 'border-green-400/40 bg-green-500/10 text-green-200' },
    completed: { label: 'Torneo finalizado', badge: 'border-blue-400/40 bg-blue-500/10 text-blue-200' },
    paused: { label: 'Torneo pausado', badge: 'border-yellow-400/40 bg-yellow-500/10 text-yellow-200' },
    draft: { label: 'Proximamente', badge: 'border-gray-500/40 bg-gray-500/10 text-gray-200' },
  };
  const status = tournament?.status || 'draft';
  const statusTheme = statusThemes[status] || statusThemes.draft;

  const startDateLabel = tournament?.start_date
    ? new Date(tournament.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Fecha por definir';

  const handleNavigate = (target: string) => {
    if (target === 'calendar') {
      // Navigate to the calendar page
      if (tournamentId && typeof tournamentId === 'string') {
        router.push(`/tournaments/${encodeURIComponent(tournamentId)}/public/calendar`);
      }
    } else {
      onNavigate(target);
    }
  };

  const quickLinks = [
    {
      section: 'standings',
      title: 'Tabla general',
      description: 'Revisa la posicion de cada equipo.',
      icon: Trophy,
      color: 'green'
    },
    {
      section: 'calendar',
      title: 'Calendario',
      description: 'Consulta las fechas de los partidos.',
      icon: Calendar,
      color: 'blue'
    },
    {
      section: 'top-scorers',
      title: 'Goleadores',
      description: 'Ranking de anotadores del torneo.',
      icon: Target,
      color: 'yellow'
    },
    {
      section: 'ideal-5',
      title: 'Ideal 5',
      description: 'Seleccion de quinteto destacado.',
      icon: Shield,
      color: 'purple'
    },
    {
      section: 'match-stats',
      title: 'Estadísticas',
      description: 'Estadísticas detalladas de partidos.',
      icon: BarChart3,
      color: 'red'
    },
  ];

  // Animation variants for desktop
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 80,
        damping: 10
      }
    }
  };

  const statsVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      className="hidden md:flex flex-col space-y-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section with Enhanced Animation */}
      <motion.section
        className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 px-16 py-16"
        variants={itemVariants}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-green-500/5 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-blue-500/3 blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 flex items-start justify-between gap-16">
          <div className="max-w-2xl space-y-6">
            <motion.span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] ${statusTheme.badge}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {statusTheme.label}
            </motion.span>

            <motion.h1
              className="text-5xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {tournament?.name || 'Torneo de futsal'}
            </motion.h1>

            <motion.p
              className="text-lg text-gray-300 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {tournament?.description || 'Comparte una experiencia profesional con tu equipo y sigue cada instancia de la competencia en tiempo real.'}
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-4 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-5 py-2.5">
                <Calendar className="h-4 w-4 text-green-300" />
                <span>{startDateLabel}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-5 py-2.5">
                <Users className="h-4 w-4 text-green-300" />
                <span>{totalTeams} equipos</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/60 px-5 py-2.5">
                <Trophy className="h-4 w-4 text-green-300" />
                <span>{playedMatches} partidos</span>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-wrap gap-4 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <button
                type="button"
                onClick={() => handleNavigate('standings')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:from-green-700 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/20"
              >
                Ver tabla
                <Trophy className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('match-stats')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-500/60 px-6 py-3.5 text-sm font-semibold text-green-200 transition-all hover:border-green-400 hover:bg-green-500/10 hover:text-white hover:shadow-lg hover:shadow-green-500/10"
              >
                Estadísticas
                <BarChart3 className="h-4 w-4" />
              </button>
            </motion.div>
          </div>

          {/* Animated Stats Grid */}
          <motion.div
            className="grid w-96 grid-cols-2 gap-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            {[
              { title: 'Partidos totales', value: totalMatches, icon: Trophy, desc: 'Incluye programados y finalizados' },
              { title: 'Partidos pendientes', value: Math.max(totalMatches - playedMatches, 0), icon: Timer, desc: 'Aun por disputarse' },
              { title: 'Partidos jugados', value: playedMatches, icon: Activity, desc: 'Resultados confirmados' },
              { title: 'Partidos programados', value: scheduledMatches, icon: Calendar, desc: 'Con fecha definida' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="rounded-2xl border border-gray-800 bg-gray-900/70 p-5 backdrop-blur-sm"
                variants={statsVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.8 + (index * 0.1) }}
                whileHover={{ y: -5, borderColor: '#10b981' }}
              >
                <div className="flex items-center gap-2">
                  <stat.icon className="h-4 w-4 text-green-300" />
                  <p className="text-sm text-gray-400">{stat.title}</p>
                </div>
                <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500">{stat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Animated Quick Links Section */}
      <motion.section
        className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delayChildren: 0.2 }}
      >
        {quickLinks.map((item, index) => {
          const Icon = item.icon;
          const colorClasses = {
            green: 'text-green-400 border-green-500/30 bg-green-500/10',
            blue: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
            yellow: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
            purple: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
            red: 'text-red-400 border-red-500/30 bg-red-500/10'
          };

          return (
            <motion.button
              key={item.section}
              type="button"
              onClick={() => handleNavigate(item.section)}
              className="group rounded-2xl border border-gray-800 bg-gray-900/70 p-6 text-left transition-all hover:border-green-500/40 hover:bg-gray-900/90 flex flex-col h-full relative overflow-hidden"
              variants={itemVariants}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>

              <div className="flex justify-between items-start flex-shrink-0 z-10">
                <div className={`rounded-xl ${colorClasses[item.color as keyof typeof colorClasses]} p-3 text-green-300 transition-all group-hover:bg-opacity-20`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-col flex-grow justify-between z-10">
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{item.description}</p>
                </div>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-green-300 group-hover:text-green-200 transition-colors">
                  Ver seccion
                  <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </motion.button>
          )
        })}
      </motion.section>

      {/* Animated Stats Section */}
      <motion.section
        className="grid grid-cols-1 gap-8 lg:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delayChildren: 0.3 }}
      >
        <motion.div
          className="rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900/70 to-gray-900/80 p-8 backdrop-blur-sm"
          variants={itemVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-green-300" /> Figura destacada
            </h3>
          </div>
          {topScorer ? (
            <motion.div
              className="mt-6 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white font-bold text-xl">
                    {topScorer.player_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{topScorer.player_name}</p>
                  <p className="text-sm text-gray-400">{topScorer.team_name}</p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-200 mt-2">
                    <Star className="h-3 w-3" />
                    {topScorer.goals} goles
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mt-6 space-y-2">
              <p className="text-gray-400 text-sm">Aun no hay goleadores destacados. Vuelve mas tarde para ver las estadisticas.</p>
              <div className="flex items-center gap-2 mt-3">
                <Target className="h-5 w-5 text-gray-600" />
                <span className="text-gray-500 text-sm">Estadísticas actualizadas en tiempo real</span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="rounded-3xl border border-gray-800 bg-gradient-to-br from-gray-900/70 to-gray-900/80 p-8 backdrop-blur-sm"
          variants={itemVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-300" /> Próximo partido
            </h3>
          </div>
          {upcomingMatch ? (
            <motion.div
              className="mt-6 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                    <div className="h-1 w-1 rounded-full bg-green-400 animate-pulse"></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Local</p>
                </div>

                <div className="flex-1">
                  <div className="text-center">
                    <p className="text-xl font-semibold text-white">
                      {upcomingMatch.home_team?.name || 'Equipo A'} vs {upcomingMatch.away_team?.name || 'Equipo B'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {upcomingMatch.scheduled_at
                        ? new Date(upcomingMatch.scheduled_at).toLocaleString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                        : 'Horario por definir'}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                    <div className="h-1 w-1 rounded-full bg-gray-600"></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Visitante</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleNavigate('calendar')}
                className="w-full inline-flex items-center justify-center gap-2 text-sm font-medium text-green-300 transition hover:text-green-200 border border-gray-700 rounded-xl py-2.5"
              >
                Ver calendario completo
              </button>
            </motion.div>
          ) : (
            <div className="mt-6 space-y-2">
              <p className="text-gray-400 text-sm">No hay partidos programados por el momento. Una vez confirmado el calendario lo veras aqui.</p>
              <div className="flex items-center gap-2 mt-3">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="text-gray-500 text-sm">Calendario actualizado en tiempo real</span>
              </div>
            </div>
          )}
        </motion.div>
      </motion.section>
    </motion.div>
  )
};