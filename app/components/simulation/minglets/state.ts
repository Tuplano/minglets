import { AnimatedSprite } from "pixi.js";
import { IMinglet } from "@/models/minglets";
import { MingletAnimations } from "./animation";

// --- Types ---
export type MingletState = "wander" | "idle" | "talk";
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
      sprite.stateTimer = 80 + Math.floor(Math.random() * 160);
      sprite.direction = randomDirection();
      sprite.textures = animations[sprite.direction];
      sprite.animationSpeed = 0.25;
      sprite.play();
      sprite.bubble.style.display = "none";
      break;

    case "idle":
      sprite.stateTimer = 20 + Math.floor(Math.random() * 40);
      sprite.textures = animations.idle;
      sprite.animationSpeed = 0.15;
      sprite.play();
      sprite.bubble.style.display = "none";
      break;

    case "talk":
      sprite.stateTimer = 60 + Math.floor(Math.random() * 60);
      sprite.textures = animations.talk;
      sprite.animationSpeed = 0.35;
      sprite.gotoAndPlay(0);
      sprite.bubble.style.display = "block";
      sprite.bubble.innerText = "...";
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

// --- Personality Bias Table ---
type PersonalityEffect = Partial<{
  wander: number;
  talk: number;
  idle: number;
}>;

export const personalityBias: Record<string, PersonalityEffect> = {
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
};

// --- Decide Next Desire Based on Personality ---
export function decideDesire(sprite: MingletSprite): MingletState {
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

  // normalize so probabilities sum to 1
  const total = wanderChance + talkChance + idleChance;
  wanderChance /= total;
  talkChance /= total;
  idleChance /= total;

  const r = Math.random();
  if (r < wanderChance) return "wander";
  if (r < wanderChance + talkChance) return "talk";
  return "idle";
}
