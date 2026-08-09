import Phaser from "phaser";
import { centredScreen } from "./screen";
import { playBgm } from "../audio";
import { DEPTH, SCREEN_COLORS, TEX } from "../config";
import { TEXTURE_SCALE } from "../display";
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

    const gear = this.add
      .image(0, 0, TEX.UI_GEAR)
      .setScale(1 / TEXTURE_SCALE)
      .setDepth(DEPTH.HUD)
      .setInteractive({ useHandCursor: true });
    const repositionGear = () => gear.setPosition(this.scale.width - 28, 28);
    repositionGear();
    this.scale.on(Phaser.Scale.Events.RESIZE, repositionGear);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, repositionGear);
    });
    // 이 화면은 아래 this.input.once("pointerdown", retry)로 "아무 데나
    // 클릭하면 재시도"를 걸어 둔다. 톱니바퀴 클릭이 그 리스너까지 함께
    // 발동시키면 설정을 열려는 클릭이 동시에 재시도를 실행시켜 버리므로,
    // stopPropagation()으로 여기서 전파를 끊는다.
    gear.on(
      "pointerdown",
      (
        _pointer: Phaser.Input.Pointer,
        _localX: number,
        _localY: number,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        this.scene.pause();
        this.scene.run("SettingsScene", { returnKey: this.scene.key });
      },
    );

    const retry = () =>
      this.scene.start("GameScene", { level: this.level, spawnX: this.spawnX });
    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", retry);
    kb.once("keydown-ENTER", retry);
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", retry);
  }
}
