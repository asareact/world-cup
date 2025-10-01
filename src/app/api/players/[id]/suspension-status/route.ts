// API endpoint for checking player suspension status
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PlayerSuspensionService } from '@/lib/database/player-suspensions';

// GET /api/players/[id]/suspension-status?tournamentId=[tournamentId] - Check if a player is suspended
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const tournamentId = url.searchParams.get('tournamentId');
  
  if (!tournamentId) {
    return NextResponse.json(
      { error: 'Tournament ID is required' }, 
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      // For public access, we'll still allow access to suspension status
      // But verify the tournament is public
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('is_public')
        .eq('id', tournamentId)
        .single();
      
      if (tournamentError || !tournament || !tournament.is_public) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }
    }

    // Check if player exists
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('id', id)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' }, 
        { status: 404 }
      );
    }

    // Use the suspension service to check if player is suspended
    const suspensionService = new PlayerSuspensionService();
    const isSuspended = await suspensionService.getActivePlayerSuspensions(id, tournamentId)
      .then(result => {
        if (result.error) {
          console.error('Error checking player suspension status:', result.error);
          return false;
        }
        return result.data && result.data.length > 0;
      });

    // Get suspension details if suspended
    let suspensionDetails = null;
    if (isSuspended) {
      const { data: suspensions, error: suspensionsError } = await supabase
        .from('player_suspensions')
        .select('*')
        .eq('player_id', id)
        .eq('tournament_id', tournamentId)
        .eq('served', false)
        .order('created_at', { ascending: false });
      
      if (!suspensionsError && suspensions && suspensions.length > 0) {
        suspensionDetails = suspensions[0]; // Get the most recent active suspension
      }
    }

    return NextResponse.json({
      isSuspended,
      suspensionDetails
    });
  } catch (error) {
    console.error('Error in player suspension status API:', error);
    return NextResponse.json(
      { error: 'Failed to check player suspension status' }, 
      { status: 500 }
    );
  }
}