import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/server';
import { AdminService, PlayerStatsFilter, SortParams, PaginationParams } from '@/lib/api/admin-service';

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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Sorting
    const sortField = searchParams.get('sortField') || 'goals';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Filters
    const filters: PlayerStatsFilter = {};
    if (searchParams.get('tournamentId')) filters.tournament_id = searchParams.get('tournamentId') || undefined;
    if (searchParams.get('teamId')) filters.team_id = searchParams.get('teamId') || undefined;
    if (searchParams.get('playerName')) filters.player_name = searchParams.get('playerName') || undefined;
    if (searchParams.get('position')) filters.position = searchParams.get('position') || undefined;
    if (searchParams.get('minGoals')) filters.min_goals = parseInt(searchParams.get('minGoals') || '0');
    if (searchParams.get('maxGoals')) filters.max_goals = parseInt(searchParams.get('maxGoals') || '999');
    if (searchParams.get('minAssists')) filters.min_assists = parseInt(searchParams.get('minAssists') || '0');
    if (searchParams.get('maxAssists')) filters.max_assists = parseInt(searchParams.get('maxAssists') || '999');
    if (searchParams.get('minMinutes')) filters.min_minutes = parseInt(searchParams.get('minMinutes') || '0');
    if (searchParams.get('maxMinutes')) filters.max_minutes = parseInt(searchParams.get('maxMinutes') || '999');

    const pagination: PaginationParams = { page, limit };
    const sort: SortParams = { field: sortField, order: sortOrder as 'asc' | 'desc' };

    const result = await adminService.getPlayerStats(pagination, filters, sort);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching player stats:', error);
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Ensure we only pass valid player stats fields to the update
    const validUpdates = {
      goals: updates.goals !== undefined ? updates.goals : undefined,
      assists: updates.assists !== undefined ? updates.assists : undefined,
      yellow_cards: updates.yellow_cards !== undefined ? updates.yellow_cards : undefined,
      red_cards: updates.red_cards !== undefined ? updates.red_cards : undefined,
      matches_played: updates.matches_played !== undefined ? updates.matches_played : undefined,
      minutes_played: updates.minutes_played !== undefined ? updates.minutes_played : undefined,
      saves_made: updates.saves_made !== undefined ? updates.saves_made : undefined,
      goals_conceded: updates.goals_conceded !== undefined ? updates.goals_conceded : undefined,
      clean_sheets: updates.clean_sheets !== undefined ? updates.clean_sheets : undefined,
      matches_appeared: updates.matches_appeared !== undefined ? updates.matches_appeared : undefined,
    };

    // Remove undefined values
    Object.keys(validUpdates).forEach(key => {
      if (validUpdates[key] === undefined) {
        delete validUpdates[key];
      }
    });

    const updatedStats = await adminService.updatePlayerStats(id, validUpdates);

    return NextResponse.json({ success: true, data: updatedStats });
  } catch (error) {
    console.error('Error updating player stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { 
      player_id, 
      tournament_id, 
      goals, 
      assists, 
      yellow_cards, 
      red_cards, 
      matches_played, 
      minutes_played,
      saves_made,
      goals_conceded,
      clean_sheets,
      matches_appeared
    } = body;

    if (!player_id || !tournament_id) {
      return NextResponse.json(
        { error: 'player_id and tournament_id are required' },
        { status: 400 }
      );
    }

    const newStats = await adminService.createPlayerStats({
      player_id,
      tournament_id,
      goals: goals || 0,
      assists: assists || 0,
      yellow_cards: yellow_cards || 0,
      red_cards: red_cards || 0,
      matches_played: matches_played || 0,
      minutes_played: minutes_played || 0,
      saves_made: saves_made || 0,
      goals_conceded: goals_conceded || 0,
      clean_sheets: clean_sheets || 0,
      matches_appeared: matches_appeared || 0
    });

    return NextResponse.json({ success: true, data: newStats });
  } catch (error) {
    console.error('Error creating player stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await adminService.deletePlayerStats(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting player stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}