import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";

// 🎲 Possible baby traits
const babyTraits = [
  "curious",
  "playful",
  "clingy",
  "sleepy",
  "hungry",
  "cheerful",
  "shy",
  "clumsy",
  "gentle",
  "noisy",
];

// Helper: pick 2 random traits
function getRandomBabyTraits() {
  return babyTraits.sort(() => 0.5 - Math.random()).slice(0, 2);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ownerWallet } = body;

    if (!name) {
      return NextResponse.json(
        { message: "Missing Minglet name" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newMinglet = await Minglet.create({
      name,
      ownerWallet: ownerWallet || "test_wallet",
      stats: { hunger: 100, happiness: 100, age: 0 },
      personality: getRandomBabyTraits(), 
      generation: 1,
      parents: [],
      isAlive: true,
      lastUpdated: new Date(),
    });

    return NextResponse.json(newMinglet, { status: 201 });
  } catch (error) {
    console.error("Create Minglet error:", error);
    return NextResponse.json(
      { message: "Failed to create Minglet" },
      { status: 500 }
    );
  }
}
