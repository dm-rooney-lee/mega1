import Phaser from "phaser";
import { centredScreen } from "./screen";
import { playBgm } from "../audio";
import { DEPTH, SCREEN_COLORS, TEX } from "../config";
import { TEXTURE_SCALE } from "../display";

/** Shown on reaching the goal. Play again restarts; Esc returns to the menu. */
export class WinScene extends Phaser.Scene {
  constructor() {
    super("WinScene");
  }

  create(): void {
    playBgm(this);
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
    // 이 화면은 아래 this.input.once("pointerdown", playAgain)로 "아무 데나
    // 클릭하면 다시하기"를 걸어 둔다. 톱니바퀴 클릭이 그 리스너까지 함께
    // 발동시키면 설정을 열려는 클릭이 동시에 다시하기를 실행시켜 버리므로,
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

    const playAgain = () => this.scene.start("GameScene", { level: 0 });
    const kb = this.input.keyboard!;
    kb.once("keydown-SPACE", playAgain);
    kb.once("keydown-ENTER", playAgain);
    kb.once("keydown-ESC", () => this.scene.start("MenuScene"));
    this.input.once("pointerdown", playAgain);
  }
}
