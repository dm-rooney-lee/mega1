import type { LevelDef } from "./level1";

/**
 * Stage 2 — a measured step up from stage 1: longer (3000 vs 2400), two pits
 * instead of one, two spike fields instead of one, and five enemies instead of
 * three. Everything on the main ground route stays within the player's jump
 * envelope (~165px up, and the 140px pits are comfortably clearable at run
 * speed). The high platforms (y≈268/300) and the enemies perched on platforms
 * are optional — you can beat the stage on the ground alone, so the *mandatory*
 * difficulty bump is gentle while there's extra challenge for those who climb.
 */
export const level2: LevelDef = {
  name: "Double Trouble",
  worldWidth: 3000,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    // Ground in three segments separated by two 140px pits.
    { x: 0, y: 496, width: 560, height: 44 }, // start
    { x: 700, y: 496, width: 760, height: 44 }, // mid run (pit 560..700)
    { x: 1600, y: 496, width: 1400, height: 44 }, // long run to goal (pit 1460..1600)
    // Floating platforms — traversal + enemy perches, with two optional high hops.
    { x: 320, y: 384, width: 150, height: 24 },
    { x: 780, y: 372, width: 180, height: 24 },
    { x: 1040, y: 300, width: 140, height: 24 }, // optional high route
    { x: 1280, y: 372, width: 160, height: 24 },
    { x: 1720, y: 360, width: 200, height: 24 },
    { x: 2040, y: 268, width: 150, height: 24 }, // optional high route
    { x: 2360, y: 372, width: 180, height: 24 },
  ],
  enemies: [
    { x: 860, y: 332 }, // on the x=780 platform
    { x: 1050, y: 456 }, // patrols the mid ground segment
    { x: 1340, y: 332 }, // on the x=1280 platform
    { x: 1820, y: 320 }, // on the x=1720 platform
    { x: 2500, y: 456 }, // patrols the long final segment
  ],
  spikes: [
    { x: 1150, y: 472, tiles: 3 }, // on the mid ground segment
    { x: 2150, y: 472, tiles: 3 }, // on the long final segment
  ],
  goal: { x: 2860, y: 496 },
};
