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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();
    const matchedUser = HARDCODED_USERS.find(
      (user) => user.username.toLowerCase() === normalizedUsername
    );

    if (!matchedUser || matchedUser.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const { password: _password, ...userWithoutPassword } = matchedUser;

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

