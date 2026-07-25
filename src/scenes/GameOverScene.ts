import Phaser from "phaser";
import { GAME } from "../config";

/** Shown on death. Retry restarts the level; Esc returns to the menu. */
export class GameOverScene extends Phaser.Scene {
  private level = 0;

  constructor() {
    super("GameOverScene");
  }

  /** The stage the player died on, so retry restarts that same stage. */
  init(data: { level?: number }): void {
    this.level = data.level ?? 0;
  }

  create(): void {
    const cx = GAME.WIDTH / 2;

    this.add
      .text(cx, 200, "YOU DIED", {
        fontFamily: "monospace",
        fontSize: "56px",
        color: "#ff004d",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 300, "press SPACE / ENTER to retry", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#fff1e8",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 340, "ESC for menu", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#7d7460",
      })
      .setOrigin(0.5);

    const retry = () => this.scene.start("GameScene", { level: this.level });
    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", retry);
    kb.once("keydown-ENTER", retry);
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", retry);
  }
}
