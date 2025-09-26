'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { db } from '@/lib/database'
import type { Match, Team, Player } from '@/lib/database'
import { Loader2, Play, Pause, Flag, Shield, Goal, RectangleVertical, Undo2, ShieldCheck, Hand } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useMatchState, LiveMatchEvent } from '@/lib/hooks/use-match-state'
import Image from 'next/image'

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
    <div className={`text-6xl font-bold font-mono transition-colors ${isRunning ? 'text-green-400' : 'text-gray-500'}`}>
      {formatTime(time)}
    </div>
    <div className="text-lg text-gray-400 uppercase tracking-wider">
      {half === 'first' ? 'Primer Tiempo' : half === 'second' ? 'Segundo Tiempo' : 'Finalizado'}
    </div>
  </div>
);

const Scoreboard = ({ home, away }: { home: number, away: number }) => (
  <div className="text-5xl font-bold text-white">
    {home} - {away}
  </div>
);

const PlayerCard = ({ player, onPlayerClick }: { player: Player, onPlayerClick: (player: Player) => void }) => (
  <button 
    onClick={() => onPlayerClick(player)}
    className="w-full bg-gray-700/50 p-3 rounded-lg flex items-center space-x-3 hover:bg-gray-600 transition-all text-left">
    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-green-400 flex-shrink-0">
      {player.jersey_number || '-'}
    </div>
    <span className="text-white font-medium truncate flex-grow">{player.name}</span>
    {player.is_captain && <span title="Capitán"><ShieldCheck className="h-5 w-5 text-yellow-400 flex-shrink-0" /></span>}
    {player.position === 'portero' && <span title="Portero"><Hand className="h-5 w-5 text-blue-400 flex-shrink-0" /></span>}
  </button>
);

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
              {!isGoalkeeper && <button onClick={() => handleEvent('goal')} className="flex items-center justify-center space-x-2 bg-green-500/20 text-green-300 p-3 rounded-lg hover:bg-green-500/40"><Goal className="w-5 h-5"/><span>Gol</span></button>}
              {!isGoalkeeper && <button onClick={() => handleEvent('own_goal')} className="flex items-center justify-center space-x-2 bg-red-500/20 text-red-300 p-3 rounded-lg hover:bg-red-500/40"><Shield className="w-5 h-5"/><span>Autogol</span></button>}
              {isGoalkeeper && <button onClick={() => handleEvent('assist')} className="flex items-center justify-center space-x-2 bg-blue-500/20 text-blue-300 p-3 rounded-lg hover:bg-blue-500/40"><Hand className="w-5 h-5"/><span>Atajada</span></button>}
              <button onClick={() => handleEvent('yellow_card')} className="flex items-center justify-center space-x-2 bg-yellow-500/20 text-yellow-300 p-3 rounded-lg hover:bg-yellow-500/40"><RectangleVertical className="w-5 h-5 bg-yellow-500"/><span>Amarilla</span></button>
              <button onClick={() => handleEvent('red_card')} className="flex items-center justify-center space-x-2 bg-red-500/20 text-red-300 p-3 rounded-lg hover:bg-red-500/40"><RectangleVertical className="w-5 h-5 bg-red-500"/><span>Roja</span></button>
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
  if (events.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-4 p-4 bg-gray-800/50 rounded-lg">
        No hay eventos registrados.
      </div>
    );
  }

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

  const eventDisplay: Record<string, { icon: string; text: string }> = {
    goal: { icon: '⚽', text: 'Gol' },
    yellow_card: { icon: '🟨', text: 'Tarjeta Amarilla' },
    red_card: { icon: '🟥', text: 'Tarjeta Roja' },
    own_goal: { icon: '🥅', text: 'Autogol' },
    assist: { icon: '🧤', text: 'Atajada' }, // For goalkeeper saves
  };

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
      {[...events].reverse().map((event) => {
        const playerName = getPlayerName(event.player_id);
        const assistPlayerName = event.assist_player_id ? getAssistPlayerName(event.assist_player_id) : null;
        const teamName = getTeamName(event.team_id);
        
        return (
          <div key={event.id} className="flex items-center text-sm bg-gray-800 p-3 rounded-md animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="font-mono text-gray-400 w-14">{`Min ${event.minute}'`}</span>
            <span className="text-xl mr-2">{eventDisplay[event.event_type]?.icon || '🔹'}</span>
            <div className="flex-grow">
              <div className="font-semibold text-gray-200">
                {eventDisplay[event.event_type]?.text || event.event_type} - {playerName}
                {event.event_type === 'goal' && assistPlayerName && (
                  <span className="text-gray-400 ml-2">(Asist: {assistPlayerName})</span>
                )}
              </div>
              <div className="text-xs text-gray-500">{teamName}</div>
            </div>
            <div className="flex space-x-1 ml-2">
              <button 
                onClick={() => onDeleteEvent(event.id)}
                className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                title="Eliminar evento"
              >
                🗑️
              </button>
              <button 
                onClick={() => onEditEvent(event.id)}
                className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                title="Editar evento"
              >
                ✏️
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const EditEventModal = ({ 
  event, 
  match,
  onClose, 
  onSave 
}: { 
  event: LiveMatchEvent | null, 
  match: MatchWithDetails | null,
  onClose: () => void, 
  onSave: (eventId: string, updatedData: Partial<Omit<LiveMatchEvent, 'id' | 'timestamp' | 'minute'>>) => void 
}) => {
  if (!event || !match) return null;

  const [updatedPlayerId, setUpdatedPlayerId] = useState(event.player_id);
  const [updatedEventType, setUpdatedEventType] = useState(event.event_type);
  const [updatedAssistPlayerId, setUpdatedAssistPlayerId] = useState(event.assist_player_id || '');

  const handleSubmit = () => {
    // Only update fields that were changed
    const updates: Partial<Omit<LiveMatchEvent, 'id' | 'timestamp' | 'minute'>> = {};
    
    if (updatedPlayerId !== event.player_id) updates.player_id = updatedPlayerId;
    if (updatedEventType !== event.event_type) updates.event_type = updatedEventType;
    if (updatedAssistPlayerId !== (event.assist_player_id || '')) {
      updates.assist_player_id = updatedAssistPlayerId || null;
    }
    
    onSave(event.id, updates);
    onClose();
  };

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
  
  const { state: matchState, actions } = useMatchState(matchId, match?.home_team?.id, match?.away_team?.id);

  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);
  const [modalTeam, setModalTeam] = useState<TeamWithPlayers | null>(null);
  const [editingEvent, setEditingEvent] = useState<LiveMatchEvent | null>(null);

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

  const handleFinalize = () => {
    if (!match) return;

    const homePlayerIds = match.home_team?.players.map(p => p.id) || [];
    const awayPlayerIds = match.away_team?.players.map(p => p.id) || [];
    const allPlayerIds = [...homePlayerIds, ...awayPlayerIds];

    actions.finalizeMatch(allPlayerIds);
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

  return (
    <DashboardLayout>
      <EventModal player={modalPlayer} team={modalTeam} onClose={() => setModalPlayer(null)} onAddEvent={actions.addEvent} />
      <EditEventModal 
        event={editingEvent} 
        match={match} 
        onClose={() => setEditingEvent(null)} 
        onSave={actions.editEvent} 
      />
      <div className="container mx-auto p-4 text-white">
        {/* Header */}
        <div className="grid grid-cols-3 items-center mb-8">
          <div className="text-left">
            <Image src={match?.home_team?.logo_url || '/file.svg'} alt={match?.home_team?.name || ''} width={64} height={64} className="h-16 w-16 object-contain inline"/>
            <h2 className="text-2xl font-bold truncate">{match?.home_team?.name}</h2>
          </div>
          <div className="text-center">
            <Scoreboard home={matchState.score.home} away={matchState.score.away} />
          </div>
          <div className="text-right">
            <Image src={match?.away_team?.logo_url || '/file.svg'} alt={match?.away_team?.name || ''} width={64} height={64} className="h-16 w-16 object-contain inline"/>
            <h2 className="text-2xl font-bold truncate">{match?.away_team?.name}</h2>
          </div>
        </div>

        {/* Timer and Controls */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-around mb-8">
          <Timer time={matchState.time} half={matchState.currentHalf} isRunning={matchState.isRunning} />
          <div className="flex space-x-4">
            {!matchState.isRunning ? (
              <button onClick={actions.startTimer} disabled={matchState.currentHalf === 'finished'} className="p-4 bg-green-600 rounded-full text-white hover:bg-green-500 disabled:bg-gray-600"><Play className="h-6 w-6"/></button>
            ) : (
              <button onClick={actions.pauseTimer} className="p-4 bg-yellow-600 rounded-full text-white hover:bg-yellow-500"><Pause className="h-6 w-6"/></button>
            )}
            <button onClick={handleFinalize} disabled={matchState.isFinalizing} className="p-4 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed">
              {matchState.isFinalizing ? <Loader2 className="h-6 w-6 animate-spin"/> : <Flag className="h-6 w-6"/>}
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
              <Undo2 className="w-4 h-4"/>
              <span>Deshacer</span>
            </button>
          </div>
          <EventLog events={matchState.events} match={match} onDeleteEvent={actions.deleteEvent} onEditEvent={(id) => {
            // Find the event to edit
            const eventToEdit = matchState.events.find(event => event.id === id);
            if (eventToEdit) {
              setEditingEvent(eventToEdit);
            }
          }} />
        </div>

        {/* Player Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">Jugadores de {match?.home_team?.name}</h3>
            <div className="space-y-2">
              {match?.home_team?.players.map(p => <PlayerCard key={p.id} player={p} onPlayerClick={(pl) => handlePlayerClick(pl, match.home_team!)} />)}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Jugadores de {match?.away_team?.name}</h3>
            <div className="space-y-2">
              {match?.away_team?.players
                .sort((a, b) => {
                  if (a.is_captain && !b.is_captain) return -1;
                  if (!a.is_captain && b.is_captain) return 1;
                  if (a.position === 'portero' && b.position !== 'portero') return -1;
                  if (a.position !== 'portero' && b.position === 'portero') return 1;
                  return (a.jersey_number ?? 999) - (b.jersey_number ?? 999);
                })
                .map(p => <PlayerCard key={p.id} player={p} onPlayerClick={(pl) => handlePlayerClick(pl, match.away_team!)} />)}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
   
