const express = require('express');
const router = express.Router();
const Trade = require('../models/Trade');

// Get all trades for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const trades = await Trade.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, trades });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trades' });
  }
});

// Get trades for a specific session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const sessionId = req.params.sessionId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const trades = await Trade.find({ userId, sessionId }).sort({ createdAt: 1 });
    res.json({ success: true, trades });
  } catch (error) {
    console.error('Get session trades error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session trades' });
  }
});

// Create a new trade
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const tradeData = {
      ...req.body,
      userId,
      updatedAt: new Date()
    };

    const trade = new Trade(tradeData);
    await trade.save();

    res.json({ success: true, message: 'Trade created successfully', trade });
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ success: false, message: 'Failed to create trade' });
  }
});

// Update a trade
router.put('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const tradeId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const trade = await Trade.findOneAndUpdate(
      { id: tradeId, userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }

    res.json({ success: true, message: 'Trade updated successfully', trade });
  } catch (error) {
    console.error('Update trade error:', error);
    res.status(500).json({ success: false, message: 'Failed to update trade' });
  }
});

// Delete a trade
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const tradeId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const trade = await Trade.findOneAndDelete({ id: tradeId, userId });

    if (!trade) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }

    res.json({ success: true, message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete trade' });
  }
});

// Bulk create trades
router.post('/bulk', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { trades } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const tradesWithUser = trades.map(trade => ({
      ...trade,
      userId,
      updatedAt: new Date()
    }));

    const createdTrades = await Trade.insertMany(tradesWithUser);

    res.json({ success: true, message: 'Trades created successfully', trades: createdTrades });
  } catch (error) {
    console.error('Bulk create trades error:', error);
    res.status(500).json({ success: false, message: 'Failed to create trades' });
  }
});

module.exports = router;
