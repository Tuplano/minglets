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

  // --- Init PIXI ---
  useEffect(() => {
    if (!canvasRef.current || loading || appRef.current) return;

    const app = new Application();
    appRef.current = app;

    app.init({ resizeTo: window, backgroundAlpha: 0 }).then(async () => {
      if (!canvasRef.current) return;

      canvasRef.current.appendChild(app.canvas);

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

      treeContainerRef.current = new Container();
      app.stage.addChild(treeContainerRef.current);

      mingletContainerRef.current = new Container();
      app.stage.addChild(mingletContainerRef.current);

      const loadedTextures: Record<number, any> = {};
      loadedTextures[1] = await Assets.load("/textures/tree1.png");
      loadedTextures[2] = await Assets.load("/textures/tree2.png");
      loadedTextures[3] = await Assets.load("/textures/tree3.png");
      loadedTextures[4] = await Assets.load("/textures/tree4.png");

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
    treeContainerRef.current.removeChildren();

    for (const t of trees) {
      const texture = treeTextures[t.type as number];
      if (!texture) continue;

      const sprite = new Sprite(texture);
      sprite.x = t.x;
      sprite.y = t.y;
      sprite.anchor.set(0.5, 1);
      sprite.scale.set(0.5);
      treeContainerRef.current.addChild(sprite);
    }
  }, [trees, pixiReady, treeTextures]);

  // --- Render Minglets ---
useEffect(() => {
  if (!pixiReady || !mingletContainerRef.current) return;

  mingletContainerRef.current.removeChildren();

  minglets.forEach((m) => {
    const circle = new Graphics();
    circle.beginFill(0xff0000); // red
    circle.drawCircle(0, 0, 20); // radius 20
    circle.endFill();

    circle.x = m.x;
    circle.y = m.y;

    circle.interactive = true;
    circle.cursor = "pointer";
    circle.on("pointertap", () => onSelectMinglet(m));

    mingletContainerRef.current?.addChild(circle);
  });
}, [minglets, pixiReady, onSelectMinglet]);



  return <div ref={canvasRef} className="absolute inset-0" />;
}
