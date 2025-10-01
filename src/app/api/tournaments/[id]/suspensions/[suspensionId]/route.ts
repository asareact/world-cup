// API route for individual suspension operations
import { NextRequest, NextResponse } from 'next/server';
import { PlayerSuspensionService } from '@/lib/database/player-suspensions';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const suspensionService = new PlayerSuspensionService();

// PATCH /api/tournaments/[id]/suspensions/[suspensionId] - Serve a suspension
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; suspensionId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { suspensionId } = params;
    
    if (!suspensionId) {
      return NextResponse.json(
        { error: 'Suspension ID is required' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { action } = body;
    
    // Validate action
    if (action !== 'serve') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }
    
    // Serve suspension
    const { data, error } = await suspensionService.serveSuspension(suspensionId);
    
    if (error) {
      console.error('Error serving suspension:', error);
      return NextResponse.json(
        { error: 'Failed to serve suspension' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ suspension: data });
  } catch (error) {
    console.error('Unexpected error serving suspension:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id]/suspensions/[suspensionId] - Delete a suspension (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; suspensionId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // TODO: Check if user is admin
    
    const { suspensionId } = params;
    
    if (!suspensionId) {
      return NextResponse.json(
        { error: 'Suspension ID is required' },
        { status: 400 }
      );
    }
    
    // Delete suspension
    const { error } = await suspensionService.deleteSuspension(suspensionId);
    
    if (error) {
      console.error('Error deleting suspension:', error);
      return NextResponse.json(
        { error: 'Failed to delete suspension' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Suspension deleted successfully' });
  } catch (error) {
    console.error('Unexpected error deleting suspension:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}