import Phaser from "phaser";
import { DEPTH, TEX } from "../config";
import { TEXTURE_SCALE } from "../display";

/**
 * A rock dropped by Dropper: no horizontal velocity, gravity pulls it
 * straight down. Created fresh per drop and destroyed on landing/off-world
 * (GameScene), the same lifecycle Cannon/Cannonball already use.
 */
export class FallingRock extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.FALLING_ROCK);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(true);
    this.setDepth(DEPTH.PROJECTILE);
  }
}
