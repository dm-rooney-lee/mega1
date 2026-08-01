import Phaser from "phaser";
import { GAME } from "../config";
import { levels } from "../levels/index";
import { resolveSpawnX, resolveStartLevel } from "../levels/startLevel";

/** Title screen. Press any key (or click/tap) to start the level. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    // Dev-only: `?stage=7` skips the title screen and drops straight into that
    // stage, and `?stage=7&x=3600` also starts you partway across it instead of
    // at its spawn point. Reload with different numbers to switch — no dev-server
    // restart. Stripped from production builds (same guard as `main.ts`).
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const askedStage = params.get("stage");
      if (askedStage) {
        const requested = resolveStartLevel(askedStage, levels.length);
        if (requested === null) {
          console.warn(
            `[dev] ?stage=${askedStage} is not a stage between 1 and ${levels.length}; showing the menu.`,
          );
        } else {
          const askedX = params.get("x");
          const worldWidth = levels[requested].worldWidth;
          const spawnX = resolveSpawnX(askedX, worldWidth);
          if (askedX && spawnX === null) {
            console.warn(
              `[dev] ?x=${askedX} is outside stage ${requested + 1} (0-${worldWidth}); using its normal spawn point.`,
            );
          }
          this.scene.start("GameScene", { level: requested, spawnX: spawnX ?? undefined });
          return;
        }
      }
    }

    const cx = GAME.WIDTH / 2;

    this.add
      .text(cx, 180, "PLATFORMER POC", {
        fontFamily: "monospace",
        fontSize: "56px",
        color: "#29adff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 250, "a tiny Phaser 4 platformer", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#fff1e8",
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, 360, "press any key to start", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#00e436",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const start = () => this.scene.start("GameScene", { level: 0 });
    this.input.keyboard!.once("keydown", start);
    this.input.once("pointerdown", start);
  }
}
