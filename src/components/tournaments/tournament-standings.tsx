'use client';

import { useMemo } from 'react';
import { Trophy, Users, Calendar, Shuffle, Target, Award, BarChart3, Square } from 'lucide-react';
import { Team, Match } from '@/lib/database';

interface StandingsEntry {
  position: number
  team: Team
  played: number
  wins: number
  draws: number
  losses: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

interface TournamentStandingsProps {
  tournament: any;
  teams: Team[];
  matches: Match[];
  onTeamClick: (teamId: string) => void;
}

const TEAM_PLACEHOLDER_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
] as const;

const getTeamPlaceholderColor = (teamId: string | undefined | null) => {
  if (!teamId) return TEAM_PLACEHOLDER_COLORS[0];
  const numericId = parseInt(teamId as string, 36);
  if (Number.isNaN(numericId)) return TEAM_PLACEHOLDER_COLORS[0];
  const index = Math.abs(numericId) % TEAM_PLACEHOLDER_COLORS.length;
  return TEAM_PLACEHOLDER_COLORS[index];
};

const calculateStandings = (teams: Team[], matches: Match[]): StandingsEntry[] => {
  // Initialize standings for all teams
  const standingsMap: Record<string, StandingsEntry> = {};
  
  teams.forEach(team => {
    if (!team?.id) return; // Skip if team id is undefined
    
    standingsMap[team.id] = {
      position: 0, // Will be calculated later
      team,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
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
      
      const homeTeamId = match.home_team.id;
      const awayTeamId = match.away_team.id;
      
      // Ensure both teams exist in standings
      if (!standingsMap[homeTeamId]) {
        // Find the full team object from the teams array to ensure all required Team properties
        const fullHomeTeam = teams.find(t => t.id === match.home_team?.id);
        standingsMap[homeTeamId] = {
          position: 0,
          team: fullHomeTeam || {
            id: match.home_team?.id || '',
            name: match.home_team?.name || 'Equipo desconocido',
            logo_url: match.home_team?.logo_url || null,
            description: null,
            captain_id: null,
            created_by: '',
            contact_email: null,
            contact_phone: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0
        };
      }
      
      if (!standingsMap[awayTeamId]) {
        // Find the full team object from the teams array to ensure all required Team properties
        const fullAwayTeam = teams.find(t => t.id === match.away_team?.id);
        standingsMap[awayTeamId] = {
          position: 0,
          team: fullAwayTeam || {
            id: match.away_team?.id || '',
            name: match.away_team?.name || 'Equipo desconocido',
            logo_url: match.away_team?.logo_url || null,
            description: null,
            captain_id: null,
            created_by: '',
            contact_email: null,
            contact_phone: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0
        };
      }
      
      // Update match counts
      standingsMap[homeTeamId].played += 1;
      standingsMap[awayTeamId].played += 1;
      
      // Update goals
      const homeGoals = match.home_score || 0;
      const awayGoals = match.away_score || 0;
      
      standingsMap[homeTeamId].goalsFor += homeGoals;
      standingsMap[homeTeamId].goalsAgainst += awayGoals;
      standingsMap[homeTeamId].goalDifference = standingsMap[homeTeamId].goalsFor - standingsMap[homeTeamId].goalsAgainst;
      
      standingsMap[awayTeamId].goalsFor += awayGoals;
      standingsMap[awayTeamId].goalsAgainst += homeGoals;
      standingsMap[awayTeamId].goalDifference = standingsMap[awayTeamId].goalsFor - standingsMap[awayTeamId].goalsAgainst;
      
      // Update points (3 for win, 1 for draw, 0 for loss) and match results
      if (homeGoals > awayGoals) {
        standingsMap[homeTeamId].points += 3; // Home win
        standingsMap[homeTeamId].wins += 1;
        standingsMap[awayTeamId].losses += 1;
      } else if (homeGoals < awayGoals) {
        standingsMap[awayTeamId].points += 3; // Away win
        standingsMap[awayTeamId].wins += 1;
        standingsMap[homeTeamId].losses += 1;
      } else {
        standingsMap[homeTeamId].points += 1; // Draw
        standingsMap[awayTeamId].points += 1; // Draw
        standingsMap[homeTeamId].draws += 1;
        standingsMap[awayTeamId].draws += 1;
      }
    });

  // Convert to array and sort by points, then by goal difference, then by goals scored
  const standingsArray = Object.values(standingsMap).filter(entry => entry !== undefined) as StandingsEntry[];
  
  standingsArray.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points; // Higher points first
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference; // Higher goal difference first
    return b.goalsFor - a.goalsFor; // Higher goals for first
  });

  // Assign positions
  standingsArray.forEach((entry, index) => {
    entry.position = index + 1;
  });

  return standingsArray;
};

export function TournamentStandings({ 
  tournament,
  teams,
  matches,
  onTeamClick
}: TournamentStandingsProps) {
  // Calculate overall standings
  const overallStandings = useMemo(() => {
    return calculateStandings(teams, matches);
  }, [teams, matches]);

  // Determine classification status based on position
  const getClassificationStatus = (position: number, totalTeams: number) => {
    if (position <= 6) return 'qualified'; // Direct qualification (green)
    else if (position <= 10) return 'repechaje'; // Repechaje (yellow)
    else if (position >= totalTeams - 2) return 'eliminated'; // Direct elimination (red)
    else return 'normal';
  };

  // Get classification color based on status
  const getClassificationColor = (status: string) => {
    switch (status) {
      case 'qualified': return 'bg-green-500';
      case 'repechaje': return 'bg-yellow-500';
      case 'eliminated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Tabla de Posiciones - {tournament?.name}
        </h1>
        <p className="text-gray-400 mt-2">
          Sigue la clasificación de los equipos en tiempo real
        </p>
        
        {/* Legend for classification indicators */}
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-400">Clasificados directos</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-400">Repechaje</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-400">Eliminados</span>
          </div>
        </div>
      </div>
      
      {/* Standings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-3 px-4 text-left text-gray-400 font-medium text-sm">Pos</th>
              <th className="py-3 px-4 text-left text-gray-400 font-medium text-sm">Equipo</th>
              <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">PJ</th>
              <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">G</th>
              <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">E</th>
              <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">P</th>
              <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">Pts</th>
              <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">GF</th>
              <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">GC</th>
              <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">DG</th>
            </tr>
          </thead>
          <tbody>
            {overallStandings.map((entry) => {
              const classificationStatus = getClassificationStatus(entry.position, overallStandings.length);
              const classificationColor = getClassificationColor(classificationStatus);
              
              return (
              <tr 
                key={entry.team.id} 
                className={`border-b border-gray-800 hover:bg-gray-800/30 transition-colors cursor-pointer ${classificationStatus === 'qualified' ? 'bg-green-900/10' : 
                 classificationStatus === 'repechaje' ? 'bg-yellow-900/10' : 
                 classificationStatus === 'eliminated' ? 'bg-red-900/10' : ''}`}
                onClick={() => onTeamClick(entry.team.id)}
              >
                <td className="py-3 px-4 text-gray-300 font-medium flex items-center">
                    <div className={`w-1 h-6 ${classificationColor} rounded-full mr-3`}></div>
                    {entry.position}
                  </td>
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                      {entry.team.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={entry.team.logo_url} 
                          alt={entry.team.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${getTeamPlaceholderColor(entry.team.id)}`}>
                          <span className="text-white text-xs font-bold">
                            {entry.team.name?.charAt(0) || 'T'}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-white font-medium">{entry.team.name || 'Equipo desconocido'}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center text-gray-300">{entry.played}</td>
                <td className="py-3 px-4 text-center text-gray-300">{entry.wins}</td>
                <td className="py-3 px-4 text-center text-gray-300">{entry.draws}</td>
                <td className="py-3 px-4 text-center text-gray-300">{entry.losses}</td>
                <td className="py-3 px-4 text-center text-white font-bold">{entry.points}</td>
                <td className="py-3 px-4 text-center text-gray-300">{entry.goalsFor}</td>
                <td className="py-3 px-4 text-center text-gray-300">{entry.goalsAgainst}</td>
                <td className="py-3 px-4 text-center text-gray-300 font-medium">
                  {entry.goalDifference >= 0 ? '+' : ''}{entry.goalDifference}
                </td>
              </tr>
              )})}
          </tbody>
        </table>
      </div>
      
      {/* Empty State */}
      {overallStandings.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Tabla de Posiciones</h3>
          <p className="text-gray-400 mb-4">
            La tabla de posiciones se mostrará aquí una vez que haya partidos jugados.
          </p>
          <div className="bg-gray-800/50 rounded-xl p-4 max-w-md mx-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Equipos registrados</span>
                <span className="text-white font-medium">{teams.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Partidos programados</span>
                <span className="text-white font-medium">
                  {matches.filter(m => m.status === 'scheduled').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Partidos jugados</span>
                <span className="text-white font-medium">
                  {matches.filter(m => m.status === 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}