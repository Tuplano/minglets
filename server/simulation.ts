import { Server } from "socket.io";
import minglets from "@/models/minglets";
import mongoose from "mongoose";

let mingletsCache: any[] = [];

export async function loadMinglets() {
  mingletsCache = await minglets.find({});
}

export function startSimulation(io: Server) {
  setInterval(() => {
    const now = new Date();
    mingletsCache = mingletsCache.map(m => {
      const elapsed = (now.getTime() - m.lastUpdated.getTime()) / 1000;

      return {
        ...m.toObject(),
        stats: {
          hunger: Math.max(m.stats.hunger - elapsed * 0.1, 0),
          happiness: Math.max(m.stats.happiness - elapsed * 0.05, 0),
        },
        metadata: {
          ...m.metadata,
          age: m.metadata.age + elapsed / 60,
        },
        lastUpdated: now,
      };
    });

    io.emit("updateMinglets", mingletsCache);
  }, 1000); 

  setInterval(async () => {
    for (const m of mingletsCache) {
      await minglets.updateOne({ _id: m._id }, m);
    }
  }, 5000);
}
