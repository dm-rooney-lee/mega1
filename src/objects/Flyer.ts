import Phaser from "phaser";
import { DEPTH, FLYER, TEX } from "../config";
import { clampAbs, oscillateOffset } from "../levels/motion";
import { TEXTURE_SCALE } from "../display";
import { setLogicalBodyCircle } from "./hitbox";
import { squashAndDestroy } from "./squash";

/**
 * A flying enemy that rides a straight rail (same math as Gear/MovingPlatform)
 * but, unlike Gear, is stompable rather than instant-death on any contact.
 */
export class Flyer extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly homeX: number;
  private readonly homeY: number;
  private readonly axis: "horizontal" | "vertical";
  private readonly range: number;
  private readonly speed: number;
  private readonly phase01: number;
  private readonly waitMs: number;
  private isDead = false;

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
    } = {},
  ) {
    super(scene, x, y, TEX.FLYER);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.ENEMY);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // displayWidth, not width: the texture is drawn oversized and the sprite is
    // scaled back down, so only the display size is in logical units.
    const inset = this.displayWidth / 2 - FLYER.RADIUS;
    setLogicalBodyCircle(this, FLYER.RADIUS, inset, inset);

    this.homeX = x;
    this.homeY = y;
    this.axis = opts.axis ?? "horizontal";
    this.range = opts.range ?? 0;
    this.speed = opts.speed ?? FLYER.SPEED;
    this.phase01 = opts.phase ?? 0;
    this.waitMs = opts.waitMs ?? 0;
  }

  get dead(): boolean {
    return this.isDead;
  }

  /** `elapsedMs` = scene time; `dtMs` = frame delta. */
  update(elapsedMs: number, dtMs: number): void {
    if (this.isDead) return;

    const off = oscillateOffset(elapsedMs, this.range, this.speed, this.phase01, this.waitMs);
    const targetX = this.axis === "horizontal" ? this.homeX + off : this.homeX;
    const targetY = this.axis === "vertical" ? this.homeY + off : this.homeY;

    const dtSec = dtMs / 1000;
    const vx = dtSec > 0 ? clampAbs((targetX - this.x) / dtSec, this.speed) : 0;
    const vy = dtSec > 0 ? clampAbs((targetY - this.y) / dtSec, this.speed) : 0;
    this.setVelocity(vx, vy);
  }

  /** Destroyed by a stomp: stop and squash, same as Enemy/Turret. */
  kill(): void {
    if (this.isDead) return;
    this.isDead = true;
    squashAndDestroy(this.scene, this);
  }
}
