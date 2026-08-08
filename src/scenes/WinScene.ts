import Phaser from "phaser";
import { centredScreen } from "./screen";
import { playBgm } from "../audio";
import { BGM, SCREEN_COLORS, TEX } from "../config";

/** Shown on reaching the goal. Play again restarts; Esc returns to the menu. */
export class WinScene extends Phaser.Scene {
  constructor() {
    super("WinScene");
  }

  create(): void {
    playBgm(this, BGM.SCREEN);
    this.cameras.main.setBackgroundColor(SCREEN_COLORS.WIN_BG);

    const screen = centredScreen(this);
    screen.addImage(270, 420, 180, TEX.UI_WIN);
    screen.addTitle(
      120,
      76,
      "YOU WIN!",
      SCREEN_COLORS.WIN_TITLE,
      SCREEN_COLORS.WIN_TITLE_EDGE,
      8,
    );
    screen.add(390, 28, "CONGRATULATIONS!", SCREEN_COLORS.PROMPT);
    screen.add(425, 18, "all stages cleared", SCREEN_COLORS.PROMPT);
    screen.add(475, 14, "press SPACE / ENTER or TAP to play again", SCREEN_COLORS.PROMPT);
    screen.add(510, 14, "ESC for menu", SCREEN_COLORS.MUTED);
    screen.start();

    const playAgain = () => this.scene.start("GameScene", { level: 0 });
    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", playAgain);
    kb.once("keydown-ENTER", playAgain);
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", playAgain);
  }
}
