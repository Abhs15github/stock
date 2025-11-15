import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Trade from '@/lib/models/Trade';
import { getUserIdFromHeaders, handleError, unauthorizedResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromHeaders(request.headers);
    if (!userId) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const trades = await Trade.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, trades });
  } catch (error) {
    return handleError(error, 'Failed to fetch trades');
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromHeaders(request.headers);
    if (!userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    await connectToDatabase();

    const trade = new Trade({
      ...body,
      userId,
      updatedAt: new Date(),
    });
    await trade.save();

    return NextResponse.json({
      success: true,
      message: 'Trade created successfully',
      trade,
    });
  } catch (error) {
    return handleError(error, 'Failed to create trade');
  }
}

