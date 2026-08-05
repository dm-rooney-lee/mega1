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
    this.makeGroundTileTexture();
    this.makeEnemyTexture();
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
    this.clampTextureEdges(key);
  }

  /**
   * Stops a texture's edges from sampling the opposite side.
   *
   * Phaser gives any power-of-two texture `REPEAT` wrapping, so smooth filtering
   * along an edge pixel blends in the far edge. On the spikes — empty at the top,
   * solid white along the bottom — that drew a white hairline across the tips.
   * Every size here is a power of two once multiplied by the texture scale, so
   * clamp them all.
   */
  private clampTextureEdges(key: string): void {
    const renderer = this.sys.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    const glTexture = this.textures.get(key).source[0].glTexture;
    // The Canvas renderer has no wrap modes and no glTexture.
    if (!renderer.gl || !glTexture) return;
    const clamp = renderer.gl.CLAMP_TO_EDGE;
    renderer.setTextureWrap(glTexture, clamp, clamp);
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

  /** 반복 배치되는 흙+풀 타일(64x44). 발판 폭에 맞춰 늘리지 않고 TileSprite로 이어붙인다. */
  private makeGroundTileTexture(): void {
    const w = 64;
    const h = 44;
    const g = this.beginTexture();
    g.fillStyle(COLORS.GRASS_TOP, 1);
    g.fillRect(0, 0, w, 6);
    g.fillStyle(COLORS.DIRT, 1);
    g.fillRect(0, 6, w, h - 6);
    g.fillStyle(COLORS.DIRT_DETAIL, 1);
    g.fillRect(8, 16, 6, 4);
    g.fillRect(38, 28, 8, 4);
    g.fillRect(20, 12, 4, 4);
    g.fillRect(50, 10, 4, 12);
    this.endTexture(g, TEX.GROUND_TILE, w, h);
  }

  /** 고퍼: 각진 실루엣 + 검정 테두리 + 귀·코·앞니·발(14x20 아트 픽셀, 2단위 격자). */
  private makePlayerTexture(): void {
    const w = 28;
    const h = 40;
    const g = this.beginTexture();
    const px = (x: number, y: number, pw: number, ph: number, color: number): void => {
      g.fillStyle(color, 1);
      g.fillRect(x * 2, y * 2, pw * 2, ph * 2);
    };

    // 검정 테두리(귀 2개 포함 실루엣).
    px(1, 0, 2, 2, COLORS.OUTLINE);
    px(11, 0, 2, 2, COLORS.OUTLINE);
    px(2, 0, 10, 1, COLORS.OUTLINE);
    px(1, 1, 12, 1, COLORS.OUTLINE);
    px(0, 2, 14, 16, COLORS.OUTLINE);
    px(1, 18, 12, 1, COLORS.OUTLINE);
    px(2, 19, 10, 1, COLORS.OUTLINE);

    // 몸통(테두리 안쪽으로 1아트픽셀 인셋).
    px(3, 1, 8, 1, COLORS.PLAYER);
    px(2, 2, 10, 1, COLORS.PLAYER);
    px(1, 3, 12, 14, COLORS.PLAYER);
    px(2, 17, 10, 1, COLORS.PLAYER);
    px(3, 18, 8, 1, COLORS.PLAYER);

    // 눈.
    px(3, 5, 2, 2, 0xfff1e8);
    px(9, 5, 2, 2, 0xfff1e8);
    px(4, 6, 1, 1, COLORS.OUTLINE);
    px(10, 6, 1, 1, COLORS.OUTLINE);

    // 코 + 앞니(고퍼 정체성 단서).
    px(6, 8, 2, 1, COLORS.OUTLINE);
    px(5, 9, 4, 2, 0xfff1e8);
    px(7, 9, 1, 2, COLORS.OUTLINE);

    // 발.
    px(2, 18, 3, 2, 0xffccaa);
    px(9, 18, 3, 2, 0xffccaa);

    this.endTexture(g, TEX.PLAYER, w, h);
  }

  /** 적: 딱정벌레 — 둥근 등딱지 대신 각진 갑각 + 화난 눈. */
  private makeEnemyTexture(): void {
    const w = 32;
    const h = 28;
    const g = this.beginTexture();
    g.fillStyle(COLORS.OUTLINE, 1);
    g.fillRect(2, 4, 28, 20);
    g.fillStyle(COLORS.ENEMY, 1);
    g.fillRect(4, 6, 24, 16);
    g.fillStyle(COLORS.OUTLINE, 1);
    g.fillRect(6, 10, 4, 4); // left eye
    g.fillRect(22, 10, 4, 4); // right eye
    g.fillRect(0, 8, 4, 2); // left antenna
    g.fillRect(28, 8, 4, 2); // right antenna
    this.endTexture(g, TEX.ENEMY, w, h);
  }

  /** 가시덤불: 기존 삼각 톱니 실루엣 유지, 갈색·진초록 배색으로 변경. */
  private makeSpikeTexture(): void {
    const s = 32;
    const g = this.beginTexture();
    g.fillStyle(COLORS.SPIKE, 1);
    for (let i = 0; i < 3; i++) {
      const base = (i * s) / 3;
      const step = s / 3;
      g.fillTriangle(base, s, base + step / 2, 0, base + step, s);
    }
    g.fillStyle(COLORS.HILL_FAR, 1);
    g.fillRect(0, s - 4, s, 4);
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

  /** 솔방울: 사각 비늘이 어긋나게 쌓인 실루엣(원형 히트박스는 Pendulum.ts가 별도 관리, 텍스처만 변경). */
  private makePendulumHeadTexture(): void {
    const s = 40;
    const g = this.beginTexture();
    g.fillStyle(COLORS.PENDULUM_HEAD, 1);
    g.fillRect(12, 4, 16, 32);
    for (let row = 0; row < 4; row++) {
      const offset = row % 2 === 0 ? 4 : 12;
      g.fillStyle(COLORS.DIRT_DETAIL, 1);
      g.fillRect(offset, 6 + row * 8, 8, 4);
      g.fillRect(s - offset - 8, 6 + row * 8, 8, 4);
    }
    this.endTexture(g, TEX.PENDULUM_HEAD, s, s);
  }

  /** 바위 압사기: 회색 돌 + 금 간 무늬 + 화난 눈. */
  private makeThwompTexture(): void {
    const w = 60;
    const h = 60;
    const g = this.beginTexture();
    g.fillStyle(COLORS.THWOMP, 1);
    g.fillRect(0, 0, w, h);
    g.fillStyle(COLORS.DIRT_DETAIL, 1);
    g.fillRect(0, 0, w, 4); // rim
    g.fillRect(10, 30, 20, 3); // crack
    g.fillRect(34, 40, 3, 14); // crack
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
