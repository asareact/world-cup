// API endpoint to get potential suspensions for a match
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PotentialSuspensionsService } from '@/lib/suspensions/potential-suspensions-service'

// GET /api/tournaments/[id]/matches/[matchId]/potential-suspensions
// Get potential suspensions for a specific match
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; matchId: string }> }
) {
  const { id, matchId } = await context.params
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

    // Verify tournament exists and user has permission to view it
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, is_public, creator_id')
      .eq('id', id)
      .single()
    
    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' }, 
        { status: 404 }
      )
    }

    // Allow access if tournament is public or user is creator
    if (!tournament.is_public && tournament.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Verify match exists in this tournament
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id, tournament_id')
      .eq('id', matchId)
      .eq('tournament_id', id)
      .single()
    
    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found in this tournament' }, 
        { status: 404 }
      )
    }

    // Get potential suspensions
    const suspensionService = new PotentialSuspensionsService()
    const potentialSuspensions = await suspensionService.detectPotentialSuspensions(id, { matchId })

    return NextResponse.json(potentialSuspensions)
  } catch (error) {
    console.error('Error in potential suspensions API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch potential suspensions' }, 
      { status: 500 }
    )
  }
}