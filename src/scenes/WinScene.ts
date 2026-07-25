import Phaser from "phaser";
import { GAME } from "../config";

/** Shown on reaching the goal. Play again restarts; Esc returns to the menu. */
export class WinScene extends Phaser.Scene {
  constructor() {
    super("WinScene");
  }

  create(): void {
    const cx = GAME.WIDTH / 2;

    this.add
      .text(cx, 200, "YOU WIN!", {
        fontFamily: "monospace",
        fontSize: "52px",
        color: "#00e436",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 260, "all stages cleared", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#fff1e8",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 300, "press SPACE / ENTER to play again", {
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

    const playAgain = () => this.scene.start("GameScene", { level: 0 });
    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", playAgain);
    kb.once("keydown-ENTER", playAgain);
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", playAgain);
  }
}
