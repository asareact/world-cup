// Hook to manage suspended players
import { useState, useEffect } from 'react';
import { SuspensionLogicService } from '@/lib/suspension-logic';

interface UseSuspendedPlayersProps {
  tournamentId: string;
  teams: any[];
  matches: any[];
  topScorers: any[];
  standings: any[];
}

export function useSuspendedPlayers({
  tournamentId,
  teams,
  matches,
  topScorers,
  standings
}: UseSuspendedPlayersProps) {
  const [suspendedPlayers, setSuspendedPlayers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuspendedPlayers = async () => {
      if (!tournamentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const suspensionService = new SuspensionLogicService();
        
        // Create a map of suspended players
        const suspendedMap: Record<string, boolean> = {};
        
        // Check each player in teams
        for (const team of teams) {
          // In a real implementation, we would fetch team players
          // For now, we'll check if any top scorers belong to this team
          const teamTopScorers = topScorers.filter(scorer => scorer.team_id === team.id);
          
          for (const scorer of teamTopScorers) {
            if (scorer.player_id) {
              const isSuspended = await suspensionService.isPlayerSuspended(scorer.player_id, tournamentId);
              suspendedMap[scorer.player_id] = isSuspended;
            }
          }
        }
        
        setSuspendedPlayers(suspendedMap);
      } catch (err) {
        console.error('Error fetching suspended players:', err);
        setError('Error al cargar información de sanciones');
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId && teams.length > 0) {
      fetchSuspendedPlayers();
    }
  }, [tournamentId, teams, matches, topScorers, standings]);

  const isPlayerSuspended = (playerId: string): boolean => {
    return suspendedPlayers[playerId] || false;
  };

  const refreshSuspendedPlayers = async () => {
    if (!tournamentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const suspensionService = new SuspensionLogicService();
      
      // Refresh suspended players map
      const suspendedMap: Record<string, boolean> = {};
      
      for (const team of teams) {
        const teamTopScorers = topScorers.filter(scorer => scorer.team_id === team.id);
        
        for (const scorer of teamTopScorers) {
          if (scorer.player_id) {
            const isSuspended = await suspensionService.isPlayerSuspended(scorer.player_id, tournamentId);
            suspendedMap[scorer.player_id] = isSuspended;
          }
        }
      }
      
      setSuspendedPlayers(suspendedMap);
    } catch (err) {
      console.error('Error refreshing suspended players:', err);
      setError('Error al actualizar información de sanciones');
    } finally {
      setLoading(false);
    }
  };

  return {
    suspendedPlayers,
    isPlayerSuspended,
    refreshSuspendedPlayers,
    loading,
    error
  };
}