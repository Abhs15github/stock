import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import Calculation from '@/lib/models/Calculation';
import { getUserIdFromHeaders, handleError, unauthorizedResponse } from '@/lib/api-helpers';

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
    const calculation = await Calculation.findOneAndDelete({
      id: params.id,
      userId,
    });

    if (!calculation) {
      return NextResponse.json(
        { success: false, message: 'Calculation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Calculation deleted successfully',
    });
  } catch (error) {
    return handleError(error, 'Failed to delete calculation');
  }
}

