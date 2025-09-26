'use client';

import { useState } from 'react';
import { Team, Match } from '@/lib/database';

interface TournamentGroupsProps {
  tournament: any;
  teams: Team[];
  matches: Match[];
  onTeamClick: (teamId: string) => void;
}

export function TournamentGroups({ 
  tournament,
  teams,
  matches,
  onTeamClick
}: TournamentGroupsProps) {
  const [activeGroup, setActiveGroup] = useState<string>('Group A');
  
  // For demo purposes, create mock groups
  const mockGroups = [
    { id: 'Group A', name: 'Grupo A' },
    { id: 'Group B', name: 'Grupo B' },
    { id: 'Group C', name: 'Grupo C' },
    { id: 'Group D', name: 'Grupo D' },
  ];
  
  // Mock standings data
  const mockStandings = [
    { position: 1, team: { id: '1', name: 'Equipo 1', logo_url: null }, played: 3, points: 7, goalsFor: 8, goalsAgainst: 3, goalDifference: 5 },
    { position: 2, team: { id: '2', name: 'Equipo 2', logo_url: null }, played: 3, points: 6, goalsFor: 6, goalsAgainst: 4, goalDifference: 2 },
    { position: 3, team: { id: '3', name: 'Equipo 3', logo_url: null }, played: 3, points: 3, goalsFor: 4, goalsAgainst: 6, goalDifference: -2 },
    { position: 4, team: { id: '4', name: 'Equipo 4', logo_url: null }, played: 3, points: 1, goalsFor: 2, goalsAgainst: 7, goalDifference: -5 },
  ];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Fase de Grupos - {tournament?.name}
        </h1>
        <p className="text-gray-400 mt-2">
          Seguimiento de los grupos y clasificaciones
        </p>
      </div>
      
      {/* Group Selection */}
      <div className="flex flex-wrap gap-2 mb-6">
        {mockGroups.map((group) => (
          <button
            key={group.id}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeGroup === group.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => setActiveGroup(group.id)}
          >
            {group.name}
          </button>
        ))}
      </div>
      
      {/* Group Standings */}
      <div className="overflow-x-auto">
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
            {mockStandings.map((entry) => (
              <tr 
                key={entry.team.id} 
                className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors cursor-pointer"
                onClick={() => onTeamClick(entry.team.id)}
              >
                <td className="py-3 px-4 text-gray-300 font-medium">{entry.position}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-3 bg-gray-700 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {entry.team.name?.charAt(0) || 'T'}
                      </span>
                    </div>
                    <span className="text-white font-medium">{entry.team.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center text-gray-300">{entry.played}</td>
                <td className="py-3 px-4 text-center text-white font-bold">{entry.points}</td>
                <td className="py-3 px-4 text-center text-gray-300">{entry.goalsFor}</td>
                <td className="py-3 px-4 text-center text-gray-300">{entry.goalsAgainst}</td>
                <td className="py-3 px-4 text-center text-gray-300 font-medium">
                  {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Group Stage Info */}
      <div className="mt-8 bg-gray-800/50 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Información de la Fase de Grupos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Equipos por grupo</p>
            <p className="text-white font-bold text-xl">4</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Partidos por equipo</p>
            <p className="text-white font-bold text-xl">3</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">Clasificados por grupo</p>
            <p className="text-white font-bold text-xl">2</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-400">
          <p><span className="font-medium text-green-400">Verde:</span> Equipos clasificados a la siguiente fase</p>
          <p><span className="font-medium text-yellow-400">Amarillo:</span> Equipos en posición de repechaje</p>
        </div>
      </div>
    </div>
  );
}