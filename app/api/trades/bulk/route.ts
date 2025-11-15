import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Trade from '@/lib/models/Trade';
import { getUserIdFromHeaders, handleError, unauthorizedResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromHeaders(request.headers);
    if (!userId) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { trades } = body;

    if (!Array.isArray(trades)) {
      return NextResponse.json(
        { success: false, message: 'Trades array is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const tradesWithUser = trades.map((trade: any) => ({
      ...trade,
      userId,
      updatedAt: new Date(),
    }));

    const createdTrades = await Trade.insertMany(tradesWithUser);

    return NextResponse.json({
      success: true,
      message: 'Trades created successfully',
      trades: createdTrades,
    });
  } catch (error) {
    return handleError(error, 'Failed to create trades');
  }
}

