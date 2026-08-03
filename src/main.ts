import Phaser from "phaser";
import { PHYSICS, COLORS } from "./config";
import { computeDisplay } from "./display";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { WinScene } from "./scenes/WinScene";

const initial = computeDisplay(
  window.innerWidth,
  window.innerHeight,
  window.devicePixelRatio,
);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  // The game size *is* the canvas backing buffer, so it is sized in physical
  // pixels; `zoom` divides that back down to the CSS size that fills the window.
  // Scenes recover the logical coordinate space via camera zoom (see display.ts).
  width: initial.bufferWidth,
  height: initial.bufferHeight,
  backgroundColor: COLORS.BACKGROUND,
  scale: {
    // NONE, because every size here is computed rather than fitted: FIT would
    // letterbox and RESIZE would size the buffer in CSS pixels, losing density.
    mode: Phaser.Scale.NONE,
    zoom: 1 / initial.pixelRatio,
  },
  // The art is drawn as circles, rounded rects and triangles rather than pixel
  // art, so nearest-neighbour scaling (what `pixelArt: true` forces) turns every
  // curve into a staircase. Smooth filtering at native density is the right call.
  render: {
    antialias: true,
    roundPixels: false,
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

/**
 * Re-sizes the buffer to the window's physical pixels. Scenes pick the new
 * camera zoom up from the Scale Manager's RESIZE event.
 */
function applyDisplay(): void {
  const next = computeDisplay(
    window.innerWidth,
    window.innerHeight,
    window.devicePixelRatio,
  );
  // Set the zoom first: `resize` writes the canvas CSS size using it. The ratio
  // only actually changes when the window moves to a screen with a different one.
  game.scale.setZoom(1 / next.pixelRatio);
  game.scale.resize(next.bufferWidth, next.bufferHeight);
}

// Coalesce the burst of events a window drag produces into one resize per frame.
let resizeQueued = false;
window.addEventListener("resize", () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    applyDisplay();
  });
});

// Dev-only handle for quick manual testing (e.g. jumping between levels in the
// console). Stripped from production builds.
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}
