import mongoose, { Schema, Model } from 'mongoose';

export interface CalculationDocument {
  id: string;
  userId: string;
  type: string;
  inputs: Record<string, unknown>;
  result: unknown;
  createdAt: Date;
}

const calculationSchema = new Schema<CalculationDocument>({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  inputs: { type: Schema.Types.Mixed, required: true },
  result: { type: Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

calculationSchema.index({ userId: 1, createdAt: -1 });

const Calculation: Model<CalculationDocument> =
  mongoose.models.Calculation ||
  mongoose.model<CalculationDocument>('Calculation', calculationSchema);

export default Calculation;

