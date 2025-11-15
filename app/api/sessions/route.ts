import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Session from '@/lib/models/Session';
import { getUserIdFromHeaders, handleError, unauthorizedResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromHeaders(request.headers);
    if (!userId) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const sessions = await Session.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    return handleError(error, 'Failed to fetch sessions');
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

    const sessionData = {
      ...body,
      userId,
      updatedAt: new Date(),
    };

    const session = new Session(sessionData);
    await session.save();

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      session,
    });
  } catch (error) {
    return handleError(error, 'Failed to create session');
  }
}

