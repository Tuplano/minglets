import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { IMinglet } from "../models/minglets";
import MingletModel from "../models/minglets";

// Personality bias table
type PersonalityEffect = Partial<Record<IMinglet["currentState"], number>>;

export const personalityBias: Record<string, PersonalityEffect> = {
  // Base personality
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

  // Teen traits
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

  // Adult traits
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

const httpServer = createServer();
const io = new Server(httpServer, { cors: { origin: "*" } });

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

io.on("connection", async (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Send initial minglets
  const minglets = await MingletModel.find();
  socket.emit("minglets:init", minglets);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// 🚀 Movement + State + Stats Loop
setInterval(async () => {
  const minglets = await MingletModel.find();

  const updated = await Promise.all(
    minglets.map(async (m: IMinglet) => {
      // ⛔ Skip dead Minglets completely
      if (!m.isAlive) {
        return m;
      }

      // Decrease state timer
      m.stateTimer = Math.max(0, m.stateTimer - 1);

      if (m.stateTimer === 0) {
        // ⚡ Weighted state selection
        const baseStates: IMinglet["currentState"][] = [
          "wander",
          "idle",
          "talk",
          "eating",
          "playing",
        ];

        const stateWeights: Record<string, number> = {
          wander: 1,
          idle: 1,
          talk: 1,
          eating: 0,  // default disabled
          playing: 0, // default disabled
        };

        // 📌 Hunger influence → allow eating only if hunger < 40
        if (m.stats.hunger < 40) {
          stateWeights.eating = 2; // enable eating with bias
        }

        // 📌 Happiness influence → allow playing only if happiness < 40
        if (m.stats.happiness < 40) {
          stateWeights.playing = 2; // enable playing with bias
        }

        // 📌 Personality bias
        if (m.personality && Array.isArray(m.personality)) {
          m.personality.forEach((trait) => {
            const bias = personalityBias[trait];
            if (bias) {
              for (const [state, effect] of Object.entries(bias)) {
                stateWeights[state] = (stateWeights[state] || 0) + effect;
              }
            }
          });
        }

        // 📌 Weighted random selection
        const totalWeight = Object.values(stateWeights).reduce(
          (a, b) => a + Math.max(0, b),
          0
        );
        let rnd = Math.random() * totalWeight;
        let chosenState: IMinglet["currentState"] = "idle";

        for (const state of baseStates) {
          rnd -= Math.max(0, stateWeights[state]);
          if (rnd <= 0) {
            chosenState = state as IMinglet["currentState"];
            break;
          }
        }

        m.currentState = chosenState;
        m.stateTimer = Math.floor(Math.random() * 5) + 3; // 3–7 seconds
      }

      // 🥕 Eating → restore hunger
      if (m.currentState === "eating") {
        m.stats.hunger = Math.min(100, m.stats.hunger + 5);
      }

      // 🎮 Playing → restore happiness
      if (m.currentState === "playing") {
        m.stats.happiness = Math.min(100, m.stats.happiness + 5);
      }

      // 🚶 Movement only if wandering
      if (m.currentState === "wander") {
        if (Math.random() < 0.2) {
          const dirs: IMinglet["direction"][] = ["up", "down", "left", "right"];
          m.direction = dirs[Math.floor(Math.random() * dirs.length)];
        }

        switch (m.direction) {
          case "up":
            m.y = Math.max(0, m.y - 5);
            break;
          case "down":
            m.y = Math.min(600, m.y + 5);
            break;
          case "left":
            m.x = Math.max(0, m.x - 5);
            break;
          case "right":
            m.x = Math.min(800, m.x + 5);
            break;
        }
      }

      await m.save();
      return m;
    })
  );

  io.emit("minglets:update", updated);

  console.log(
    `🔄 Updated ${
      updated.length
    } minglets at ${new Date().toLocaleTimeString()}`
  );
}, 1000); // every 1 second

httpServer.listen(3001, () => {
  console.log("🚀 Socket server running on :3001");
});
