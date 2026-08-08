import type { LevelDef } from "./types";

/**
 * Stage 6 — precision jumps across narrow floating platforms, plus two cannons
 * (one at the sky-high crest, one on the final ground run) and a shield pickup
 * to soak a hit on the way to the crest. Ported from the `level2` branch's
 * cannon/shield stage (originally authored as a second stage before the main
 * line grew stages 2-5, hence the renumbering).
 */
export const level6: LevelDef = {
  name: "6 — Bombardment",
  worldWidth: 2600,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    // Ground split by two pits: PIT1=680..800, PIT2=1880..1980.
    { x: 0, y: 496, width: 680, height: 44 },
    { x: 800, y: 496, width: 1080, height: 44 },
    { x: 1980, y: 496, width: 620, height: 44 },
    // Bullet-stop pillar: keeps the final cannon's lane to ~300px. Without it the
    // chest-height shots reach back across the whole stage and arrive in areas the
    // player has not seen yet.
    { x: 2040, y: 452, width: 24, height: 44 },
    // Narrow floating platforms (90-120px).
    { x: 340, y: 380, width: 110, height: 24 },
    { x: 620, y: 330, width: 90, height: 24 },
    { x: 900, y: 360, width: 110, height: 24 },
    { x: 1080, y: 270, width: 100, height: 24 }, // shield pickup here
    { x: 1260, y: 220, width: 100, height: 24 }, // crest — cannon #2
    { x: 1440, y: 300, width: 110, height: 24 },
    { x: 1700, y: 380, width: 110, height: 24 },
    { x: 2100, y: 360, width: 120, height: 24 },
  ],
  enemies: [
    { x: 960, y: 346 }, // on the x=900 platform
    { x: 1300, y: 482 }, // mid ground segment
    { x: 1750, y: 366 }, // on the x=1700 platform
  ],
  spikes: [
    { x: 1000, y: 472, tiles: 2 },
    { x: 1500, y: 472, tiles: 2 },
  ],
  hazards: [
    // Crest cannon, parked at the crest's right end so its leftward lane sweeps
    // the crest itself — the shield picked up just below is what buys a mistake.
    { kind: "cannon", x: 1340, y: 220, direction: "left" },
    { kind: "cannon", x: 2360, y: 496, direction: "left" }, // final ground run
  ],
  shieldPickups: [{ x: 1120, y: 250 }], // on the x=1080 platform, just before the crest
  goal: { x: 2540, y: 496 },
};
