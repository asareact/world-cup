'use client';

import { useEffect, useState } from 'react';
import { X, Users, Target, Award, Activity, Goal, Zap, Trophy, Star, Shield, Heart } from 'lucide-react';
import { Player } from '@/lib/database';

interface PlayerDetailsModalProps {
  player: Player;
  tournamentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerDetailsModal({ 
  player, 
  tournamentId, 
  isOpen, 
  onClose 
}: PlayerDetailsModalProps) {
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      const fetchPlayerStats = async () => {
        setLoading(true);
        
        try {
          const response = await fetch(`/api/players/${player.id}/stats?tournamentId=${tournamentId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch player stats');
          }
          
          const data = await response.json();
          setPlayerStats(data);
        } catch (error) {
          console.error('Error fetching player stats:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPlayerStats();
    }
  }, [isOpen, player, tournamentId]);

  // Close modal when ESC key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !player) return null;

  const handleImageError = () => {
    setImageError(true);
  };

  // Define position color based on player position
  const getPositionColor = (position: string | null) => {
    if (!position) return 'bg-gray-600';
    switch (position.toLowerCase()) {
      case 'portero':
        return 'bg-blue-600';
      case 'defensa':
      case 'defender':
        return 'bg-green-600';
      case 'mediocampista':
      case 'midfielder':
        return 'bg-yellow-600';
      case 'delantero':
      case 'forward':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700 w-full max-w-md overflow-hidden shadow-2xl shadow-green-500/10 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with team gradient and position badge - Fixed height */}
        <div className="relative bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 p-6 pb-12 flex-shrink-0">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-all shadow-lg"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Position Badge */}
          <div className={`${getPositionColor(playerStats?.position)} rounded-full px-3 py-1 text-xs font-bold text-white uppercase tracking-wide inline-block absolute top-4 left-4`}>
            {playerStats?.position || 'Sin Posición'}
          </div>
          
          {/* Rating Badge */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full w-14 h-14 flex items-center justify-center border-2 border-white/20 shadow-lg">
            <span className="text-white font-bold text-xl drop-shadow">
              {playerStats?.stats?.rating > 0 ? playerStats.stats.rating : '--'}
            </span>
          </div>
          
          {/* Player Info */}
          <div className="text-center pt-8">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              {playerStats?.name || player.name}
            </h2>
            <div className="flex justify-center items-center mt-2 space-x-3">
              {playerStats?.jersey_number && (
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center border border-white/10">
                  <span className="text-white font-bold text-sm">#{playerStats.jersey_number}</span>
                </div>
              )}
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 border border-white/10">
                <span className="text-white text-sm capitalize">
                  {playerStats?.position || 'Posición no definida'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Player Image - Fixed height */}
        <div className="flex justify-center -mt-14 mb-2 flex-shrink-0">
          <div className="w-28 h-28 md:w-32 md:h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-900 shadow-2xl shadow-black/50 relative">
            {playerStats?.photo_url && playerStats.photo_url !== '' && !imageError ? (
              <img 
                src={playerStats.photo_url} 
                alt={playerStats.name} 
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                <Users className="h-12 w-12 text-gray-400" />
              </div>
            )}
            {/* Circle border effect */}
            <div className="absolute inset-0 rounded-full border-4 border-white/10 pointer-events-none"></div>
          </div>
        </div>
        
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-grow">
          {/* Stats Section */}
          <div className="p-6 pt-2">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : playerStats ? (
            <>
              {/* Main Stats - Circular progress-style cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 text-center border border-gray-700/50 shadow-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-green-400 mb-1">{playerStats?.stats?.goals || 0}</div>
                  <div className="text-sm text-gray-300 flex items-center justify-center">
                    <Goal className="h-4 w-4 mr-2 text-green-400" />
                    Goles
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 text-center border border-gray-700/50 shadow-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-blue-400 mb-1">{playerStats?.stats?.assists || 0}</div>
                  <div className="text-sm text-gray-300 flex items-center justify-center">
                    <Award className="h-4 w-4 mr-2 text-blue-400" />
                    Asistencias
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 text-center border border-gray-700/50 shadow-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{playerStats?.stats?.matches_played || 0}</div>
                  <div className="text-sm text-gray-300 flex items-center justify-center">
                    <Activity className="h-4 w-4 mr-2 text-yellow-400" />
                    Partidos
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-4 text-center border border-gray-700/50 shadow-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {playerStats?.stats?.rating > 0 ? playerStats.stats.rating : '--'}
                  </div>
                  <div className="text-sm text-gray-300 flex items-center justify-center">
                    <Star className="h-4 w-4 mr-2 text-purple-400" />
                    Calificación
                  </div>
                </div>
              </div>
              
              {/* Rating Explanation */}
              {(!playerStats?.stats?.rating || playerStats.stats.rating === 0) && (
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-4 text-center">
                  <p className="text-xs text-blue-300">
                    La calificación se muestra cuando el jugador ha jugado al menos un partido y tiene eventos registrados
                  </p>
                </div>
              )}
              
              {/* Additional Stats with better spacing and design */}
              <div className="space-y-4">
                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 flex items-center">
                      <Zap className="h-5 w-5 mr-3 text-yellow-500" />
                      Tarjetas Amarillas
                    </span>
                    <span className="font-bold text-xl text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
                      {playerStats?.stats?.yellow_cards || 0}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 flex items-center">
                      <Trophy className="h-5 w-5 mr-3 text-red-500" />
                      Tarjetas Rojas
                    </span>
                    <span className="font-bold text-xl text-red-400 bg-red-400/10 px-3 py-1 rounded-full">
                      {playerStats?.stats?.red_cards || 0}
                    </span>
                  </div>
                </div>
                
                {/* Position-specific stats */}
                {playerStats?.position === 'portero' ? (
                  <>
                    <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 flex items-center">
                          <Shield className="h-5 w-5 mr-3 text-blue-400" />
                          Atajadas
                        </span>
                        <span className="font-bold text-xl text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                          {playerStats?.stats?.saves_made || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 flex items-center">
                          <Goal className="h-5 w-5 mr-3 text-red-500" />
                          Goles Recibidos
                        </span>
                        <span className="font-bold text-xl text-red-400 bg-red-400/10 px-3 py-1 rounded-full">
                          {playerStats?.stats?.goals_conceded || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 flex items-center">
                          <Star className="h-5 w-5 mr-3 text-green-400" />
                          Vallas Invictas
                        </span>
                        <span className="font-bold text-xl text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                          {playerStats?.stats?.clean_sheets || 0}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 flex items-center">
                          <Activity className="h-5 w-5 mr-3 text-gray-400" />
                          Minutos Jugados
                        </span>
                        <span className="font-bold text-xl text-gray-300 bg-gray-400/10 px-3 py-1 rounded-full">
                          {playerStats?.stats?.minutes_played || 0}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 flex items-center">
                          <Users className="h-5 w-5 mr-3 text-purple-400" />
                          Apariciones
                        </span>
                        <span className="font-bold text-xl text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">
                          {playerStats?.stats?.matches_appeared || 0}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p>No se pudieron cargar las estadísticas del jugador</p>
            </div>
          )}
        </div>
        </div> {/* Closing scrollable content area */}
        
        {/* Footer - Fixed at bottom */}
        <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 px-6 py-4 border-t border-gray-700/50 text-center backdrop-blur-sm flex-shrink-0">
          <p className="text-xs text-gray-500 font-medium">
            Estadísticas del torneo
          </p>
        </div>
      </div>
    </div>
  );
}