import Phaser from "phaser";
import { DEPTH, MOVING_PLATFORM, TEX } from "../config";
import { clampAbs, oscillateOffset } from "../levels/motion";

/**
 * A-2 — a platform that patrols a straight path and carries riders.
 *
 * Driven by velocity (not by teleporting position) so Arcade's collision
 * separation naturally pushes a resting player upward. Horizontal carry and the
 * "stick to a descending platform" case aren't handled by Arcade, so the scene
 * reads `carryDX()` / `carryDY()` and nudges the rider itself.
 *
 * Position along the path comes from `oscillateOffset` (pure, tested), so motion
 * is deterministic and identical after a restart.
 */
export class MovingPlatform extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly homeX: number;
  private readonly homeY: number;
  private readonly axis: "horizontal" | "vertical";
  private readonly range: number;
  private readonly speed: number;
  private readonly phase01: number;
  private readonly waitMs: number;
  private lastVX = 0;
  private lastVY = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    opts: {
      axis?: "horizontal" | "vertical";
      range?: number;
      speed?: number;
      phase?: number;
      waitMs?: number;
    } = {},
  ) {
    // (x, y) is the platform's top-left (matching PlatformDef); center the sprite.
    super(scene, x + width / 2, y + height / 2, TEX.MOVING);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.PLATFORM);

    this.setDisplaySize(width, height);
    // Frame size scaled by the body → body matches the display size.
    this.body.setSize(this.width, this.height);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    this.homeX = this.x;
    this.homeY = this.y;
    this.axis = opts.axis ?? "horizontal";
    this.range = opts.range ?? 0;
    this.speed = opts.speed ?? MOVING_PLATFORM.SPEED;
    this.phase01 = opts.phase ?? 0;
    this.waitMs = opts.waitMs ?? MOVING_PLATFORM.WAIT_MS;
  }

  /** `elapsedMs` = scene time; `dtMs` = frame delta. */
  update(elapsedMs: number, dtMs: number): void {
    const off = oscillateOffset(elapsedMs, this.range, this.speed, this.phase01, this.waitMs);
    const targetX = this.axis === "horizontal" ? this.homeX + off : this.homeX;
    const targetY = this.axis === "vertical" ? this.homeY + off : this.homeY;

    const dtSec = dtMs / 1000;
    // Chase the deterministic target, but CAP the speed at the path speed. Arcade's
    // fixedStep runs a variable number of sub-steps per frame; a "reach the target
    // exactly this frame" velocity overshoots on 2-step frames and reverses on
    // 0-step frames — the visible juddering. Capping keeps motion monotonic and
    // smooth (it just tracks the target with an imperceptible sub-frame lag).
    this.lastVX = dtSec > 0 ? clampAbs((targetX - this.x) / dtSec, this.speed) : 0;
    this.lastVY = dtSec > 0 ? clampAbs((targetY - this.y) / dtSec, this.speed) : 0;
    this.setVelocity(this.lastVX, this.lastVY);
  }

  /** Horizontal movement this frame — added to a rider's x (Arcade won't carry it). */
  carryDX(dtSec: number): number {
    return this.lastVX * dtSec;
  }

  /** Vertical movement this frame — used to glue a rider to a descending platform. */
  carryDY(dtSec: number): number {
    return this.lastVY * dtSec;
  }
}
