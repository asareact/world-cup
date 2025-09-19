import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// POST /api/tournaments/[id]/generate-fixture - Generate tournament fixture
export async function POST(
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

    // Get the tournament to check ownership
    const tournament = await db.getTournament(id)
    
    // Check if user is the creator
    if (tournament.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Get registered teams
    const { data: tournamentTeams, error: teamsError } = await supabase
      .from('tournament_teams')
      .select('*, teams(name)')
      .eq('tournament_id', id)
      .eq('status', 'confirmed')
      
    if (teamsError) {
      throw teamsError
    }

    // Validate we have teams
    if (!tournamentTeams || tournamentTeams.length === 0) {
      return NextResponse.json(
        { error: 'No confirmed teams in tournament' }, 
        { status: 400 }
      )
    }

    // For single elimination tournaments, generate bracket
    if (tournament.format === 'single_elimination') {
      const matches = await generateSingleEliminationFixture(
        id,
        tournamentTeams.map(tt => ({
          id: tt.team_id,
          name: tt.teams?.name || 'Unknown Team'
        }))
      )
      
      return NextResponse.json(matches)
    }
    
    // For other formats, return not implemented
    return NextResponse.json(
      { error: 'Fixture generation not implemented for this format' }, 
      { status: 501 }
    )
  } catch (error) {
    console.error('Error generating fixture:', error)
    return NextResponse.json(
      { error: 'Failed to generate fixture' }, 
      { status: 500 }
    )
  }
}

// Helper function to generate single elimination fixture
async function generateSingleEliminationFixture(
  tournamentId: string,
  teams: { id: string; name: string }[]
) {
  // Simple implementation - in a real app, this would be more sophisticated
  const rounds = Math.ceil(Math.log2(teams.length))
  const totalSlots = Math.pow(2, rounds)
  const byeTeams = totalSlots - teams.length
  
  // Create matches for first round
  const matches = []
  
  // Handle byes (teams that automatically advance)
  for (let i = 0; i < byeTeams; i++) {
    matches.push({
      tournament_id: tournamentId,
      home_team_id: teams[i].id,
      away_team_id: null,
      round_name: 'Round 1',
      status: 'completed',
      home_score: 1,
      away_score: 0,
      notes: 'Bye - Automatic advancement'
    })
  }
  
  // Create matches for remaining teams
  for (let i = byeTeams; i < teams.length; i += 2) {
    if (i + 1 < teams.length) {
      matches.push({
        tournament_id: tournamentId,
        home_team_id: teams[i].id,
        away_team_id: teams[i + 1].id,
        round_name: 'Round 1',
        status: 'scheduled'
      })
    } else {
      // Odd number of teams, this team gets a bye
      matches.push({
        tournament_id: tournamentId,
        home_team_id: teams[i].id,
        away_team_id: null,
        round_name: 'Round 1',
        status: 'completed',
        home_score: 1,
        away_score: 0,
        notes: 'Bye - Automatic advancement'
      })
    }
  }
  
  // Save matches to database
  const supabaseClient = await createClient()
  const { data, error } = await supabaseClient
    .from('matches')
    .insert(matches)
    .select()
    
  if (error) {
    throw error
  }
  
  return data
}


