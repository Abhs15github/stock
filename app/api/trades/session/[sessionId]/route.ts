import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Trade from '@/lib/models/Trade';
import { getUserIdFromHeaders, handleError, unauthorizedResponse } from '@/lib/api-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userId = getUserIdFromHeaders(request.headers);
    if (!userId) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const trades = await Trade.find({
      userId,
      sessionId: params.sessionId,
    }).sort({ createdAt: 1 });

    return NextResponse.json({ success: true, trades });
  } catch (error) {
    return handleError(error, 'Failed to fetch session trades');
  }
}

