'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Target, Shield, Users, Calendar, Trophy } from 'lucide-react';

interface TournamentMatchStatsProps {
  tournamentId: string;
}

interface PlayerStat {
  player_id: string;
  player_name: string;
  team_name: string;
  team_id: string;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  matches_played: number;
  player_photo_url?: string | null;
}

export function TournamentMatchStats({ tournamentId }: TournamentMatchStatsProps) {
  const [activeTab, setActiveTab] = useState<'top-scorers' | 'ideal-5' | 'overview'>('top-scorers');
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!tournamentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would fetch from an API endpoint
        // For now, we'll use mock data
        const mockStats: PlayerStat[] = [
          {
            player_id: '1',
            player_name: 'Juan Pérez',
            team_name: 'Equipo A',
            team_id: 'team-a',
            goals: 8,
            assists: 3,
            yellow_cards: 1,
            red_cards: 0,
            matches_played: 5,
            player_photo_url: null
          },
          {
            player_id: '2',
            player_name: 'Carlos López',
            team_name: 'Equipo B',
            team_id: 'team-b',
            goals: 6,
            assists: 5,
            yellow_cards: 2,
            red_cards: 0,
            matches_played: 5,
            player_photo_url: null
          },
          {
            player_id: '3',
            player_name: 'Miguel García',
            team_name: 'Equipo C',
            team_id: 'team-c',
            goals: 5,
            assists: 2,
            yellow_cards: 0,
            red_cards: 1,
            matches_played: 4,
            player_photo_url: null
          },
          {
            player_id: '4',
            player_name: 'Roberto Silva',
            team_name: 'Equipo D',
            team_id: 'team-d',
            goals: 4,
            assists: 7,
            yellow_cards: 1,
            red_cards: 0,
            matches_played: 5,
            player_photo_url: null
          },
          {
            player_id: '5',
            player_name: 'Alejandro Ruiz',
            team_name: 'Equipo E',
            team_id: 'team-e',
            goals: 4,
            assists: 1,
            yellow_cards: 3,
            red_cards: 0,
            matches_played: 5,
            player_photo_url: null
          }
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setStats(mockStats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Error al cargar las estadísticas');
        setLoading(false);
      }
    };

    fetchStats();
  }, [tournamentId]);

  // Mock ideal 5 data
  const ideal5Players = stats.slice(0, 5);

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-700 mr-4"></div>
                  <div>
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-700 rounded w-8"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
        <div className="text-red-400 mb-4">
          <BarChart3 className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Error al cargar estadísticas</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Estadísticas del Torneo
        </h1>
        <p className="text-gray-400 mt-2">
          Sigue el rendimiento de los jugadores destacados
        </p>
      </div>
      
      {/* Stats Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'top-scorers' 
              ? 'text-green-400 border-b-2 border-green-400' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('top-scorers')}
        >
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Goleadores
          </div>
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'ideal-5' 
              ? 'text-green-400 border-b-2 border-green-400' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('ideal-5')}
        >
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Ideal 5
          </div>
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'overview' 
              ? 'text-green-400 border-b-2 border-green-400' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <div className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Resumen
          </div>
        </button>
      </div>
      
      {/* Top Scorers Tab */}
      {activeTab === 'top-scorers' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Máximos Goleadores</h2>
            <div className="text-sm text-gray-400">Goles</div>
          </div>
          <div className="space-y-3">
            {stats.map((player, index) => (
              <div 
                key={player.player_id} 
                className="flex items-center justify-between p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center mr-3">
                    <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  </div>
                  <div className="flex items-center">
                    {player.player_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={player.player_photo_url} 
                        alt={player.player_name} 
                        className="w-10 h-10 rounded-full object-cover mr-3" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                        <span className="text-white font-bold">
                          {player.player_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-white">{player.player_name}</h3>
                      <p className="text-sm text-gray-400">{player.team_name}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-green-400">{player.goals}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Ideal 5 Tab */}
      {activeTab === 'ideal-5' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Ideal 5 del Torneo</h2>
            <p className="text-gray-400 text-sm">Selección de los mejores jugadores</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ideal5Players.map((player, index) => (
              <div 
                key={player.player_id} 
                className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl hover:border-green-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center mr-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                    </div>
                    {player.player_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={player.player_photo_url} 
                        alt={player.player_name} 
                        className="w-10 h-10 rounded-full object-cover mr-3" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                        <span className="text-white font-bold">
                          {player.player_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-white">{player.player_name}</h3>
                      <p className="text-sm text-gray-400">{player.team_name}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-green-400 font-bold">{player.goals}</div>
                    <div className="text-xs text-gray-400">Goles</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-blue-400 font-bold">{player.assists}</div>
                    <div className="text-xs text-gray-400">Asist.</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Resumen Estadístico</h2>
            <p className="text-gray-400 text-sm">Datos generales del torneo</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.reduce((sum, p) => sum + p.goals, 0)}</div>
              <div className="text-sm text-gray-400">Goles totales</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.reduce((sum, p) => sum + p.assists, 0)}</div>
              <div className="text-sm text-gray-400">Asistencias</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.reduce((sum, p) => sum + p.yellow_cards, 0)}</div>
              <div className="text-sm text-gray-400">Tarj. Amarillas</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.reduce((sum, p) => sum + p.red_cards, 0)}</div>
              <div className="text-sm text-gray-400">Tarj. Rojas</div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">Promedio por Partido</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Goles por partido</span>
                <span className="text-white font-medium">
                  {(stats.reduce((sum, p) => sum + p.goals, 0) / Math.max(stats.reduce((sum, p) => sum + p.matches_played, 0), 1)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Asistencias por partido</span>
                <span className="text-white font-medium">
                  {(stats.reduce((sum, p) => sum + p.assists, 0) / Math.max(stats.reduce((sum, p) => sum + p.matches_played, 0), 1)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}