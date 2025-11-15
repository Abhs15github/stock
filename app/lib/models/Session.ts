import mongoose, { Schema, Model } from 'mongoose';

export interface SessionDocument {
  id: string;
  userId: string;
  name: string;
  capital: number;
  totalTrades: number;
  accuracy: number;
  riskRewardRatio: number;
  status: 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<SessionDocument>({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  capital: {
    type: Number,
    required: true,
  },
  totalTrades: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    required: true,
  },
  riskRewardRatio: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

sessionSchema.index({ userId: 1, createdAt: -1 });

const Session: Model<SessionDocument> =
  mongoose.models.Session || mongoose.model<SessionDocument>('Session', sessionSchema);

export default Session;

