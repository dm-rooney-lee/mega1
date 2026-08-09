import Phaser from "phaser";
import { addSettingsGear, centredScreen } from "./screen";
import { playBgm } from "../audio";
import { SCREEN_COLORS, TEX } from "../config";
import { levels } from "../levels/index";
import { stageLabel } from "../levels/stageLabel";

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
    playBgm(this);

    const screen = centredScreen(this);
    this.cameras.main.setBackgroundColor(SCREEN_COLORS.DEATH_BG);

    // The ground the hazards stand on: a lighter half below, and a bright line
    // where the two meet. Both are painted here rather than baked into the
    // picture, because they have to reach both edges of a window whose width
    // varies (854-1100 logical units).
    screen.addBand(245, 540, SCREEN_COLORS.DEATH_BG_LOW);
    screen.addBand(245, 249, SCREEN_COLORS.DEATH_LINE);
    screen.addImage(210, 400, 70, TEX.UI_DEATH);
    screen.addTitle(
      130,
      80,
      "YOU DIED",
      SCREEN_COLORS.DEATH_TITLE,
      SCREEN_COLORS.DEATH_TITLE_EDGE,
      8,
    );
    screen.add(340, 30, "GAME OVER", SCREEN_COLORS.DEATH_SUBTITLE);
    screen.add(385, 20, stageLabel(this.level, levels.length), SCREEN_COLORS.PROMPT);
    screen.add(455, 16, "press SPACE / ENTER or TAP to retry", SCREEN_COLORS.PROMPT);
    screen.add(495, 14, "ESC for menu", SCREEN_COLORS.MUTED);
    screen.start();
    addSettingsGear(this);

    const retry = () =>
      this.scene.start("GameScene", { level: this.level, spawnX: this.spawnX });
    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", retry);
    kb.once("keydown-ENTER", retry);
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", retry);
  }
}
