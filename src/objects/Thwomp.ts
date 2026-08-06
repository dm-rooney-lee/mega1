import Phaser from "phaser";
import { COLORS, DEPTH, THWOMP, TEX } from "../config";
import { shakeCamera } from "../display";
import type { Player } from "./Player";
import { playRockDrop } from "../audio";

type ThwompState = "idle" | "telegraph" | "dropping" | "bottom" | "rising";

/**
 * C-4 — a crusher. Waits at the top; when the player passes underneath it flashes
 * (telegraph), slams down fast, waits, then crawls back up slowly. It's deadly
 * only while slamming down — the slow return is a safe passing window (the puzzle).
 * A camera shake sells the impact.
 *
 * Kinematic + overlap-only (no collider): the scene checks `deadly` in the
 * overlap so the safe phases pass through cleanly.
 */
export class Thwomp extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private mode: ThwompState = "idle";
  private readonly homeY: number;
  private readonly dropDistance: number;
  private readonly detectWidth: number;
  private readonly dropSpeed: number;
  private readonly returnSpeed: number;
  private readonly bottomWaitMs: number;
  private travelled = 0;
  private timerMs = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    opts: {
      dropDistance?: number;
      detectWidth?: number;
      dropSpeed?: number;
      returnSpeed?: number;
      bottomWaitMs?: number;
    } = {},
  ) {
    super(scene, x + width / 2, y + height / 2, TEX.THWOMP);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.HAZARD);

    this.setDisplaySize(width, height);
    this.body.setSize(this.width, this.height);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    this.homeY = this.y;
    this.dropDistance = opts.dropDistance ?? THWOMP.DROP_DISTANCE;
    this.detectWidth = opts.detectWidth ?? THWOMP.DETECT_WIDTH;
    this.dropSpeed = opts.dropSpeed ?? THWOMP.DROP_SPEED;
    this.returnSpeed = opts.returnSpeed ?? THWOMP.RETURN_SPEED;
    this.bottomWaitMs = opts.bottomWaitMs ?? THWOMP.BOTTOM_WAIT_MS;
  }

  /** Only the fast slam kills; idle / telegraph / return are safe to pass. */
  get deadly(): boolean {
    return this.mode === "dropping";
  }

  update(dtMs: number, player: Player): void {
    const dtSec = dtMs / 1000;

    switch (this.mode) {
      case "idle": {
        const underneath =
          Math.abs(player.x - this.x) <= this.detectWidth / 2 &&
          player.y > this.body.bottom;
        if (underneath) {
          this.mode = "telegraph";
          this.timerMs = 0;
          this.setTint(COLORS.TELEGRAPH);
        }
        break;
      }
      case "telegraph": {
        this.timerMs += dtMs;
        // Flash on/off during the wind-up.
        this.setAlpha(this.timerMs % 120 < 60 ? 1 : 0.5);
        if (this.timerMs >= THWOMP.TELEGRAPH_MS) {
          this.clearTint();
          this.setAlpha(1);
          this.mode = "dropping";
          this.travelled = 0;
        }
        break;
      }
      case "dropping": {
        const step = this.dropSpeed * dtSec;
        this.y += step;
        this.travelled += step;
        if (this.travelled >= this.dropDistance) {
          this.y = this.homeY + this.dropDistance;
          this.mode = "bottom";
          this.timerMs = 0;
          shakeCamera(this.scene.cameras.main, 180, 0.012);
          playRockDrop(this.scene);
        }
        break;
      }
      case "bottom": {
        this.timerMs += dtMs;
        if (this.timerMs >= this.bottomWaitMs) this.mode = "rising";
        break;
      }
      case "rising": {
        this.y -= this.returnSpeed * dtSec;
        if (this.y <= this.homeY) {
          this.y = this.homeY;
          this.mode = "idle";
        }
        break;
      }
    }
  }
}
