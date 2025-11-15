const express = require('express');
const router = express.Router();

// Hardcoded users (same as frontend)
const HARDCODED_USERS = [
  {
    id: 'user-hemant',
    username: 'hemant',
    displayName: 'Hemant',
    password: 'Hemant@122',
    email: 'hemant@secure.local'
  },
  {
    id: 'user-akshay',
    username: 'akshay',
    displayName: 'Akshay',
    password: 'Akshay@99',
    email: 'akshay@secure.local'
  },
  {
    id: 'user-abhs',
    username: 'abhs',
    displayName: 'Abhs',
    password: 'Abhs@123',
    email: 'abhs@secure.local'
  }
];

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const matchedUser = HARDCODED_USERS.find(
      user => user.username.toLowerCase() === normalizedUsername
    );

    if (!matchedUser || matchedUser.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = matchedUser;
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        ...userWithoutPassword,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// Verify session endpoint
router.get('/verify', async (req, res) => {
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const matchedUser = HARDCODED_USERS.find(user => user.id === userId);

  if (!matchedUser) {
    return res.status(401).json({ success: false, message: 'Invalid session' });
  }

  const { password: _, ...userWithoutPassword } = matchedUser;
  res.json({
    success: true,
    user: {
      ...userWithoutPassword,
      createdAt: new Date().toISOString()
    }
  });
});

module.exports = router;
