import Phaser from "phaser";
import { COLORS, DEPTH, PENDULUM, TEX } from "../config";
import { pendulumAngleRad, pendulumHead } from "../levels/motion";

/**
 * B-1 — a spiked ball swinging from a fixed pivot. The head is a physics sprite
 * used only for an overlap check (instant death); the chain is decorative and
 * harmless. Motion is a pure function of elapsed time (deterministic), so it
 * resets identically on a scene restart.
 */
export class Pendulum {
  readonly head: Phaser.Physics.Arcade.Image;

  private readonly pivotX: number;
  private readonly pivotY: number;
  private readonly length: number;
  private readonly amplitudeRad: number;
  private readonly periodMs: number;
  private readonly phase01: number;
  private readonly chain: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    pivotX: number,
    pivotY: number,
    opts: {
      length?: number;
      amplitudeDeg?: number;
      periodMs?: number;
      phase?: number;
    } = {},
  ) {
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.length = opts.length ?? PENDULUM.LENGTH;
    this.amplitudeRad = Phaser.Math.DegToRad(opts.amplitudeDeg ?? PENDULUM.AMPLITUDE_DEG);
    this.periodMs = opts.periodMs ?? PENDULUM.PERIOD_MS;
    this.phase01 = opts.phase ?? 0;

    this.chain = scene.add.graphics().setDepth(DEPTH.HAZARD - 1);

    // A small anchor cap at the pivot, purely visual.
    scene.add
      .circle(pivotX, pivotY, 5, COLORS.CHAIN)
      .setDepth(DEPTH.HAZARD);

    this.head = scene.physics.add.image(pivotX, pivotY + this.length, TEX.PENDULUM_HEAD);
    this.head.setDepth(DEPTH.HAZARD);
    const body = this.head.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    // Circular hitbox a touch smaller than the art (fairer near the edges).
    const inset = this.head.width / 2 - PENDULUM.HEAD_RADIUS;
    body.setCircle(PENDULUM.HEAD_RADIUS, inset, inset);

    this.redraw();
  }

  /** `elapsedMs` is scene time since create() — keeps every pendulum in phase. */
  update(elapsedMs: number): void {
    const angle = pendulumAngleRad(elapsedMs, this.periodMs, this.amplitudeRad, this.phase01);
    const p = pendulumHead(this.pivotX, this.pivotY, this.length, angle);
    // Move the physics body via its reset so the body tracks the sprite exactly.
    this.head.setPosition(p.x, p.y);
    this.head.setRotation(angle);
    this.redraw();
  }

  private redraw(): void {
    this.chain.clear();
    this.chain.lineStyle(4, COLORS.CHAIN, 1);
    this.chain.lineBetween(this.pivotX, this.pivotY, this.head.x, this.head.y);
  }
}
