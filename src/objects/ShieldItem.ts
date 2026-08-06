import Phaser from "phaser";
import { DEPTH, TEX } from "../config";
import type { Player } from "./Player";
import { TEXTURE_SCALE } from "../display";
import { playShieldPickup } from "../audio";

/**
 * A pickup that grants the player a shield on overlap. Like Goal, a static,
 * gravity-free sprite.
 */
export class ShieldItem extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.SHIELD);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setOrigin(0.5, 0.5);
    this.setDepth(DEPTH.HAZARD);

    // A gentle bob to draw the eye.
    scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  /** Grants the player a shield and removes the pickup. */
  collect(player: Player): void {
    player.giveShield();
    playShieldPickup(this.scene);
    this.destroy();
  }
}
