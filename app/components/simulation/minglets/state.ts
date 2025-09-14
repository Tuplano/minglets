// state.ts
import { AnimatedSprite } from "pixi.js";
import { IMinglet } from "@/models/minglets";
import { MingletAnimations } from "./animation";

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
