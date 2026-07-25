import Phaser from "phaser";
import { CRUMBLE, DEPTH, TEX } from "../config";

type CrumbleState = "solid" | "collapsing" | "gone";

/**
 * C-1 / C-3 — a platform that looks solid but falls away shortly after you step
 * on it. One component covers both the "fake floor" and the "trapdoor":
 *   - collapseMs > 0 → wobbles as a warning, then drops (trapdoor / crumble).
 *   - collapseMs = 0 → drops the moment it's touched (pure fake floor).
 * With `respawn`, it comes back after a delay for repeated attempts.
 */
export class CrumblingPlatform extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.StaticBody;

  private mode: CrumbleState = "solid";
  private readonly collapseMs: number;
  private readonly respawn: boolean;
  private readonly homeX: number;
  private readonly homeY: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    opts: { collapseMs?: number; respawn?: boolean } = {},
  ) {
    super(scene, x + width / 2, y + height / 2, TEX.FAKE);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(DEPTH.PLATFORM);

    this.collapseMs = opts.collapseMs ?? CRUMBLE.COLLAPSE_MS;
    this.respawn = opts.respawn ?? false;
    this.homeX = this.x;
    this.homeY = this.y;

    this.setDisplaySize(width, height);
    this.body.setSize(width, height);
    this.body.updateFromGameObject();
  }

  /** Called from the player↔platform collider when the player lands on top. */
  trigger(): void {
    if (this.mode !== "solid") return;
    this.mode = "collapsing";

    if (this.collapseMs <= 0) {
      this.collapse();
      return;
    }

    // Telegraph: a nervous wobble before it gives way.
    this.scene.tweens.add({
      targets: this,
      angle: { from: -4, to: 4 },
      duration: 70,
      yoyo: true,
      repeat: Math.max(1, Math.floor(this.collapseMs / 140)),
    });
    this.scene.time.delayedCall(this.collapseMs, () => this.collapse());
  }

  private collapse(): void {
    this.mode = "gone";
    this.body.enable = false; // stop supporting the player
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 24,
      duration: 200,
      onComplete: () => {
        if (this.respawn) {
          this.scene.time.delayedCall(CRUMBLE.RESPAWN_MS, () => this.reset());
        } else {
          this.setVisible(false);
        }
      },
    });
  }

  private reset(): void {
    this.scene.tweens.killTweensOf(this);
    this.setPosition(this.homeX, this.homeY);
    this.setAngle(0);
    this.setAlpha(1);
    this.setVisible(true);
    this.body.enable = true;
    this.mode = "solid";
  }
}
