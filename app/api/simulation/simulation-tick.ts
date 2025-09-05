import type { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  await connectToDatabase();

  const minglets = await Minglet.find();
  const now = Date.now();

  for (const m of minglets) {
    const last = m.lastUpdated?.getTime() || now;
    const hoursPassed = (now - last) / (1000 * 60 * 60);

    m.stats.hunger = Math.min(m.stats.hunger + hoursPassed * 2, 100);
    m.stats.happiness = Math.max(m.stats.happiness - hoursPassed, 0);

    m.metadata.age += hoursPassed / 24;

    m.metadata.status = m.stats.hunger >= 100 ? "starving" : "healthy";

    m.lastUpdated = new Date();
    await m.save();
  }

  res.status(200).json({ message: "Simulation tick complete for all Minglets" });
}
