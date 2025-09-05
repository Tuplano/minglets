import mongoose, { Schema, Document } from "mongoose";

const StatsSchema = new Schema({
  hunger: { type: Number, default: 100 },
  happiness: { type: Number, default: 100 },
});

const MetadataSchema = new Schema({
  age: { type: Number, default: 0 },
  status: { type: String, default: "alive" },
});

export interface IMinglet extends Document {
    _id: string;
  name: string;
  ownerWallet: string;
  stats: {
    hunger: number;
    happiness: number;
  };
  metadata: {
    age: number;
    status: string;
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MingletSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    ownerWallet: { type: String, default: "test_wallet" },
    stats: { type: StatsSchema, default: () => ({}) },
    metadata: { type: MetadataSchema, default: () => ({}) },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Minglet ||
  mongoose.model<IMinglet>("Minglet", MingletSchema);
