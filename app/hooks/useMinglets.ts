"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { IMinglet } from "@/models/minglets";

let socket: Socket | null = null;

export function useMinglets() {
  const [minglets, setMinglets] = useState<IMinglet[]>([]);

  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:3001");
    }

    socket.on("worldState", (world: IMinglet[]) => {
      setMinglets(world);
    });

    return () => {
      socket?.off("worldState");
    };
  }, []);

  return minglets;
}
