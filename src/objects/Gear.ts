import Phaser from "phaser";
import { DEPTH, GEAR, TEX } from "../config";
import { gearRotationRad, oscillateOffset } from "../levels/motion";
import { TEXTURE_SCALE } from "../display";
import { setLogicalBodyCircle } from "./hitbox";

/**
 * F-1 — a gear that rides a straight rail (same math as MovingPlatform) while
 * spinning in place. The spin is purely visual (circular hitbox never changes
 * shape); the danger is the rail movement itself. Instant death on any contact
 * — no stomp-kill, same as the Pendulum head.
 */
export class Gear extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly homeX: number;
  private readonly homeY: number;
  private readonly axis: "horizontal" | "vertical";
  private readonly range: number;
  private readonly speed: number;
  private readonly phase01: number;
  private readonly waitMs: number;
  private readonly rotateDegPerSec: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    opts: {
      axis?: "horizontal" | "vertical";
      range?: number;
      speed?: number;
      phase?: number;
      waitMs?: number;
      rotateDegPerSec?: number;
    } = {},
  ) {
    super(scene, x, y, TEX.GEAR);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.HAZARD);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // displayWidth, not width: the texture is drawn oversized and the sprite is
    // scaled back down, so only the display size is in logical units.
    const inset = this.displayWidth / 2 - GEAR.RADIUS;
    setLogicalBodyCircle(this, GEAR.RADIUS, inset, inset);

    this.homeX = x;
    this.homeY = y;
    this.axis = opts.axis ?? "horizontal";
    this.range = opts.range ?? 0;
    this.speed = opts.speed ?? GEAR.SPEED;
    this.phase01 = opts.phase ?? 0;
    this.waitMs = opts.waitMs ?? 0;
    this.rotateDegPerSec = opts.rotateDegPerSec ?? GEAR.ROTATE_DEG_PER_SEC;
  }

  /** `elapsedMs` = scene time; `dtMs` = frame delta. */
  update(elapsedMs: number, dtMs: number): void {
    const off = oscillateOffset(elapsedMs, this.range, this.speed, this.phase01, this.waitMs);
    const targetX = this.axis === "horizontal" ? this.homeX + off : this.homeX;
    const targetY = this.axis === "vertical" ? this.homeY + off : this.homeY;

    const dtSec = dtMs / 1000;
    const vx = dtSec > 0 ? clampAbs((targetX - this.x) / dtSec, this.speed) : 0;
    const vy = dtSec > 0 ? clampAbs((targetY - this.y) / dtSec, this.speed) : 0;
    this.setVelocity(vx, vy);

    this.setRotation(gearRotationRad(elapsedMs, this.rotateDegPerSec, this.phase01));
  }
}

/** Clamp `v` to the range [-max, max] — same technique as MovingPlatform's velocity cap. */
function clampAbs(v: number, max: number): number {
  return v > max ? max : v < -max ? -max : v;
}
