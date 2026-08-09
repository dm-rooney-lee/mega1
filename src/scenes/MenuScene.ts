import Phaser from "phaser";
import { levels } from "../levels/index";
import { resolveSpawnX, resolveStartLevel } from "../levels/startLevel";
import { addSettingsGear, centredScreen } from "./screen";
import { playBgm } from "../audio";
import { SCREEN_COLORS, TEX } from "../config";

/** Title screen. Press any key (or click/tap) to start the level. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    // Dev-only: `?stage=7` skips the title screen and drops straight into that
    // stage, and `?stage=7&x=3600` also starts you partway across it instead of
    // at its spawn point. Reload with different numbers to switch — no dev-server
    // restart. Stripped from production builds (same guard as `main.ts`).
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search);
      const askedStage = params.get("stage");
      if (askedStage) {
        const requested = resolveStartLevel(askedStage, levels.length);
        if (requested === null) {
          console.warn(
            `[dev] ?stage=${askedStage} is not a stage between 1 and ${levels.length}; showing the menu.`,
          );
        } else {
          const askedX = params.get("x");
          const worldWidth = levels[requested].worldWidth;
          const spawnX = resolveSpawnX(askedX, worldWidth);
          if (askedX && spawnX === null) {
            console.warn(
              `[dev] ?x=${askedX} is outside stage ${requested + 1} (0-${worldWidth}); using its normal spawn point.`,
            );
          }
          this.scene.start("GameScene", { level: requested, spawnX: spawnX ?? undefined });
          return;
        }
      }
    }

    // 타이틀에서는 음악이 앞에 나선다. 위의 개발용 분기로 타이틀을 건너뛸 때는
    // 여기 닿지 않고, 플레이 화면이 자기 볼륨으로 음악을 시작한다.
    playBgm(this);
    this.cameras.main.setBackgroundColor(SCREEN_COLORS.TITLE_SKY);

    const screen = centredScreen(this);
    screen.addImage(300, 1100, 180, TEX.UI_TITLE);
    screen.addTitle(
      150,
      64,
      "Let's go!!",
      SCREEN_COLORS.TITLE_LOGO,
      SCREEN_COLORS.TITLE_LOGO_EDGE,
      8,
    );
    const prompt = screen.add(445, 18, "press any key to start", SCREEN_COLORS.PROMPT);
    screen.start();
    addSettingsGear(this);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const start = () => this.scene.start("GameScene", { level: 0 });
    this.input.keyboard!.once("keydown", start);
    this.input.once("pointerdown", start);
  }
}
