import Phaser from "phaser";
import { CHARGER, TEX } from "../config";
import { TEXTURE_SCALE } from "../display";
import { setLogicalBodySize } from "./hitbox";
import { standOnSurface } from "./mount";
import { reverseAtBounds } from "../levels/patrol";
import { squashAndDestroy } from "./squash";
import { withinRange } from "./proximity";
import type { Player } from "./Player";

/**
 * A patrolling enemy (same bounds/reversal as Enemy) that dashes toward
 * the player at CHARGE_SPEED once they're within detection range, and returns
 * to normal patrol speed otherwise. Stompable at all times, including mid-charge.
 */
export class Charger extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private dir: 1 | -1 = 1;
  private isDead = false;
  private readonly leftBound: number;
  private readonly rightBound: number;
  private readonly detectRangeX: number;
  private readonly chargeSpeed: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    leftBound: number,
    rightBound: number,
    opts: { detectRangeX?: number; chargeSpeed?: number } = {},
  ) {
    super(scene, x, y, TEX.CHARGER);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // (x, y) is the surface it patrols — see HammerThrower for why this can't
    // just be the raw super(x, y) center position.
    standOnSurface(this, x, y);

    this.leftBound = leftBound;
    this.rightBound = rightBound;
    this.detectRangeX = opts.detectRangeX ?? CHARGER.DETECT_RANGE_X;
    this.chargeSpeed = opts.chargeSpeed ?? CHARGER.CHARGE_SPEED;
    this.setCollideWorldBounds(true);
    setLogicalBodySize(this, CHARGER.WIDTH, CHARGER.HEIGHT);
    this.setVelocityX(CHARGER.PATROL_SPEED * this.dir);
  }

  get dead(): boolean {
    return this.isDead;
  }

  update(player: Player): void {
    if (this.isDead) return;

    const charging = withinRange(
      player.x - this.x,
      player.y - this.y,
      this.detectRangeX,
      CHARGER.DETECT_RANGE_Y,
    );
    if (charging) this.dir = player.x < this.x ? -1 : 1;

    // Patrol bounds and wall bumps always win over the charge — it doesn't run
    // off its platform chasing the player.
    this.dir = reverseAtBounds(
      this.x,
      this.body.halfWidth,
      this.leftBound,
      this.rightBound,
      this.body.blocked.left || this.body.touching.left,
      this.body.blocked.right || this.body.touching.right,
      this.dir,
    );

    this.setVelocityX((charging ? this.chargeSpeed : CHARGER.PATROL_SPEED) * this.dir);
    this.setFlipX(this.dir < 0);
  }

  /** Squash and remove after being stomped. */
  squash(): void {
    if (this.isDead) return;
    this.isDead = true;
    squashAndDestroy(this.scene, this, { knockback: true });
  }
}
