import Phaser from "phaser";
import { DEPTH, PROJECTILE, TEX } from "../config";

/**
 * A single reusable projectile. It self-culls (in preUpdate) once it has flown
 * past its range or left the world, returning itself to the pool. Deactivated
 * projectiles are invisible and have no body, so they don't hurt anyone.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private spawnX = 0;
  private spawnY = 0;
  private range: number = PROJECTILE.RANGE;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.PROJECTILE);
    this.setDepth(DEPTH.PROJECTILE);
  }

  /** Fire from (x, y) with velocity (vx, vy). Rotates to face travel direction. */
  fire(x: number, y: number, vx: number, vy: number, range: number): void {
    this.spawnX = x;
    this.spawnY = y;
    this.range = range;

    this.enableBody(true, x, y, true, true);
    this.body.setAllowGravity(false);
    this.setRotation(Math.atan2(vy, vx));
    this.setVelocity(vx, vy);
  }

  /** Return to the pool (called on a hit, or automatically when out of range). */
  deactivate(): void {
    if (!this.active) return;
    this.disableBody(true, true);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active) return;

    const dx = this.x - this.spawnX;
    const dy = this.y - this.spawnY;
    if (dx * dx + dy * dy >= this.range * this.range) {
      this.deactivate();
      return;
    }
    const b = this.scene.physics.world.bounds;
    if (this.x < b.x - 40 || this.x > b.right + 40 || this.y < b.y - 40 || this.y > b.bottom + 40) {
      this.deactivate();
    }
  }
}
