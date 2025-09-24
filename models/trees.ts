import mongoose, { Schema, Document } from "mongoose";

// Tree state interface
export interface ITree extends Document {
  _id: string;
  type: number;          
  x: number;             
  y: number;            
  state: "healthy" | "chopped" | "burned"; 
  createdAt: Date;
  updatedAt: Date;
}

const TreeSchema: Schema = new Schema(
  {
    type: { type: Number, required: true, min: 1 }, 
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    state: { type: String, enum: ["healthy", "chopped", "burned"], default: "healthy" },
  },
  { timestamps: true }
);

export default mongoose.models.Tree || mongoose.model<ITree>("Tree", TreeSchema);
