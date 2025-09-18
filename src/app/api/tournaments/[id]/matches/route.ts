import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// GET /api/tournaments/[id]/matches - Get all matches for a tournament
export async function GET(
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

    // Get the tournament to check access
    const tournament = await db.getTournament(id)
    
    // Check if user has access (creator or public tournament)
    if (tournament.creator_id !== user.id && !tournament.is_public) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Get matches using the existing database service
    const matches = await db.getMatches(id)
    
    return NextResponse.json(matches)
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' }, 
      { status: 500 }
    )
  }
}

// POST /api/tournaments/[id]/matches - Create a new match for a tournament
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

    // Parse the request body
    const body = await request.json()
    
    // Create the match using the existing database service
    const match = await db.createMatch({
      ...body,
      tournament_id: id,
    })
    
    return NextResponse.json(match)
  } catch (error) {
    console.error('Error creating match:', error)
    return NextResponse.json(
      { error: 'Failed to create match' }, 
      { status: 500 }
    )
  }
}

