import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { createRouteClient } from '@/lib/supabase/server'

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
  const { supabase, applyCookies } = createRouteClient(request)

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log('User check result:', { user: user?.id, userError })

    if (userError || !user) {
      console.log('Authentication failed:', userError)
      const response = NextResponse.json(
        {
          error: 'Unauthorized',
          userCheck: { user, userError },
          message: 'No user found or authentication error'
        },
        { status: 401 }
      )
      applyCookies(response)
      return response
    }

    const profile = await db.getProfile(user.id, supabase)
    const response = NextResponse.json(profile)
    applyCookies(response)
    return response
  } catch (error) {
    console.error('Error fetching profile:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch profile', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
    applyCookies(response)
    return response
  }
}

// PUT /api/profile - Update current user profile
export async function PUT(request: NextRequest) {
  const { supabase, applyCookies } = createRouteClient(request)

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
      applyCookies(response)
      return response
    }

    const body = await request.json()

    const profile = await db.updateProfile(user.id, body, supabase)
    const response = NextResponse.json(profile)
    applyCookies(response)
    return response
  } catch (error) {
    console.error('Error updating profile:', error)
    const response = NextResponse.json(
      { error: 'Failed to update profile', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
    applyCookies(response)
    return response
  }
}
