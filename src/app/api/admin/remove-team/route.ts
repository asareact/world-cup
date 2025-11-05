import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with proper cookie handling
    const supabase = createMiddlewareClient(request, new NextResponse());
    
    // Get the user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges - try user_profiles table first
    let profile = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If user_profiles doesn't exist, try profiles table as fallback
    if (profile.error) {
      if (profile.error.code === '42P01' || profile.error.message.includes('does not exist')) {
        profile = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
      }
    }

    if (profile.error || !profile.data || !['superAdmin', 'arbitro'].includes(profile.data.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get the request body
    const body = await request.json();
    const { team_id, tournament_id, action } = body;

    if (!team_id) {
      return NextResponse.json(
        { error: 'team_id is required' },
        { status: 400 }
      );
    }

    if (!tournament_id) {
      return NextResponse.json(
        { error: 'tournament_id is required' },
        { status: 400 }
      );
    }

    // If action is 'preview', return what will be affected
    if (action === 'preview') {
      return await previewRemoval(request, team_id, tournament_id);
    }

    // If action is 'remove', perform the removal
    if (action === 'remove') {
      return await performRemoval(request, team_id, tournament_id);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "preview" or "remove".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in remove team API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function previewRemoval(request: NextRequest, team_id: string, tournament_id: string) {
  // Use the same Supabase client from the main function
  const supabase = createMiddlewareClient(request, new NextResponse());

  // Get team name
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('name')
    .eq('id', team_id)
    .single();

  if (teamError) {
    throw new Error('Team not found');
  }

  // Get tournament name
  const { data: tournamentData, error: tournamentError } = await supabase
    .from('tournaments')
    .select('name')
    .eq('id', tournament_id)
    .single();

  if (tournamentError) {
    throw new Error('Tournament not found');
  }

  try {
    // Get matches where the team participated
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select(`
        id,
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        home_team_id,
        away_team_id
      `)
      .or(`home_team_id.eq.${team_id},away_team_id.eq.${team_id}`)
      .eq('tournament_id', tournament_id);

    if (matchesError) {
      throw new Error('Error fetching matches');
    }

    // Get teams that played against the removed team
    const otherTeamIds = new Set<string>();
    matchesData?.forEach(match => {
      if (match.home_team_id !== team_id) {
        otherTeamIds.add(match.home_team_id);
      }
      if (match.away_team_id !== team_id) {
        otherTeamIds.add(match.away_team_id);
      }
    });

    // First get the player IDs for the team
    const { data: teamPlayers, error: teamPlayersError } = await supabase
      .from('players')
      .select('id')
      .eq('team_id', team_id);

    if (teamPlayersError) {
      throw new Error('Error fetching team players');
    }

    // Get player stats for the team being removed
    const { data: teamPlayerStats, error: teamStatsError } = await supabase
      .from('player_stats')
      .select(`
        id,
        player_id,
        players!inner (name),
        goals,
        assists,
        yellow_cards,
        red_cards,
        matches_played
      `)
      .in('player_id', teamPlayers.map(player => player.id))
      .eq('tournament_id', tournament_id);

    if (teamStatsError) {
      throw new Error('Error fetching player stats for team');
    }

    // Get matches for events
    const { data: matchesForEvents, error: matchesForEventsError } = await supabase
      .from('matches')
      .select('id')
      .or(`home_team_id.eq.${team_id},away_team_id.eq.${team_id}`)
      .eq('tournament_id', tournament_id);

    if (matchesForEventsError) {
      throw new Error('Error fetching matches for events');
    }

    // Get match events for matches involving the team
    const { data: matchEvents, error: eventsError } = await supabase
      .from('match_events')
      .select(`
        id,
        match_id,
        player_id,
        event_type,
        players!inner (name),
        teams!inner (name)
      `)
      .in('match_id', matchesForEvents.map(match => match.id));

    if (eventsError) {
      throw new Error('Error fetching match events');
    }

    // Get player stats for other teams that played against the removed team
    let otherTeamPlayerStats: any[] = [];
    let otherTeamPlayerStatsDetails: any[] = [];
    if (otherTeamIds.size > 0) {
      // First get the player IDs for other teams
      const { data: otherTeamPlayers, error: otherTeamPlayersError } = await supabase
        .from('players')
        .select('id')
        .in('team_id', Array.from(otherTeamIds));

      if (otherTeamPlayersError) {
        throw new Error('Error fetching other team players');
      }

      const { data, error: otherTeamStatsError } = await supabase
        .from('player_stats')
        .select(`
          id,
          player_id,
          players!inner (name),
          teams!inner (name),
          goals,
          assists,
          yellow_cards,
          red_cards,
          matches_played
        `)
        .in('player_id', otherTeamPlayers.map(player => player.id))
        .eq('tournament_id', tournament_id);

      if (!otherTeamStatsError) {
        otherTeamPlayerStats = data || [];
        otherTeamPlayerStatsDetails = data || [];
      }
    }

    // Get other teams' match results that will be affected
    let otherTeamMatches: any[] = [];
    if (otherTeamIds.size > 0) {
      const teamIdsArray = Array.from(otherTeamIds);
      const { data, error: otherTeamMatchesError } = await supabase
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score
        `)
        .or(
          teamIdsArray.map(id => `home_team_id.eq.${id}`).join(',')
        )
        .or(
          teamIdsArray.map(id => `away_team_id.eq.${id}`).join(',')
        )
        .eq('tournament_id', tournament_id);

      if (!otherTeamMatchesError) {
        otherTeamMatches = data || [];
      }
    }

    // Get team names for display
    const { data: teamNames, error: teamNamesError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', [team_id, ...Array.from(otherTeamIds)]);

    if (teamNamesError) {
      throw new Error('Error fetching team names');
    }

    const teamNameMap: Record<string, string> = {};
    teamNames?.forEach((team: any) => {
      teamNameMap[team.id] = team.name;
    });

    return NextResponse.json({
      success: true,
      summary: {
        teamName: teamData.name,
        tournamentName: tournamentData.name,
        affectedMatches: matchesData?.length || 0,
        affectedMatchEvents: matchEvents?.length || 0,
        teamPlayerStats: teamPlayerStats?.length || 0,
        otherTeamPlayerStats: otherTeamPlayerStats?.length || 0,
        otherTeamsAffected: otherTeamIds.size,
        otherTeamMatches: otherTeamMatches?.length || 0,
        matchDetails: matchesData?.map((match: any) => ({
          ...match,
          home_team_name: teamNameMap[match.home_team_id] || `Team ${match.home_team_id}`,
          away_team_name: teamNameMap[match.away_team_id] || `Team ${match.away_team_id}`,
        })) || [],
        eventDetails: matchEvents || [],
        teamPlayerStatsDetails: teamPlayerStats || [],
        otherTeamPlayerStatsDetails: otherTeamPlayerStatsDetails,
        otherTeamMatchDetails: otherTeamMatches || [],
        otherTeamNames: Array.from(otherTeamIds).map(id => teamNameMap[id]),
      }
    });
  } catch (error) {
    console.error('Error in previewRemoval:', error);
    return NextResponse.json(
      { error: 'Error generating preview', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function performRemoval(request: NextRequest, team_id: string, tournament_id: string) {
  const supabase = createMiddlewareClient(request, new NextResponse());

  // Verify that the team exists
  const { data: teamData, error: teamError } = await supabase
    .from('teams')
    .select('id')
    .eq('id', team_id)
    .single();

  if (teamError || !teamData) {
    return NextResponse.json(
      { error: 'Team not found' },
      { status: 404 }
    );
  }

  // Verify that the tournament exists and the team is part of it
  const { data: tournamentTeamData, error: tournamentTeamError } = await supabase
    .from('tournament_teams')
    .select('id')
    .eq('team_id', team_id)
    .eq('tournament_id', tournament_id)
    .single();

  if (tournamentTeamError || !tournamentTeamData) {
    return NextResponse.json(
      { error: 'Team is not part of the specified tournament' },
      { status: 400 }
    );
  }

  // Perform all deletions in sequence with proper error handling
  
  // First, get the matches IDs to delete match events
  const { data: matchesForEvents, error: matchesForEventsError } = await supabase
    .from('matches')
    .select('id')
    .or(`home_team_id.eq.${team_id},away_team_id.eq.${team_id}`)
    .eq('tournament_id', tournament_id);

  if (matchesForEventsError) {
    console.error('Error fetching matches for events:', matchesForEventsError);
    return NextResponse.json(
      { error: 'Error fetching matches for events', details: matchesForEventsError.message },
      { status: 500 }
    );
  }

  // Step 1: Delete match events related to matches where the team participated in this tournament
  const { error: matchEventsError } = await supabase
    .from('match_events')
    .delete()
    .in('match_id', matchesForEvents.map(match => match.id));

  if (matchEventsError) {
    console.error('Error deleting match events:', matchEventsError);
    return NextResponse.json(
      { error: 'Error removing match events', details: matchEventsError.message },
      { status: 500 }
    );
  }

  // Step 2: Delete matches where the team was playing (home or away) in this tournament
  const { error: matchesError } = await supabase
    .from('matches')
    .delete()
    .or(`home_team_id.eq.${team_id},away_team_id.eq.${team_id}`)
    .eq('tournament_id', tournament_id);

  if (matchesError) {
    console.error('Error deleting matches:', matchesError);
    return NextResponse.json(
      { error: 'Error removing matches', details: matchesError.message },
      { status: 500 }
    );
  }

  // First, get the player IDs to delete their stats
  const { data: playersForStats, error: playersForStatsError } = await supabase
    .from('players')
    .select('id')
    .eq('team_id', team_id);

  if (playersForStatsError) {
    console.error('Error fetching players for stats:', playersForStatsError);
    return NextResponse.json(
      { error: 'Error fetching players for stats', details: playersForStatsError.message },
      { status: 500 }
    );
  }

  // Step 3: Delete player stats for players in that team for this tournament only
  const { error: playerStatsError } = await supabase
    .from('player_stats')
    .delete()
    .in('player_id', playersForStats.map(player => player.id))
    .eq('tournament_id', tournament_id);

  if (playerStatsError) {
    console.error('Error deleting player stats:', playerStatsError);
    return NextResponse.json(
      { error: 'Error removing player stats', details: playerStatsError.message },
      { status: 500 }
    );
  }

  // Step 4: Remove the team from the tournament (tournament_teams table)
  const { error: tournamentTeamsError } = await supabase
    .from('tournament_teams')
    .delete()
    .eq('team_id', team_id)
    .eq('tournament_id', tournament_id);

  if (tournamentTeamsError) {
    console.error('Error removing team from tournament:', tournamentTeamsError);
    return NextResponse.json(
      { error: 'Error removing team from tournament', details: tournamentTeamsError.message },
      { status: 500 }
    );
  }

  // Note: We won't delete the players themselves since they might be participating in other tournaments
  // The foreign key constraint with CASCADE will handle player deletion when the team is deleted

  return NextResponse.json({
    success: true,
    message: 'Team and all related data have been successfully removed from the tournament'
  });
}