import mongoose, { Schema, Document } from "mongoose";

const StatsSchema = new Schema({
  hunger: { type: Number, min: 0, max: 100, default: 100 },
  happiness: { type: Number, min: 0, max: 100, default: 100 },
  age: { type: Number, default: 0 }, // in days
});

export interface IMinglet extends Document {
  _id: string;
  name: string;
  ownerWallet: string;
  stats: {
    hunger: number;
    happiness: number;
    age: number;
  };
  personality: string[];
  generation: number;
  parents: string[];
  isAlive: boolean;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MingletSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    ownerWallet: { type: String, required: true, index: true },
    stats: { type: StatsSchema, default: () => ({}) },
    personality: { type: [String], default: [] },
    generation: { type: Number, default: 1 },
    parents: { type: [String], default: [] },
    isAlive: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Minglet ||
  mongoose.model<IMinglet>("Minglet", MingletSchema);
