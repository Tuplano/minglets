import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";

const CRON_SECRET = process.env.CRON_SECRET || "hehe";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("secret") || req.headers.get("x-cron-key");

    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const minglets = await Minglet.find();
    const now = Date.now();

    for (const m of minglets) {
      const last = m.lastUpdated?.getTime() || now;
      const hoursPassed = (now - last) / (1000 * 60 * 60); 

      m.stats.hunger = Math.max(m.stats.hunger - hoursPassed * 2, 0);
      m.stats.happiness = Math.max(m.stats.happiness - hoursPassed, 0);
      m.stats.age += hoursPassed / 24;

      m.isAlive = !(m.stats.hunger <= 0 || m.stats.happiness <= 0);

      m.lastUpdated = new Date();
      await m.save();
    }

    return NextResponse.json({
      message: "✅ Simulation tick complete for all Minglets",
      updated: minglets.length,
    });
  } catch (error) {
    console.error("Simulation tick error:", error);
    return NextResponse.json(
      { message: "Error running simulation tick" },
      { status: 500 }
    );
  }
}
