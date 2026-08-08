import Phaser from "phaser";
import { COLORS, DEPTH, DROPPER, FALLING_ROCK, TEX } from "../config";
import type { Player } from "./Player";
import { TEXTURE_SCALE } from "../display";
import { standOnSurface } from "./mount";
import { isBeneath } from "./proximity";
import { squashAndDestroy } from "./squash";
import { FallingRock } from "./FallingRock";

type DropperState = "idle" | "telegraph" | "cooldown";

/**
 * A mounted launcher (fixed in place, like Turret) that drops a
 * FallingRock straight down once the player passes beneath it. Stompable
 * from above, same as Turret.
 */
export class Dropper extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly rocks: Phaser.Physics.Arcade.Group;
  private readonly detectRangeX: number;
  private readonly telegraphMs: number;
  private readonly perchThickness: number;
  private mode: DropperState = "idle";
  private phaseElapsedMs = 0;
  private isDead = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    rocks: Phaser.Physics.Arcade.Group,
    opts: { detectRangeX?: number; telegraphMs?: number; perchThickness?: number } = {},
  ) {
    super(scene, x, y, TEX.DROPPER);
    this.setScale(1 / TEXTURE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.ENEMY);

    this.rocks = rocks;
    this.detectRangeX = opts.detectRangeX ?? DROPPER.DETECT_RANGE_X;
    this.telegraphMs = opts.telegraphMs ?? DROPPER.TELEGRAPH_MS;
    this.perchThickness = opts.perchThickness ?? DROPPER.PERCH_THICKNESS;

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // (x, y) is the surface it stands on, same convention as Turret/Cannon.
    standOnSurface(this, x, y);
  }

  get dead(): boolean {
    return this.isDead;
  }

  update(dtMs: number, player: Player): void {
    if (this.isDead) return;

    if (this.mode === "telegraph") {
      this.phaseElapsedMs += dtMs;
      this.setAlpha(this.phaseElapsedMs % 120 < 60 ? 1 : 0.5);
      if (this.phaseElapsedMs >= this.telegraphMs) {
        this.setAlpha(1);
        this.clearTint();
        this.dropRock();
        this.mode = "cooldown";
        this.phaseElapsedMs = 0;
      }
      return;
    }

    if (this.mode === "cooldown") {
      this.phaseElapsedMs += dtMs;
      if (this.phaseElapsedMs >= DROPPER.COOLDOWN_MS) this.mode = "idle";
      return;
    }

    if (isBeneath(player.x - this.x, player.y, this.body.bottom, this.detectRangeX)) {
      this.mode = "telegraph";
      this.phaseElapsedMs = 0;
      this.setTint(COLORS.TELEGRAPH);
    }
  }

  /** Destroyed by a stomp: stop and squash, same as Turret. */
  kill(): void {
    if (this.isDead) return;
    this.isDead = true;
    squashAndDestroy(this.scene, this);
  }

  private dropRock(): void {
    // Clear the perch's own thickness plus the rock's own radius before it can
    // hit terrain, or it lands on the very perch it just dropped from and
    // self-destructs before ever falling.
    const rockY =
      this.y +
      this.displayHeight / 2 +
      this.perchThickness +
      FALLING_ROCK.DIAMETER / 2 +
      2; // a couple px of margin so it doesn't spawn touching the perch's edge exactly
    const rock = new FallingRock(this.scene, this.x, rockY);
    this.rocks.add(rock);
  }
}
