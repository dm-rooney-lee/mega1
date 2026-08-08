import type { LevelDef } from "./types";

/**
 * Stage 8 — level6's cannon/shield idea doubled in length (2600 -> 5200px) and
 * escalated across four zones: warm-up (cannon recap) -> gearworks (the new
 * Gear hazard alone) -> trapped ground (the new TrapFloor hazard alone) ->
 * finale (cannon + gear + trap floor together). No checkpoints, same as every
 * other stage — dying restarts the whole level. Coordinates are world pixels;
 * expect to playtest-tune (same convention as level3/level6).
 */
export const level8: LevelDef = {
  name: "8 — Cogs & Pitfalls",
  worldWidth: 5200,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    // --- Zone 1: warm-up (0-1400) — level6 opener recap. Ground split by PIT1=640..760.
    { x: 0, y: 496, width: 640, height: 44 },
    { x: 760, y: 496, width: 640, height: 44 },
    { x: 300, y: 380, width: 110, height: 24 },
    { x: 560, y: 330, width: 90, height: 24 },
    { x: 820, y: 360, width: 130, height: 24 }, // enemy patrol
    { x: 1050, y: 260, width: 110, height: 24 }, // crest — cannon
    { x: 1300, y: 340, width: 110, height: 24 },

    // --- Zone 2: gearworks (1400-2820). PIT2=1900..2020, PIT3=2600..2720.
    { x: 1400, y: 496, width: 500, height: 44 },
    { x: 2020, y: 496, width: 580, height: 44 },
    { x: 2720, y: 496, width: 100, height: 44 },
    { x: 1560, y: 380, width: 110, height: 24 },
    { x: 1760, y: 320, width: 100, height: 24 }, // shield pickup here
    { x: 1960, y: 260, width: 100, height: 24 }, // crest over PIT2
    { x: 2160, y: 340, width: 110, height: 24 },
    { x: 2400, y: 400, width: 110, height: 24 },
    { x: 2560, y: 340, width: 100, height: 24 },

    // --- Zone 3: trapped ground (2820-4000). Safe islands alternating with trap
    // floors; every trap floor sits directly on the ground line with nothing
    // underneath it, so an open trap floor is a real pit.
    { x: 2820, y: 496, width: 100, height: 44 },
    { x: 2920, y: 496, width: 120, height: 44, type: "trapfloor", phase: 0 },
    { x: 3040, y: 496, width: 80, height: 44 },
    { x: 3120, y: 496, width: 120, height: 44, type: "trapfloor", phase: 0.4 },
    { x: 3240, y: 496, width: 100, height: 44 }, // spikes here
    { x: 3340, y: 496, width: 140, height: 44, type: "trapfloor", phase: 0.7 },
    { x: 3480, y: 496, width: 80, height: 44 },
    { x: 3560, y: 496, width: 120, height: 44, type: "trapfloor", phase: 0.15 },
    { x: 3680, y: 496, width: 320, height: 44 },

    // --- Zone 4: finale (4000-5200) — cannon + gear + trap floor together.
    // PIT4=4260..4360.
    { x: 4000, y: 496, width: 260, height: 44 },
    { x: 4000, y: 430, width: 24, height: 66 }, // bullet-stop pillar: confines zone-4 cannon fire to zone 4, doesn't block zone-3
    { x: 4360, y: 496, width: 140, height: 44 },
    { x: 4500, y: 496, width: 120, height: 44, type: "trapfloor", phase: 0.5 },
    { x: 4620, y: 496, width: 580, height: 44 }, // final run — cannon fires here
    { x: 4300, y: 360, width: 110, height: 24 }, // escape route over PIT4
    { x: 4700, y: 330, width: 110, height: 24 },
    { x: 4900, y: 380, width: 110, height: 24 },
  ],
  enemies: [
    { x: 880, y: 346 }, // zone 1, on the x=820 platform
    { x: 3720, y: 456 }, // zone 3, on the x=3680 ground
    { x: 4420, y: 456 }, // zone 4, on the x=4360 ground
  ],
  spikes: [
    { x: 1000, y: 472, tiles: 2 }, // zone 1
    { x: 3260, y: 472, tiles: 1 }, // zone 3, on a "safe" island
  ],
  hazards: [
    // Zone 1 crest cannon, at the crest's right end so its leftward lane sweeps
    // the crest the player has to cross.
    { kind: "cannon", x: 1140, y: 260, direction: "left" },
    // Zone 2, riding the rail between the x=1760 and x=1960 platforms. It starts
    // far enough left to sweep the whole shield platform: from x=1860 it only
    // reached that platform's last few pixels, so standing on it was safe and the
    // shield was free.
    {
      kind: "gear",
      x: 1790,
      y: 300,
      axis: "horizontal",
      range: 170,
      speed: 90,
    },
    {
      kind: "gear",
      x: 2335,
      y: 330,
      axis: "vertical",
      range: 140,
      speed: 90,
    }, // zone 2, between the x=2160 and x=2400 platforms
    {
      kind: "gear",
      x: 4855,
      y: 300,
      axis: "vertical",
      range: 150,
      speed: 100,
    }, // zone 4, between the x=4700 and x=4900 platforms
    { kind: "cannon", x: 4960, y: 496, direction: "left" }, // zone 4 final ground run
  ],
  shieldPickups: [{ x: 1810, y: 295 }], // on the x=1760 platform, zone 2
  goal: { x: 5140, y: 496 },
};
