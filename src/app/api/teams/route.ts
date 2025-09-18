import { NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createClient } from '@/lib/supabase/server'

// GET /api/teams - Get all teams for the current user
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

    // Get user role from profile
    let userRole: 'superAdmin' | 'capitan' | 'invitado' = 'invitado'
    try {
      const profile = await db.getProfile(user.id)
      userRole = profile?.role || 'invitado'
    } catch (profileError) {
      // If profile doesn't exist, we'll use default role
      console.warn('Could not fetch user role, using default', profileError)
    }

    // Get teams using the existing database service
    const teams = await db.getTeams(user.id, userRole)
    
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' }, 
      { status: 500 }
    )
  }
}

// POST /api/teams - Create a new team
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
    
    // Create the team using the existing database service
    const team = await db.createTeam({
      ...body,
      created_by: user.id,
      captain_id: user.id, // By default, the creator is the captain
    })
    
    return NextResponse.json(team)
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' }, 
      { status: 500 }
    )
  }
}



