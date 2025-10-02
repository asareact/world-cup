// Component to display suspended players indicators
import { useState, useEffect } from 'react';
import { SuspensionLogicService } from '@/lib/suspension-logic';
import { Ban, AlertTriangle } from 'lucide-react';

interface SuspendedPlayerIndicatorProps {
  playerId: string;
  tournamentId: string;
  playerName: string;
}

export function SuspendedPlayerIndicator({ 
  playerId, 
  tournamentId,
  playerName
}: SuspendedPlayerIndicatorProps) {
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuspensionStatus = async () => {
      try {
        const suspensionService = new SuspensionLogicService();
        const suspended = await suspensionService.isPlayerSuspended(playerId, tournamentId);
        setIsSuspended(suspended);
      } catch (error) {
        console.error('Error checking player suspension status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (playerId && tournamentId) {
      checkSuspensionStatus();
    }
  }, [playerId, tournamentId]);

  if (loading) {
    return (
      <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-700 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
      </div>
    );
  }

  if (!isSuspended) {
    return null;
  }

  return (
    <div 
      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400"
      title={`Jugador sancionado: ${playerName}`}
    >
      <Ban className="h-3 w-3" />
    </div>
  );
}

interface PlayerSuspensionBadgeProps {
  playerId: string;
  tournamentId: string;
  playerName: string;
}

export function PlayerSuspensionBadge({ 
  playerId, 
  tournamentId,
  playerName
}: PlayerSuspensionBadgeProps) {
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuspensionStatus = async () => {
      try {
        const suspensionService = new SuspensionLogicService();
        const suspended = await suspensionService.isPlayerSuspended(playerId, tournamentId);
        setIsSuspended(suspended);
      } catch (error) {
        console.error('Error checking player suspension status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (playerId && tournamentId) {
      checkSuspensionStatus();
    }
  }, [playerId, tournamentId]);

  if (loading) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700/50 border border-gray-600 text-gray-400 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-gray-500 mr-1"></div>
        Cargando...
      </span>
    );
  }

  if (!isSuspended) {
    return null;
  }

  return (
    <span 
      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 border border-red-500/30 text-red-300"
      title={`Jugador sancionado: ${playerName}`}
    >
      <Ban className="h-3 w-3 mr-1" />
      Sancionado
    </span>
  );
}

interface TeamSuspensionWarningProps {
  teamId: string;
  tournamentId: string;
  teamName: string;
}

export function TeamSuspensionWarning({ 
  teamId, 
  tournamentId,
  teamName
}: TeamSuspensionWarningProps) {
  const [suspendedPlayers, setSuspendedPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamSuspensions = async () => {
      try {
        const suspensionService = new SuspensionLogicService();
        // This would need to be implemented to get suspended players for a team
        // For now we'll simulate with an empty array
        setSuspendedPlayers([]);
      } catch (error) {
        console.error('Error fetching team suspensions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (teamId && tournamentId) {
      fetchTeamSuspensions();
    }
  }, [teamId, tournamentId]);

  if (loading) {
    return (
      <div className="inline-flex items-center text-xs text-gray-400">
        <div className="w-2 h-2 rounded-full bg-gray-500 mr-1 animate-pulse"></div>
        Cargando sanciones...
      </div>
    );
  }

  if (suspendedPlayers.length === 0) {
    return null;
  }

  return (
    <div 
      className="inline-flex items-center text-xs text-red-400"
      title={`${suspendedPlayers.length} jugador(es) sancionado(s) en ${teamName}`}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      {suspendedPlayers.length} sancionado(s)
    </div>
  );
}