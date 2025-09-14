import { IMinglet } from "@/models/minglets";
import { AnimatedSprite } from "pixi.js";

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

export function randomDirection(): Direction {
  const dirs: Direction[] = ["up", "down", "left", "right"];
  return dirs[Math.floor(Math.random() * dirs.length)];
}

export function distance(a: MingletSprite, b: MingletSprite) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
