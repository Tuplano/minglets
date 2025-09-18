// animation.ts
import { Assets, Texture, Rectangle } from "pixi.js";

export interface MingletAnimations {
  up: Texture[];
  down: Texture[];
  left: Texture[];
  right: Texture[];
  idle: Texture[];
  talk: Texture[];
  eat: Texture[];
  dead: Texture[];
  stateTimer: number;
}

export async function loadMingletAnimations(): Promise<MingletAnimations> {
  const upSheet = await Assets.load("/textures/minglet-up.png");
  const downSheet = await Assets.load("/textures/minglet-down.png");
  const leftSheet = await Assets.load("/textures/minglet-left.png");
  const rightSheet = await Assets.load("/textures/minglet-right.png");
  const idleSheet = await Assets.load("/textures/minglet-idle.png");
  const talkSheet = await Assets.load("/textures/minglet-talk.png");
  const eatingsheet = await Assets.load("/textures/minglet-eating.png");
  const deadSheet = await Assets.load("/textures/minglet-dead.png");

  function sliceRow(sheet: any, frameCount: number): Texture[] {
    const frameWidth = sheet.width / frameCount;
    const frameHeight = sheet.height;
    const frames: Texture[] = [];
    for (let i = 0; i < frameCount; i++) {
      frames.push(
        new Texture({
          source: sheet,
          frame: new Rectangle(i * frameWidth, 0, frameWidth, frameHeight),
        })
      );
    }
    return frames;
  }

  return {
    up: sliceRow(upSheet, 3),
    down: sliceRow(downSheet, 3),
    left: sliceRow(leftSheet, 3),
    right: sliceRow(rightSheet, 3),
    idle: sliceRow(idleSheet, 2),
    talk: sliceRow(talkSheet, 2),
    eat: sliceRow(eatingsheet, 2),
    dead: sliceRow(deadSheet, 1),
  };
}
