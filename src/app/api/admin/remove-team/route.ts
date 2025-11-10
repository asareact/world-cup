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
        away_team_id,status
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

    // Get matches for events - matches where the team participated (either home or away)
    const { data: matchesForEvents, error: matchesForEventsError } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', tournament_id)
      .or(`home_team_id.eq.${team_id},away_team_id.eq.${team_id}`);

    if (matchesForEventsError) {
      console.error('DEBUG_PREVIEW_REMOVAL - Error fetching matches for events:', matchesForEventsError);
      throw new Error('Error fetching matches for events');
    }
    
    console.log('DEBUG_PREVIEW_REMOVAL - MATCHES_FOR_EVENTS_FOUND:', matchesForEvents?.length || 0);
    console.log('DEBUG_PREVIEW_REMOVAL - MATCHES_FOR_EVENTS_SAMPLE:', matchesForEvents?.slice(0, 3) || []);

    // Get match events for matches involving the team
    let matchEvents: any[] = [];
    console.log('DEBUG_PREVIEW_REMOVAL - ABOUT_TO_FETCH_EVENTS_FOR_MATCHES:', matchesForEvents?.length || 0);
    
    if (matchesForEvents && matchesForEvents.length > 0) {
      const { data, error: eventsError } = await supabase
        .from('match_events')
        .select(`
          id,
          match_id,
          player_id,
          team_id,
          event_type
        `)
        .in('match_id', matchesForEvents.map(match => match.id));

      if (eventsError) {
        console.error('DEBUG_PREVIEW_REMOVAL - Error fetching match events:', eventsError);
        // If there are no events for the matches, that's fine - return empty array
        matchEvents = [];
      } else {
        matchEvents = data || [];
        console.log('DEBUG_PREVIEW_REMOVAL - EVENTS_FETCHED_SUCCESSFULLY:', matchEvents.length);
        console.log('DEBUG_PREVIEW_REMOVAL - EVENTS_SAMPLE:', matchEvents?.slice(0, 3) || []);
      }
    } else {
      console.log('DEBUG_PREVIEW_REMOVAL - NO_MATCHES_TO_GET_EVENTS_FOR');
      matchEvents = [];
    }

    // DEBUG LOGS: Get player stats for players from other teams (oponents) based on the events
    console.log('DEBUG_PREVIEW_REMOVAL - TEAM_TO_REMOVE:', team_id);
    console.log('DEBUG_PREVIEW_REMOVAL - MATCH_EVENTS_COUNT:', matchEvents.length);
    console.log('DEBUG_PREVIEW_REMOVAL - MATCH_EVENTS_SAMPLE:', matchEvents.slice(0, 3)); // Show first 3 events
    console.log('DEBUG_PREVIEW_REMOVAL - TOURNAMENT_ID:', tournament_id);

    let otherTeamPlayerStats: any[] = [];
    let otherTeamPlayerStatsDetails: any[] = [];
    
    // Get unique opponent player IDs from match events
    const filteredEvents = matchEvents.filter(event => {
      const isOpponentTeam = event.team_id && event.team_id !== team_id;
      console.log('DEBUG_PREVIEW_REMOVAL - EVENT:', { 
        eventId: event.id, 
        eventTeamId: event.team_id, 
        isOpponentTeam: isOpponentTeam 
      });
      return isOpponentTeam;
    });
    
    console.log('DEBUG_PREVIEW_REMOVAL - FILTERED_EVENTS_COUNT:', filteredEvents.length);

    const opponentPlayerIds = [...new Set(
      filteredEvents
        .map(event => event.player_id)
        .filter(id => id) // Filter out any undefined/null IDs
    )];

    console.log('DEBUG_PREVIEW_REMOVAL - OPPONENT_PLAYER_IDS:', opponentPlayerIds);
    console.log('DEBUG_PREVIEW_REMOVAL - OPPONENT_PLAYER_IDS_COUNT:', opponentPlayerIds.length);

    if (opponentPlayerIds.length > 0) {
      const { data, error: otherTeamStatsError } = await supabase
        .from('player_stats')
        .select(`
          id,
          player_id,
          players!inner (id, name),
          teams!inner (id, name),
          goals,
          assists,
          yellow_cards,
          red_cards,
          matches_played
        `)
        .eq('tournament_id', tournament_id)
        .in('player_id', opponentPlayerIds);

      console.log('DEBUG_PREVIEW_REMOVAL - PLAYER_STATS_QUERY_RESULT:', { data, otherTeamStatsError });

      if (!otherTeamStatsError) {
        otherTeamPlayerStats = data || [];
        otherTeamPlayerStatsDetails = data || [];
        console.log('DEBUG_PREVIEW_REMOVAL - OTHER_TEAM_PLAYER_STATS_LOADED:', otherTeamPlayerStats.length);
      } else {
        console.log('DEBUG_PREVIEW_REMOVAL - PLAYER_STATS_QUERY_ERROR:', otherTeamStatsError);
      }
    } else {
      console.log('DEBUG_PREVIEW_REMOVAL - NO OPPONENT PLAYERS TO FETCH STATS FOR');
    }

    // Get matches where other teams played against the team to be removed (the matches that will be affected)
    let otherTeamMatches: any[] = [];
    if (otherTeamIds.size > 0) {
      const { data, error: otherTeamMatchesError } = await supabase
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score
        `)
        .eq('tournament_id', tournament_id)
        .or(`home_team_id.eq.${team_id},away_team_id.eq.${team_id}`); // Only matches where the removed team was involved

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

    // First get all teams and players data for naming
    const { data: allTeams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('id', Array.from(otherTeamIds));

    if (teamsError) {
      throw new Error('Error fetching team names for adjustments');
    }

    const allTeamNames: Record<string, string> = {};
    allTeams?.forEach((team: any) => {
      allTeamNames[team.id] = team.name;
    });

    // Get player names for the adjustments
    const { data: allPlayers, error: playersError } = await supabase
      .from('players')
      .select('id, name')
      .in('id', matchEvents.map(event => event.player_id));

    if (playersError) {
      throw new Error('Error fetching player names for adjustments');
    }

    const allPlayerNames: Record<string, string> = {};
    allPlayers?.forEach((player: any) => {
      allPlayerNames[player.id] = player.name;
    });

    // Define the type for player adjustments
    type PlayerAdjustment = {
      goals: number;
      assists: number;
      yellows: number;
      reds: number;
      matches: number;
      saves: number;
      own_goals: number;
    };

    // Define the type for team adjustments
    type TeamAdjustment = {
      points: number;
      goals_scored: number;
      goals_conceded: number;
      matches_played: number;
    };

    // Calculate adjustments that will be made to other teams and players
    const adjustments: {
      players: Record<string, PlayerAdjustment>;
      teams: Record<string, TeamAdjustment>;
      teamNames: Record<string, string>;
      playerNames: Record<string, string>;
    } = {
      players: {},
      teams: {},
      teamNames: allTeamNames,
      playerNames: allPlayerNames
    };

    // Calculate adjustments based on match events - only for completed matches (with debug logging)
    console.log('DEBUG_PREVIEW_REMOVAL - ADJUSTMENTS_CALCULATION_START, TOTAL_MATCH_EVENTS:', matchEvents.length);

    for (const event of matchEvents) {
      // Don't process events for players from the removed team
      if (event.team_id === team_id) continue;

      // Find which match this event belongs to
      const relatedMatch = matchesData.find(match => match.id === event.match_id);
      
      // Only process events from matches that were completed (these actually happened)
      if (!relatedMatch || relatedMatch.status !== 'completed') {
        console.log('DEBUG_PREVIEW_REMOVAL - SKIPPING_EVENT_FROM_UNCOMPLETED_MATCH:', { 
          eventId: event.id, 
          matchId: event.match_id, 
          matchStatus: relatedMatch?.status 
        });
        continue; // Skip events from matches that weren't completed
      }

      console.log('DEBUG_PREVIEW_REMOVAL - PROCESSING_EVENT:', { 
        eventId: event.id, 
        playerId: event.player_id, 
        eventType: event.event_type, 
        teamId: event.team_id 
      });

      const playerId = event.player_id;
      if (!adjustments.players[playerId]) {
        adjustments.players[playerId] = { goals: 0, assists: 0, yellows: 0, reds: 0, matches: 0, saves: 0, own_goals: 0 };
      }

      switch (event.event_type) {
        case 'goal':
          adjustments.players[playerId].goals += 1;
          console.log('DEBUG_PREVIEW_REMOVAL - ADDED_GOAL_TO_PLAYER:', { playerId, newGoals: adjustments.players[playerId].goals });
          break;
        case 'assist':
          adjustments.players[playerId].assists += 1;
          console.log('DEBUG_PREVIEW_REMOVAL - ADDED_ASSIST_TO_PLAYER:', { playerId, newAssists: adjustments.players[playerId].assists });
          break;
        case 'yellow_card':
          adjustments.players[playerId].yellows += 1;
          console.log('DEBUG_PREVIEW_REMOVAL - ADDED_YELLOW_CARD_TO_PLAYER:', { playerId, newYellows: adjustments.players[playerId].yellows });
          break;
        case 'red_card':
          adjustments.players[playerId].reds += 1;
          console.log('DEBUG_PREVIEW_REMOVAL - ADDED_RED_CARD_TO_PLAYER:', { playerId, newReds: adjustments.players[playerId].reds });
          break;
        case 'save':
          if (!adjustments.players[playerId].saves) {
            adjustments.players[playerId].saves = 0;
          }
          adjustments.players[playerId].saves += 1;
          console.log('DEBUG_PREVIEW_REMOVAL - ADDED_SAVE_TO_PLAYER:', { playerId, newSaves: adjustments.players[playerId].saves });
          break;
        case 'own_goal':
          if (!adjustments.players[playerId].own_goals) {
            adjustments.players[playerId].own_goals = 0;
          }
          adjustments.players[playerId].own_goals += 1;
          console.log('DEBUG_PREVIEW_REMOVAL - ADDED_OWN_GOAL_TO_PLAYER:', { playerId, newOwnGoals: adjustments.players[playerId].own_goals });
          break;
      }
    }
    
    console.log('DEBUG_PREVIEW_REMOVAL - FINAL_ADJUSTMENTS_PLAYERS_COUNT:', Object.keys(adjustments.players).length);

    // First get all players from other teams
    const { data: allOtherTeamPlayers, error: allOtherTeamPlayersError } = await supabase
      .from('players')
      .select('id, team_id')
      .in('team_id', Array.from(otherTeamIds));

    if (allOtherTeamPlayersError) {
      throw new Error('Error fetching other team players for adjustments');
    }

    // For each match, calculate how many matches are affected for players of the other teams
    for (const match of matchesData) {
      // Get the opposing team for each match
      const opposingTeamId = match.home_team_id === team_id ? match.away_team_id : match.home_team_id;
      const teamScore = match.home_team_id === team_id ? match.home_score : match.away_score;
      const opposingScore = match.home_team_id === team_id ? match.away_score : match.home_score;
      
      // Calculate adjustments based on match status
      let pointsToRemove = 0;
      let goalsScoredToRemove = 0;
      let goalsConcededToRemove = 0;
      let matchesPlayedToRemove = 0;
      
      if (match.status === 'completed') {
        // For completed matches: calculate points and goals to remove
        if (opposingScore > teamScore) {
          pointsToRemove = 3; // Opposing team wins, removes 3 points they gained
        } else if (opposingScore === teamScore) {
          pointsToRemove = 1; // Match was draw, removes 1 point they gained
        }
        
        goalsScoredToRemove = opposingScore;
        goalsConcededToRemove = teamScore;
        matchesPlayedToRemove = 1; // Count as played match that will be removed
      } 
      // For non-completed matches: do not adjust anything (partido no se jugó, no hay que ajustar estadísticas)
      // No hacemos matchesPlayedToRemove = 1 porque un partido no jugado no debería afectar estadísticas de partidos jugados
      // Solo se eliminará el partido en sí, pero no se ajustan estadísticas si no se jugó

      if (!adjustments.teams[opposingTeamId]) {
        adjustments.teams[opposingTeamId] = { points: 0, goals_scored: 0, goals_conceded: 0, matches_played: 0 };
      }
      
      adjustments.teams[opposingTeamId].points -= pointsToRemove;
      adjustments.teams[opposingTeamId].goals_scored -= goalsScoredToRemove;
      adjustments.teams[opposingTeamId].goals_conceded -= goalsConcededToRemove;
      adjustments.teams[opposingTeamId].matches_played -= matchesPlayedToRemove;
      
      // For players in the opposing team, adjust matches played only for completed matches
      const opposingTeamPlayers = allOtherTeamPlayers.filter(p => p.team_id === opposingTeamId);
      for (const player of opposingTeamPlayers) {
        if (!adjustments.players[player.id]) {
          adjustments.players[player.id] = { goals: 0, assists: 0, yellows: 0, reds: 0, matches: 0, saves: 0, own_goals: 0 };
        }
        adjustments.players[player.id].matches += matchesPlayedToRemove; // Only add if match was completed
      }
    }

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
        adjustments: adjustments, // Include adjustments in the preview
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

  // First, get matches where the team participated to process statistics adjustments
  const { data: matchesToRemove, error: matchesToRemoveError } = await supabase
    .from('matches')
    .select(`
      id,
      home_team_id,
      away_team_id,
      home_score,
      away_score
    `)
    .or(`home_team_id.eq.${team_id},away_team_id.eq.${team_id}`)
    .eq('tournament_id', tournament_id);

  if (matchesToRemoveError) {
    console.error('Error fetching matches to remove:', matchesToRemoveError);
    return NextResponse.json(
      { error: 'Error fetching matches to remove', details: matchesToRemoveError.message },
      { status: 500 }
    );
  }

  // Get match events related to these matches to understand what to adjust
  const matchIds = matchesToRemove.map(match => match.id);
  let matchEventsForAdjustments: any[] = [];
  if (matchIds.length > 0) {
    const { data, error: eventsError } = await supabase
      .from('match_events')
      .select(`
        event_type,
        player_id,
        team_id,
        match_id
      `)
      .in('match_id', matchIds);

    if (eventsError) {
      console.error('Error fetching match events:', eventsError);
      matchEventsForAdjustments = []; // If there are no events for the matches, that's fine, assign empty array
    } else {
      matchEventsForAdjustments = data || [];
    }
  }

    // Calculate adjustments for player statistics
    const playerAdjustments: Record<string, { goals: number; assists: number; yellows: number; reds: number; matches: number; saves: number; own_goals: number; }> = {};

    for (const event of matchEventsForAdjustments) {
      // Don't process events for players from the removed team
      if (event.team_id === team_id) continue;

      const playerId = event.player_id;
      if (!playerAdjustments[playerId]) {
        playerAdjustments[playerId] = { goals: 0, assists: 0, yellows: 0, reds: 0, matches: 0, saves: 0, own_goals: 0 };
      }

      switch (event.event_type) {
        case 'goal':
          playerAdjustments[playerId].goals += 1;
          break;
        case 'assist':
          playerAdjustments[playerId].assists += 1;
          break;
        case 'yellow_card':
          playerAdjustments[playerId].yellows += 1;
          break;
        case 'red_card':
          playerAdjustments[playerId].reds += 1;
          break;
        case 'save':
          playerAdjustments[playerId].saves += 1;
          break;
        case 'own_goal':
          playerAdjustments[playerId].own_goals += 1;
          break;
      }
    }

    // For each match, we need to decrease matches_played for players from the other teams
    for (const match of matchesToRemove) {
      // Get players who participated in this match from the opposing team
      const opposingTeamId = match.home_team_id === team_id ? match.away_team_id : match.home_team_id;
      
      const { data: playersInMatch, error: playersError } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', opposingTeamId);

      if (!playersError && playersInMatch) {
        for (const player of playersInMatch) {
          if (!playerAdjustments[player.id]) {
            playerAdjustments[player.id] = { goals: 0, assists: 0, yellows: 0, reds: 0, matches: 0, saves: 0, own_goals: 0 };
          }
          playerAdjustments[player.id].matches += 1;
        }
      }
    }

    // Now we need to update player stats by subtracting the calculated values
    for (const [playerId, adjustment] of Object.entries(playerAdjustments)) {
      // Get the current stats for the player
      const { data: currentStats, error: statsError } = await supabase
        .from('player_stats')
        .select('goals, assists, yellow_cards, red_cards, matches_played')
        .eq('player_id', playerId)
        .eq('tournament_id', tournament_id)
        .single();

      if (!statsError && currentStats) {
        // Update stats by subtracting the values
        const updatedGoals = Math.max(0, (currentStats.goals || 0) - adjustment.goals);
        const updatedAssists = Math.max(0, (currentStats.assists || 0) - adjustment.assists);
        const updatedYellows = Math.max(0, (currentStats.yellow_cards || 0) - adjustment.yellows);
        const updatedReds = Math.max(0, (currentStats.red_cards || 0) - adjustment.reds);
        const updatedMatches = Math.max(0, (currentStats.matches_played || 0) - adjustment.matches);

        const { error: updateError } = await supabase
          .from('player_stats')
          .update({
            goals: updatedGoals,
            assists: updatedAssists,
            yellow_cards: updatedYellows,
            red_cards: updatedReds,
            matches_played: updatedMatches
          })
          .eq('player_id', playerId)
          .eq('tournament_id', tournament_id);

        if (updateError) {
          console.error(`Error updating player stats for ${playerId}:`, updateError);
          return NextResponse.json(
            { error: 'Error updating player stats', details: updateError.message },
            { status: 500 }
          );
        }
      }
    }
   // Cierra el bloque if que cubre las actualizaciones de estadísticas

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