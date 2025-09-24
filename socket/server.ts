// socket/server.ts
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import Minglet from "../models/minglets";

// --- Setup ---
const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// --- Types ---
type MingletState = "wander" | "idle" | "talk" | "eating" | "playing";
type Direction = "up" | "down" | "left" | "right";

// --- Direction helper ---
function getDirection(dx: number, dy: number): Direction {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

// --- Personality bias table ---
const personalityBias: Record<
  string,
  Partial<{ wander: number; talk: number; idle: number }>
> = {
  curious: { wander: +0.3, idle: -0.1 },
  playful: { wander: +0.2, talk: +0.1 },
  shy: { talk: -0.2, idle: +0.2 },
  cheerful: { talk: +0.3 },
  sleepy: { idle: +0.4, wander: -0.3 },
  clumsy: { wander: +0.1 },
  clingy: { talk: +0.15 },
  hungry: { wander: +0.2 },
  noisy: { talk: +0.25 },
  gentle: { idle: +0.1 },
  adventurous: { wander: +0.4 },
  rebellious: { wander: +0.3, talk: -0.1 },
  social: { talk: +0.4 },
  energetic: { wander: +0.3, idle: -0.2 },
  moody: { idle: +0.2, talk: -0.2 },
  dreamy: { idle: +0.3 },
  competitive: { wander: +0.2 },
  creative: { talk: +0.1, idle: +0.1 },
  independent: { wander: +0.25 },
  stubborn: { idle: +0.2 },
  responsible: { idle: +0.2 },
  calm: { idle: +0.3 },
  wise: { talk: +0.1, idle: +0.2 },
  focused: { idle: +0.3, wander: -0.1 },
  protective: { talk: +0.15 },
  disciplined: { idle: +0.4, wander: -0.2 },
  caring: { talk: +0.2 },
  hardworking: { wander: +0.2 },
  strategic: { idle: +0.3 },
  practical: { idle: +0.2 },
};

// --- Decide next state ---
function decideDesire(m: any): MingletState {
  const { hunger, happiness } = m.stats;

  if (hunger < 40 && Math.random() < 0.4) return "eating";
  if (happiness < 50 && Math.random() < 0.3) return "playing";

  let wanderChance = 0.3;
  let talkChance = 0.3;
  let idleChance = 0.4;

  const traits = m.personality || [];
  traits.forEach((trait: string) => {
    const bias = personalityBias[trait];
    if (bias) {
      wanderChance += bias.wander ?? 0;
      talkChance += bias.talk ?? 0;
      idleChance += bias.idle ?? 0;
    }
  });

  const total = wanderChance + talkChance + idleChance;
  wanderChance /= total;
  talkChance /= total;
  idleChance /= total;

  const r = Math.random();
  if (r < wanderChance) return "wander";
  if (r < wanderChance + talkChance) return "talk";
  return "idle";
}

// --- Keep track of last state and duration in memory ---
const lastStateMap = new Map<
  string,
  { state: string; changedAt: number; duration: number }
>();
const MIN_DURATION = 2000; // 2 seconds
const MAX_DURATION = 5000; // 5 seconds

// --- Simulation loop ---
setInterval(async () => {
  const minglets = await Minglet.find();
  const now = Date.now();

  for (const m of minglets) {
    if (!m.isAlive) continue;

    const prev = lastStateMap.get(m._id.toString());
    let prevState = prev?.state || m.state;
    let prevTime = prev?.changedAt || 0;
    let duration =
      prev?.duration ||
      Math.floor(Math.random() * (MAX_DURATION - MIN_DURATION)) + MIN_DURATION;

    // Only pick new state if duration has passed
    let newState = prevState;
    if (now - prevTime >= duration) {
      newState = decideDesire(m);
      duration =
        Math.floor(Math.random() * (MAX_DURATION - MIN_DURATION)) +
        MIN_DURATION; // new random duration
      prevTime = now;

      console.log(
        `🐾 Minglet ${
          m._id
        } changed from "${prevState}" to "${newState}" after ${(
          (now - (prev?.changedAt || 0)) /
          1000
        ).toFixed(2)}s`
      );
    }

    lastStateMap.set(m._id.toString(), {
      state: newState,
      changedAt: prevTime,
      duration,
    });

    // Update minglet in memory
    m.state = newState;

    if (m.state === "wander") {
      const step = Math.floor(Math.random() * 10) + 5;

      const dirs: Direction[] = ["up", "down", "left", "right"];
      const dir = dirs[Math.floor(Math.random() * dirs.length)];

      let dx = 0;
      let dy = 0;
      if (dir === "up") dy = -step;
      if (dir === "down") dy = step;
      if (dir === "left") dx = -step;
      if (dir === "right") dx = step;

      m.x = Math.max(20, Math.min(1280 - 20, m.x + dx));
      m.y = Math.max(20, Math.min(720 - 20, m.y + dy));
      m.direction = dir;
    }

    if (m.state === "eating") {
      m.stats.hunger = Math.min(m.stats.hunger + 1, 100);
    }

    if (m.state === "playing") {
      m.stats.happiness = Math.min(m.stats.happiness + 1, 100);
    }

    m.lastUpdated = new Date();
  }

  io.emit("minglets_update", minglets);
}, 1000); // run every 1 second

// --- Socket ---
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on("disconnect", () =>
    console.log("❌ Client disconnected:", socket.id)
  );
});

httpServer.listen(4000, () => {
  console.log("✅ Socket server running at http://localhost:4000");
});
