import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Calculation from '@/lib/models/Calculation';
import { getUserIdFromHeaders, handleError, unauthorizedResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromHeaders(request.headers);
    if (!userId) {
      return unauthorizedResponse();
    }

    await connectToDatabase();
    const calculations = await Calculation.find({ userId }).sort({
      createdAt: -1,
    });
    return NextResponse.json({ success: true, calculations });
  } catch (error) {
    return handleError(error, 'Failed to fetch calculations');
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

    const calculation = new Calculation({
      ...body,
      userId,
    });
    await calculation.save();

    return NextResponse.json({
      success: true,
      message: 'Calculation saved successfully',
      calculation,
    });
  } catch (error) {
    return handleError(error, 'Failed to save calculation');
  }
}

