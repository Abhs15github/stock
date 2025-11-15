import { NextResponse } from 'next/server';

export function getUserIdFromHeaders(headers: Headers) {
  return headers.get('x-user-id');
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, message: 'User ID required' },
    { status: 401 }
  );
}

export function handleError(error: unknown, fallbackMessage: string) {
  console.error(fallbackMessage, error);
  return NextResponse.json(
    { success: false, message: fallbackMessage },
    { status: 500 }
  );
}

