import Phaser from "phaser";
import { CANNON, DEPTH, TEX } from "../config";
import type { CannonDef } from "../levels/types";
import { shouldFire } from "./ballistics";
import { Cannonball } from "./Cannonball";
import { TEXTURE_SCALE } from "../display";
import { playCannonFire } from "../audio";

/**
 * A cannon that periodically fires cannonballs. The body itself is harmless
 * (not wired into any collider) — only its cannonballs are lethal.
 */
export class Cannon extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private direction: "left" | "right";
  private intervalMs: number;
  private lastFiredAt = 0;
  private balls: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, def: CannonDef, balls: Phaser.Physics.Arcade.Group) {
    super(scene, def.x, def.y, TEX.CANNON);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setOrigin(0.5, 0.5);
    this.setFlipX(def.direction === "left");
    this.setDepth(DEPTH.HAZARD);

    this.direction = def.direction;
    this.intervalMs = def.intervalMs ?? CANNON.FIRE_INTERVAL_MS;
    this.balls = balls;
  }

  update(time: number): void {
    if (!shouldFire(time, this.lastFiredAt, this.intervalMs)) return;
    this.lastFiredAt = time;
    const ball = new Cannonball(this.scene, this.x, this.y, this.direction);
    this.balls.add(ball);
    // Group#add re-applies the group's physics defaults (velocityX/Y default
    // to 0) to every member, even one that already has a body — this silently
    // zeroes the velocity set in the Cannonball constructor above. Re-apply it.
    ball.reapplyVelocity();
    playCannonFire(this.scene);
  }
}
