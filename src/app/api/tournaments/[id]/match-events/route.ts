// src/app/api/tournaments/[id]/match-events/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MatchEvent } from '@/lib/database'

// GET /api/tournaments/[id]/match-events - Get all match events for a tournament
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
      // For public access, we return events without sensitive info
      // But we still need to check tournament visibility
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('is_public')
        .eq('id', id)
        .single()
      
      if (tournamentError || !tournament || !tournament.is_public) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        )
      }
    }

    // Get all matches for this tournament to get the match IDs
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('id')
      .eq('tournament_id', id)
    
    if (matchesError) {
      console.error('Error fetching matches:', matchesError)
      return NextResponse.json(
        { error: 'Failed to fetch tournament matches' }, 
        { status: 500 }
      )
    }

    const matchIds = matches.map(match => match.id)

    if (matchIds.length === 0) {
      return NextResponse.json([])
    }

    // Get all events for matches in this tournament
    const { data: events, error: eventsError } = await supabase
      .from('match_events')
      .select(`
        id, match_id, player_id, team_id, event_type, minute, description, created_at,
        player:players!match_events_player_id_fkey(name, photo_url, team_id),
        assist_player:players!match_events_assist_player_id_fkey(name, photo_url, team_id),
        team:teams!match_events_team_id_fkey(name)
      `)
      .in('match_id', matchIds)
      .order('minute', { ascending: true })
      .order('created_at', { ascending: true })
    
    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to fetch match events' }, 
        { status: 500 }
      )
    }

    return NextResponse.json(events || [])
  } catch (error) {
    console.error('Error in match events API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match events' }, 
      { status: 500 }
    )
  }
}

// POST /api/tournaments/[id]/match-events - Create a new match event
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

    // Verify tournament exists and user is creator
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, creator_id')
      .eq('id', id)
      .single()
    
    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' }, 
        { status: 404 }
      )
    }

    if (tournament.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' }, 
        { status: 403 }
      )
    }

    // Parse the request body
    const body: Omit<MatchEvent, 'id' | 'created_at'> & { assist_player_id?: string | null } = await request.json()
    
    // Verify the match belongs to this tournament
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('id')
      .eq('id', body.match_id)
      .eq('tournament_id', id)
      .single()
    
    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found in this tournament' }, 
        { status: 404 }
      )
    }

    // Insert the new event
    const { data: event, error: eventError } = await supabase
      .from('match_events')
      .insert([{
        ...body,
        // Only include assist_player_id if it's provided and valid
        ...(body.event_type === 'goal' && body.assist_player_id ? { assist_player_id: body.assist_player_id } : {})
      }])
      .select(`
        id, match_id, player_id, team_id, event_type, minute, description, created_at,
        player:players!match_events_player_id_fkey(name, photo_url, team_id),
        assist_player:players!match_events_assist_player_id_fkey(name, photo_url, team_id),
        team:teams!match_events_team_id_fkey(name)
      `)
      .single()
    
    if (eventError) {
      console.error('Error creating event:', eventError)
      return NextResponse.json(
        { error: 'Failed to create match event' }, 
        { status: 500 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error in match event creation API:', error)
    return NextResponse.json(
      { error: 'Failed to create match event' }, 
      { status: 500 }
    )
  }
}