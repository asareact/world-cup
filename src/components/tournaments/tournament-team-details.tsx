'use client';

import { X, Users, Calendar, Trophy, Target } from 'lucide-react';
import { Player } from '@/lib/database';

interface TournamentTeamDetailsProps {
  team: any;
  players: Player[];
  isOpen: boolean;
  onClose: () => void;
}

export function TournamentTeamDetails({ 
  team,
  players,
  isOpen,
  onClose
}: TournamentTeamDetailsProps) {
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl max-w-md w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl md:hidden">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            Detalles del Equipo
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Team Info */}
        <div className="p-4 overflow-y-auto flex-grow">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              {team.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={team.logo_url} 
                  alt={team.name} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500/30 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-blue-500/30 shadow-xl">
                  <span className="text-white font-bold text-3xl">
                    {team.name?.charAt(0) || 'T'}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">
                {team.position ? `#${team.position}` : 'Equipo'}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center">{team.name}</h2>
          </div>
          
          {/* Team Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-700/30 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-green-400">{team.wins || 0}</div>
              <div className="text-xs text-gray-400">Victorias</div>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-yellow-400">{team.draws || 0}</div>
              <div className="text-xs text-gray-400">Empates</div>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-red-400">{team.losses || 0}</div>
              <div className="text-xs text-gray-400">Derrotas</div>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-3 text-center col-span-3">
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{team.goals_for || 0}</div>
                  <div className="text-xs text-gray-400">Goles a favor</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{team.goals_against || 0}</div>
                  <div className="text-xs text-gray-400">Goles en contra</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {team.goals_for && team.goals_against ? (team.goals_for - team.goals_against) : 0}
                  </div>
                  <div className="text-xs text-gray-400">Diferencia</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Players List */}
          <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/50">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-400" />
              Jugadores
            </h3>
            
            {players.length > 0 ? (
              <div className="space-y-2">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center py-2 px-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                    {player.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={player.photo_url} 
                        alt={player.name} 
                        className="w-8 h-8 rounded-full object-cover mr-3 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {player.name?.charAt(0) || 'J'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{player.name}</h4>
                      <p className="text-gray-400 text-xs truncate">
                        {player.position || 'Posición no definida'}
                      </p>
                    </div>
                    {player.jersey_number && (
                      <span className="bg-gray-700 text-gray-300 text-xs font-medium px-2 py-1 rounded-full">
                        #{player.jersey_number}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-4 italic">
                No hay jugadores registrados para este equipo
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Desktop Version - Hidden on mobile */}
      <div className="hidden md:flex bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex-col shadow-2xl">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
            Detalles del Equipo
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700/50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Team Info and Stats */}
        <div className="overflow-y-auto flex-grow p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Team Basic Info */}
            <div className="lg:w-1/3">
              <div className="bg-gray-700/30 rounded-2xl p-6 mb-6 text-center">
                <div className="relative mb-4 inline-block">
                  {team.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={team.logo_url} 
                      alt={team.name} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/30 shadow-xl mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-blue-500/30 shadow-xl mx-auto">
                      <span className="text-white font-bold text-4xl">
                        {team.name?.charAt(0) || 'T'}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {team.position ? `Posición #${team.position}` : 'Equipo'}
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{team.name}</h2>
                <p className="text-gray-400">Estadísticas del equipo</p>
              </div>
              
              {/* Detailed Stats */}
              <div className="bg-gray-800/40 rounded-2xl p-5 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-green-400" />
                  Estadísticas
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Victorias" value={team.wins || 0} color="text-green-400" />
                  <StatCard label="Empates" value={team.draws || 0} color="text-yellow-400" />
                  <StatCard label="Derrotas" value={team.losses || 0} color="text-red-400" />
                  <StatCard label="Puntos" value={team.points || 0} color="text-blue-400" />
                  <StatCard label="Goles a favor" value={team.goals_for || 0} color="text-green-400" />
                  <StatCard label="Goles en contra" value={team.goals_against || 0} color="text-red-400" />
                  <StatCard 
                    label="Diferencia de goles" 
                    value={team.goals_for && team.goals_against ? (team.goals_for - team.goals_against) : 0} 
                    color={team.goals_for && team.goals_against && (team.goals_for - team.goals_against) >= 0 ? "text-green-400" : "text-red-400"} 
                  />
                </div>
              </div>
            </div>
            
            {/* Players List */}
            <div className="lg:w-2/3">
              <div className="bg-gray-800/40 rounded-2xl p-5 border border-gray-700/50 h-full">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-400" />
                  Plantilla del Equipo
                </h3>
                
                {players.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {players.map((player) => (
                      <div key={player.id} className="flex items-center p-3 rounded-lg hover:bg-gray-700/30 transition-colors">
                        {player.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={player.photo_url} 
                            alt={player.name} 
                            className="w-10 h-10 rounded-full object-cover mr-3 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-white text-sm font-bold">
                              {player.name?.charAt(0) || 'J'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{player.name}</h4>
                          <div className="flex items-center text-gray-400 text-sm">
                            <span className="truncate">
                              {player.position || 'Posición no definida'}
                            </span>
                            {player.jersey_number && (
                              <span className="ml-2 bg-gray-700 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
                                #{player.jersey_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8 italic">
                    No hay jugadores registrados para este equipo
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
}

const StatCard = ({ label, value, color }: StatCardProps) => (
  <div className="bg-gray-700/30 rounded-xl p-3">
    <div className={`text-xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-gray-400">{label}</div>
  </div>
);