import Phaser from "phaser";
import { COLORS, DEPTH, TEX, TRAP_FLOOR } from "../config";
import { trapFloorPhase } from "../levels/motion";

/**
 * F-2 — a floor tile disguised as normal ground (reuses the "fake" texture) that
 * auto-cycles forever: solid -> warn -> solid -> warn -> open -> repeat. Only
 * "open" disables the body; falling through relies entirely on the scene's
 * existing fall-off-the-world death check, not any logic in this class. Must be
 * placed directly over a real pit (nothing solid underneath) — see level design
 * notes in the level7 spec.
 */
export class TrapFloor extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.StaticBody;

  private readonly telegraphMs: number;
  private readonly safeMs: number;
  private readonly openMs: number;
  private readonly phase01: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    opts: { telegraphMs?: number; safeMs?: number; openMs?: number; phase?: number } = {},
  ) {
    super(scene, x + width / 2, y + height / 2, TEX.FAKE);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(DEPTH.PLATFORM);

    this.telegraphMs = opts.telegraphMs ?? TRAP_FLOOR.TELEGRAPH_MS;
    this.safeMs = opts.safeMs ?? TRAP_FLOOR.SAFE_MS;
    this.openMs = opts.openMs ?? TRAP_FLOOR.OPEN_MS;
    this.phase01 = opts.phase ?? 0;

    this.setDisplaySize(width, height);
    this.body.setSize(width, height);
    this.body.updateFromGameObject();
  }

  update(elapsedMs: number): void {
    const phase = trapFloorPhase(
      elapsedMs,
      this.telegraphMs,
      this.safeMs,
      this.openMs,
      this.phase01,
    );

    switch (phase) {
      case "solid":
        this.body.enable = true;
        this.setVisible(true);
        this.clearTint();
        this.setAlpha(1);
        break;
      case "telegraph":
        this.body.enable = true;
        this.setVisible(true);
        this.setTint(COLORS.TELEGRAPH);
        this.setAlpha(0.5 + 0.5 * Math.abs(Math.sin(elapsedMs / 55)));
        break;
      case "open":
        this.body.enable = false;
        this.setVisible(false);
        break;
    }
  }
}
