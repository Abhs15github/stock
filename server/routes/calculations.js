const express = require('express');
const router = express.Router();
const Calculation = require('../models/Calculation');

// Get all calculations for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const calculations = await Calculation.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, calculations });
  } catch (error) {
    console.error('Get calculations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch calculations' });
  }
});

// Create a new calculation
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const calculationData = {
      ...req.body,
      userId
    };

    const calculation = new Calculation(calculationData);
    await calculation.save();

    res.json({ success: true, message: 'Calculation saved successfully', calculation });
  } catch (error) {
    console.error('Create calculation error:', error);
    res.status(500).json({ success: false, message: 'Failed to save calculation' });
  }
});

// Delete a calculation
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const calculationId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User ID required' });
    }

    const calculation = await Calculation.findOneAndDelete({ id: calculationId, userId });

    if (!calculation) {
      return res.status(404).json({ success: false, message: 'Calculation not found' });
    }

    res.json({ success: true, message: 'Calculation deleted successfully' });
  } catch (error) {
    console.error('Delete calculation error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete calculation' });
  }
});

module.exports = router;
