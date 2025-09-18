import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet, { IMinglet } from "@/models/minglets";

const CRON_SECRET = process.env.CRON_SECRET || "hehe";

const teenTraits = [
  "adventurous",
  "rebellious",
  "social",
  "energetic",
  "moody",
  "dreamy",
  "competitive",
  "creative",
  "independent",
  "stubborn",
] as const;

const adultTraits = [
  "responsible",
  "calm",
  "wise",
  "focused",
  "protective",
  "disciplined",
  "caring",
  "hardworking",
  "strategic",
  "practical",
] as const;

type TeenTrait = typeof teenTraits[number];
type AdultTrait = typeof adultTraits[number];

function getRandomTrait<T extends readonly string[]>(traits: T): T[number] {
  return traits[Math.floor(Math.random() * traits.length)];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token =
      url.searchParams.get("secret") || req.headers.get("x-cron-key");

    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const now = Date.now();
    // ✅ Only fetch alive Minglets to save processing time
    const minglets: IMinglet[] = await Minglet.find({ isAlive: true });

    type BulkOperation = {
      updateOne: {
        filter: { _id: string };
        update: Record<string, unknown>;
      };
    };

    const bulkOps: BulkOperation[] = [];

    for (const m of minglets) {
      const last = m.lastUpdated?.getTime() || now;
      const hoursPassed = (now - last) / (1000 * 60 * 60);

      const newHunger = Math.max(m.stats.hunger - hoursPassed * 2, 0);
      const newHappiness = Math.max(m.stats.happiness - hoursPassed, 0);
      const newAge = m.stats.age + hoursPassed / 24;
      const isAlive = !(newHunger <= 0 || newHappiness <= 0);

      const updatedPersonality = [...m.personality];

      if (newAge >= 21) {
        const hasAdult = updatedPersonality.some(
          (p): p is AdultTrait => adultTraits.includes(p as AdultTrait)
        );
        if (!hasAdult) {
          updatedPersonality.push(getRandomTrait(adultTraits));
        }
      } else if (newAge >= 7) {
        const hasTeen = updatedPersonality.some(
          (p): p is TeenTrait => teenTraits.includes(p as TeenTrait)
        );
        if (!hasTeen) {
          updatedPersonality.push(getRandomTrait(teenTraits));
        }
      }

      const updateDoc: Record<string, unknown> = {
        $set: {
          "stats.hunger": newHunger,
          "stats.happiness": newHappiness,
          "stats.age": newAge,
          isAlive,
          lastUpdated: new Date(),
        },
      };

      if (updatedPersonality.length !== m.personality.length) {
        (updateDoc.$set as Record<string, unknown>).personality =
          updatedPersonality;
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: m._id },
          update: updateDoc,
        },
      });
    }

    if (bulkOps.length > 0) {
      const result = await Minglet.bulkWrite(bulkOps);
      return NextResponse.json({
        message: `✅ Simulation tick complete for ${bulkOps.length} Minglets`,
        modified: result.modifiedCount ?? 0, // `modifiedCount` is available here
      });
    }

    return NextResponse.json({
      message: "✅ Simulation tick complete - no updates needed",
      modified: 0,
    });
  } catch (error) {
    console.error("Simulation tick error:", error);
    return NextResponse.json(
      { message: "Error running simulation tick" },
      { status: 500 }
    );
  }
}
