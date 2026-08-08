import Phaser from "phaser";
import { DEPTH, HAMMER, TEX } from "../config";
import { TEXTURE_SCALE } from "../display";

/**
 * A hammer thrown by HammerThrower. Unlike Cannonball (constant velocity,
 * no gravity), this one falls into an arc — gravity is left on. Added to an
 * unbounded group and destroyed on terrain hit or leaving the world, the same
 * lifecycle Cannon/Cannonball already use.
 */
export class Hammer extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly launchVX: number;
  private readonly launchVY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, dir: 1 | -1) {
    super(scene, x, y, TEX.HAMMER);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(true);
    this.setDepth(DEPTH.PROJECTILE);
    this.launchVX = HAMMER.LAUNCH_SPEED_X * dir;
    this.launchVY = HAMMER.LAUNCH_SPEED_Y;
    this.setVelocity(this.launchVX, this.launchVY);
  }

  /**
   * Re-applies this hammer's launch velocity. Call after adding this sprite to
   * a Phaser.Physics.Arcade.Group — Group#add always re-applies the group's
   * physics defaults (velocityX/Y default to 0) to every member, which
   * silently zeroes out the velocity set in the constructor above (same
   * gotcha Cannonball works around).
   */
  reapplyVelocity(): void {
    this.setVelocity(this.launchVX, this.launchVY);
  }
}
