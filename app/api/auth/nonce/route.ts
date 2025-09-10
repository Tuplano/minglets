import { NextResponse } from "next/server";
import crypto from "crypto";

const nonces = new Map<string, { publicKey: string; expiresAt: number }>();

export async function POST(req: Request) {
  const { publicKey } = await req.json();
  if (!publicKey) {
    return NextResponse.json({ error: "publicKey required" }, { status: 400 });
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  nonces.set(nonce, { publicKey, expiresAt: Date.now() + 5 * 60 * 1000 });

  return NextResponse.json({ nonce });
}

export { nonces };
