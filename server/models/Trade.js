const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  pairName: {
    type: String,
    required: true
  },
  entryPrice: {
    type: Number,
    required: true
  },
  exitPrice: {
    type: Number
  },
  investment: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'won', 'lost'],
    required: true
  },
  profitOrLoss: {
    type: Number,
    default: 0
  },
  profitOrLossPercentage: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
tradeSchema.index({ userId: 1, sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('Trade', tradeSchema);
