'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/database'
import type { Match, Team, Player } from '@/lib/database'
import { Loader2, Play, Pause, Flag, Shield, Goal, RectangleVertical, Undo2, ShieldCheck, Hand, Trash2, Edit3, Square, AlertTriangle, Info } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useMatchState, LiveMatchEvent } from '@/lib/hooks/use-match-state'
import Image from 'next/image'
import { PlayerCard } from '@/components/referee/PlayerCard'
import { PlayerEventsModal } from '@/components/referee/PlayerEventsModal'


// --- Helper Components ---
type PlayerWithTeam = Player & { team_id: string }
type TeamWithPlayers = Team & { players: PlayerWithTeam[] }
type MatchWithDetails = Match & {
  home_team: TeamWithPlayers | null
  away_team: TeamWithPlayers | null
  tournament: { id: string; name: string } | null
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const Timer = ({ time, half, isRunning }: { time: number, half: string, isRunning: boolean }) => (
  <div className="text-center">
    <div className={`text-4xl font-bold font-mono transition-colors ${isRunning ? 'text-green-400' : 'text-gray-500'} md:text-6xl`}>
      {formatTime(time)}
    </div>
    <div className="text-sm text-gray-400 uppercase tracking-wider md:text-lg">
      {half === 'first' ? 'Primer Tiempo' : half === 'second' ? 'Segundo Tiempo' : 'Finalizado'}
    </div>
  </div>
);

const Scoreboard = ({ home, away }: { home: number, away: number }) => (
  <div className="text-3xl font-bold text-white md:text-5xl">
    {home} - {away}
  </div>
);

const PlayerCard = ({ 
  player, 
  onPlayerClick, 
  match, 
  suspendedPlayers, 
  events,
  potentialSuspensions 
}: { 
  player: Player, 
  onPlayerClick: (player: Player) => void, 
  match: MatchWithDetails | null, 
  suspendedPlayers?: string[], 
  events: LiveMatchEvent[],
  potentialSuspensions?: any[]
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isPlayerDetailsModalOpen, setIsPlayerDetailsModalOpen] = useState(false);
  
  // Check if player is suspended
  // Check if player is suspended (from official suspensions)
  const isOfficiallySuspended = suspendedPlayers && suspendedPlayers.includes(player.id);
  
  // Check for potential suspension warnings (based on live events in this match)
  const playerYellowCards = events.filter(
    event => event.player_id === player.id && 
             event.event_type === 'yellow_card'
  ).length;
  
  const playerRedCards = events.filter(
    event => event.player_id === player.id && 
             event.event_type === 'red_card'
  ).length;
  
  // Check if player is potentially suspended for this match (should be warned, not disabled)
  const isPotentiallySuspended = potentialSuspensions && 
    potentialSuspensions.some((s: any) => s.playerId === player.id);
  
  // Player should be warned if they:
  // 1. Have 1 yellow card (risk of suspension with another)
  // 2. Are potentially suspended (from tournament accumulation)
  const isWarned = (playerYellowCards >= 1 && playerYellowCards < 2 && playerRedCards === 0) || 
                   isPotentiallySuspended;
  
  // Player should be disabled/expelled if they have:
  // 1. A red card, or
  // 2. Two yellow cards in this match (which equals a red card)
  // 3. Official suspension
  const isExpelled = playerRedCards > 0 || playerYellowCards >= 2;
  
  // Overall disabled status (only official suspension or expelled in this match)
  const isDisabled = isOfficiallySuspended || isExpelled;
  
  // Group events by type for this player
  const playerEvents = events.filter(event => event.player_id === player.id);
  
  // Count events by type
  const eventCounts: Record<string, number> = {};
  playerEvents.forEach(event => {
    eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
  });
  
  // Get event icons with counts
  const eventIcons = [] as any[];
  const eventDisplay: Record<string, { icon: string; color: string }> = {
    goal: { icon: '⚽', color: 'text-green-400' },
    yellow_card: { icon: '🟨', color: 'text-yellow-400' },
    red_card: { icon: '🟥', color: 'text-red-400' },
    own_goal: { icon: '🥅', color: 'text-red-400' },
    assist: { icon: '🤝', color: 'text-blue-400' },
    save: { icon: '🧤', color: 'text-blue-400' },
  };
  
  Object.entries(eventCounts).forEach(([eventType, count]) => {
    const displayInfo = eventDisplay[eventType];
    if (displayInfo && count > 0) {
      eventIcons.push({
        icon: displayInfo.icon,
        color: displayInfo.color,
        count: count,
        type: eventType
      });
    }
  });
  
  return (
    <div className={`w-full p-3 rounded-lg flex items-center space-x-3 text-left relative group ${
      isDisabled ? 'bg-red-900/30 opacity-60' : 
      isWarned ? 'bg-yellow-900/30' : 
      'bg-gray-700/50'
    }`}>
      <button
        onClick={isDisabled ? undefined : () => onPlayerClick(player)}
        className={`flex items-center space-x-3 flex-grow text-left transition-all p-1 rounded -m-1 ${
          isDisabled ? 'cursor-not-allowed' : 'hover:bg-gray-600'
        }`}
        disabled={isDisabled}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
          isDisabled ? 'bg-red-800 text-red-200' :
          isWarned ? 'bg-yellow-800 text-yellow-200' :
          'bg-gray-800 text-green-400'
        }`}>
          {player.jersey_number || '-'}
        </div>
        <span className={`font-medium truncate flex-grow ${
          isDisabled ? 'text-red-300 line-through' :
          isWarned ? 'text-yellow-300' :
          'text-white'
        }`}>
          {player.name}
          {/* Show event icons for mobile view */}
          {eventIcons.length > 0 && (
            <span className="ml-2 inline-flex items-center space-x-1">
              {eventIcons.map((event, index) => (
                <span key={index} className="inline-flex items-center text-xs">
                  <span className={event.color}>{event.icon}</span>
                  {event.count > 1 && (
                    <span className="ml-0.5 text-xs">x{event.count}</span>
                  )}
                </span>
              ))}
            </span>
          )}
        </span>
        {player.is_captain && (
          <span title="Capitán">
            <ShieldCheck className={`h-5 w-5 ${
              isDisabled ? 'text-red-400' :
              isWarned ? 'text-yellow-400' :
              'text-yellow-400'
            } flex-shrink-0`} />
          </span>
        )}
        {player.position === 'portero' && (
          <span title="Portero">
            <Hand className={`h-5 w-5 ${
              isDisabled ? 'text-red-400' :
              isWarned ? 'text-yellow-400' :
              'text-blue-400'
            } flex-shrink-0`} />
          </span>
        )}
        {isWarned && !isDisabled && (
          <span title="Jugador advertido (tiene tarjeta amarilla)">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </span>
        )}
        {isDisabled && (
          <span title="Jugador expulsado o suspendido">
            <Flag className="h-4 w-4 text-red-400" />
          </span>
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedPlayer(player);
          setIsPlayerDetailsModalOpen(true);
        }}
        className={`p-1 ${
          isDisabled ? 'text-red-400' :
          isWarned ? 'text-yellow-400' :
          'text-gray-400'
        } hover:text-white transition-colors opacity-0 group-hover:opacity-100`}
        title="Ver detalles del jugador"
        disabled={isDisabled}
      >
        <Info className="h-4 w-4" />
      </button>
      {selectedPlayer && match && (
        <PlayerDetailsModal
          player={selectedPlayer}
          tournamentId={match.tournament?.id || ''}
          isOpen={isPlayerDetailsModalOpen}
          onClose={() => setIsPlayerDetailsModalOpen(false)}
        />
      )}
    </div>
  )
};

const EventModal = ({
  player,
  team,
  onClose,
  onAddEvent
}: {
  player: Player | null,
  team: TeamWithPlayers | null,
  onClose: () => void,
  onAddEvent: (event: Omit<LiveMatchEvent, 'timestamp' | 'minute' | 'id'>) => void
}) => {
  const [selectingAssist, setSelectingAssist] = useState(false);

  // Reset internal state when modal is closed or player changes
  useEffect(() => {
    if (!player) {
      setSelectingAssist(false);
    }
  }, [player]);

  if (!player || !team) return null;

  const handleEvent = (type: LiveMatchEvent['event_type']) => {
    if (type === 'goal') {
      setSelectingAssist(true);
    } else {
      onAddEvent({ player_id: player.id, team_id: team.id, event_type: type, description: null, assist_player_id: null });
      onClose();
    }
  };

  const handleAssist = (assistPlayerId: string | null) => {
    onAddEvent({
      player_id: player.id,
      team_id: team.id,
      event_type: 'goal',
      description: null,
      assist_player_id: assistPlayerId
    });
    onClose();
  };


  const isGoalkeeper = player.position === 'portero';
  const teammates = team.players.filter(p => p.id !== player.id);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-2">{player.name}</h3>

        {!selectingAssist ? (
          <>
            <p className="text-gray-400 mb-6">Selecciona un evento:</p>
            <div className="grid grid-cols-2 gap-3">
              {<button onClick={() => handleEvent('goal')} className="flex items-center justify-center space-x-2 bg-green-500/20 text-green-300 p-3 rounded-lg hover:bg-green-500/40"><Goal className="w-5 h-5" /><span>Gol</span></button>}
              {<button onClick={() => handleEvent('own_goal')} className="flex items-center justify-center space-x-2 bg-red-500/20 text-red-300 p-3 rounded-lg hover:bg-red-500/40"><Shield className="w-5 h-5" /><span>Autogol</span></button>}
              {isGoalkeeper && <button onClick={() => handleEvent('save')} className="flex items-center justify-center space-x-2 bg-blue-500/20 text-blue-300 p-3 rounded-lg hover:bg-blue-500/40"><Hand className="w-5 h-5" /><span>Atajada</span></button>}
              <button onClick={() => handleEvent('yellow_card')} className="flex items-center justify-center space-x-2 bg-yellow-500/20 text-yellow-300 p-3 rounded-lg hover:bg-yellow-500/40"><RectangleVertical className="w-5 h-5 bg-yellow-500" /><span>Amarilla</span></button>
              <button onClick={() => handleEvent('red_card')} className="flex items-center justify-center space-x-2 bg-red-500/20 text-red-300 p-3 rounded-lg hover:bg-red-500/40"><RectangleVertical className="w-5 h-5 bg-red-500" /><span>Roja</span></button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-400 mb-4">¿Quién dio la asistencia?</p>
            <button onClick={() => handleAssist(null)} className="w-full text-left mb-3 p-3 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 italic border border-gray-700">
              Sin Asistencia
            </button>
            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
              {teammates.map(p => (
                <button key={p.id} onClick={() => handleAssist(p.id)} className="w-full text-left p-3 rounded-lg flex items-center space-x-3 hover:bg-gray-700 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center font-bold text-green-400 flex-shrink-0">{p.jersey_number || '-'}</div>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};


const EventLog = ({
  events,
  match,
  onDeleteEvent,
  onEditEvent
}: {
  events: LiveMatchEvent[],
  match: MatchWithDetails | null,
  onDeleteEvent: (id: string) => void,
  onEditEvent: (id: string) => void
}) => {
  const getPlayerName = (playerId: string | null | undefined) => {
    if (!playerId || !match) return 'Desconocido';
    const allPlayers = [...(match.home_team?.players || []), ...(match.away_team?.players || [])];
    return allPlayers.find(p => p.id === playerId)?.name || 'Desconocido';
  };

  const getAssistPlayerName = (playerId: string | null) => {
    if (!playerId || !match) return null;
    const allPlayers = [...(match.home_team?.players || []), ...(match.away_team?.players || [])];
    return allPlayers.find(p => p.id === playerId)?.name || null;
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId || !match) return 'Desconocido';
    if (match.home_team?.id === teamId) return match.home_team.name;
    if (match.away_team?.id === teamId) return match.away_team.name;
    return 'Desconocido';
  };

  const eventDisplay: Record<string, { icon: string; text: string; color: string }> = {
    goal: { icon: '⚽', text: 'Gol', color: 'text-green-400' },
    yellow_card: { icon: '🟨', text: 'Tarjeta Amarilla', color: 'text-yellow-400' },
    red_card: { icon: '🟥', text: 'Tarjeta Roja', color: 'text-red-400' },
    own_goal: { icon: '🥅', text: 'Autogol', color: 'text-red-400' },
    assist: { icon: '🤝', text: 'Asistencia', color: 'text-blue-400' },
    save: { icon: '🧤', text: 'Atajada', color: 'text-blue-400' }, // For goalkeeper saves
  };

  // Separate events by team
  const homeTeamEvents = events.filter(event => event.team_id === match?.home_team?.id);
  const awayTeamEvents = events.filter(event => event.team_id === match?.away_team?.id);

  const EventItem = ({ event }: { event: LiveMatchEvent }) => {
    const playerName = getPlayerName(event.player_id);
    const assistPlayerName = event.assist_player_id ? getAssistPlayerName(event.assist_player_id) : null;
    const teamName = getTeamName(event.team_id);
    const eventInfo = eventDisplay[event.event_type];

    return (
      <div className="flex items-start text-sm bg-gray-800 p-3 rounded-md animate-in fade-in slide-in-from-top-2 duration-300 mb-2">
        <span className="font-mono text-gray-400 mr-2 text-xs self-center">{`Min ${event.minute}'`}</span>
        <span className={`text-xl mr-2 ${eventInfo.color}`}>{eventInfo.icon}</span>
        <div className="flex-grow">
          <div className="font-semibold text-gray-200">
            {eventInfo.text} - {playerName}
            {event.event_type === 'goal' && assistPlayerName && (
              <span className="text-gray-400 ml-2">(Asist: {assistPlayerName})</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">{teamName}</div>
        </div>
        <div className="flex space-x-1 ml-2">
          <button
            onClick={() => onDeleteEvent(event.id)}
            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
            title="Eliminar evento"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEditEvent(event.id)}
            className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
            title="Editar evento"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  if (events.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-4 p-4 bg-gray-800/50 rounded-lg">
        No hay eventos registrados.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Home Team Events */}
      <div className="bg-gray-900/50 rounded-lg p-3">
        <h3 className="font-semibold text-gray-300 mb-2 text-center border-b border-gray-700 pb-1">
          {match?.home_team?.name}
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto p-1">
          {[...homeTeamEvents].reverse().map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </div>
      </div>

      {/* Away Team Events */}
      <div className="bg-gray-900/50 rounded-lg p-3">
        <h3 className="font-semibold text-gray-300 mb-2 text-center border-b border-gray-700 pb-1">
          {match?.away_team?.name}
        </h3>
        <div className="space-y-2 max-h-80 overflow-y-auto p-1">
          {[...awayTeamEvents].reverse().map((event) => (
            <EventItem key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
};

// EditEventModal is integrated into the main component to avoid conditional hooks issue
const EditEventModal = ({
  event,
  match,
  onClose,
  onSave,
  updatedPlayerId,
  setUpdatedPlayerId,
  updatedEventType,
  setUpdatedEventType,
  updatedAssistPlayerId,
  setUpdatedAssistPlayerId,
  handleSubmit
}: {
  event: LiveMatchEvent | null,
  match: MatchWithDetails | null,
  onClose: () => void,
  onSave: (eventId: string, updatedData: Partial<Omit<LiveMatchEvent, 'id' | 'timestamp' | 'minute'>>) => void,
  updatedPlayerId: string,
  setUpdatedPlayerId: (id: string) => void,
  updatedEventType: LiveMatchEvent['event_type'],
  setUpdatedEventType: (type: LiveMatchEvent['event_type']) => void,
  updatedAssistPlayerId: string,
  setUpdatedAssistPlayerId: (id: string) => void,
  handleSubmit: () => void
}) => {
  if (!event || !match) return null;

  // Get players from the event's team
  const teamPlayers = (event.team_id === match.home_team?.id ?
    match.home_team?.players || [] :
    match.away_team?.players || []);

  const assistPlayers = teamPlayers.filter(p => p.id !== updatedPlayerId);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4">Editar Evento</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-2">Tipo de Evento</label>
            <select
              value={updatedEventType}
              onChange={(e) => setUpdatedEventType(e.target.value as LiveMatchEvent['event_type'])}
              className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600"
            >
              <option value="goal">Gol</option>
              <option value="yellow_card">Tarjeta Amarilla</option>
              <option value="red_card">Tarjeta Roja</option>
              <option value="own_goal">Autogol</option>
              {event.event_type === 'assist' && <option value="assist">Atajada</option>} {/* Only show if current is assist */}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">Jugador</label>
            <select
              value={updatedPlayerId}
              onChange={(e) => setUpdatedPlayerId(e.target.value)}
              className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600"
            >
              {teamPlayers.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>

          {(updatedEventType === 'goal') && (
            <div>
              <label className="block text-gray-400 mb-2">Asistente (opcional)</label>
              <select
                value={updatedAssistPlayerId}
                onChange={(e) => setUpdatedAssistPlayerId(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600"
              >
                <option value="">Sin asistencia</option>
                {assistPlayers.map(player => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
// --- Main Page Component ---

export default function RefereePage() {
  const { role } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<MatchWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspendedPlayers, setSuspendedPlayers] = useState<string[]>([]);
  const [potentialSuspensions, setPotentialSuspensions] = useState<any[]>([]);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [activeTeamTab, setActiveTeamTab] = useState<'home' | 'away'>('home');

  const { state: matchState, actions } = useMatchState(matchId, match?.home_team?.id, match?.away_team?.id);

  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const [modalTeam, setModalTeam] = useState<TeamWithPlayers | null>(null);

  const [editingEvent, setEditingEvent] = useState<LiveMatchEvent | null>(null);

  // State variables for EditEventModal
  const [updatedPlayerId, setUpdatedPlayerId] = useState<string>('');
  const [updatedEventType, setUpdatedEventType] = useState<LiveMatchEvent['event_type']>('goal');
  const [updatedAssistPlayerId, setUpdatedAssistPlayerId] = useState<string>('');

  const [showStopModal, setShowStopModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, eventId: string | null }>({
    visible: false,
    x: 0,
    y: 0,
    eventId: null
  });

  // Reset edit form when editingEvent changes
  useEffect(() => {
    if (editingEvent) {
      setUpdatedPlayerId(editingEvent.player_id);
      setUpdatedEventType(editingEvent.event_type);
      setUpdatedAssistPlayerId(editingEvent.assist_player_id || '');
    }
  }, [editingEvent]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, eventId: null });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible]);

  useEffect(() => {
    if (role && role !== 'superAdmin' && role !== 'arbitro') {
      router.replace('/dashboard');
    }
  }, [role, router]);

  useEffect(() => {
    if (!matchId) return;
    const fetchMatchDetails = async () => {
      setIsLoading(true);
      try {
        const data = await db.getMatchWithPlayers(matchId);
        if (!data) throw new Error('Match not found');
        setMatch(data as MatchWithDetails);
        
        // Fetch suspended players for this tournament
        if (data.tournament?.id) {
          const fetchSuspendedPlayers = async () => {
            try {
              const response = await fetch(`/api/tournaments/${data.tournament?.id}/suspensions`);
              if (response.ok) {
                const suspensions = await response.json();
                const suspendedIds = suspensions.map((s: any) => s.player_id);
                setSuspendedPlayers(suspendedIds);
              }
            } catch (err) {
              console.error('Error fetching suspended players:', err);
            }
          };
          
          // Fetch potential suspensions for this specific match
          const fetchPotentialSuspensions = async () => {
            try {
              const response = await fetch(`/api/tournaments/${data.tournament?.id}/matches/${matchId}/potential-suspensions`);
              if (response.ok) {
                const potentialSuspensions = await response.json();
                setPotentialSuspensions(potentialSuspensions);
                // Note: We don't combine with suspendedPlayers here
                // Potential suspensions are just for warnings, not disabling players
              }
            } catch (err) {
              console.error('Error fetching potential suspended players:', err);
            }
          };
          
          fetchSuspendedPlayers();
          fetchPotentialSuspensions();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatchDetails();
  }, [matchId]);

  const handlePlayerClick = (player: Player, team: TeamWithPlayers) => {
    setModalPlayer(player);
    setModalTeam(team);
  };

  const handleStopTimer = () => {
    actions.stopTimer();
    setShowStopModal(false);
  };

  const handleFinalize = () => {
    if (!match) return;

    const homePlayerIds = match.home_team?.players.map(p => p.id) || [];
    const awayPlayerIds = match.away_team?.players.map(p => p.id) || [];
    const allPlayerIds = [...homePlayerIds, ...awayPlayerIds];

    actions.finalizeMatch(allPlayerIds);
    setShowFinalizeModal(false);
  };

  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, eventId: string) => {
    e.preventDefault(); // Prevent default context menu

    // Only show context menu on mobile devices
    const isMobile = window.innerWidth < 768;

    if (!isMobile) {
      // On desktop, do nothing - the icons are already visible
      return;
    }

    let clientX, clientY;
    if ('touches' in e) {
      // For touch events
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // For mouse events
      clientX = e.clientX;
      clientY = e.clientY;
    }

    setContextMenu({
      visible: true,
      x: clientX,
      y: clientY,
      eventId
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, eventId: null });
  };

  const handleEditEvent = (eventId: string) => {
    const eventToEdit = matchState?.events.find(event => event.id === eventId);
    if (eventToEdit) {
      setEditingEvent(eventToEdit);
    }
    closeContextMenu();
  };

  const handleDeleteEvent = (eventId: string) => {
    actions.deleteEvent(eventId);
    closeContextMenu();
  };

  if (isLoading || !role || (role !== 'superAdmin' && role !== 'arbitro') || !matchState) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="h-10 w-10 animate-spin text-green-500" />
      </div>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-500"><h1 className="text-2xl font-bold">Error</h1><p>{error}</p></div>
      </DashboardLayout>
    );
  }

  // Define handleSubmit function for editing events
  const handleSubmit = () => {
    if (!editingEvent) return;

    // Only update fields that were changed
    const updates: Partial<Omit<LiveMatchEvent, 'id' | 'timestamp' | 'minute'>> = {};

    if (updatedPlayerId !== editingEvent.player_id) updates.player_id = updatedPlayerId;
    if (updatedEventType !== editingEvent.event_type) updates.event_type = updatedEventType;
    if (updatedAssistPlayerId !== (editingEvent.assist_player_id || '')) {
      updates.assist_player_id = updatedAssistPlayerId || null;
    }

    actions.editEvent(editingEvent.id, updates);
    setEditingEvent(null); // Close the modal after saving
  };

  return (
    <DashboardLayout>
      <EventModal player={modalPlayer} team={modalTeam} onClose={() => setModalPlayer(null)} onAddEvent={actions.addEvent} />
      <EditEventModal
        event={editingEvent}
        match={match}
        onClose={() => setEditingEvent(null)}
        onSave={actions.editEvent}
        updatedPlayerId={updatedPlayerId}
        setUpdatedPlayerId={setUpdatedPlayerId}
        updatedEventType={updatedEventType}
        setUpdatedEventType={setUpdatedEventType}
        updatedAssistPlayerId={updatedAssistPlayerId}
        setUpdatedAssistPlayerId={setUpdatedAssistPlayerId}
        handleSubmit={handleSubmit}
      />

      {/* Stop Timer Warning Modal */}
      {showStopModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowStopModal(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-xl font-bold text-white">Advertencia</h3>
            </div>
            <p className="text-gray-300 mb-6">
              ¿Estás seguro de que deseas detener el contador? Esta acción reiniciará el tiempo del partido y no se podrán recuperar los eventos registrados durante la sesión actual.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowStopModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleStopTimer}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg transition-colors"
              >
                Detener contador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Match Confirmation Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowFinalizeModal(false)}>
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-xl font-bold text-white">Confirmar Finalización</h3>
            </div>
            <p className="text-gray-300 mb-2">
              ¿Estás seguro de que deseas finalizar el partido?
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Esta acción es irreversible. Asegúrate de haber revisado todas las estadísticas antes de continuar.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalize}
                disabled={matchState.isFinalizing}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                {matchState.isFinalizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Finalizando...
                  </>
                ) : (
                  'Finalizar Partido'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu for Events on Mobile */}
      {contextMenu.visible && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 py-2 w-40"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the menu
        >
          <button
            onClick={() => contextMenu.eventId && handleEditEvent(contextMenu.eventId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar
          </button>
          <button
            onClick={() => contextMenu.eventId && handleDeleteEvent(contextMenu.eventId)}
            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </button>
        </div>
      )}
      <div className="container mx-auto p-4 text-white">
        {/* Mobile Layout: 3 letters + Logo, Score, Logo + 3 letters */}
        <div className="md:hidden flex flex-col items-center mb-2">
          {/* Timer above the score on mobile */}
          <div className="mb-2">
            <Timer time={matchState.time} half={matchState.currentHalf} isRunning={matchState.isRunning} />
          </div>

          <div className="flex items-center justify-between w-full">
            {/* Home Team - Mobile: 3 letters + Logo */}
            <div className="flex items-center">
              <div className="text-lg font-bold text-white max-w-[60px] truncate mr-1 md:text-sm">
                {(match?.home_team?.name || 'TBD').substring(0, 3).replace(/\s/g, '').toUpperCase()}
              </div>
              {match?.home_team?.logo_url ? (
                <Image
                  src={match.home_team.logo_url}
                  alt={match.home_team.name || ''}
                  width={40}
                  height={40}
                  className="w-12 h-12 rounded-full object-cover md:w-10 md:h-10"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center md:w-10 md:h-10">
                  <span className="text-lg font-bold text-white md:text-sm">
                    {(match?.home_team?.name || 'TBD').substring(0, 3).replace(/\s/g, '').toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Score - Centered */}
            <div className="text-center mx-2">
              <Scoreboard home={matchState.score.home} away={matchState.score.away} />
            </div>

            {/* Away Team - Mobile: Logo + 3 letters */}
            <div className="flex items-center">
              {match?.away_team?.logo_url ? (
                <Image
                  src={match.away_team.logo_url}
                  alt={match.away_team.name || ''}
                  width={40}
                  height={40}
                  className="w-12 h-12 rounded-full object-cover mr-1 md:w-10 md:h-10"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mr-1 md:w-10 md:h-10">
                  <span className="text-lg font-bold text-white md:text-sm">
                    {(match?.away_team?.name || 'TBD').substring(0, 3).replace(/\s/g, '').toUpperCase()}
                  </span>
                </div>
              )}
              <div className="text-lg font-bold text-white max-w-[60px] truncate md:text-sm">
                {(match?.away_team?.name || 'TBD').substring(0, 3).replace(/\s/g, '').toUpperCase()}
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Desktop Layout: Full Team Cards */}
        <div className="hidden md:flex items-center justify-between gap-4 mb-2">
          {/* Home Team */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <Image
                src={match?.home_team?.logo_url || '/file.svg'}
                alt={match?.home_team?.name || ''}
                width={80}
                height={80}
                className="h-20 w-20 object-cover rounded-full mb-2"
              />
              <h2 className="text-xl font-bold text-center truncate w-full">{match?.home_team?.name}</h2>
            </div>
          </div>

          {/* Score - Centered on desktop */}
          <div className="text-center mx-4">
            <Scoreboard home={matchState.score.home} away={matchState.score.away} />
          </div>

          {/* Away Team */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex-1 min-w-0">
            <div className="flex flex-col items-center">
              <Image
                src={match?.away_team?.logo_url || '/file.svg'}
                alt={match?.away_team?.name || ''}
                width={80}
                height={80}
                className="h-20 w-20 object-cover rounded-full mb-2"
              />
              <h2 className="text-xl font-bold text-center truncate w-full">{match?.away_team?.name}</h2>
            </div>
          </div>
        </div>

        {/* Timer - Shown on all screens below the header (for desktop only) */}
        <div className="hidden md:flex justify-center my-4">
          <Timer time={matchState.time} half={matchState.currentHalf} isRunning={matchState.isRunning} />
        </div>

        {/* Divider between score/events and buttons (only on mobile) */}
        <div className="md:hidden border-t border-gray-700 my-4"></div>

        {/* Timer Controls */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="flex space-x-2">
            {!matchState.isRunning ? (
              <button
                onClick={actions.startTimer}
                disabled={matchState.currentHalf === 'finished'}
                className="p-3 bg-green-600 rounded-lg text-white hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Play className="h-5 w-5" />
                <span className="ml-2 hidden sm:inline">Iniciar</span>
              </button>
            ) : (
              <button
                onClick={actions.pauseTimer}
                className="p-3 bg-yellow-600 rounded-lg text-white hover:bg-yellow-500 flex items-center justify-center"
              >
                <Pause className="h-5 w-5" />
                <span className="ml-2 hidden sm:inline">Pausar</span>
              </button>
            )}
            <button
              onClick={() => setShowStopModal(true)}
              className="p-3 bg-red-600 rounded-lg text-white hover:bg-red-500 flex items-center justify-center"
            >
              <Square className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Detener</span>
            </button>
            <button
              onClick={() => setShowFinalizeModal(true)}
              disabled={matchState.isFinalizing}
              className="p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {matchState.isFinalizing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="ml-2 hidden sm:inline">Finalizando</span>
                </>
              ) : (
                <>
                  <Flag className="h-5 w-5" />
                  <span className="ml-2 hidden sm:inline">Finalizar</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">

            <button
              onClick={actions.undoLastEvent}
              disabled={!matchState || matchState.events.length === 0}
              className="flex items-center space-x-2 text-sm text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              <span>Deshacer</span>
            </button>
          </div>

          {/* Events Section - Desktop Only */}
          <div className="hidden md:block mb-8">
            <h3 className="text-xl font-semibold mb-6 text-center">Eventos</h3>
            <EventLog events={matchState.events} match={match} onDeleteEvent={actions.deleteEvent} onEditEvent={(id) => {
              // Find the event to edit
              const eventToEdit = matchState.events.find(event => event.id === id);
              if (eventToEdit) {
                setEditingEvent(eventToEdit);
              }
            }} />
          </div>

          {/* Player Lists with Tabs - Mobile */}
          <div className="md:hidden">
            <div className="border-b border-gray-700 mb-4">
              <div className="flex">
                <button
                  className={`flex-1 py-2 text-center font-medium ${activeTeamTab === 'home' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
                  onClick={() => setActiveTeamTab('home')}
                >
                  {match?.home_team?.name || 'Local'}
                </button>
                <button
                  className={`flex-1 py-2 text-center font-medium ${activeTeamTab === 'away' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-400'}`}
                  onClick={() => setActiveTeamTab('away')}
                >
                  {match?.away_team?.name || 'Visitante'}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {activeTeamTab === 'home' && match?.home_team?.players.sort((a, b) => {
                  if (a.is_captain && !b.is_captain) return -1;
                  if (!a.is_captain && b.is_captain) return 1;
                  if (a.position === 'portero' && b.position !== 'portero') return -1;
                  if (a.position !== 'portero' && b.position === 'portero') return 1;
                  return (a.jersey_number ?? 999) - (b.jersey_number ?? 999);
                }).map(p => <PlayerCard match={match} suspendedPlayers={suspendedPlayers} events={matchState.events} key={p.id} player={p} onPlayerClick={(pl) => handlePlayerClick(pl, match.home_team!)} />)}
              {activeTeamTab === 'away' && match?.away_team?.players
                .sort((a, b) => {
                  if (a.is_captain && !b.is_captain) return -1;
                  if (!a.is_captain && b.is_captain) return 1;
                  if (a.position === 'portero' && b.position !== 'portero') return -1;
                  if (a.position !== 'portero' && b.position === 'portero') return 1;
                  return (a.jersey_number ?? 999) - (b.jersey_number ?? 999);
                })
                .map(p => <PlayerCard match={match} suspendedPlayers={suspendedPlayers} events={matchState.events} key={p.id} player={p} onPlayerClick={(pl) => handlePlayerClick(pl, match.away_team!)} />)}
            </div>
          </div>

          {/* Player Lists - Desktop (Two Columns) */}
          <div className="hidden md:block">
            <h3 className="text-xl font-semibold mb-6 text-center">Jugadores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="space-y-2">
                  {match?.home_team?.players
                  .sort((a, b) => {
                      if (a.is_captain && !b.is_captain) return -1;
                      if (!a.is_captain && b.is_captain) return 1;
                      if (a.position === 'portero' && b.position !== 'portero') return -1;
                      if (a.position !== 'portero' && b.position === 'portero') return 1;
                      return (a.jersey_number ?? 999) - (b.jersey_number ?? 999);
                    }).map(p => <PlayerCard match={match} suspendedPlayers={suspendedPlayers} events={matchState.events} key={p.id} player={p} onPlayerClick={(pl) => handlePlayerClick(pl, match.home_team!)} />)}
                </div>
              </div>
              <div>
                <div className="space-y-2">
                  {match?.away_team?.players
                    .sort((a, b) => {
                      if (a.is_captain && !b.is_captain) return -1;
                      if (!a.is_captain && b.is_captain) return 1;
                      if (a.position === 'portero' && b.position !== 'portero') return -1;
                      if (a.position !== 'portero' && b.position === 'portero') return 1;
                      return (a.jersey_number ?? 999) - (b.jersey_number ?? 999);
                    })
                    .map(p => <PlayerCard match={match} suspendedPlayers={suspendedPlayers} events={matchState.events} key={p.id} player={p} onPlayerClick={(pl) => handlePlayerClick(pl, match.away_team!)} />)}
                </div>
              </div>
            </div>
          </div>
        </div>

    </DashboardLayout>
  );
}

