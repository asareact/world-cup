import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// GET /api/tournaments - Get all tournaments for the current user
export async function GET() {
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

    // Get tournaments using the existing database service
    const tournaments = await db.getTournaments(user.id)
    
    return NextResponse.json(tournaments)
  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' }, 
      { status: 500 }
    )
  }
}

// POST /api/tournaments - Create a new tournament
export async function POST(request: Request) {
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

    // Parse the request body
    const body = await request.json()
    
    // Create the tournament using the existing database service
    const tournament = await db.createTournament({
      ...body,
      creator_id: user.id,
    })
    
    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to create tournament' }, 
      { status: 500 }
    )
  }
}

