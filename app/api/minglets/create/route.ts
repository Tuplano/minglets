import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ownerWallet } = body;

    if (!name) return NextResponse.json({ message: "Missing Minglet name" }, { status: 400 });

    await connectToDatabase();

    const newMinglet = await Minglet.create({
      name,
      ownerWallet: ownerWallet || "test_wallet",
      stats: { hunger: 100, happiness: 100 },
      metadata: { age: 0, status: "alive" },
    });

    return NextResponse.json(newMinglet, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to create Minglet" }, { status: 500 });
  }
}
