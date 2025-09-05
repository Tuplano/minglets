import type { NextApiRequest, NextApiResponse } from "next";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PATCH") return res.status(405).json({ message: "Method not allowed" });

  const { id } = req.body;
  if (!id) return res.status(400).json({ message: "Missing Minglet ID" });

  try {
    await connectToDatabase();
    const minglet = await Minglet.findById(id);
    if (!minglet) return res.status(404).json({ message: "Minglet not found" });

    minglet.stats.happiness = Math.min(100, minglet.stats.happiness + 20);
    minglet.lastUpdated = new Date();

    await minglet.save();
    return res.status(200).json(minglet);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to play with Minglet" });
  }
}
