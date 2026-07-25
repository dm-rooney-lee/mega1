import Phaser from "phaser";
import { GAME, PHYSICS, COLORS } from "./config";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { WinScene } from "./scenes/WinScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: COLORS.BACKGROUND,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: PHYSICS.GRAVITY_Y },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene],
};

const game = new Phaser.Game(config);

// Dev-only handle for quick manual testing (e.g. jumping between levels in the
// console). Stripped from production builds.
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}
