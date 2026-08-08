import Phaser from "phaser";
import { PROJECTILE } from "../config";
import { Projectile } from "./Projectile";
import { playFire } from "../audio";

/**
 * D — shared projectile pool. A fixed-size group of reusable Projectiles that
 * every shooter and turret fires from, so bursts never allocate mid-play. The
 * scene wires the group once: overlap(player) = death (or a shield charge if
 * the player has one), collider(platforms) = the projectile is blocked by
 * terrain (cover works).
 */
export class ProjectilePool {
  readonly group: Phaser.Physics.Arcade.Group;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      classType: Projectile,
      maxSize: PROJECTILE.POOL_SIZE,
      allowGravity: false,
      runChildUpdate: true,
    });
  }

  /** Fire a projectile from (x, y) with velocity (vx, vy). No-op if the pool is dry. */
  fire(x: number, y: number, vx: number, vy: number, range = PROJECTILE.RANGE): void {
    const p = this.group.get(x, y) as Projectile | null;
    if (!p) return; // pool exhausted — drop the shot rather than grow unbounded
    p.fire(x, y, vx, vy, range);
    playFire(this.scene);
  }

  /** Terrain hit: block the projectile (call from the platform collider). */
  static onTerrainHit(obj: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
    (obj as Projectile).deactivate();
  }
}
