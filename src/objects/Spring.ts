import Phaser from "phaser";
import { DEPTH, SPRING, TEX } from "../config";
import type { Player } from "./Player";
import { playSpringBounce } from "../audio";

/**
 * A-1 — a jump pad. Landing on top launches the player far higher than a normal
 * jump; side/underside contact is just a solid wall (handled by the collider).
 * No cooldown — land on it again and it bounces you again.
 */
export class Spring extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.StaticBody;

  private readonly power: number;
  private squashing = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    power: number = SPRING.POWER,
  ) {
    super(scene, x + width / 2, y + height / 2, TEX.SPRING);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(DEPTH.PLATFORM);
    this.power = power;

    this.setDisplaySize(width, height);
    this.body.setSize(width, height);
    this.body.updateFromGameObject();
  }

  /**
   * Called from the player↔spring collider. Only a top landing launches; the
   * collider itself blocks the other faces. `body.touching.up` on the static
   * body reliably marks a top contact.
   */
  tryLaunch(player: Player): void {
    if (!this.body.touching.up) return;
    player.launch(this.power);
    playSpringBounce(this.scene);
    this.squash();
  }

  private squash(): void {
    if (this.squashing) return;
    this.squashing = true;
    this.scene.tweens.add({
      targets: this,
      scaleY: this.scaleY * 0.55,
      duration: SPRING.SQUASH_MS,
      yoyo: true,
      onComplete: () => {
        this.squashing = false;
      },
    });
  }
}
