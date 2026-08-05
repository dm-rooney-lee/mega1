import Phaser from "phaser";
import { TEX } from "../config";
import { TEXTURE_SCALE } from "../display";

/**
 * The level-end flag. Physics-enabled only so it can participate in an overlap
 * check; it has no gravity and doesn't move.
 */
export class Goal extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.GOAL);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setOrigin(0.5, 1);

    // A gentle idle wave to draw the eye.
    scene.tweens.add({
      targets: this,
      angle: { from: -3, to: 3 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }
}
