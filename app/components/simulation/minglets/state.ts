import { AnimatedSprite, Texture } from "pixi.js";
import { MingletAnimations } from "./animation";
import { IMinglet } from "@/models/minglets";

export interface MingletSprite extends AnimatedSprite {
  minglet: IMinglet;
  bubble?: HTMLDivElement;
}

export function setMingletState(
  sprite: MingletSprite,
  animations: MingletAnimations,
  state: IMinglet["currentState"]
) {
  switch (state) {
    case "idle":
      sprite.textures = animations.idle;
      sprite.loop = true;
      break;
    case "wander":
      // choose direction frames
      if (sprite.minglet.direction === "up") sprite.textures = animations.up;
      else if (sprite.minglet.direction === "down") sprite.textures = animations.down;
      else if (sprite.minglet.direction === "left") sprite.textures = animations.left;
      else sprite.textures = animations.right;
      sprite.loop = true;
      break;
    case "talk":
      sprite.textures = animations.talk;
      sprite.loop = true;
      break;
    case "eating":
      sprite.textures = animations.eat;
      sprite.loop = true;
      break;
    case "playing":
      // (optional: reuse idle or add separate spritesheet later)
      sprite.textures = animations.idle;
      sprite.loop = true;
      break;

  }

  sprite.animationSpeed = 0.1;
  sprite.play();
}
