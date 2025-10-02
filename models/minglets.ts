import mongoose, { Schema, Document } from "mongoose";

const StatsSchema = new Schema({
  hunger: { type: Number, min: 0, max: 100, default: 100 },
  happiness: { type: Number, min: 0, max: 100, default: 100 },
  age: { type: Number, default: 0 },
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
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
  currentState: "wander" | "idle" | "talk" | "eating" | "playing";
  stateTimer: number;
  lastUpdated: Date;
  createdAt?: Date;   // ✅ optional because timestamps auto-add
  updatedAt?: Date;   // ✅ optional
}

const MingletSchema = new Schema<IMinglet>(
  {
    name: { type: String, required: true, trim: true },
    ownerWallet: { type: String, required: true, index: true },
    stats: { type: StatsSchema, default: () => ({}) },
    personality: { type: [String], default: [] },
    generation: { type: Number, default: 1 },
    parents: { type: [String], default: [] },
    isAlive: { type: Boolean, default: true },

    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    direction: { type: String, enum: ["up", "down", "left", "right"], default: "down" },
    currentState: { type: String, enum: ["wander","idle","talk","eating","playing"], default: "wander" },
    stateTimer: { type: Number, default: 0 },

    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default (mongoose.models.Minglet as mongoose.Model<IMinglet>) 
  || mongoose.model<IMinglet>("Minglet", MingletSchema);
