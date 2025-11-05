'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminService } from '@/lib/api/admin-service';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export default function RemoveTeamPage() {
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingTeams, setLoadingTeams] = useState(false);
  
  const router = useRouter();
  const adminService = useMemo(() => new AdminService(), []);

  const loadTournaments = useCallback(async () => {
    try {
      setLoading(true);
      const tournamentsData = await adminService.getTournamentsForFilter();
      
      setTournaments(tournamentsData);
    } catch (error) {
      setMessage({ type: 'error', text: `Error loading tournaments: ${(error as Error).message}` });
    } finally {
      setLoading(false);
    }
  }, [adminService]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const loadTeamsForTournament = async (tournamentId: string) => {
    try {
      setLoadingTeams(true);
      const teamsData = await adminService.getTeamsInTournament(tournamentId);
      setTeams(teamsData);
    } catch (error) {
      setMessage({ type: 'error', text: `Error loading teams: ${(error as Error).message}` });
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    setSelectedTeam('');
    setTeams([]);
    if (tournamentId) {
      loadTeamsForTournament(tournamentId);
    }
  };

  const handlePreview = async () => {
    if (!selectedTournament || !selectedTeam) {
      setMessage({ type: 'error', text: 'Please select both tournament and team' });
      return;
    }

    try {
      setPreviewing(true);
      setMessage(null);
      
      const result = await adminService.previewTeamRemoval(selectedTeam, selectedTournament);
      setPreviewData(result.summary);
      setShowPreview(true);
      
      setMessage(null);
    } catch (error) {
      setMessage({ type: 'error', text: `Error previewing team removal: ${(error as Error).message}` });
    } finally {
      setPreviewing(false);
    }
  };

  const handleRemoveTeam = async () => {
    if (!selectedTournament || !selectedTeam) {
      setMessage({ type: 'error', text: 'Please select both tournament and team' });
      return;
    }

    if (!showPreview) {
      // First get the preview
      await handlePreview();
      return;
    }

    if (!confirm('This action is irreversible. Are you sure you want to permanently remove this team and all related data?')) {
      return;
    }

    try {
      setRemoving(true);
      
      await adminService.removeTeamFromTournament(selectedTeam, selectedTournament);
      
      setMessage({ type: 'success', text: 'Team successfully removed from tournament!' });
      setSelectedTeam('');
      setTeams([]);
      setPreviewData(null);
      setShowPreview(false);
      
      // Reload tournaments to show updated list
      loadTournaments();
    } catch (error) {
      setMessage({ type: 'error', text: `Error removing team: ${(error as Error).message}` });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full flex justify-center">
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-3xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white">Eliminar Equipo del Torneo</h1>
            <p className="text-gray-300 mt-1">
              Selecciona un torneo y equipo para eliminar de la competición. Todos los datos relacionados serán eliminados permanentemente.
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-900/30 border border-red-700 text-red-200' : 'bg-green-900/30 border border-green-700 text-green-200'}`}>
                  <div className="flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">{message.text}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200 text-center">Seleccionar Torneo</label>
                <select
                  value={selectedTournament}
                  onChange={(e) => handleTournamentChange(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-3 text-base bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-lg"
                >
                  <option value="">Elegir un torneo</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id} className="bg-gray-700 text-white">
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-200 text-center">Seleccionar Equipo</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  disabled={!selectedTournament && !teams.length}
                  className="mt-1 block w-full pl-3 pr-10 py-3 text-base bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-lg disabled:bg-gray-800 disabled:text-gray-500"
                >
                  <option value="" className="bg-gray-700 text-white">
                    {loadingTeams ? "Cargando equipos..." : "Elegir un equipo"}
                  </option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id} className="bg-gray-700 text-white">
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={handleRemoveTeam}
                  disabled={!selectedTournament || !selectedTeam || removing || previewing}
                  className={`w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white ${
                    (!selectedTournament || !selectedTeam || removing || previewing)
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  }`}
                >
                  {removing ? (
                    'Eliminando Equipo...'
                  ) : previewing ? (
                    'Generando Vista Previa...'
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5 mr-2" />
                      {showPreview ? 'Confirmar Eliminación' : 'Previsualizar Eliminación'}
                    </>
                  )}
                </button>
                
                {showPreview && (
                  <button
                    onClick={() => setShowPreview(false)}
                    className="w-full flex justify-center items-center px-4 py-3 border border-gray-600 text-sm font-medium rounded-lg shadow-sm text-gray-200 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          </div>

          {!showPreview && selectedTeam && selectedTournament && (
            <div className="mt-8 p-4 bg-amber-900/30 border border-amber-700 rounded-lg max-w-2xl mx-auto">
              <h3 className="text-sm font-medium text-amber-200 mb-2 text-center">Lo que será eliminado:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-amber-100">
                <li>Todos los eventos de partido relacionados con este equipo en el torneo</li>
                <li>Todos los partidos en los que jugó este equipo (local o visitante)</li>
                <li>Todas las estadísticas de jugadores de este equipo en el torneo</li>
                <li>Asociación del equipo al torneo</li>
              </ul>
            </div>
          )}
          
          {showPreview && previewData && (
            <div className="mt-8 space-y-6 max-w-4xl mx-auto">
              <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <h3 className="text-sm font-medium text-blue-200 mb-3 text-center">Vista Previa de Cambios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Equipo</p>
                    <p className="font-medium text-white">{previewData.teamName}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Torneo</p>
                    <p className="font-medium text-white">{previewData.tournamentName}</p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <p className="text-2xl font-bold text-red-400">{previewData.affectedMatches}</p>
                    <p className="text-xs text-gray-400">Partidos</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <p className="text-2xl font-bold text-red-400">{previewData.affectedMatchEvents}</p>
                    <p className="text-xs text-gray-400">Eventos</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <p className="text-2xl font-bold text-red-400">{previewData.teamPlayerStats}</p>
                    <p className="text-xs text-gray-400">Estadísticas</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                    <p className="text-2xl font-bold text-red-400">{previewData.otherTeamsAffected}</p>
                    <p className="text-xs text-gray-400">Otros Equipos</p>
                  </div>
                </div>
              </div>

              {/* Match Details */}
              {previewData.matchDetails && previewData.matchDetails.length > 0 && (
                <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <h4 className="text-sm font-medium text-red-200 mb-3 text-center">Partidos a eliminar:</h4>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {previewData.matchDetails.map((match: any, index: number) => (
                      <li key={index} className="py-2 px-3 bg-gray-700/50 rounded border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-200">
                            {match.home_team_name} <span className="font-semibold text-white">{match.home_score}</span> - 
                            <span className="font-semibold text-white"> {match.away_score}</span> {match.away_team_name}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Other Teams Affected */}
              {previewData.otherTeamMatchDetails && previewData.otherTeamMatchDetails.length > 0 && (
                <div className="p-4 bg-amber-900/20 border border-amber-700 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-200 mb-3 text-center">Partidos afectados de otros equipos:</h4>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {previewData.otherTeamMatchDetails.map((match: any, index: number) => (
                      <li key={index} className="py-2 px-3 bg-gray-700/50 rounded border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-200">
                            {match.home_team_name} vs {match.away_team_name} 
                            <span className="text-xs text-gray-400 ml-2">
                              ({match.home_score} - {match.away_score})
                            </span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Team Player Stats */}
              {previewData.teamPlayerStatsDetails && previewData.teamPlayerStatsDetails.length > 0 && (
                <div className="p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-200 mb-3 text-center">Estadísticas de jugadores a eliminar:</h4>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {previewData.teamPlayerStatsDetails.map((stat: any, index: number) => (
                      <li key={index} className="py-2 px-3 bg-gray-700/50 rounded border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white">{stat.players.name}</span>
                          <span className="text-sm text-gray-300">
                            {stat.goals > 0 && <span className="mr-3">{stat.goals} goles</span>}
                            {stat.assists > 0 && <span className="mr-3">{stat.assists} asistencias</span>}
                            {stat.yellow_cards > 0 && <span className="mr-3">{stat.yellow_cards} TA</span>}
                            {stat.red_cards > 0 && <span className="mr-3">{stat.red_cards} TR</span>}
                            <span>{stat.matches_played} partidos</span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Other Teams' Player Stats */}
              {previewData.otherTeamPlayerStatsDetails && previewData.otherTeamPlayerStatsDetails.length > 0 && (
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <h4 className="text-sm font-medium text-green-200 mb-3 text-center">Jugadores de otros equipos afectados:</h4>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {previewData.otherTeamPlayerStatsDetails.map((stat: any, index: number) => (
                      <li key={index} className="py-2 px-3 bg-gray-700/50 rounded border border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-white">{stat.players.name} ({stat.teams.name})</span>
                          <span className="text-sm text-gray-300">
                            <span className="mr-2">G:{stat.goals}</span>
                            <span className="mr-2">A:{stat.assists}</span>
                            <span className="mr-2">TA:{stat.yellow_cards}</span>
                            <span className="mr-2">TR:{stat.red_cards}</span>
                            <span>P:{stat.matches_played}</span>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Adjustments to be Made */}
              {previewData.adjustments && (
                <div className="p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-200 mb-3 text-center">Ajustes a realizar a otros equipos y jugadores:</h4>
                  
                  {/* Team Adjustments */}
                  {Object.keys(previewData.adjustments.teams).length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs text-purple-300 uppercase tracking-wide mb-2">Ajustes a equipos:</h5>
                      <ul className="space-y-1 text-sm text-gray-300">
                        {Object.entries(previewData.adjustments.teams).map(([teamId, adjustments]: [string, any]) => (
                          <li key={teamId} className="flex justify-between px-2 py-1">
                            <span className="font-medium">{previewData.adjustments.teamNames?.[teamId] || `Equipo ${teamId.substring(0,8)}...`}</span>
                            <span>
                              {adjustments.points !== 0 && <span className="mx-1">P:{adjustments.points}</span>}
                              {adjustments.goals_scored !== 0 && <span className="mx-1">GF:{adjustments.goals_scored}</span>}
                              {adjustments.goals_conceded !== 0 && <span className="mx-1">GC:{adjustments.goals_conceded}</span>}
                              {adjustments.matches_played !== 0 && <span className="mx-1">PJ:{adjustments.matches_played}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Player Adjustments */}
                  {Object.keys(previewData.adjustments.players).length > 0 && (
                    <div>
                      <h5 className="text-xs text-purple-300 uppercase tracking-wide mb-2">Ajustes a jugadores:</h5>
                      <ul className="space-y-1 text-sm text-gray-300 max-h-40 overflow-y-auto">
                        {Object.entries(previewData.adjustments.players).map(([playerId, adjustments]: [string, any]) => {
                          // Buscar el nombre del jugador en los detalles ya disponibles
                          let playerName = null;
                          
                          // Buscar en los detalles de jugadores del equipo eliminado
                          if (previewData.teamPlayerStatsDetails) {
                            const playerStat = previewData.teamPlayerStatsDetails.find((stat: any) => stat.player_id === playerId);
                            if (playerStat && playerStat.players?.name) {
                              playerName = playerStat.players.name;
                            }
                          }
                          
                          // Si no lo encontramos allí, buscar en otros equipos
                          if (!playerName && previewData.otherTeamPlayerStatsDetails) {
                            const playerStat = previewData.otherTeamPlayerStatsDetails.find((stat: any) => stat.player_id === playerId);
                            if (playerStat && playerStat.players?.name) {
                              playerName = playerStat.players.name;
                            }
                          }
                          
                          // Si tampoco lo encontramos allí, intentar con el nombre disponible en adjustments
                          if (!playerName && previewData.adjustments.playerNames) {
                            playerName = previewData.adjustments.playerNames[playerId] || null;
                          }
                          
                          return (
                            <li key={playerId} className="flex justify-between px-2 py-1">
                              <span className="font-medium">{playerName || `Jugador ${playerId.substring(0,8)}...`}</span>
                              <span>
                                {adjustments.goals !== 0 && <span className="mx-1">G:{adjustments.goals}</span>}
                                {adjustments.assists !== 0 && <span className="mx-1">A:{adjustments.assists}</span>}
                                {adjustments.yellows !== 0 && <span className="mx-1">TA:{adjustments.yellows}</span>}
                                {adjustments.reds !== 0 && <span className="mx-1">TR:{adjustments.reds}</span>}
                                {adjustments.matches !== 0 && <span className="mx-1">PJ:{adjustments.matches}</span>}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}