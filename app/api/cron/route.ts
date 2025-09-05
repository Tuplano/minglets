import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";

// This function will be called by Vercel cron jobs
export async function GET() {
  try {
    await connectToDatabase();

    const minglets = await Minglet.find();
    const now = Date.now();

    for (const m of minglets) {
      const last = m.lastUpdated?.getTime() || now;
      const hoursPassed = (now - last) / (1000 * 60 * 60); // convert ms → hours

      // Hunger decreases from 100
      m.stats.hunger = Math.max(m.stats.hunger - hoursPassed * 2, 0);

      // Happiness decreases from 100
      m.stats.happiness = Math.max(m.stats.happiness - hoursPassed, 0);

      // Age in days
      m.metadata.age += hoursPassed / 24;

      // Status logic
      if (m.stats.hunger <= 0) {
        m.metadata.status = "starving";
      } else if (m.stats.happiness <= 20) {
        m.metadata.status = "sad";
      } else {
        m.metadata.status = "healthy";
      }

      m.lastUpdated = new Date();
      await m.save();
    }

    return NextResponse.json({ message: "Simulation tick complete for all Minglets" });
  } catch (error) {
    console.error("Simulation tick error:", error);
    return NextResponse.json({ message: "Error running simulation tick" }, { status: 500 });
  }
}
