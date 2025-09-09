import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";

export async function GET() {
  try {
    await connectToDatabase();

    const minglets = await Minglet.find();
    const now = Date.now();

    for (const m of minglets) {
      const last = m.lastUpdated?.getTime() || now;
      const hoursPassed = (now - last) / (1000 * 60 * 60); 

      m.stats.hunger = Math.max(m.stats.hunger - hoursPassed * 2, 0);

      m.stats.happiness = Math.max(m.stats.happiness - hoursPassed, 0);

      m.stats.age += hoursPassed / 24;

      if (m.stats.hunger <= 0 || m.stats.happiness <= 0) {
        m.isAlive = false;
      } else {
        m.isAlive = true;
      }

      m.lastUpdated = new Date();

      await m.save();
    }

    return NextResponse.json({
      message: "Simulation tick complete for all Minglets",
    });
  } catch (error) {
    console.error("Simulation tick error:", error);
    return NextResponse.json(
      { message: "Error running simulation tick" },
      { status: 500 }
    );
  }
}
