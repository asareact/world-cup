'use client'

import { Calendar, Trophy, Users, Target } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TournamentOverviewProps {
  tournament: {
    id?: string
    name: string
    status: 'draft' | 'active' | 'completed' | 'paused'
    start_date: string | null
    end_date: string | null
    teams_count: number
    matches_count: number
    played_matches: number
    rules?: string
  }
  teams?: any[]
  matches?: any[]
}

export function TournamentOverviewLanding({ 
  tournament,
  teams = [],
  matches = []
}: TournamentOverviewProps) {
  const playedPercentage = tournament.matches_count > 0 
    ? Math.round((tournament.played_matches / tournament.matches_count) * 100) 
    : 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Tournament Info Card - Mobile Optimized */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{tournament.name}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {tournament.status === 'active' ? 'Torneo en curso' : 
               tournament.status === 'completed' ? 'Torneo finalizado' :
               tournament.status === 'paused' ? 'Torneo pausado' : 'Próximamente'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1 text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>
                {tournament.start_date ? formatDate(tournament.start_date) : 'Por definir'}
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
      
      {/* Quick Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 md:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-lg md:text-xl font-bold text-white">{tournament.teams_count}</div>
          <div className="text-xs md:text-sm text-gray-400">Equipos</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 md:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Target className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-lg md:text-xl font-bold text-white">{tournament.matches_count}</div>
          <div className="text-xs md:text-sm text-gray-400">Partidos</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 md:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-lg md:text-xl font-bold text-white">{tournament.played_matches}</div>
          <div className="text-xs md:text-sm text-gray-400">Jugados</div>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3 md:p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="text-lg md:text-xl font-bold text-white">
            {tournament.teams_count > 0 ? Math.floor(tournament.matches_count / Math.max(tournament.teams_count, 1)) : 0}
          </div>
          <div className="text-xs md:text-sm text-gray-400">por equipo</div>
        </div>
      </div>
      
      {/* Quick Links Grid - Mobile Optimized */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Acceso Rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '#standings', label: 'Tabla', icon: Trophy, color: 'green' },
            { href: '#groups', label: 'Grupos', icon: Users, color: 'blue' },
            { href: '#repechage', label: 'Repechaje', icon: Target, color: 'purple' },
            { href: '#top-scorers', label: 'Goleadores', icon: Calendar, color: 'yellow' },
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
          <h3 className="text-lg font-semibold text-white mb-2">¡Próximamente!</h3>
          <p className="text-gray-400 text-sm">
            Este torneo aún no tiene resultados disponibles. 
            ¡Vuelve pronto para ver las estadísticas y clasificaciones!
          </p>
        </div>
      )}
    </div>
  )
}