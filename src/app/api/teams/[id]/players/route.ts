import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// GET /api/teams/[id]/players - Get all players for a team
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

    // Get players using the existing database service
    const players = await db.getPlayers(id)
    
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json(
      { error: 'Failed to fetch players' }, 
      { status: 500 }
    )
  }
}

// POST /api/teams/[id]/players - Create a new player for a team
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
    
    // Validate player count (max 12 players per team)
    const existingPlayers = await db.getPlayers(id)
    if (existingPlayers.length >= 12) {
      return NextResponse.json(
        { error: 'Team already has maximum number of players (12)' }, 
        { status: 400 }
      )
    }
    
    // Create the player using the existing database service
    const player = await db.createPlayer({
      ...body,
      team_id: id,
    })
    
    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json(
      { error: 'Failed to create player' }, 
      { status: 500 }
    )
  }
}

