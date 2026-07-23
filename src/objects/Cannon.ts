import Phaser from "phaser";
import { CANNON, TEX } from "../config";
import type { CannonDef } from "../levels/types";
import { shouldFire } from "./ballistics";
import { Cannonball } from "./Cannonball";

/**
 * 주기적으로 대포알을 발사하는 대포. 본체는 무해(충돌 미배선) — 대포알만 치명적.
 */
export class Cannon extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private direction: "left" | "right";
  private intervalMs: number;
  private lastFiredAt = 0;
  private balls: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, def: CannonDef, balls: Phaser.Physics.Arcade.Group) {
    super(scene, def.x, def.y, TEX.CANNON);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setOrigin(0.5, 0.5);
    this.setFlipX(def.direction === "left");

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
  }
}
