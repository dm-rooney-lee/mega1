import Phaser from "phaser";
import { CANNON, TEX } from "../config";

/**
 * 대포 발사체: 등속 수평 이동, 중력 없음. Cannon이 생성하고,
 * GameScene이 발판 충돌·월드 이탈 시 소멸시킨다.
 */
export class Cannonball extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: "left" | "right") {
    super(scene, x, y, TEX.CANNONBALL);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setOrigin(0.5, 0.5);
    const sign = direction === "left" ? -1 : 1;
    this.setVelocityX(sign * CANNON.BALL_SPEED);
  }
}
