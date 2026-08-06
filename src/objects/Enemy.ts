import Phaser from "phaser";
import { ENEMY, TEX } from "../config";
import { TEXTURE_SCALE } from "../display";
import { setLogicalBodySize } from "./hitbox";
import { playEnemyKill } from "../audio";

/**
 * A simple patrolling enemy. It walks back and forth between an explicit left/right
 * bound (the edges of the platform it spawned on, computed by GameScene) and also
 * reverses if it bumps a wall. Using bounds keeps it from strolling off ledges
 * without any raycasting.
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private dir: 1 | -1 = 1;
  private isDead = false;
  private leftBound: number;
  private rightBound: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    leftBound: number,
    rightBound: number,
  ) {
    super(scene, x, y, TEX.ENEMY);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.leftBound = leftBound;
    this.rightBound = rightBound;
    this.setCollideWorldBounds(true);
    setLogicalBodySize(this, 28, 26);
    this.setVelocityX(ENEMY.MOVE_SPEED * this.dir);
  }

  update(): void {
    if (this.isDead) return;

    const halfW = this.body.halfWidth;
    // Reverse at patrol bounds...
    if (this.x - halfW <= this.leftBound) this.dir = 1;
    else if (this.x + halfW >= this.rightBound) this.dir = -1;
    // ...or on a wall bump (e.g. running into another platform).
    if (this.body.blocked.left || this.body.touching.left) this.dir = 1;
    else if (this.body.blocked.right || this.body.touching.right) this.dir = -1;

    this.setVelocityX(ENEMY.MOVE_SPEED * this.dir);
    this.setFlipX(this.dir < 0);
  }

  get dead(): boolean {
    return this.isDead;
  }

  /** Squash and remove after being stomped. */
  squash(): void {
    if (this.isDead) return;
    this.isDead = true;
    playEnemyKill(this.scene);
    this.body.stop();
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      y: this.y + 10,
      alpha: 0,
      duration: 160,
      onComplete: () => this.destroy(),
    });
  }
}
