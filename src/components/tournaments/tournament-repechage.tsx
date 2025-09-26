'use client';

import { useState } from 'react';
import { Team, Match } from '@/lib/database';
import { Calendar, Trophy, Users, Shuffle } from 'lucide-react';

interface TournamentRepechageProps {
  tournament: any;
  teams: Team[];
  matches: Match[];
}

export function TournamentRepechage({ 
  tournament,
  teams,
  matches
}: TournamentRepechageProps) {
  const [activeRound, setActiveRound] = useState<string>('round_1');
  
  // Mock rounds for demo purposes
  const mockRounds = [
    { id: 'round_1', name: 'Primera Ronda' },
    { id: 'round_2', name: 'Cuartos de Final' },
    { id: 'round_3', name: 'Semifinales' },
    { id: 'round_4', name: 'Final' },
  ];
  
  // Mock matches for demo purposes
  const mockMatches = [
    { id: '1', home_team: { id: '1', name: 'Equipo A' }, away_team: { id: '2', name: 'Equipo B' }, scheduled_at: '2023-06-15T18:00:00Z', status: 'scheduled', home_score: null, away_score: null },
    { id: '2', home_team: { id: '3', name: 'Equipo C' }, away_team: { id: '4', name: 'Equipo D' }, scheduled_at: '2023-06-16T18:00:00Z', status: 'scheduled', home_score: null, away_score: null },
    { id: '3', home_team: { id: '5', name: 'Equipo E' }, away_team: { id: '6', name: 'Equipo F' }, scheduled_at: '2023-06-17T18:00:00Z', status: 'scheduled', home_score: null, away_score: null },
    { id: '4', home_team: { id: '7', name: 'Equipo G' }, away_team: { id: '8', name: 'Equipo H' }, scheduled_at: '2023-06-18T18:00:00Z', status: 'scheduled', home_score: null, away_score: null },
  ];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Sistema de Repechaje - {tournament?.name}
        </h1>
        <p className="text-gray-400 mt-2">
          Seguimiento del sistema de repechaje para equipos no clasificados
        </p>
      </div>
      
      {/* Info Banner */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 mb-6">
        <div className="flex items-start">
          <Shuffle className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-300 font-medium mb-1">Sistema de Repechaje Activo</h3>
            <p className="text-blue-200 text-sm">
              Los equipos que no clasifiquen directamente podrán competir por plazas adicionales en la siguiente ronda.
            </p>
          </div>
        </div>
      </div>
      
      {/* Round Selection */}
      <div className="flex flex-wrap gap-2 mb-6">
        {mockRounds.map((round) => (
          <button
            key={round.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeRound === round.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => setActiveRound(round.id)}
          >
            {round.name}
          </button>
        ))}
      </div>
      
      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockMatches.map((match) => (
          <div key={match.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-green-500/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {match.scheduled_at 
                  ? new Date(match.scheduled_at).toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  : 'Fecha por definir'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                match.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                match.status === 'in_progress' ? 'bg-yellow-900/50 text-yellow-300' :
                'bg-blue-900/50 text-blue-300'
              }`}>
                {match.status === 'completed' ? 'Finalizado' :
                 match.status === 'in_progress' ? 'En juego' :
                 'Pendiente'}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Home Team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">
                      {match.home_team?.name?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <span className="text-white font-medium">{match.home_team?.name || 'TBD'}</span>
                </div>
                {match.status === 'completed' ? (
                  <span className="text-2xl font-bold text-green-400">{match.home_score}</span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>
              
              {/* Away Team */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">
                      {match.away_team?.name?.charAt(0) || 'T'}
                    </span>
                  </div>
                  <span className="text-white font-medium">{match.away_team?.name || 'TBD'}</span>
                </div>
                {match.status === 'completed' ? (
                  <span className="text-2xl font-bold text-green-400">{match.away_score}</span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>
            </div>
            
            {match.scheduled_at && (
              <div className="mt-3 pt-3 border-t border-gray-700 flex items-center text-xs text-gray-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  {new Date(match.scheduled_at).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Repechage Rules */}
      <div className="mt-8 bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Reglas del Repechaje</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex items-start">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-3 flex-shrink-0"></div>
            <span>Los 2 mejores terceros lugares de cada grupo avanzan automáticamente</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-3 flex-shrink-0"></div>
            <span>Los equipos derrotados en cuartos de final entran al repechaje</span>
          </li>
          <li className="flex items-start">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-3 flex-shrink-0"></div>
            <span>Ganadores del repechaje pasan a semifinales</span>
          </li>
        </ul>
      </div>
    </div>
  );
}