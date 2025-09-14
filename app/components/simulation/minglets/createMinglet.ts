import { Application, AnimatedSprite } from "pixi.js";
import { loadMingletAnimations } from "./animation";
import {
  setMingletState,
  MingletSprite,
  randomDirection,
  distance,
  setDirection,
  decideDesire, // 🆕 Import the new function
} from "./state";
import { IMinglet } from "@/models/minglets";

export default async function createMinglet(
  app: Application,
  minglet: IMinglet,
  onSelect: (m: IMinglet) => void,
  mingletsRef?: MingletSprite[]
): Promise<MingletSprite> {
  const animations = await loadMingletAnimations();

  const sprite = new AnimatedSprite(animations.down) as MingletSprite;
  sprite.minglet = minglet;
  sprite.x = Math.random() * app.screen.width;
  sprite.y = Math.random() * app.screen.height;
  sprite.anchor.set(0.5);

  sprite.speed = 0.3 + Math.random() * 0.3;
  sprite.eventMode = "static";
  sprite.cursor = "pointer";
  sprite.on("pointertap", () => onSelect(minglet));

  const bubble = document.createElement("div");
  bubble.className =
    "absolute bg-white border border-gray-400 text-xs px-2 py-1 rounded shadow";
  bubble.style.display = "none";
  bubble.innerText = "";
  document.body.appendChild(bubble);
  sprite.bubble = bubble;

  if (!minglet.isAlive) {
    sprite.textures = animations.dead;
    sprite.loop = false;
    sprite.animationSpeed = 0;
    sprite.gotoAndStop(0);
    sprite.bubble.style.display = "none";
    return sprite;
  }

  // 🆕 Personality-based initial state
  sprite.desire = decideDesire(sprite);
  sprite.currentState = sprite.desire;
  setMingletState(sprite, animations);

  app.ticker.add(() => {
    if (bubble.style.display === "block") {
      const rect = app.canvas.getBoundingClientRect();
      bubble.style.left = rect.left + sprite.x + "px";
      bubble.style.top = rect.top + sprite.y - 30 + "px";
    }

    sprite.stateTimer--;

    if (sprite.stateTimer <= 0) {
      // 🆕 Decide again based on personality
      sprite.desire = decideDesire(sprite);
      setMingletState(sprite, animations, sprite.desire);
    }

    if (sprite.currentState === "wander" && sprite.desire !== "talk") {
      if (Math.random() < 0.01) sprite.direction = randomDirection();

      const speed = sprite.speed;

      if (sprite.direction === "right") {
        setDirection(sprite, animations, "right");
        sprite.x += speed;
        if (sprite.x > app.screen.width - 20) sprite.direction = randomDirection();
      } else if (sprite.direction === "left") {
        setDirection(sprite, animations, "left");
        sprite.x -= speed;
        if (sprite.x < 20) sprite.direction = randomDirection();
      } else if (sprite.direction === "up") {
        setDirection(sprite, animations, "up");
        sprite.y -= speed;
        if (sprite.y < 20) sprite.direction = randomDirection();
      } else if (sprite.direction === "down") {
        setDirection(sprite, animations, "down");
        sprite.y += speed;
        if (sprite.y > app.screen.height - 20) sprite.direction = randomDirection();
      }

      if (mingletsRef) {
        for (const other of mingletsRef) {
          if (other !== sprite) {
            const dist = distance(sprite, other);
            if (dist < 40) {
              sprite.x += ((sprite.x - other.x) / dist) * 1.5;
              sprite.y += ((sprite.y - other.y) / dist) * 1.5;
            }
          }
        }
      }

      sprite.animationSpeed = 0.15;
    } else if (sprite.currentState === "idle") {
      if (sprite.textures !== animations.idle) {
        sprite.textures = animations.idle;
        sprite.animationSpeed = 0.1;
        sprite.gotoAndPlay(0);
      }
    } else if (sprite.currentState === "talk") {
      if (sprite.textures !== animations.talk) {
        sprite.textures = animations.talk;
        sprite.animationSpeed = 0.1;
        sprite.gotoAndPlay(0);
      }
    }
  });

  return sprite;
}
