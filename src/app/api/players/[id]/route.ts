import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// PUT /api/players/[id] - Update a specific player
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

    // Get the player to check team ownership
    // First, we need to get the player to find their team
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*, teams(created_by, captain_id)')
      .eq('id', id)
      .single()
      
    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' }, 
        { status: 404 }
      )
    }

    // Check if user is the creator or captain of the team
    const team = player.teams
    if (team.created_by !== user.id && team.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Parse the request body
    const body = await request.json()
    
    // Update the player using the existing database service
    await db.updatePlayer(id, body)
    
    return NextResponse.json({ message: 'Player updated successfully' })
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json(
      { error: 'Failed to update player' }, 
      { status: 500 }
    )
  }
}

// DELETE /api/players/[id] - Delete a specific player
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

    // Get the player to check team ownership
    // First, we need to get the player to find their team
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*, teams(created_by, captain_id)')
      .eq('id', id)
      .single()
      
    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' }, 
        { status: 404 }
      )
    }

    // Check if user is the creator or captain of the team
    const team = player.teams
    if (team.created_by !== user.id && team.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Delete the player using the existing database service
    await db.deletePlayer(id)
    
    return NextResponse.json({ message: 'Player deleted successfully' })
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json(
      { error: 'Failed to delete player' }, 
      { status: 500 }
    )
  }
}

