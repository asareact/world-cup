'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { TopScorerRow } from '@/lib/hooks/use-tournament';

interface TournamentTopScorersTableProps {
  tournamentId: string;
}

interface TopScorerData {
  player_id: string;
  player_name: string;
  team_name: string;
  team_id: string;
  goals: number;
  player_photo_url?: string | null;
}

export function TournamentTopScorersTable({ tournamentId }: TournamentTopScorersTableProps) {
  const [scorers, setScorers] = useState<TopScorerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and pagination state
  const [playerFilter, setPlayerFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [scorersPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: keyof TopScorerData; direction: 'asc' | 'desc' } | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchTopScorers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Import the function dynamically to avoid circular dependencies
        const { getTopScorers } = await import('@/lib/hooks/use-tournament');
        const rows: any[] = await getTopScorers(tournamentId, 100); // Get all to allow filtering
        
        // Map the data to our expected format
        const mappedScorers: TopScorerData[] = rows.map((row: any) => ({
          player_id: row.player?.id || '',
          player_name: row.player?.name || 'Jugador desconocido',
          team_name: row.player?.teams?.name || 'Equipo desconocido', 
          team_id: row.player?.team_id || '',
          goals: row.goals || 0,
          player_photo_url: row.player?.photo_url || null
        })).filter((scorer: any) => scorer.player_id && scorer.player_name);

        setScorers(mappedScorers);
      } catch (err) {
        console.error('Error fetching top scorers:', err);
        setError('Error al cargar los goleadores');
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchTopScorers();
    }
  }, [tournamentId]);

  // Apply filters and sorting
  const filteredAndSortedScorers = scorers
    .filter(scorer => 
      scorer.player_name.toLowerCase().includes(playerFilter.toLowerCase()) &&
      scorer.team_name.toLowerCase().includes(teamFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortConfig !== null) {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle null or undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1; // null values go to end when ascending
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1; // null values go to end when ascending
        
        // For string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        // For number comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
      // Default sort by goals descending
      return b.goals - a.goals;
    });

  // Pagination
  const indexOfLastScorer = currentPage * scorersPerPage;
  const indexOfFirstScorer = indexOfLastScorer - scorersPerPage;
  const currentScorers = filteredAndSortedScorers.slice(indexOfFirstScorer, indexOfLastScorer);
  const totalPages = Math.ceil(filteredAndSortedScorers.length / scorersPerPage);

  const handleSort = (key: keyof TopScorerData) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleResultsPerPageChange = (value: string) => {
    // This would update scorersPerPage state, but we'll keep it simple for now
    // Since it's a const, we'll need to restructure if we want to make it dynamic
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Cargando goleadores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Tabla de Goleadores
        </h2>
        <p className="text-gray-400 mt-2">
          Ranking de anotadores del torneo
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Filtrar por nombre de jugador..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            value={playerFilter}
            onChange={(e) => {
              setPlayerFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Filtrar por equipo..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th 
                className="py-3 px-4 text-left text-gray-400 font-medium text-sm cursor-pointer"
                onClick={() => handleSort('player_name')}
              >
                <div className="flex items-center">
                  <span>Nombre</span>
                  {sortConfig?.key === 'player_name' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-center text-gray-400 font-medium text-sm">Equipo</th>
              <th 
                className="py-3 px-4 text-center text-gray-400 font-medium text-sm cursor-pointer"
                onClick={() => handleSort('goals')}
              >
                <div className="flex items-center justify-center">
                  <span>Goles</span>
                  {sortConfig?.key === 'goals' && (
                    sortConfig.direction === 'asc' ? 
                    <ChevronUp className="ml-1 h-4 w-4" /> : 
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentScorers.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-gray-500">
                  No hay goleadores registrados
                </td>
              </tr>
            ) : (
              currentScorers.map((scorer, index) => (
                <tr 
                  key={scorer.player_id} 
                  className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                        {scorer.player_photo_url ? (
                          <img 
                            src={scorer.player_photo_url} 
                            alt={scorer.player_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {scorer.player_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="text-white font-medium">{scorer.player_name}</span>
                        <div className="text-gray-400 text-xs">
                          {indexOfFirstScorer + index + 1}° pos
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-300">
                    {scorer.team_name}
                  </td>
                  <td className="py-3 px-4 text-center text-white font-bold">
                    {scorer.goals}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            Mostrando {indexOfFirstScorer + 1} - {Math.min(indexOfLastScorer, filteredAndSortedScorers.length)} de {filteredAndSortedScorers.length} resultados
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Anterior
            </button>
            
            {/* Page numbers with ellipsis */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = idx + 1;
                } else if (currentPage <= 3) {
                  pageNum = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + idx;
                } else {
                  pageNum = currentPage - 2 + idx;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentPage === pageNum
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Siguiente
            </button>
          </div>
          
          <div className="text-sm text-gray-400">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}