import Phaser from "phaser";
import { COLORS, DEPTH, POPUP_SPIKE, TILE, TEX } from "../config";
import { popupSpikePhase } from "../levels/motion";
import { TEXTURE_SCALE } from "../display";
import { setLogicalBodySize, setLogicalBodyOffset } from "./hitbox";

/**
 * C-2 — spikes hidden in the floor that rise on a cycle. Deadly only while
 * "active"; a telegraph phase (blinking red just above the surface) always warns
 * first, so it's fair. The cycle is a pure function of scene time, so multiple
 * pop-ups can be phase-staggered into a rhythm.
 *
 * Tiles are added to a shared physics group (the scene wires one overlap→death
 * for the group); their bodies are enabled only during the active phase.
 */
export class PopupSpike {
  private readonly tiles: Phaser.Physics.Arcade.Image[] = [];
  private readonly hiddenY: number;
  private readonly activeY: number;
  private readonly telegraphMs: number;
  private readonly activeMs: number;
  private readonly hiddenMs: number;
  private readonly phase01: number;

  constructor(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    x: number,
    y: number,
    opts: {
      tiles?: number;
      telegraphMs?: number;
      activeMs?: number;
      hiddenMs?: number;
      phase?: number;
    } = {},
  ) {
    const count = opts.tiles ?? 1;
    this.telegraphMs = opts.telegraphMs ?? POPUP_SPIKE.TELEGRAPH_MS;
    this.activeMs = opts.activeMs ?? POPUP_SPIKE.ACTIVE_MS;
    this.hiddenMs = opts.hiddenMs ?? POPUP_SPIKE.HIDDEN_MS;
    this.phase01 = opts.phase ?? 0;

    // (x, y) is the ground surface top. Raised = a full spike above the surface;
    // hidden = tucked below it.
    this.activeY = y - TILE / 2;
    this.hiddenY = y + TILE / 2;

    for (let i = 0; i < count; i++) {
      const t = scene.physics.add
        .image(x + i * TILE + TILE / 2, this.hiddenY, TEX.SPIKE)
        .setScale(1 / TEXTURE_SCALE)
        .setDepth(DEPTH.HAZARD);
      const body = t.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      // Only the pointy upper portion hurts (matches the static spikes).
      setLogicalBodySize(t, 28, 18);
      setLogicalBodyOffset(t, 2, 14);
      body.enable = false;
      t.setVisible(false);
      group.add(t);
      this.tiles.push(t);
    }
  }

  update(elapsedMs: number): void {
    const phase = popupSpikePhase(
      elapsedMs,
      this.telegraphMs,
      this.activeMs,
      this.hiddenMs,
      this.phase01,
    );

    for (const t of this.tiles) {
      const body = t.body as Phaser.Physics.Arcade.Body;
      switch (phase) {
        case "hidden":
          t.setVisible(false);
          body.enable = false;
          t.y = this.hiddenY;
          t.clearTint();
          break;
        case "telegraph": {
          // Peek out and blink red — the warning. Not deadly yet.
          t.setVisible(true);
          body.enable = false;
          t.y = this.hiddenY - 6;
          t.setTint(COLORS.TELEGRAPH);
          t.setAlpha(0.35 + 0.35 * Math.abs(Math.sin(elapsedMs / 55)));
          break;
        }
        case "active":
          t.setVisible(true);
          t.setAlpha(1);
          t.clearTint();
          t.y = this.activeY;
          body.enable = true;
          break;
      }
    }
  }
}
