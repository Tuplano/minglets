import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";
import jwt from "jsonwebtoken";
import { nonces } from "../nonce/route";

const JWT_SECRET = process.env.JWT_SECRET || "random hehe";

export async function POST(req: Request) {
  const { publicKey, signature, nonce } = await req.json();
  if (!publicKey || !signature || !nonce) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const entry = nonces.get(nonce);
  if (!entry) return NextResponse.json({ error: "invalid nonce" }, { status: 400 });
  if (entry.publicKey !== publicKey) return NextResponse.json({ error: "nonce mismatch" }, { status: 400 });
  if (entry.expiresAt < Date.now()) {
    nonces.delete(nonce);
    return NextResponse.json({ error: "nonce expired" }, { status: 400 });
  }

  // Verify signature
  const message = `Minglets Authentication\n\nNonce: ${nonce}`;
  const msgBytes = new TextEncoder().encode(message);
  const sigBytes = bs58.decode(signature);
  const pubKeyBytes = bs58.decode(publicKey);

  const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);
  if (!valid) return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  nonces.delete(nonce);

  const token = jwt.sign({ sub: publicKey }, JWT_SECRET, { expiresIn: "1h" });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60, // 1h
  });

  return res;
}
