const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Get all sessions for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const sessions = await Session.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
});

// Create a new session
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const sessionData = {
      ...req.body,
      userId,
      updatedAt: new Date()
    };

    const session = new Session(sessionData);
    await session.save();

    res.json({ success: true, message: 'Session created successfully', session });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ success: false, message: 'Failed to create session' });
  }
});

// Update a session
router.put('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const sessionId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const session = await Session.findOneAndUpdate(
      { id: sessionId, userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, message: 'Session updated successfully', session });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ success: false, message: 'Failed to update session' });
  }
});

// Delete a session
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const sessionId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const session = await Session.findOneAndDelete({ id: sessionId, userId });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
});

module.exports = router;
