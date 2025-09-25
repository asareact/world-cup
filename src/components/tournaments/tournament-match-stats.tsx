// src/components/tournaments/tournament-match-stats.tsx
'use client'

import { Trophy, Target, Award, Square } from 'lucide-react'

interface TournamentMatchStatsProps {
  tournamentId: string
}

export function TournamentMatchStats({ tournamentId }: TournamentMatchStatsProps) {
  return (
    <div className="space-y-8">
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Trophy className="h-5 w-5 text-green-400" />
          <h2 className="text-xl font-bold text-white">Estadísticas del Torneo</h2>
        </div>
        
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Todas las estadísticas del torneo están disponibles en las siguientes secciones:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-center space-x-3">
              <Target className="h-5 w-5 text-green-400" />
              <span className="text-white">Goleadores del torneo</span>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-center space-x-3">
              <Award className="h-5 w-5 text-blue-400" />
              <span className="text-white">Asistidores del torneo</span>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-center space-x-3">
              <Square className="h-5 w-5 text-yellow-400" />
              <span className="text-white">Tarjetas amarillas</span>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-center space-x-3">
              <Square className="h-5 w-5 text-red-400" />
              <span className="text-white">Tarjetas rojas</span>
            </div>
          </div>
          
          <p className="text-gray-500 mt-6">
            Las estadísticas detalladas de cada partido están disponibles en la vista del calendario
          </p>
        </div>
      </div>
    </div>
  )
}