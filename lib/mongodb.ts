import mongoose from "mongoose";

const MONGODB_URI: string = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

let isConnected: boolean = false;
export default async function connectToDatabase() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB");
  }
}

export async function disconnectFromDatabase() {
  if (isConnected) {
    try {
      await mongoose.disconnect();
      isConnected = false;
      console.log("MongoDB disconnected successfully");
    } catch (error) {
      console.error("MongoDB disconnection error:", error);
      throw new Error("Failed to disconnect from MongoDB");
    }
  }
}
