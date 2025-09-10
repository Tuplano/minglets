"use client";

import { useState, useEffect, useRef } from "react";
import { Application, Graphics, TilingSprite, Assets } from "pixi.js";
import { IMinglet } from "@/models/minglets";
import MingletOverlay from "./components/mingletsOverlay";
import ProfileOverlay from "./components/mingletProfileOverlay";
import bs58 from "bs58";

interface PhantomProvider {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
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
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const connectWallet = async () => {
    try {
      const provider = window.solana;
      if (!provider?.isPhantom) {
        alert("Phantom wallet not found. Install it first!");
        return;
      }

      // 1. Connect wallet
      const resp = await provider.connect();
      const pubkey = resp.publicKey.toString();

      // 2. Ask server for nonce
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: pubkey }),
      });
      const { nonce } = await nonceRes.json();

      // 3. Sign the message with Phantom
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

      // 4. Verify signature with server → sets cookie
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
      const res = await fetch("/api/minglets/get", {
        credentials: "include",
      });
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

  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const app = new Application();

    app
      .init({
        resizeTo: window,
        backgroundAlpha: 0,
      })
      .then(async () => {
        if (!canvasRef.current) return;
        canvasRef.current.appendChild(app.canvas);

        app.stage.removeChildren();

        // Background
        const texture = await Assets.load("/textures/grass.png");
        const tiling = new TilingSprite({
          texture,
          width: app.screen.width,
          height: app.screen.height,
        });

        tiling.tileScale.set(0.25, 0.25);
        app.stage.addChild(tiling);

        app.renderer.on("resize", (width, height) => {
          tiling.width = width;
          tiling.height = height;
        });

        // Add minglets as circles
        minglets.forEach((m) => {
          const g = new Graphics();
          g.beginFill(m.isAlive ? 0x00ff99 : 0x999999);
          g.drawCircle(0, 0, 20);
          g.endFill();

          g.x = Math.random() * app.screen.width;
          g.y = Math.random() * app.screen.height;

          g.eventMode = "static";
          g.cursor = "pointer";

          g.on("pointertap", () => {
            setSelectedMinglet(m);
          });

          app.stage.addChild(g);

          app.ticker.add(() => {
            g.x += Math.random() * 2 - 1;
            g.y += Math.random() * 2 - 1;
          });
        });
      });

    return () => {
      app.destroy(true, { children: true });
    };
  }, [minglets, loading]);

  return (
    <div className="relative w-full h-screen">
      <div ref={canvasRef} className="absolute inset-0" />

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
