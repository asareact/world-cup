// API endpoint for processing match events for suspensions
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MatchEvent } from '@/lib/database';
import { SuspensionLogicService } from '@/lib/suspensions/suspension-logic';

// POST /api/tournaments/[id]/process-suspensions - Process match events for suspensions
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    
    // Verify user is authorized (should be tournament creator or admin)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Verify tournament exists and user has permission
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, creator_id')
      .eq('id', id)
      .single();
    
    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' }, 
        { status: 404 }
      );
    }

    // Only tournament creator can process suspensions
    if (tournament.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { matchId, events }: { matchId: string; events: MatchEvent[] } = body;
    
    if (!matchId || !events) {
      return NextResponse.json(
        { error: 'matchId and events are required' }, 
        { status: 400 }
      );
    }

    // Verify the match belongs to this tournament
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, tournament_id')
      .eq('id', matchId)
      .eq('tournament_id', id)
      .single();
    
    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found in this tournament' }, 
        { status: 404 }
      );
    }

    // Process suspensions using the logic service
    const suspensionLogic = new SuspensionLogicService();
    await suspensionLogic.processMatchEventsForSuspensions(matchId, id, events);

    return NextResponse.json({ message: 'Suspensions processed successfully' });
  } catch (error) {
    console.error('Error in suspension processing API:', error);
    return NextResponse.json(
      { error: 'Failed to process suspensions' }, 
      { status: 500 }
    );
  }
}

// GET /api/tournaments/[id]/suspensions - Get all active suspensions for a tournament
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supabase = await createClient();
    
    // Verify user is authorized
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Verify tournament exists and user has permission
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, creator_id, is_public')
      .eq('id', id)
      .single();
    
    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' }, 
        { status: 404 }
      );
    }

    // Allow access if tournament is public or user is creator
    if (!tournament.is_public && tournament.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      );
    }

    // Get active suspensions for the tournament
    const { data: activeSuspensions, error: suspensionsError } = await supabase
      .from('player_suspensions')
      .select(`
        *,
        players(name, photo_url, jersey_number, team_id)
      `)
      .eq('tournament_id', id)
      .eq('served', false)
      .order('created_at', { ascending: false });
    
    if (suspensionsError) {
      console.error('Error fetching suspensions:', suspensionsError);
      return NextResponse.json(
        { error: 'Failed to fetch suspensions' }, 
        { status: 500 }
      );
    }

    // Process the data to include player and team information
    // First get team names for all unique team_ids
    const teamIds = [...new Set(activeSuspensions.map(s => s.players?.team_id).filter(Boolean))] as string[];
    const teamNames: Record<string, string> = {};
    
    if (teamIds.length > 0) {
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name')
        .in('id', teamIds);
      
      if (!teamsError && teams) {
        teams.forEach(team => {
          teamNames[team.id] = team.name;
        });
      }
    }
    
    const processedSuspensions = activeSuspensions.map(suspension => ({
      ...suspension,
      player_name: suspension.players?.name || 'Jugador',
      player_photo_url: suspension.players?.photo_url,
      player_jersey_number: suspension.players?.jersey_number,
      team_name: suspension.players?.team_id ? teamNames[suspension.players.team_id] || 'Equipo' : 'Equipo',
    }));

    return NextResponse.json(processedSuspensions);
  } catch (error) {
    console.error('Error in suspensions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suspensions' }, 
      { status: 500 }
    );
  }
}