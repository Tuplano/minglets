import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";

export async function GET() {
  try {
    await connectToDatabase();
    const minglets = await Minglet.find({});
    return NextResponse.json(minglets);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ message: "Failed to fetch Minglets" }, { status: 500 });
  }
}
