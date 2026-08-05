import Phaser from "phaser";
import { COLORS, TEX } from "../config";
import { TEXTURE_SCALE } from "../display";

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

    // Cannon + shield (ported from the level2 branch).
    this.makeRectTexture(TEX.CANNON, 40, 30, COLORS.CANNON, 0xffffff);
    this.makeCannonballTexture();
    this.makeShieldTexture();

    // Gear hazard (level7).
    this.makeGearTexture();

    // Dev-only: `?level=N` (1-indexed, matching the in-game "STAGE N" label)
    // skips the menu and jumps straight into that level. Stripped from
    // production builds along with every other `import.meta.env.DEV` branch.
    if (import.meta.env.DEV) {
      const level = this.devLevelFromQuery();
      if (level !== null) {
        this.scene.start("GameScene", { level });
        return;
      }
    }

    this.scene.start("MenuScene");
  }

  private devLevelFromQuery(): number | null {
    const raw = new URLSearchParams(window.location.search).get("level");
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 1 ? n - 1 : null;
  }

  /**
   * Graphics pre-scaled so every drawing command below stays in logical units
   * while the pixels it lays down are `TEXTURE_SCALE` times denser. Pair with
   * `endTexture`, which bakes it at the matching size.
   */
  private beginTexture(): Phaser.GameObjects.Graphics {
    const g = this.add.graphics();
    g.scaleCanvas(TEXTURE_SCALE, TEXTURE_SCALE);
    return g;
  }

  /**
   * Bakes the drawing into a texture that many times larger than its logical size.
   * Sprites shrink back down to match — see `src/objects/hitbox.ts` for what that
   * means for their bodies.
   */
  private endTexture(
    g: Phaser.GameObjects.Graphics,
    key: string,
    width: number,
    height: number,
  ): void {
    g.generateTexture(key, width * TEXTURE_SCALE, height * TEXTURE_SCALE);
    g.destroy();
  }

  /** A flat-colored rectangle, optionally with a lighter top edge for depth. */
  private makeRectTexture(
    key: string,
    w: number,
    h: number,
    color: number,
    topColor?: number,
  ): void {
    const g = this.beginTexture();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    if (topColor !== undefined) {
      g.fillStyle(topColor, 1);
      g.fillRect(0, 0, w, 6);
    }
    this.endTexture(g, key, w, h);
  }

  /** Player: a rounded body with two little "eyes" so facing is readable. */
  private makePlayerTexture(): void {
    const w = 28;
    const h = 40;
    const g = this.beginTexture();
    g.fillStyle(COLORS.PLAYER, 1);
    g.fillRoundedRect(0, 0, w, h, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 13, 3);
    g.fillCircle(19, 13, 3);
    g.fillStyle(0x000000, 1);
    g.fillCircle(10, 13, 1.5);
    g.fillCircle(20, 13, 1.5);
    this.endTexture(g, TEX.PLAYER, w, h);
  }

  /** A row-friendly triangular spike tile (32x32). */
  private makeSpikeTexture(): void {
    const s = 32;
    const g = this.beginTexture();
    g.fillStyle(COLORS.SPIKE, 1);
    // Three teeth across the tile.
    for (let i = 0; i < 3; i++) {
      const base = (i * s) / 3;
      const step = s / 3;
      g.fillTriangle(base, s, base + step / 2, 0, base + step, s);
    }
    this.endTexture(g, TEX.SPIKE, s, s);
  }

  /** Goal: a flag on a pole. */
  private makeGoalTexture(): void {
    const w = 40;
    const h = 64;
    const g = this.beginTexture();
    g.fillStyle(0xffffff, 1);
    g.fillRect(4, 0, 4, h); // pole
    g.fillStyle(COLORS.GOAL, 1);
    g.fillTriangle(8, 4, 8, 30, 36, 17); // flag
    this.endTexture(g, TEX.GOAL, w, h);
  }

  /** Jump pad: a springy base with a bright top plate. */
  private makeSpringTexture(): void {
    const w = 32;
    const h = 20;
    const g = this.beginTexture();
    g.fillStyle(0x1a4d2e, 1);
    // A couple of coil zig-zags for a springy read.
    for (let i = 0; i < 3; i++) {
      g.fillRect(4 + i * 9, 6, 4, h - 6);
    }
    g.fillStyle(COLORS.SPRING, 1);
    g.fillRect(0, 0, w, 7); // top plate
    this.endTexture(g, TEX.SPRING, w, h);
  }

  /** Conveyor: dark belt with chevrons hinting at the push direction (drawn →). */
  private makeConveyorTexture(): void {
    const w = 64;
    const h = 24;
    const g = this.beginTexture();
    g.fillStyle(COLORS.CONVEYOR, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(COLORS.CONVEYOR_ARROW, 1);
    for (let x = 4; x < w; x += 20) {
      g.fillTriangle(x, 6, x, 18, x + 10, 12); // right-pointing chevron
    }
    this.endTexture(g, TEX.CONVEYOR, w, h);
  }

  /** Pendulum head: a spiked ball. */
  private makePendulumHeadTexture(): void {
    const s = 40;
    const c = s / 2;
    const g = this.beginTexture();
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
    this.endTexture(g, TEX.PENDULUM_HEAD, s, s);
  }

  /** Thwomp: a chunky block with an angry face on the bottom. */
  private makeThwompTexture(): void {
    const w = 60;
    const h = 60;
    const g = this.beginTexture();
    g.fillStyle(COLORS.THWOMP, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x5a1a3c, 1);
    g.fillRect(0, 0, w, 6); // rim
    g.fillStyle(COLORS.THWOMP_FACE, 1);
    g.fillRect(14, 22, 8, 10); // left eye
    g.fillRect(38, 22, 8, 10); // right eye
    g.fillRect(18, 44, 24, 5); // gritted mouth
    this.endTexture(g, TEX.THWOMP, w, h);
  }

  /** Gear: a circular hub with square teeth around the rim (distinct silhouette from the pendulum's spikes). */
  private makeGearTexture(): void {
    const s = 44;
    const c = s / 2;
    const g = this.beginTexture();
    g.fillStyle(COLORS.GEAR, 1);
    g.fillCircle(c, c, 15);
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      g.save();
      g.translateCanvas(c + Math.cos(a) * 15, c + Math.sin(a) * 15);
      g.rotateCanvas(a);
      g.fillRect(-4, -4, 8, 8);
      g.restore();
    }
    g.fillStyle(0x4a4a4a, 1);
    g.fillCircle(c, c, 6); // dark hub
    this.endTexture(g, TEX.GEAR, s, s);
  }

  /** Projectile: a small dart pointing right (flipped when fired left). */
  private makeProjectileTexture(): void {
    const w = 22;
    const h = 10;
    const g = this.beginTexture();
    g.fillStyle(COLORS.PROJECTILE, 1);
    g.fillRect(0, h / 2 - 2, w - 8, 4); // shaft
    g.fillTriangle(w - 10, 0, w - 10, h, w, h / 2); // head
    this.endTexture(g, TEX.PROJECTILE, w, h);
  }

  /** Wall-mounted arrow launcher. */
  private makeShooterTexture(): void {
    const w = 26;
    const h = 34;
    const g = this.beginTexture();
    g.fillStyle(COLORS.SHOOTER, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(0x1a0d16, 1);
    g.fillRect(w - 10, h / 2 - 5, 10, 10); // muzzle
    this.endTexture(g, TEX.SHOOTER, w, h);
  }

  /** Turret: a squat body with a barrel; stompable from above. */
  private makeTurretTexture(): void {
    const w = 34;
    const h = 30;
    const g = this.beginTexture();
    g.fillStyle(COLORS.TURRET, 1);
    g.fillRoundedRect(0, 6, w, h - 6, 4);
    g.fillStyle(0x6b2f1e, 1);
    g.fillRect(w / 2 - 4, 0, 8, 12); // barrel
    g.fillStyle(0xffec27, 1);
    g.fillCircle(w / 2, 18, 3); // eye
    this.endTexture(g, TEX.TURRET, w, h);
  }

  /** Cannonball: a small circle. */
  private makeCannonballTexture(): void {
    const d = 16;
    const g = this.beginTexture();
    g.fillStyle(COLORS.CANNONBALL, 1);
    g.fillCircle(d / 2, d / 2, d / 2);
    this.endTexture(g, TEX.CANNONBALL, d, d);
  }

  /** Shield pickup: a shield shape with a white cross. */
  private makeShieldTexture(): void {
    const w = 26;
    const h = 30;
    const g = this.beginTexture();
    g.fillStyle(COLORS.SHIELD, 1);
    g.fillRoundedRect(0, 0, w, h - 8, 5);
    g.fillTriangle(0, h - 10, w, h - 10, w / 2, h);
    g.fillStyle(0xffffff, 1);
    g.fillRect(w / 2 - 2, 6, 4, 12);
    g.fillRect(w / 2 - 6, 10, 12, 4);
    this.endTexture(g, TEX.SHIELD, w, h);
  }
}
