import Phaser from "phaser";
import { centredScreen } from "./screen";
import { playBgm } from "../audio";
import { BGM } from "../config";

/** Shown on reaching the goal. Play again restarts; Esc returns to the menu. */
export class WinScene extends Phaser.Scene {
  constructor() {
    super("WinScene");
  }

  create(): void {
    playBgm(this, BGM.SCREEN);

    const screen = centredScreen(this);
    screen.add(200, 52, "YOU WIN!", "#00e436", true);
    screen.add(260, 20, "all stages cleared", "#fff1e8");
    screen.add(300, 22, "press SPACE / ENTER to play again", "#fff1e8");
    screen.add(340, 18, "ESC for menu", "#7d7460");
    screen.start();

    const playAgain = () => this.scene.start("GameScene", { level: 0 });
    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", playAgain);
    kb.once("keydown-ENTER", playAgain);
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", playAgain);
  }
}
