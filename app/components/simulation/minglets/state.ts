import { AnimatedSprite } from "pixi.js";
import { IMinglet } from "@/models/minglets";
import { MingletAnimations } from "./animation";

// --- Types ---
export type MingletState = "wander" | "idle" | "talk" | "eating" | "playing";
export type Direction = "up" | "down" | "left" | "right";

export interface MingletSprite extends AnimatedSprite {
  minglet: IMinglet;
  currentState: MingletState;
  stateTimer: number;
  direction: Direction;
  bubble: HTMLDivElement;
  desire: MingletState;
  speed: number;
}

// --- Utils ---
export function randomDirection(): Direction {
  const dirs: Direction[] = ["up", "down", "left", "right"];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

export function distance(a: MingletSprite, b: MingletSprite) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// --- Set State ---
export function setMingletState(
  sprite: MingletSprite,
  animations: MingletAnimations,
  newState?: MingletState
) {
  const target = newState || sprite.desire;
  sprite.currentState = target;

  switch (target) {
    case "wander":
      sprite.stateTimer = 600 + Math.floor(Math.random() * 600);
      sprite.direction = randomDirection();
      sprite.textures = animations[sprite.direction];
      sprite.animationSpeed = 0.25;
      sprite.play();
      sprite.bubble.style.display = "none";
      break;

    case "idle":
      sprite.stateTimer = 480 + Math.floor(Math.random() * 480);
      sprite.textures = animations.idle;
      sprite.animationSpeed = 0.15;
      sprite.play();
      sprite.bubble.style.display = "none";
      break;

    case "talk":
      sprite.stateTimer = 600 + Math.floor(Math.random() * 360);
      sprite.textures = animations.talk;
      sprite.animationSpeed = 0.35;
      sprite.gotoAndPlay(0);
      sprite.bubble.style.display = "block";
      sprite.bubble.innerText = "...";
      break;

    case "eating":
      sprite.stateTimer = 360 + Math.floor(Math.random() * 200);
      sprite.textures = animations.eat;
      sprite.animationSpeed = 0.2;
      sprite.play();
      sprite.bubble.style.display = "block";
      sprite.bubble.innerText = "🍎 Eating...";
      sprite.minglet.stats.hunger = Math.min(sprite.minglet.stats.hunger + 10, 100);
      break;
  }
}

export function setDirection(
  sprite: MingletSprite,
  animations: MingletAnimations,
  dir: Direction
) {
  if (sprite.direction !== dir || sprite.textures !== animations[dir]) {
    sprite.direction = dir;
    sprite.textures = animations[dir];
    sprite.play();
  }
}

// --- Personality Traits ---
export const teenTraits = [
  "adventurous",
  "rebellious",
  "social",
  "energetic",
  "moody",
  "dreamy",
  "competitive",
  "creative",
  "independent",
  "stubborn",
] as const;

export const adultTraits = [
  "responsible",
  "calm",
  "wise",
  "focused",
  "protective",
  "disciplined",
  "caring",
  "hardworking",
  "strategic",
  "practical",
] as const;

// --- Personality Bias Table ---
type PersonalityEffect = Partial<{
  wander: number;
  talk: number;
  idle: number;
}>;

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

// --- Decide Desire ---
export function decideDesire(sprite: MingletSprite): MingletState {
  const { hunger, happiness } = sprite.minglet.stats;

  if (hunger < 40 && Math.random() < 0.4) return "eating";
  if (happiness < 50 && Math.random() < 0.3) return "playing";

  let wanderChance = 0.3;
  let talkChance = 0.3;
  let idleChance = 0.4;

  const traits = sprite.minglet.personality || [];
  traits.forEach((trait) => {
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
