import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// GET /api/teams/[id] - Get a specific team
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

    // Get the team using the existing database service
    const team = await db.getTeam(id)
    
    return NextResponse.json(team)
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

