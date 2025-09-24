// pages/api/plantTree.ts
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Tree from "@/models/trees";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { x, y, type } = await req.json();

    const newTree = new Tree({ x, y, type });
    await newTree.save();

    return NextResponse.json({ tree: newTree });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Failed to plant tree" },
      { status: 500 }
    );
  }
}
