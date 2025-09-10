"use client";

import { useState, useEffect } from "react";
import { IMinglet } from "@/models/minglets";

interface PhantomProvider {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => void;
  publicKey?: {
    toString(): string;
  };
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

  const connectWallet = async () => {
    try {
      const provider = window.solana;
      if (!provider?.isPhantom) {
        alert("Phantom wallet not found. Install it first!");
        return;
      }

      const resp = await provider.connect();
      setWallet(resp.publicKey.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMinglets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/minglets/get");
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

  // ➕ Create Minglet
  const createMinglet = async () => {
    if (!wallet) return alert("Connect your wallet first!");
    const name = prompt("Enter a name for your Minglet:");
    if (!name) return;

    try {
      await fetch("/api/minglets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, ownerWallet: wallet }),
      });
      fetchMinglets();
    } catch (err) {
      console.error(err);
    }
  };

const handleAction = async (id: string, action: "feed" | "play") => {
  if (!wallet) return alert("Connect your wallet first!");

  try {
    await fetch("/api/minglets/action", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, wallet }),
    });
    fetchMinglets();
  } catch (err) {
    console.error(err);
  }
};


  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-4 text-center">
        🌟 Minglets Simulation World 🌟
      </h1>

      {/* Wallet Connect / Info */}
      <div className="text-center mb-6">
        {wallet ? (
          <div>
            Connected: <span className="font-mono">{wallet}</span>
            <button
              onClick={createMinglet}
              className="ml-4 px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Create Minglet
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Connect Phantom Wallet
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center mt-10">Loading simulation...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {minglets.map((m) => (
            <div
              key={m._id}
              className="p-4 border rounded-lg shadow-md bg-white"
            >
              <h2 className="text-xl font-semibold">{m.name}</h2>
              <p>👤 Owner: {m.ownerWallet}</p>
              <p>📌 Alive: {m.isAlive ? "✅ Yes" : "❌ No"}</p>
              <p>🎂 Age: {m.stats.age.toFixed(1)}</p>
              <p>🍗 Hunger: {m.stats.hunger.toFixed(0)}</p>
              <p>😊 Happiness: {m.stats.happiness.toFixed(0)}</p>
              <p>🧬 Generation: {m.generation}</p>

              {/* Personality section */}
              {m.personality?.length > 0 && (
                <div className="mt-3 p-2 bg-gray-50 rounded">
                  <p className="font-medium">✨ Personality Traits:</p>
                  <ul className="list-disc ml-5 text-sm">
                    {m.personality.map((trait, i) => (
                      <li key={i}>{trait}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleAction(m._id, "feed")}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Feed
                </button>
                <button
                  onClick={() => handleAction(m._id, "play")}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Play
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
