import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/server';
import { AdminService } from '@/lib/api/admin-service';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with proper cookie handling
    const supabase = createMiddlewareClient(request, new NextResponse());
    
    // Get the user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges - try user_profiles table first
    let profile = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If user_profiles doesn't exist, try profiles table as fallback
    if (profile.error) {
      if (profile.error.code === '42P01' || profile.error.message.includes('does not exist')) {
        profile = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
      }
    }

    if (profile.error || !profile.data || !['superAdmin', 'arbitro'].includes(profile.data.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const adminService = new AdminService();
    
    // Get pagination and search parameters from query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const result = await adminService.getUserProfiles(page, limit, search);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching user profiles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Create Supabase client with proper cookie handling
    const supabase = createMiddlewareClient(request, new NextResponse());
    
    // Get the user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges - try user_profiles table first
    let profile = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If user_profiles doesn't exist, try profiles table as fallback
    if (profile.error) {
      if (profile.error.code === '42P01' || profile.error.message.includes('does not exist')) {
        profile = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
      }
    }

    if (profile.error || !profile.data || !['superAdmin', 'arbitro'].includes(profile.data.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const adminService = new AdminService();
    
    // Get the request body
    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    // Validate role value
    const validRoles: Array<'superAdmin' | 'capitan' | 'invitado' | 'arbitro'> = ['superAdmin', 'capitan', 'invitado', 'arbitro'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const updatedProfile = await adminService.updateUserRole(userId, role);

    // Return in the format expected by the frontend
    return NextResponse.json({ user: updatedProfile });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support PATCH method for compatibility with existing frontend
export async function PATCH(request: NextRequest) {
  return PUT(request); // Use the same logic as PUT
}