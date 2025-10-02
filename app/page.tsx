"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { IMinglet } from "@/models/minglets";
import MingletOverlay from "./components/mingletsOverlay";
import ProfileOverlay from "./components/mingletProfileOverlay";
import MingletWorld from "./components/simulation/mingletWorld";
import { usePhantomWallet } from "./hooks/usePhantomWallet";

const socket = io("http://localhost:3001");

export default function Simulation() {
  const [minglets, setMinglets] = useState<IMinglet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMinglet, setSelectedMinglet] = useState<IMinglet | null>(null);

  const { wallet, connectWallet } = usePhantomWallet({
    onConnect: () => socket.emit("minglets:request"),
    onDisconnect: () => setMinglets([]),
  });

  useEffect(() => {
    socket.on("minglets:init", (data: IMinglet[]) => {
      console.log("🚀 Initial Minglets:", data);
      setMinglets(data);
      setLoading(false);
    });

    socket.on("minglets:update", (data: IMinglet[]) => {
      console.log("🔄 Update received:", data.map(m => ({
        name: m.name,
        state: m.currentState,
        hunger: m.stats.hunger,
        happiness: m.stats.happiness
      })));
      setMinglets(data);
    });

    return () => {
      socket.off("minglets:init");
      socket.off("minglets:update");
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <MingletWorld
        minglets={minglets}
        loading={loading}
        onSelectMinglet={setSelectedMinglet}
      />

      <MingletOverlay
        wallet={wallet}
        connectWallet={connectWallet}
        minglets={minglets}
        loading={loading}
        refreshMinglets={() => socket.emit("minglets:request")}
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
