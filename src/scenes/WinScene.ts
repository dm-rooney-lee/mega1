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
      .text(cx, 200, "ALL LEVELS CLEAR!", {
        fontFamily: "monospace",
        fontSize: "52px",
        color: "#00e436",
        fontStyle: "bold",
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

    const replay = () => {
      this.registry.set("levelIndex", 0); // start a fresh run from level 1
      this.scene.start("GameScene");
    };
    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", replay);
    kb.once("keydown-ENTER", replay);
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", replay);
  }
}
