import mongoose, { Schema, Model } from 'mongoose';

export interface TradeDocument {
  id: string;
  userId: string;
  sessionId?: string;
  pairName: string;
  entryPrice: number;
  exitPrice?: number;
  investment: number;
  date: string;
  type: 'buy' | 'sell';
  status: 'pending' | 'won' | 'lost';
  profitOrLoss: number;
  profitOrLossPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const tradeSchema = new Schema<TradeDocument>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  sessionId: { type: String },
  pairName: { type: String, required: true },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number },
  investment: { type: Number, required: true },
  date: { type: String, required: true },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  status: { type: String, enum: ['pending', 'won', 'lost'], required: true },
  profitOrLoss: { type: Number, required: true },
  profitOrLossPercentage: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

tradeSchema.index({ userId: 1, createdAt: -1 });

const Trade: Model<TradeDocument> =
  mongoose.models.Trade || mongoose.model<TradeDocument>('Trade', tradeSchema);

export default Trade;

