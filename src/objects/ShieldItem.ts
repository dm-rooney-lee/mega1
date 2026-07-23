import Phaser from "phaser";
import { TEX } from "../config";
import type { Player } from "./Player";

/**
 * 밟으면(overlap) 플레이어에게 방패를 주는 픽업. Goal처럼 중력 없는 정적 스프라이트.
 */
export class ShieldItem extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.SHIELD);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setOrigin(0.5, 0.5);

    // 눈에 띄게 위아래로 살짝 떠다니게.
    scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  /** 플레이어에게 방패를 주고 픽업을 제거. */
  collect(player: Player): void {
    player.giveShield();
    this.destroy();
  }
}
