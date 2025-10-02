// Component to display suspended players in team roster
import { Ban, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SuspendedPlayerBadgeProps {
  playerName: string;
  reason?: string;
  matchesRemaining?: number;
  showFullInfo?: boolean;
}

export function SuspendedPlayerBadge({ 
  playerName, 
  reason,
  matchesRemaining,
  showFullInfo = false
}: SuspendedPlayerBadgeProps) {
  if (showFullInfo) {
    return (
      <motion.div 
        className="inline-flex items-center px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-medium"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Ban className="h-4 w-4 mr-2 text-red-400" />
        <div className="flex flex-col">
          <span className="font-semibold">{playerName}</span>
          {reason && (
            <span className="text-xs text-red-400/80 mt-0.5">{reason}</span>
          )}
          {matchesRemaining && (
            <span className="text-xs text-red-400/80">
              {matchesRemaining} partido{matchesRemaining > 1 ? 's' : ''} restante{matchesRemaining > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="inline-flex items-center px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      title={`${playerName} - ${reason || 'Jugador sancionado'}`}
    >
      <Ban className="h-3 w-3 mr-1 text-red-400" />
      Sancionado
    </motion.div>
  );
}

interface TeamSuspensionListProps {
  suspendedPlayers: any[];
  tournamentId: string;
}

export function TeamSuspensionList({ 
  suspendedPlayers, 
  tournamentId 
}: TeamSuspensionListProps) {
  if (suspendedPlayers.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
          <AlertTriangle className="h-6 w-6 text-green-400" />
        </div>
        <p className="text-gray-400 text-sm">No hay jugadores sancionados en este momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suspendedPlayers.map((player, index) => (
        <motion.div
          key={player.id || index}
          className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-900/50 p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold">
              {player.player_name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-semibold text-white">{player.player_name || 'Jugador'}</p>
              <p className="text-xs text-gray-400">{player.team_name || 'Equipo'}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <SuspendedPlayerBadge 
              playerName={player.player_name || 'Jugador'}
              reason={player.reason || 'Sancionado'}
              matchesRemaining={player.suspension_matches}
              showFullInfo={false}
            />
            <p className="text-xs text-gray-500 mt-1">
              {player.suspension_matches} partido{player.suspension_matches > 1 ? 's' : ''} restante{player.suspension_matches > 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface MatchSuspendedPlayersProps {
  homeTeamSuspended: any[];
  awayTeamSuspended: any[];
}

export function MatchSuspendedPlayers({ 
  homeTeamSuspended, 
  awayTeamSuspended 
}: MatchSuspendedPlayersProps) {
  const hasSuspendedPlayers = homeTeamSuspended.length > 0 || awayTeamSuspended.length > 0;
  
  if (!hasSuspendedPlayers) {
    return null;
  }

  return (
    <motion.div 
      className="rounded-2xl border border-gray-700 bg-gray-900/50 p-4 mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <h3 className="text-lg font-semibold text-white">Jugadores Sancionados</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {homeTeamSuspended.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Equipo Local</h4>
            <div className="space-y-2">
              {homeTeamSuspended.map((player, index) => (
                <div key={player.id || `home-${index}`} className="flex items-center gap-2 text-sm">
                  <Ban className="h-4 w-4 text-red-400" />
                  <span className="text-gray-300">{player.player_name || 'Jugador'}</span>
                  <span className="text-xs text-gray-500">
                    ({player.suspension_matches} partido{player.suspension_matches > 1 ? 's' : ''})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {awayTeamSuspended.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Equipo Visitante</h4>
            <div className="space-y-2">
              {awayTeamSuspended.map((player, index) => (
                <div key={player.id || `away-${index}`} className="flex items-center gap-2 text-sm">
                  <Ban className="h-4 w-4 text-red-400" />
                  <span className="text-gray-300">{player.player_name || 'Jugador'}</span>
                  <span className="text-xs text-gray-500">
                    ({player.suspension_matches} partido{player.suspension_matches > 1 ? 's' : ''})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}