import Phaser from "phaser";
import { COLORS, DEPTH, PROJECTILE, TURRET, TEX } from "../config";
import type { Player } from "./Player";
import type { ProjectilePool } from "./ProjectilePool";
import { TEXTURE_SCALE } from "../display";
import { standOnSurface } from "./mount";
import { playEnemyKill } from "../audio";

/**
 * D-2 — a turret. Fires projectiles (death on contact) but the body itself can
 * be stomped from above to destroy it. "fixed" fires straight along a direction;
 * "aim" leads toward the player, preceded by a brief aim-line telegraph so the
 * shot is fair. Stays vulnerable to a stomp even mid-aim.
 */
export class Turret extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly pool: ProjectilePool;
  private readonly aimMode: "fixed" | "aim";
  private readonly direction: -1 | 1;
  private readonly projectileSpeed: number;
  private readonly intervalMs: number;
  private readonly aimLine: Phaser.GameObjects.Graphics;

  private sinceFireMs = 0;
  private aiming = false;
  private aimingMs = 0;
  private aimTargetX = 0;
  private aimTargetY = 0;
  private isDead = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    pool: ProjectilePool,
    opts: {
      aimMode?: "fixed" | "aim";
      direction?: -1 | 1;
      projectileSpeed?: number;
      intervalMs?: number;
    } = {},
  ) {
    super(scene, x, y, TEX.TURRET);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.ENEMY);

    this.pool = pool;
    this.aimMode = opts.aimMode ?? "fixed";
    this.direction = opts.direction ?? -1;
    this.projectileSpeed = opts.projectileSpeed ?? PROJECTILE.SPEED;
    this.intervalMs = opts.intervalMs ?? TURRET.INTERVAL_MS;

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // Input (x, y) is the surface it stands on; centring the sprite above it keeps
    // the body aligned (changing origin after body creation would offset it).
    standOnSurface(this, x, y);
    this.aimLine = scene.add.graphics().setDepth(DEPTH.HAZARD);
  }

  get dead(): boolean {
    return this.isDead;
  }

  update(dtMs: number, player: Player): void {
    if (this.isDead) return;

    if (this.aiming) {
      this.aimingMs += dtMs;
      // Aim is LOCKED to where the player stood when the telegraph began — the line
      // marks the spot it will fire at, so it reads as "step out of the way", not
      // a homing lock-on that tracks you.
      this.drawAimLine(this.aimTargetX, this.aimTargetY);
      if (this.aimingMs >= TURRET.TELEGRAPH_MS) {
        this.aiming = false;
        this.aimLine.clear();
        this.fireAt(this.aimTargetX, this.aimTargetY);
        this.sinceFireMs = 0;
      }
      return;
    }

    this.sinceFireMs += dtMs;
    if (this.sinceFireMs < this.intervalMs) return;

    if (this.aimMode === "aim") {
      this.aiming = true;
      this.aimingMs = 0;
      this.aimTargetX = player.x; // snapshot: locked for the whole telegraph
      this.aimTargetY = player.y;
    } else {
      this.fireAt(this.x + this.direction * 100, this.y - this.displayHeight / 2);
      this.sinceFireMs = 0;
    }
  }

  /** Destroyed by a stomp: stop shooting and squash. Live projectiles persist. */
  kill(): void {
    if (this.isDead) return;
    this.isDead = true;
    playEnemyKill(this.scene);
    this.aimLine.clear();
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      alpha: 0,
      duration: 160,
      onComplete: () => this.destroy(),
    });
  }

  private fireAt(targetX: number, targetY: number): void {
    const originX = this.x;
    const originY = this.y - this.displayHeight / 2;
    const ang = Math.atan2(targetY - originY, targetX - originX);
    this.pool.fire(
      originX,
      originY,
      Math.cos(ang) * this.projectileSpeed,
      Math.sin(ang) * this.projectileSpeed,
    );
  }

  private drawAimLine(targetX: number, targetY: number): void {
    const originX = this.x;
    const originY = this.y - this.displayHeight / 2;
    this.aimLine.clear();
    this.aimLine.lineStyle(2, COLORS.TELEGRAPH, 0.7);
    this.aimLine.lineBetween(originX, originY, targetX, targetY);
  }
}
