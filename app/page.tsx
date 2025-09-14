"use client";

import { useState, useEffect, useCallback } from "react";
import { IMinglet } from "@/models/minglets";
import MingletOverlay from "./components/mingletsOverlay";
import ProfileOverlay from "./components/mingletProfileOverlay";
import MingletWorld from "./components/simulation/mingletWorld";
import { usePhantomWallet } from "./hooks/usePhantomWallet";

export default function Simulation() {
  const [minglets, setMinglets] = useState<IMinglet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMinglet, setSelectedMinglet] = useState<IMinglet | null>(null);

  const { wallet, connectWallet } = usePhantomWallet({
    onConnect: () => fetchMinglets(),
    onDisconnect: () => setMinglets([]),
  });

  const fetchMinglets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/minglets/get", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch minglets");
      setMinglets(await res.json());
    } catch (err) {
      console.error("❌ Failed to fetch minglets:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMinglets();
  }, [fetchMinglets]);

  return (
    <div className="relative w-full h-screen">
      {/* 🌱 World Simulation */}
      <MingletWorld
        minglets={minglets}
        loading={loading}
        onSelectMinglet={setSelectedMinglet}
      />

      {/* 🛠️ Overlay UI */}
      <MingletOverlay
        wallet={wallet}
        connectWallet={connectWallet}
        minglets={minglets}
        loading={loading}
        refreshMinglets={fetchMinglets}
      />

      {/* ⏳ Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <p className="text-white text-xl">Loading simulation...</p>
        </div>
      )}

      {/* 📄 Profile Overlay */}
      <ProfileOverlay
        minglet={selectedMinglet}
        onClose={() => setSelectedMinglet(null)}
      />
    </div>
  );
}
