import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// GET /api/teams/[id] - Get a specific team
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const url = new URL(request.url);
  const tournamentId = url.searchParams.get('tournamentId');
  
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Get the team using the existing database service
    const team = await db.getTeam(id)
    
    let teamWithStats;
    
    if (tournamentId) {
      // Calculate tournament-specific statistics
      // Get all matches for this tournament where the team participated
      const { data: tournamentMatches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          status
        `)
        .eq('tournament_id', tournamentId)
        .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
        .in('status', ['completed', 'in_progress', 'scheduled'])
      
      if (matchesError) {
        console.error('Error fetching tournament matches:', matchesError);
        return NextResponse.json(
          { error: 'Failed to fetch tournament matches' }, 
          { status: 500 }
        );
      }
      
      // Calculate tournament-specific stats
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let matchesPlayed = 0;
      
      for (const match of tournamentMatches) {
        if (match.status !== 'completed') {
          // Only process completed matches for stats
          continue;
        }
        
        if (match.home_team_id === id) {
          goalsFor += match.home_score || 0;
          goalsAgainst += match.away_score || 0;
          
          if ((match.home_score || 0) > (match.away_score || 0)) {
            wins += 1;
          } else if ((match.home_score || 0) === (match.away_score || 0)) {
            draws += 1;
          } else {
            losses += 1;
          }
        } else if (match.away_team_id === id) {
          goalsFor += match.away_score || 0;
          goalsAgainst += match.home_score || 0;
          
          if ((match.away_score || 0) > (match.home_score || 0)) {
            wins += 1;
          } else if ((match.away_score || 0) === (match.home_score || 0)) {
            draws += 1;
          } else {
            losses += 1;
          }
        }
        
        matchesPlayed += 1;
      }
      
      // Calculate points: 3 for win, 1 for draw, 0 for loss
      const points = (wins * 3) + draws;
      
      teamWithStats = {
        ...team,
        wins,
        draws,
        losses,
        goals_for: goalsFor,
        goals_against: goalsAgainst,
        points,
        position: 0, // Position would be calculated based on full tournament standings
        matches_played: matchesPlayed,
        players_count: matchesPlayed // Using matches_played for now
      };
    } else {
      // Get overall team statistics (non-tournament specific)
      const teamStats = await db.getTeamStats(id)
      
      // Get match results to calculate goals against
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          home_team_id,
          away_team_id,
          home_score,
          away_score
        `)
        .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
        .eq('status', 'completed')
      
      if (matchesError) {
        console.error('Error fetching matches for goals calculation:', matchesError);
      }
      
      // Calculate goals against
      let goals_against = 0;
      if (matches) {
        matches.forEach(match => {
          if (match.home_team_id === id) {
            goals_against += match.away_score || 0;
          } else if (match.away_team_id === id) {
            goals_against += match.home_score || 0;
          }
        });
      }
      
      teamWithStats = {
        ...team,
        wins: teamStats.wins,
        draws: teamStats.draws,
        losses: Math.max(0, (teamStats.matches_played || 0) - teamStats.wins - teamStats.draws), // Calculate losses
        goals_for: teamStats.goals,
        goals_against: goals_against,
        points: (teamStats.wins * 3) + teamStats.draws, // Assuming 3 points for win, 1 for draw
        position: 0, // Position would be calculated based on tournament standings
        matches_played: teamStats.matches_played,
        players_count: teamStats.players_count
      }
    }
    
    return NextResponse.json(teamWithStats)
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' }, 
      { status: 500 }
    )
  }
}

// PUT /api/teams/[id] - Update a specific team
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Get the team to check ownership
    const team = await db.getTeam(id)
    
    // Check if user is the creator or captain
    if (team.created_by !== user.id && team.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Parse the request body
    const body = await request.json()
    
    // Update the team using the existing database service
    const updatedTeam = await db.updateTeam(id, body)
    
    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json(
      { error: 'Failed to update team' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[id] - Delete a specific team
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Get the team to check ownership
    const team = await db.getTeam(id)
    
    // Check if user is the creator
    if (team.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Check if team is referenced in matches
    const references = await db.countTeamReferences(id)
    if (references.total > 0) {
      return NextResponse.json(
        { error: 'Cannot delete team that is referenced in matches' }, 
        { status: 400 }
      )
    }

    // Delete the team using the existing database service
    await db.deleteTeam(id)
    
    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json(
      { error: 'Failed to delete team' }, 
      { status: 500 }
    )
  }
}

