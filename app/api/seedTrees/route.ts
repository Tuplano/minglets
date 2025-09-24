import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Tree from "@/models/trees";

export async function POST() {
  try {
    await connectToDatabase();

    // Default seed trees
    const seedTrees = [
      { type: 1, x: 50, y: 100 },
      { type: 2, x: 150, y: 200 },
      { type: 3, x: 300, y: 400 },
      { type: 4, x: 500, y: 300 },
    ];

    const inserted = await Tree.insertMany(seedTrees);
    return NextResponse.json({ message: "🌳 Trees seeded!", inserted });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to seed trees", error },
      { status: 500 }
    );
  }
}
