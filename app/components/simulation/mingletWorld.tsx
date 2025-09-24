"use client";

import { useEffect, useRef, useState } from "react";
import {
  Application,
  TilingSprite,
  Assets,
  Container,
  Sprite,
  Graphics,
} from "pixi.js";
import { IMinglet } from "@/models/minglets";
import { ITree } from "@/models/trees";

interface WorldProps {
  minglets: IMinglet[];
  trees?: ITree[];
  loading: boolean;
  onSelectMinglet: (minglet: IMinglet) => void;
}

interface MingletSprite extends Graphics {
  targetX: number;
  targetY: number;
}

export default function MingletWorld({
  minglets,
  trees = [],
  loading,
  onSelectMinglet,
}: WorldProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const mingletContainerRef = useRef<Container | null>(null);
  const treeContainerRef = useRef<Container | null>(null);

  const [pixiReady, setPixiReady] = useState(false);
  const [treeTextures, setTreeTextures] = useState<Record<number, any>>({});
  const mingletSpritesRef = useRef<Record<string, MingletSprite>>({});
  const tickerCallbackRef = useRef<() => void>();

  // --- Init PIXI ---
  useEffect(() => {
    if (!canvasRef.current || loading || appRef.current) return;

    const app = new Application();
    appRef.current = app;

    app.init({ resizeTo: window, backgroundAlpha: 0 }).then(async () => {
      if (!canvasRef.current) return;

      canvasRef.current.appendChild(app.canvas);

      // Background grass texture
      const texture = await Assets.load("/textures/grass.png");
      const tiling = new TilingSprite({
        texture,
        width: app.screen.width,
        height: app.screen.height,
      });
      tiling.tileScale.set(0.25, 0.25);
      app.stage.addChild(tiling);

      app.renderer.on("resize", (width, height) => {
        tiling.width = width;
        tiling.height = height;
      });

      // Tree & minglet containers
      treeContainerRef.current = new Container();
      app.stage.addChild(treeContainerRef.current);

      mingletContainerRef.current = new Container();
      app.stage.addChild(mingletContainerRef.current);

      // Load tree textures once
      const loadedTextures: Record<number, any> = {};
      loadedTextures[1] = await Assets.load("/textures/tree1.png");
      loadedTextures[2] = await Assets.load("/textures/tree2.png");
      loadedTextures[3] = await Assets.load("/textures/tree3.png");
      loadedTextures[4] = await Assets.load("/textures/tree4.png");

      console.log("✅ Tree textures loaded:", loadedTextures);
      setTreeTextures(loadedTextures);

      setPixiReady(true);
    });

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, [loading]);

  // --- Render Trees ---
  useEffect(() => {
    if (!pixiReady || !treeContainerRef.current) return;
    if (Object.keys(treeTextures).length === 0) {
      console.log("⏳ Waiting for tree textures...");
      return;
    }

    treeContainerRef.current.removeChildren();

    console.log("🌳 Rendering trees:", trees);
    for (const t of trees) {
      const texture = treeTextures[t.type];
      if (!texture) {
        console.warn("🚨 No texture found for tree type:", t.type);
        continue;
      }

      const sprite = new Sprite(texture);
      sprite.x = t.x;
      sprite.y = t.y;
      sprite.anchor.set(0.5);
      sprite.scale.set(1);

      treeContainerRef.current.addChild(sprite);
    }
  }, [trees, pixiReady, treeTextures]);

  // --- Manage Minglet Sprites ---
  useEffect(() => {
    if (!pixiReady || !mingletContainerRef.current) return;

    const container = mingletContainerRef.current;
    const sprites = mingletSpritesRef.current;

    // Remove sprites for minglets that no longer exist
    Object.keys(sprites).forEach((id) => {
      if (!minglets.find((m) => m._id === id)) {
        container.removeChild(sprites[id]);
        delete sprites[id];
      }
    });

    // Add or update sprites
    minglets.forEach((m) => {
      let sprite = sprites[m._id];

      if (!sprite) {
        // Create new graphics circle
        sprite = new Graphics() as MingletSprite;
        sprite.beginFill(0xff0000);
        sprite.drawCircle(0, 0, 20);
        sprite.endFill();

        sprite.x = m.x;
        sprite.y = m.y;
        sprite.targetX = m.x;
        sprite.targetY = m.y;

        sprite.interactive = true;
        sprite.cursor = "pointer";
        sprite.on("pointertap", () => onSelectMinglet(m));

        container.addChild(sprite);
        sprites[m._id] = sprite;
      } else {
        sprite.targetX = m.x;
        sprite.targetY = m.y;
      }
    });
  }, [minglets, pixiReady, onSelectMinglet]);

  // --- Ticker (runs once) ---
  useEffect(() => {
    if (!pixiReady || !appRef.current) return;

    const sprites = mingletSpritesRef.current;
    const ticker = appRef.current.ticker;

    const cb = () => {
      Object.values(sprites).forEach((sprite) => {
        sprite.x += (sprite.targetX - sprite.x) * 0.1;
        sprite.y += (sprite.targetY - sprite.y) * 0.1;
      });
    };

    ticker.add(cb);
    tickerCallbackRef.current = cb;

    return () => {
      if (tickerCallbackRef.current) {
        ticker.remove(tickerCallbackRef.current);
      }
    };
  }, [pixiReady]);

  return <div ref={canvasRef} className="absolute inset-0" />;
}
