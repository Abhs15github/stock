import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Trade from '@/lib/models/Trade';
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

    const trade = await Trade.findOneAndUpdate(
      { id: params.id, userId },
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!trade) {
      return NextResponse.json(
        { success: false, message: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Trade updated successfully',
      trade,
    });
  } catch (error) {
    return handleError(error, 'Failed to update trade');
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
    const trade = await Trade.findOneAndDelete({ id: params.id, userId });

    if (!trade) {
      return NextResponse.json(
        { success: false, message: 'Trade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Trade deleted successfully',
    });
  } catch (error) {
    return handleError(error, 'Failed to delete trade');
  }
}

