import { Application, AnimatedSprite } from "pixi.js";
import { loadMingletAnimations } from "./animation";
import { setMingletState, MingletSprite } from "./state";
import { IMinglet } from "@/models/minglets";

export default async function createMinglet(
  app: Application,
  minglet: IMinglet,
  onSelect: (m: IMinglet) => void
): Promise<MingletSprite> {
  const animations = await loadMingletAnimations();

  // Default sprite (alive state)
  const sprite = new AnimatedSprite(animations.down) as MingletSprite;
  sprite.minglet = minglet;
  sprite.x = minglet.x;
  sprite.y = minglet.y;
  sprite.anchor.set(0.5);

  sprite.animationSpeed = 0.1;
  sprite.play();

  // Interaction
  sprite.eventMode = "static";
  sprite.cursor = "pointer";
  sprite.on("pointertap", () => onSelect(minglet));

  // Speech bubble
  const bubble = document.createElement("div");
  bubble.className =
    "absolute bg-white border border-gray-400 text-xs px-2 py-1 rounded shadow transition-opacity duration-300";
  bubble.style.display = "none";
  document.body.appendChild(bubble);
  sprite.bubble = bubble;

  // Track last applied state (init correctly)
  let lastState = minglet.isAlive ? minglet.currentState : "dead";

  // Initial state
  if (!minglet.isAlive) {
    sprite.textures = animations.dead;
    sprite.loop = false;
    sprite.gotoAndStop(0);
  } else {
    setMingletState(sprite, animations, minglet.currentState as any);
  }

  // Keep synced
  app.ticker.add(() => {
    const global = app.stage.toGlobal(sprite.position);

    bubble.style.left = `${
      app.canvas.getBoundingClientRect().left + global.x
    }px`;
    bubble.style.top = `${
      app.canvas.getBoundingClientRect().top + global.y - 30
    }px`;

    if (!sprite.minglet.isAlive) {
      if (lastState !== "dead") {
        sprite.textures = animations.dead;
        sprite.loop = false;
        sprite.gotoAndStop(0);
        lastState = "dead";
      }
      bubble.style.display = "none"; // hide if dead
    } else if (sprite.minglet.currentState !== lastState) {
      // only update animation when state changes
      setMingletState(sprite, animations, sprite.minglet.currentState as any);
      lastState = sprite.minglet.currentState;
    }

    // 🟢 Bubble text depending on state
    if (sprite.minglet.isAlive) {
      if (sprite.minglet.currentState === "talk") {
        bubble.innerText = "💬 Hello!";
        bubble.style.display = "block";
      } else if (sprite.minglet.currentState === "eating") {
        bubble.innerText = "🍖 Nom nom...";
        bubble.style.display = "block";
      } else {
        bubble.style.display = "none";
      }
    }
  });

  // Clean up DOM bubble when sprite is destroyed
  sprite.on("destroyed", () => {
    bubble.remove();
  });

  return sprite;
}
