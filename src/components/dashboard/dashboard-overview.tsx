'use client'

import { motion } from 'framer-motion'
import { 
  Trophy, 
  Users, 
  Calendar, 
  Plus, 
  Play, 
  Award,
  Clock,
  MapPin,
  Loader2
} from 'lucide-react'
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats'
import { useTournaments } from '@/lib/hooks/use-tournaments'
import { useRouter } from 'next/navigation'

export function DashboardOverview() {
  const { stats, upcomingMatches, loading: statsLoading } = useDashboardStats()
  const { tournaments, loading: tournamentsLoading } = useTournaments()
  const router = useRouter()

  const isLoading = statsLoading || tournamentsLoading

  // Calculate stats for display
  const displayStats = [
    {
      title: 'Total Torneos',
      value: stats.totalTournaments.toString(),
      change: `${stats.totalTournaments > 0 ? '+' : ''}${stats.totalTournaments} creados`,
      changeType: 'positive' as const,
      icon: Trophy,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Torneos Activos',
      value: stats.activeTournaments.toString(),
      change: `${stats.activeTournaments} en curso`,
      changeType: 'positive' as const,
      icon: Play,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Equipos',
      value: stats.totalTeams.toString(),
      change: `${stats.totalTeams > 0 ? '+' : ''}${stats.totalTeams} registrados`,
      changeType: 'positive' as const,
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Partidos Jugados',
      value: stats.matchesPlayed.toString(),
      change: `${stats.matchesPlayed > 0 ? '+' : ''}${stats.matchesPlayed} completados`,
      changeType: 'positive' as const,
      icon: Calendar,
      color: 'from-orange-500 to-orange-600'
    }
  ]

  // Get recent tournaments (active ones first, then by date)
  const recentTournaments = tournaments
    .sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1
      if (b.status === 'active' && a.status !== 'active') return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    .slice(0, 3)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="ml-3 text-white">Cargando dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">¡Bienvenido de vuelta!</h2>
            <p className="text-green-100">
              Tienes {stats.activeTournaments} torneo{stats.activeTournaments !== 1 ? 's' : ''} activo{stats.activeTournaments !== 1 ? 's' : ''} y {upcomingMatches.length} partido{upcomingMatches.length !== 1 ? 's' : ''} programado{upcomingMatches.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gray-800 rounded-2xl p-6 border border-gray-700 transition-all ${
              stat.title === 'Total Equipos' 
                ? 'hover:border-blue-500/50 cursor-pointer hover:scale-105 transform' 
                : 'hover:border-green-500/50'
            }`}
            onClick={stat.title === 'Total Equipos' ? () => router.push('/dashboard/teams') : undefined}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                stat.changeType === 'positive' 
                  ? 'bg-green-900/50 text-green-300' 
                  : 'bg-red-900/50 text-red-300'
              }`}>
                {stat.change}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tournaments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Mis Torneos</h3>
            <button 
              onClick={() => router.push('/dashboard/tournaments')}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo</span>
            </button>
          </div>
          <div className="space-y-4">
            {recentTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{tournament.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{tournament.teams} equipos</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{tournament.matches.total} partidos</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      tournament.status === 'active' 
                        ? 'bg-green-900/50 text-green-300' 
                        : tournament.status === 'completed'
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {tournament.status === 'active' ? 'Activo' : 
                       tournament.status === 'completed' ? 'Finalizado' :
                       tournament.status === 'draft' ? 'Borrador' : 'Pausado'}
                    </div>
                    <div className="mt-2 w-20 bg-gray-600 rounded-full h-1">
                      <div 
                        className="bg-green-500 h-1 rounded-full" 
                        style={{ width: `${tournament.progress}%` }}
                      />
                    </div>
                  </div>
                  {tournament.status === 'active' && (
                    <button className="p-2 text-green-400 hover:bg-green-900/50 rounded-lg transition-colors">
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Matches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Próximos Partidos</h3>
          <div className="space-y-4">
            {upcomingMatches.length > 0 ? (
              upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="p-4 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors"
                >
                  <div className="text-center mb-3">
                    <div className="text-sm font-medium text-white">
                      {match.homeTeam || 'TBD'} vs {match.awayTeam || 'TBD'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {match.tournament}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {match.date ? new Date(match.date).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Por definir'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{match.venue || 'Por definir'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay partidos programados</p>
              </div>
            )}
          </div>
          <button className="w-full mt-4 text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
            Ver todos los partidos →
          </button>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => router.push('/dashboard/tournaments')}
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 text-white"
          >
            <Plus className="h-5 w-5" />
            <span>Crear Torneo</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/teams/create')}
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 text-white"
          >
            <Users className="h-5 w-5" />
            <span>Agregar Equipo</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/matches')}
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 text-white"
          >
            <Calendar className="h-5 w-5" />
            <span>Programar Partido</span>
          </button>
          <button 
            onClick={() => router.push('/dashboard/stats')}
            className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105 text-white"
          >
            <Award className="h-5 w-5" />
            <span>Ver Estadísticas</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
