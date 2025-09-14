import { useState } from "react";
import bs58 from "bs58";

interface PhantomProvider {
  isPhantom?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{
    publicKey: { toString(): string };
  }>;
  disconnect?: () => void;
  signMessage?: (message: Uint8Array, encoding: string) => Promise<Uint8Array | { signature: Uint8Array }>;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
}

export function usePhantomWallet({ onConnect, onDisconnect }: { onConnect?: () => void; onDisconnect?: () => void }) {
  const [wallet, setWallet] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      const provider = window.solana;
      if (!provider?.isPhantom) return alert("Phantom wallet not found.");

      const { publicKey } = await provider.connect();
      const pubkey = publicKey.toString();

      // Get nonce from server
      const { nonce } = await (await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: pubkey }),
      })).json();

      // Sign message
      const message = `Minglets Authentication\n\nNonce: ${nonce}`;
      const encoded = new TextEncoder().encode(message);
      const signed = await provider.signMessage?.(encoded, "utf8");
      if (!signed) throw new Error("Wallet did not return a signature");

      const signature = bs58.encode(Buffer.from(signed instanceof Uint8Array ? signed : signed.signature));

      // Verify signature with server
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ publicKey: pubkey, signature, nonce }),
      });

      if (!verifyRes.ok) throw new Error("Signature verification failed");

      setWallet(pubkey);
      onConnect?.();
    } catch (err) {
      console.error("Wallet connect error:", err);
      setWallet(null);
      onDisconnect?.();
    }
  };

  return { wallet, connectWallet };
}
