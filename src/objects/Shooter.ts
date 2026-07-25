import Phaser from "phaser";
import { DEPTH, PROJECTILE, SHOOTER, TEX } from "../config";
import type { ProjectilePool } from "./ProjectilePool";

/**
 * D-1 — a wall-mounted launcher that fires a horizontal projectile on a timer
 * (the rhythmic variant; a trip-wire variant could reuse the same fire()). The
 * body itself is solid and indestructible.
 */
export class Shooter extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.StaticBody;

  private readonly pool: ProjectilePool;
  private readonly direction: -1 | 1;
  private readonly projectileSpeed: number;
  private readonly intervalMs: number;
  private sinceFireMs = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    pool: ProjectilePool,
    opts: { direction: -1 | 1; projectileSpeed?: number; intervalMs?: number },
  ) {
    super(scene, x, y, TEX.SHOOTER);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(DEPTH.HAZARD);

    this.pool = pool;
    this.direction = opts.direction;
    this.projectileSpeed = opts.projectileSpeed ?? PROJECTILE.SPEED;
    this.intervalMs = opts.intervalMs ?? SHOOTER.INTERVAL_MS;
    this.setFlipX(this.direction < 0); // muzzle faces the fire direction
    // Stagger start so a row of shooters doesn't fire in perfect unison.
    this.sinceFireMs = Math.random() * this.intervalMs;
  }

  update(dtMs: number): void {
    this.sinceFireMs += dtMs;
    if (this.sinceFireMs < this.intervalMs) return;
    this.sinceFireMs = 0;

    const muzzleX = this.x + this.direction * (this.displayWidth / 2 + 6);
    this.pool.fire(muzzleX, this.y, this.direction * this.projectileSpeed, 0);
  }
}
