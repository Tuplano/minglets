import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Tree from "@/models/trees";

export async function GET() {
  try {
    await connectToDatabase();
    const trees = await Tree.find({});
    console.log("🌳 Trees from API:", trees);
    return NextResponse.json(trees);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Failed to fetch Trees" },
      { status: 500 }
    );
  }
}
