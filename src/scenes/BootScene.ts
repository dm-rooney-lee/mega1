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

    // New content (feature/MEGA-map).
    this.makeRectTexture(TEX.MOVING, 32, 32, COLORS.MOVING, 0x4d8fe0);
    // Fake floor deliberately resembles a normal platform — spotting it is a reward.
    this.makeRectTexture(TEX.FAKE, 32, 32, COLORS.FAKE, 0x87693f);
    this.makeSpringTexture();
    this.makeConveyorTexture();
    this.makePendulumHeadTexture();
    this.makeThwompTexture();
    this.makeProjectileTexture();
    this.makeShooterTexture();
    this.makeTurretTexture();

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

  /** Jump pad: a springy base with a bright top plate. */
  private makeSpringTexture(): void {
    const w = 32;
    const h = 20;
    const g = this.add.graphics();
    g.fillStyle(0x1a4d2e, 1);
    // A couple of coil zig-zags for a springy read.
    for (let i = 0; i < 3; i++) {
      g.fillRect(4 + i * 9, 6, 4, h - 6);
    }
    g.fillStyle(COLORS.SPRING, 1);
    g.fillRect(0, 0, w, 7); // top plate
    g.generateTexture(TEX.SPRING, w, h);
    g.destroy();
  }

  /** Conveyor: dark belt with chevrons hinting at the push direction (drawn →). */
  private makeConveyorTexture(): void {
    const w = 64;
    const h = 24;
    const g = this.add.graphics();
    g.fillStyle(COLORS.CONVEYOR, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(COLORS.CONVEYOR_ARROW, 1);
    for (let x = 4; x < w; x += 20) {
      g.fillTriangle(x, 6, x, 18, x + 10, 12); // right-pointing chevron
    }
    g.generateTexture(TEX.CONVEYOR, w, h);
    g.destroy();
  }

  /** Pendulum head: a spiked ball. */
  private makePendulumHeadTexture(): void {
    const s = 40;
    const c = s / 2;
    const g = this.add.graphics();
    g.fillStyle(COLORS.PENDULUM_HEAD, 1);
    // Spikes radiating out.
    const spikes = 8;
    const rInner = 12;
    const rOuter = 19;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      const a1 = a - 0.22;
      const a2 = a + 0.22;
      g.fillTriangle(
        c + Math.cos(a1) * rInner,
        c + Math.sin(a1) * rInner,
        c + Math.cos(a2) * rInner,
        c + Math.sin(a2) * rInner,
        c + Math.cos(a) * rOuter,
        c + Math.sin(a) * rOuter,
      );
    }
    g.fillCircle(c, c, rInner);
    g.fillStyle(0x8a5a00, 1);
    g.fillCircle(c, c, 5); // dark core
    g.generateTexture(TEX.PENDULUM_HEAD, s, s);
    g.destroy();
  }

  /** Thwomp: a chunky block with an angry face on the bottom. */
  private makeThwompTexture(): void {
    const w = 60;
    const h = 60;
    const g = this.add.graphics();
    g.fillStyle(COLORS.THWOMP, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x5a1a3c, 1);
    g.fillRect(0, 0, w, 6); // rim
    g.fillStyle(COLORS.THWOMP_FACE, 1);
    g.fillRect(14, 22, 8, 10); // left eye
    g.fillRect(38, 22, 8, 10); // right eye
    g.fillRect(18, 44, 24, 5); // gritted mouth
    g.generateTexture(TEX.THWOMP, w, h);
    g.destroy();
  }

  /** Projectile: a small dart pointing right (flipped when fired left). */
  private makeProjectileTexture(): void {
    const w = 22;
    const h = 10;
    const g = this.add.graphics();
    g.fillStyle(COLORS.PROJECTILE, 1);
    g.fillRect(0, h / 2 - 2, w - 8, 4); // shaft
    g.fillTriangle(w - 10, 0, w - 10, h, w, h / 2); // head
    g.generateTexture(TEX.PROJECTILE, w, h);
    g.destroy();
  }

  /** Wall-mounted arrow launcher. */
  private makeShooterTexture(): void {
    const w = 26;
    const h = 34;
    const g = this.add.graphics();
    g.fillStyle(COLORS.SHOOTER, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x1a0d16, 1);
    g.fillRect(w - 10, h / 2 - 5, 10, 10); // muzzle
    g.generateTexture(TEX.SHOOTER, w, h);
    g.destroy();
  }

  /** Turret: a squat body with a barrel; stompable from above. */
  private makeTurretTexture(): void {
    const w = 34;
    const h = 30;
    const g = this.add.graphics();
    g.fillStyle(COLORS.TURRET, 1);
    g.fillRoundedRect(0, 6, w, h - 6, 4);
    g.fillStyle(0x6b2f1e, 1);
    g.fillRect(w / 2 - 4, 0, 8, 12); // barrel
    g.fillStyle(0xffec27, 1);
    g.fillCircle(w / 2, 18, 3); // eye
    g.generateTexture(TEX.TURRET, w, h);
    g.destroy();
  }
}
