import { NextRequest, NextResponse } from 'next/server';

const HARDCODED_USERS = [
  {
    id: 'user-hemant',
    username: 'hemant',
    displayName: 'Hemant',
    password: 'Hemant@122',
    email: 'hemant@secure.local',
  },
  {
    id: 'user-akshay',
    username: 'akshay',
    displayName: 'Akshay',
    password: 'Akshay@99',
    email: 'akshay@secure.local',
  },
  {
    id: 'user-abhs',
    username: 'abhs',
    displayName: 'Abhs',
    password: 'Abhs@123',
    email: 'abhs@secure.local',
  },
];

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 }
    );
  }

  const matchedUser = HARDCODED_USERS.find((user) => user.id === userId);

  if (!matchedUser) {
    return NextResponse.json(
      { success: false, message: 'Invalid session' },
      { status: 401 }
    );
  }

  const { password: _password, ...userWithoutPassword } = matchedUser;

  return NextResponse.json({
    success: true,
    user: {
      ...userWithoutPassword,
      createdAt: new Date().toISOString(),
    },
  });
}

