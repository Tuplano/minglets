import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Minglet from "@/models/minglets";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "please-change-me";

interface AuthPayload extends JwtPayload {
  sub: string;
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();

    const cookie = req.headers.get("cookie") || "";
    const token = cookie
      .split(";")
      .find((c) => c.trim().startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Verify JWT with typing
    let decoded: AuthPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id, action } = await req.json();

    const minglet = await Minglet.findOne({
      _id: id,
      ownerWallet: decoded.sub,
    });
    if (!minglet) {
      return NextResponse.json(
        { error: "Not found or not authorized" },
        { status: 404 }
      );
    }
    if (minglet.ownerWallet !== decoded.sub) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (action === "feed") {
      minglet.stats.hunger = Math.max(
        0,
        Math.min(100, minglet.stats.hunger + 10)
      );
    }

    if (action === "play") {
      minglet.stats.happiness = Math.max(
        0,
        Math.min(100, minglet.stats.happiness + 10)
      );
    }

    await minglet.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
