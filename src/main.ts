import Phaser from "phaser";
// Latin only — every label on the screens is ASCII, and the other subsets are
// several times the size for glyphs this game never draws.
import "@fontsource/press-start-2p/latin-400.css";
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
  // Textures are drawn at TEXTURE_SCALE times their logical size and shrunk back
  // down on screen (see display.ts), so nearest-neighbour scaling (what
  // `pixelArt: true` forces) would show visible row-dropping artifacts on the
  // downscale. Smooth filtering is needed regardless of whether the art itself
  // uses curves or blocky pixel-grid shapes.
  render: {
    antialias: true,
    roundPixels: false,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: PHYSICS.GRAVITY_Y },
      debug: false,
      // Arcade advances in fixed steps, and at 60 those steps do not line up with
      // the display: some frames get two, some none, and the resulting stutter is
      // plainly visible now that the picture is sharp. Halving the step evens it
      // out (measured: worst-case wobble 19px -> 6px) and matches 120Hz screens.
      // It also lands jumps 2.8px closer to their theoretical height — more
      // forgiving, never less, against the 136px the tallest rise asks for.
      fps: 120,
    },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene],
};

// Phaser bakes glyphs into a texture when it creates a Text object, so a font
// that arrives afterwards does not redraw labels already on screen — the title
// would stay in the fallback face for the life of the page. The stylesheet above
// declares `font-display: swap`, and this await is what stops that swap from
// being visible.
//
// A missing or broken font file settles this promise too; the CSS keeps
// `monospace` behind it, so the game still starts and still reads.
await document.fonts.load('16px "Press Start 2P"').catch(() => {});

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
