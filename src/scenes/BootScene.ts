import Phaser from "phaser";
import { COLORS, TEX } from "../config";

/**
 * Generates all placeholder textures procedurally (no image files needed), then
 * hands off to the menu. In Milestone 4 this is where you'd `this.load.image(...)`
 * real Kenney sprites instead — the rest of the game references textures by the
 * TEX.* keys, so swapping art is a localized change.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    this.makePlayerTexture();
    this.makeRectTexture(TEX.PLATFORM, 32, 32, COLORS.PLATFORM, COLORS.PLATFORM_TOP);
    this.makeRectTexture(TEX.ENEMY, 32, 28, COLORS.ENEMY);
    this.makeSpikeTexture();
    this.makeGoalTexture();

    this.scene.start("MenuScene");
  }

  /** A flat-colored rectangle, optionally with a lighter top edge for depth. */
  private makeRectTexture(
    key: string,
    w: number,
    h: number,
    color: number,
    topColor?: number,
  ): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    if (topColor !== undefined) {
      g.fillStyle(topColor, 1);
      g.fillRect(0, 0, w, 6);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  /** Player: a rounded body with two little "eyes" so facing is readable. */
  private makePlayerTexture(): void {
    const w = 28;
    const h = 40;
    const g = this.add.graphics();
    g.fillStyle(COLORS.PLAYER, 1);
    g.fillRoundedRect(0, 0, w, h, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 13, 3);
    g.fillCircle(19, 13, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(10, 13, 1.5);
    g.fillCircle(20, 13, 1.5);
    g.generateTexture(TEX.PLAYER, w, h);
    g.destroy();
  }

  /** A row-friendly triangular spike tile (32x32). */
  private makeSpikeTexture(): void {
    const s = 32;
    const g = this.add.graphics();
    g.fillStyle(COLORS.SPIKE, 1);
    // Three teeth across the tile.
    for (let i = 0; i < 3; i++) {
      const base = (i * s) / 3;
      const step = s / 3;
      g.fillTriangle(base, s, base + step / 2, 0, base + step, s);
    }
    g.generateTexture(TEX.SPIKE, s, s);
    g.destroy();
  }

  /** Goal: a flag on a pole. */
  private makeGoalTexture(): void {
    const w = 40;
    const h = 64;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(4, 0, 4, h); // pole
    g.fillStyle(COLORS.GOAL, 1);
    g.fillTriangle(8, 4, 8, 30, 36, 17); // flag
    g.generateTexture(TEX.GOAL, w, h);
    g.destroy();
  }
}
