import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "random hehe";

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

function getRandomBabyTraits() {
  return babyTraits.sort(() => 0.5 - Math.random()).slice(0, 2);
}

function getWalletFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];

  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return payload.sub as string;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const ownerWallet = getWalletFromRequest(req);
    if (!ownerWallet) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.length > 32) {
      return NextResponse.json(
        { message: "Invalid Minglet name" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newMinglet = await Minglet.create({
      name,
      ownerWallet,
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
