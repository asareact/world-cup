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
    
    // Get all filter options concurrently
    const [tournaments, teams, positions] = await Promise.all([
      adminService.getTournamentsForFilter(),
      adminService.getTeamsForFilter(),
      adminService.getPositionsForFilter()
    ]);

    return NextResponse.json({
      tournaments,
      teams,
      positions
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}