"use client";

import { useEffect, useRef } from "react";
import { Application, TilingSprite, Assets, Container } from "pixi.js";
import createMinglet from "./minglets/createMinglet";
import { IMinglet } from "@/models/minglets";

interface WorldProps {
  minglets: IMinglet[];
  loading: boolean;
  onSelectMinglet: (minglet: IMinglet) => void;
}

export default function MingletWorld({ minglets, loading, onSelectMinglet }: WorldProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const app = new Application();
    appRef.current = app;
    let mingletContainer: Container;

    app.init({ resizeTo: window, backgroundAlpha: 0 }).then(async () => {
      if (!canvasRef.current) return;
      canvasRef.current.appendChild(app.canvas);

      app.stage.removeChildren();

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

      mingletContainer = new Container();
      app.stage.addChild(mingletContainer);

      for (const m of minglets) {
        const sprite = await createMinglet(app, m, onSelectMinglet);
        mingletContainer.addChild(sprite);
      }
    });

    return () => {
      mingletContainer?.destroy({ children: true });
      app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, [minglets, loading, onSelectMinglet]);

  return <div ref={canvasRef} className="absolute inset-0" />;
}
