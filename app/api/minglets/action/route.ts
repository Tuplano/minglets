import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";

export async function PATCH(req: Request) {
  try {
    const { id, action, wallet } = await req.json();

    if (!id || !action || !wallet) {
      return NextResponse.json(
        { message: "Missing id, action, or wallet" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const minglet = await Minglet.findById(id);
    if (!minglet) {
      return NextResponse.json({ message: "Minglet not found" }, { status: 404 });
    }

    if (minglet.ownerWallet !== wallet) {
      return NextResponse.json(
        { message: "Unauthorized: not the owner" },
        { status: 403 }
      );
    }

    switch (action) {
      case "feed":
        minglet.stats.hunger = Math.min(minglet.stats.hunger + 20, 100);
        break;
      case "play":
        minglet.stats.happiness = Math.min(minglet.stats.happiness + 15, 100);
        break;
      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    minglet.lastUpdated = new Date();
    await minglet.save();

    return NextResponse.json({ message: `Minglet ${action} successful`, minglet });
  } catch (error) {
    console.error("Action error:", error);
    return NextResponse.json({ message: "Failed to perform action" }, { status: 500 });
  }
}
