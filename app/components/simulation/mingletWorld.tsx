"use client";

import { useEffect, useRef } from "react";
import { Application, TilingSprite, Assets, Container, Graphics, Text } from "pixi.js";
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
  const containerRef = useRef<Container | null>(null);

  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const app = new Application();
    appRef.current = app;

    app.init({ resizeTo: window, backgroundAlpha: 0 }).then(async () => {
      if (!canvasRef.current) return;
      canvasRef.current.appendChild(app.canvas);

      // background
      const texture = await Assets.load("/textures/grass.png");
      const tiling = new TilingSprite({
        texture,
        width: app.screen.width,
        height: app.screen.height,
      });
      tiling.tileScale.set(0.25, 0.25);
      app.stage.addChild(tiling);

      const container = new Container();
      containerRef.current = container;
      app.stage.addChild(container);

      // initial render
      for (const m of minglets) {
        const sprite = await createMinglet(app, m, onSelectMinglet);


        container.addChild(sprite);
      }
    });

    return () => {
      containerRef.current?.destroy({ children: true });
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
    };
  }, [loading]);

  // Update sprites when minglets change
  useEffect(() => {
    if (!containerRef.current) return;

    for (const child of containerRef.current.children) {
      const sprite: any = child;
      const updated = minglets.find((m) => m._id === sprite.minglet._id);
      if (!updated) continue;

      // sync base data
      sprite.minglet = updated;
      sprite.x = updated.x;
      sprite.y = updated.y;

      // 🔄 update animation/state
      if (sprite.setState) {
        sprite.setState(updated.currentState); // assumes createMinglet handles animation
      }

      // 🔄 update hunger bar
      if (sprite.hungerBar) {
        sprite.hungerBar.clear();
        sprite.hungerBar.beginFill(0xff0000);
        sprite.hungerBar.drawRect(-20, 0, (updated.stats.hunger / 100) * 40, 4);
        sprite.hungerBar.endFill();
      }

      // 🔄 update happiness bar
      if (sprite.happinessBar) {
        sprite.happinessBar.clear();
        sprite.happinessBar.beginFill(0x00ff00);
        sprite.happinessBar.drawRect(-20, 0, (updated.stats.happiness / 100) * 40, 4);
        sprite.happinessBar.endFill();
      }
    }
  }, [minglets]);

  return <div ref={canvasRef} className="absolute inset-0" />;
}
