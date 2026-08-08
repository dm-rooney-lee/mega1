import Phaser from "phaser";
import { HAMMER_THROWER, TEX } from "../config";
import { TEXTURE_SCALE } from "../display";
import { setLogicalBodySize } from "./hitbox";
import { standOnSurface } from "./mount";
import { reverseAtBounds } from "../levels/patrol";
import { squashAndDestroy } from "./squash";
import { Hammer } from "./Hammer";

type ThrowerState = "patrol" | "throwing";

/**
 * A patrolling enemy (same bounds/reversal as Enemy) that periodically
 * stops to lob a Hammer in a fixed arc. Stompable, same squash as Enemy.
 */
export class HammerThrower extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private dir: 1 | -1 = 1;
  private isDead = false;
  private mode: ThrowerState = "patrol";
  private sinceThrowMs = 0;
  private windUpMs = 0;
  private readonly leftBound: number;
  private readonly rightBound: number;
  private readonly throwIntervalMs: number;
  private readonly hammers: Phaser.Physics.Arcade.Group;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    leftBound: number,
    rightBound: number,
    hammers: Phaser.Physics.Arcade.Group,
    opts: { throwIntervalMs?: number } = {},
  ) {
    super(scene, x, y, TEX.HAMMER_THROWER);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // (x, y) is the surface it patrols, same convention as Turret/Cannon — start
    // resting exactly on top of it rather than centered on it (which would spawn
    // it half-embedded in the ground and let it fall straight through before
    // gravity and the platform collider ever get a clean frame to catch it).
    standOnSurface(this, x, y);

    this.leftBound = leftBound;
    this.rightBound = rightBound;
    this.throwIntervalMs = opts.throwIntervalMs ?? HAMMER_THROWER.THROW_INTERVAL_MS;
    this.hammers = hammers;
    this.setCollideWorldBounds(true);
    setLogicalBodySize(this, HAMMER_THROWER.WIDTH, HAMMER_THROWER.HEIGHT);
    this.setVelocityX(HAMMER_THROWER.MOVE_SPEED * this.dir);
  }

  get dead(): boolean {
    return this.isDead;
  }

  update(dtMs: number): void {
    if (this.isDead) return;

    if (this.mode === "throwing") {
      // Stand still through the wind-up so the throw reads as a deliberate beat,
      // not a walk-and-shoot.
      this.setVelocityX(0);
      this.windUpMs += dtMs;
      if (this.windUpMs >= HAMMER_THROWER.WIND_UP_MS) {
        this.throwHammer();
        this.mode = "patrol";
        this.sinceThrowMs = 0;
      }
      return;
    }

    this.sinceThrowMs += dtMs;
    if (this.sinceThrowMs >= this.throwIntervalMs) {
      this.mode = "throwing";
      this.windUpMs = 0;
      return;
    }

    this.dir = reverseAtBounds(
      this.x,
      this.body.halfWidth,
      this.leftBound,
      this.rightBound,
      this.body.blocked.left || this.body.touching.left,
      this.body.blocked.right || this.body.touching.right,
      this.dir,
    );
    this.setVelocityX(HAMMER_THROWER.MOVE_SPEED * this.dir);
    this.setFlipX(this.dir < 0);
  }

  /** Squash and remove after being stomped. */
  squash(): void {
    if (this.isDead) return;
    this.isDead = true;
    squashAndDestroy(this.scene, this, { knockback: true });
  }

  private throwHammer(): void {
    const hammer = new Hammer(this.scene, this.x, this.y, this.dir);
    this.hammers.add(hammer);
    hammer.reapplyVelocity();
  }
}
