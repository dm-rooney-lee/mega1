import Phaser from "phaser";
import { CANNON, DEPTH, TEX } from "../config";

/**
 * A cannon's projectile: constant horizontal velocity, no gravity. Created by
 * Cannon; GameScene destroys it on platform collision or leaving the world.
 */
export class Cannonball extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly launchVelocityX: number;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: "left" | "right") {
    super(scene, x, y, TEX.CANNONBALL);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setOrigin(0.5, 0.5);
    this.setDepth(DEPTH.PROJECTILE);
    const sign = direction === "left" ? -1 : 1;
    this.launchVelocityX = sign * CANNON.BALL_SPEED;
    this.setVelocityX(this.launchVelocityX);
  }

  /**
   * Re-applies this ball's launch velocity. Call after adding this sprite to
   * a Phaser.Physics.Arcade.Group — Group#add always re-applies the group's
   * physics defaults (velocityX/Y default to 0) to every member, which
   * silently zeroes out the velocity set in the constructor above.
   */
  reapplyVelocity(): void {
    this.setVelocityX(this.launchVelocityX);
  }
}
