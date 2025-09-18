import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// GET /api/tournaments/[id] - Get a specific tournament
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

    // Get the tournament using the existing database service
    const tournament = await db.getTournament(id)
    
    // Check if user has access to this tournament
    if (tournament.creator_id !== user.id && !tournament.is_public) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }
    
    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournament' }, 
      { status: 500 }
    )
  }
}

// PUT /api/tournaments/[id] - Update a specific tournament
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
    
    // Update the tournament using the existing database service
    const updatedTournament = await db.updateTournament(id, body)
    
    return NextResponse.json(updatedTournament)
  } catch (error) {
    console.error('Error updating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to update tournament' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/tournaments/[id] - Delete a specific tournament
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

    // Get the tournament to check ownership
    const tournament = await db.getTournament(id)
    
    // Check if user is the creator
    if (tournament.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Delete the tournament using the existing database service
    await db.deleteTournament(id)
    
    return NextResponse.json({ message: 'Tournament deleted successfully' })
  } catch (error) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json(
      { error: 'Failed to delete tournament' }, 
      { status: 500 }
    )
  }
}

