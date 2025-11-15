import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Session from '@/lib/models/Session';
import { getUserIdFromHeaders, handleError, unauthorizedResponse } from '@/lib/api-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromHeaders(request.headers);
    if (!userId) {
      return unauthorizedResponse();
    }

    const updates = await request.json();
    await connectToDatabase();

    const session = await Session.findOneAndUpdate(
      { id: params.id, userId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      session,
    });
  } catch (error) {
    return handleError(error, 'Failed to update session');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromHeaders(request.headers);
    if (!userId) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const session = await Session.findOneAndDelete({ id: params.id, userId });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    return handleError(error, 'Failed to delete session');
  }
}

