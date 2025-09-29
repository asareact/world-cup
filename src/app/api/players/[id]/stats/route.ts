import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { createClient } from '@/lib/supabase/server';

// GET /api/players/[id]/stats?tournamentId=[tournamentId] - Get player stats for a specific tournament
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
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Get player basic info
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select(`
        id,
        name,
        jersey_number,
        position,
        photo_url,
        birth_date,
        is_captain,
        team_id,
        teams(name)
      `)
      .eq('id', id)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' }, 
        { status: 404 }
      );
    }

    // Get player stats for the specific tournament
    const { data: playerStats, error: statsError } = await supabase
      .from('player_stats')
      .select(`
        goals,
        assists,
        yellow_cards,
        red_cards,
        matches_played,
        minutes_played,
        saves_made,
        goals_conceded,
        clean_sheets,
        matches_appeared
      `)
      .eq('player_id', id)
      .eq('tournament_id', tournamentId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 means no rows found
      return NextResponse.json(
        { error: 'Error fetching player stats' }, 
        { status: 500 }
      );
    }

    // If no stats found for tournament, return default values
    const stats = playerStats || {
      goals: 0,
      assists: 0,
      yellow_cards: 0,
      red_cards: 0,
      matches_played: 0,
      minutes_played: 0,
      saves_made: 0,
      goals_conceded: 0,
      clean_sheets: 0,
      matches_appeared: 0
    };

    // Calculate rating based on ideal 5 criteria
    // Only calculate rating if player has at least one match played and one event registered
    let rating = 0;
    
    const hasMatchesPlayed = stats.matches_played > 0;
    const hasEventsRegistered = stats.goals > 0 || stats.assists > 0 || 
                                 stats.yellow_cards > 0 || stats.red_cards > 0 ||
                                 stats.saves_made > 0; // For goalkeepers
    
    if (hasMatchesPlayed && hasEventsRegistered) {
      rating = 60; // Base rating

      // Adjust rating based on position
      if (player.position === 'portero') {
        // For goalkeepers: emphasize saves, clean sheets, minimize goals conceded
        rating += Math.min(stats.saves_made * 0.5, 15); // Up to 15 points for saves
        rating += Math.min(stats.clean_sheets * 3, 15); // Up to 15 points for clean sheets
        rating -= Math.min(stats.goals_conceded * 0.5, 10); // Up to -10 points for goals conceded
      } else {
        // For outfield players: emphasize goals and assists
        rating += stats.goals * 3; // 3 points per goal
        rating += stats.assists * 2; // 2 points per assist
      }

      // Adjust for discipline (cards)
      rating -= stats.yellow_cards * 1; // -1 point per yellow card
      rating -= stats.red_cards * 2; // -2 points per red card

      // Adjust for participation (matches played)
      rating += Math.min(stats.matches_played * 0.5, 5); // Up to 5 bonus points

      // Ensure rating stays within a reasonable range
      rating = Math.max(10, Math.min(99, Math.round(rating)));
    }
    // If player doesn't meet criteria, rating remains 0

    // Return combined player info and stats
    return NextResponse.json({
      ...player,
      stats: {
        ...stats,
        rating
      }
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player stats' }, 
      { status: 500 }
    );
  }
}