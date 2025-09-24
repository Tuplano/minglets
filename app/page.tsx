"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { IMinglet } from "@/models/minglets";
import { ITree } from "@/models/trees";
import MingletOverlay from "./components/mingletsOverlay";
import ProfileOverlay from "./components/mingletProfileOverlay";
import MingletWorld from "./components/simulation/mingletWorld";
import { usePhantomWallet } from "./hooks/usePhantomWallet";

// Connect socket using env var
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
  transports: ["websocket"],
});

export default function Simulation() {
  const [minglets, setMinglets] = useState<IMinglet[]>([]);
  const [trees, setTrees] = useState<ITree[]>([]);
  const [selectedMinglet, setSelectedMinglet] = useState<IMinglet | null>(null);

  const { wallet, connectWallet } = usePhantomWallet({
    onConnect: () => {
      fetchTrees();
    },
    onDisconnect: () => {
      setMinglets([]);
      setTrees([]);
    },
  });

  // --- Subscribe to socket updates ---
  useEffect(() => {
    socket.on("minglets_update", (data: IMinglet[]) => {
      setMinglets(data);
    });

    return () => {
      socket.off("minglets_update");
    };
  }, []);

  // --- Fetch Trees from API ---
  const fetchTrees = async () => {
    try {
      const res = await fetch("/api/assets/getTrees");
      if (!res.ok) throw new Error("Failed to fetch trees");
      const data: ITree[] = await res.json();
      setTrees(data);
    } catch (err) {
      console.error("❌ Failed to fetch trees:", err);
    }
  };

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
        refreshMinglets={() => {}}
      />

      <ProfileOverlay
        minglet={selectedMinglet}
        onClose={() => setSelectedMinglet(null)}
      />
    </div>
  );
}
