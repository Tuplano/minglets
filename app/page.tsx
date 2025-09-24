"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { IMinglet } from "@/models/minglets";
import { ITree } from "@/models/trees";
import MingletOverlay from "./components/mingletsOverlay";
import ProfileOverlay from "./components/mingletProfileOverlay";
import MingletWorld from "./components/simulation/mingletWorld";
import { usePhantomWallet } from "./hooks/usePhantomWallet";

// --- Socket Connection ---
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
  transports: ["websocket"],
});

export default function Simulation() {
  const [minglets, setMinglets] = useState<IMinglet[]>([]);
  const [trees, setTrees] = useState<ITree[]>([]);
  const [selectedMinglet, setSelectedMinglet] = useState<IMinglet | null>(null);

  // --- Wallet Hook ---
  const { wallet, connectWallet } = usePhantomWallet({
    onConnect: () => {
      console.log("🔑 Wallet connected, re-fetching trees...");
      fetchTrees();
    },
    onDisconnect: () => {
      console.log("🔒 Wallet disconnected, clearing data.");
      setMinglets([]);
      setTrees([]);
    },
  });

  // --- Fetch Trees ---
  const fetchTrees = async () => {
    try {
      console.log("🌱 Fetching trees...");
      const res = await fetch("/api/assets/getTrees");
      if (!res.ok) throw new Error("Failed to fetch trees");
      const data: ITree[] = await res.json();
      console.log("🌳 Trees fetched:", data);
      setTrees(data);
    } catch (err) {
      console.error("❌ Failed to fetch trees:", err);
    }
  };

  // --- Fetch Trees on Mount ---
  useEffect(() => {
    fetchTrees();
  }, []);

  // --- Listen for Minglet Updates from Socket ---
  useEffect(() => {
    socket.on("minglets_update", (data: IMinglet[]) => {
      console.log("🐒 Minglets update received:", data);
      setMinglets(data);
    });

    return () => {
      socket.off("minglets_update");
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <MingletWorld
        minglets={minglets}
        trees={trees}
        loading={false}
        onSelectMinglet={setSelectedMinglet}
      />

      <MingletOverlay
        wallet={wallet}
        connectWallet={connectWallet}
        minglets={minglets}
        loading={false}
        refreshMinglets={() => {
          console.log("🔄 Manual refresh triggered");
          fetchTrees();
        }}
      />

      <ProfileOverlay
        minglet={selectedMinglet}
        onClose={() => setSelectedMinglet(null)}
      />
    </div>
  );
}
