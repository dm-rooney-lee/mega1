import Phaser from "phaser";
import { GAME } from "../config";

/** Shown on death. Retry restarts the level; Esc returns to the menu. */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
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

    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", () => this.scene.start("GameScene"));
    kb.once("keydown-ENTER", () => this.scene.start("GameScene"));
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", () => this.scene.start("GameScene"));
  }
}
