import Phaser from "phaser";
import { centredScreen } from "./screen";
import { playBgm } from "../audio";
import { BGM, SCREEN_COLORS } from "../config";

/** Shown on death. Retry restarts the level; Esc returns to the menu. */
export class GameOverScene extends Phaser.Scene {
  private level = 0;
  private spawnX?: number;

  constructor() {
    super("GameOverScene");
  }

  /**
   * The stage the player died on, so retry restarts that same stage — carrying
   * the dev-only spawn-x override through with it.
   */
  init(data: { level?: number; spawnX?: number }): void {
    this.level = data.level ?? 0;
    this.spawnX = data.spawnX;
  }

  create(): void {
    playBgm(this, BGM.SCREEN);

    const screen = centredScreen(this);
    this.cameras.main.setBackgroundColor(SCREEN_COLORS.DEATH_BG);

    // The ground the hazards stand on: a lighter half below, and a bright line
    // where the two meet. Both are painted here rather than baked into the
    // picture, because they have to reach both edges of a window whose width
    // varies (854-1100 logical units).
    screen.addBand(245, 540, SCREEN_COLORS.DEATH_BG_LOW);
    screen.addBand(245, 249, SCREEN_COLORS.DEATH_LINE);
    screen.add(200, 80, "YOU DIED", "#ff004d", true);
    screen.add(300, 18, "press SPACE / ENTER to retry", "#fff1e8");
    screen.add(340, 14, "ESC for menu", "#7d7460");
    screen.start();

    const retry = () =>
      this.scene.start("GameScene", { level: this.level, spawnX: this.spawnX });
    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", retry);
    kb.once("keydown-ENTER", retry);
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", retry);
  }
}
