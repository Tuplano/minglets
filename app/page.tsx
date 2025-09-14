"use client";

import { useState, useEffect } from "react";
import { IMinglet } from "@/models/minglets";
import MingletOverlay from "./components/mingletsOverlay";
import ProfileOverlay from "./components/mingletProfileOverlay";
import MingletWorld from "./components/simulation/mingletWorld";
import bs58 from "bs58";

interface PhantomProvider {
  isPhantom?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toString(): string };
  }>;
  disconnect?: () => void;
  publicKey?: { toString(): string };
  signMessage?: (
    message: Uint8Array,
    encoding: string
  ) => Promise<Uint8Array | { signature: Uint8Array }>;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export default function Simulation() {
  const [minglets, setMinglets] = useState<IMinglet[]>([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<string | null>(null);
  const [selectedMinglet, setSelectedMinglet] = useState<IMinglet | null>(null);

  const connectWallet = async () => {
    try {
      const provider = window.solana;
      if (!provider?.isPhantom) {
        alert("Phantom wallet not found. Install it first!");
        return;
      }

      const resp = await provider.connect();
      const pubkey = resp.publicKey.toString();

      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: pubkey }),
      });

      const { nonce } = await nonceRes.json();

      const message = `Minglets Authentication\n\nNonce: ${nonce}`;
      const encoded = new TextEncoder().encode(message);

      type SignedMessage = Uint8Array | { signature: Uint8Array };
      const signed: SignedMessage | undefined = await provider.signMessage?.(
        encoded,
        "utf8"
      );

      if (!signed) throw new Error("Wallet did not return a signature");

      const signatureBytes =
        signed instanceof Uint8Array ? signed : signed.signature;
      const signatureBase58 = bs58.encode(Buffer.from(signatureBytes));

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          publicKey: pubkey,
          signature: signatureBase58,
          nonce,
        }),
      });

      if (!verifyRes.ok) throw new Error("Signature verification failed");

      setWallet(pubkey);
      console.log("✅ Wallet authenticated with cookie");
      await fetchMinglets();
    } catch (err) {
      console.error("Wallet connect error:", err);
      setWallet(null);
    }
  };

  const fetchMinglets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/minglets/get", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch minglets");
      const data = await res.json();
      setMinglets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinglets();
  }, []);

  return (
    <div className="relative w-full h-screen">
      {/* ✅ World Canvas in its own component */}
      <MingletWorld
        minglets={minglets}
        loading={loading}
        onSelectMinglet={setSelectedMinglet}
      />

      {/* ✅ Overlays remain clickable above the world */}
      <MingletOverlay
        wallet={wallet}
        connectWallet={connectWallet}
        minglets={minglets}
        loading={loading}
        refreshMinglets={fetchMinglets}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <p className="text-white text-xl">Loading simulation...</p>
        </div>
      )}

      <ProfileOverlay
        minglet={selectedMinglet}
        onClose={() => setSelectedMinglet(null)}
      />
    </div>
  );
}
