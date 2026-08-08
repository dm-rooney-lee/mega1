import type { LevelDef } from "./types";

/**
 * Level 4 — "Traps": the state-machine hazards (group C), introduced one at a
 * time. Pop-up-spike rhythm → a thwomp corridor → an arrow gauntlet with cover.
 * No turrets here — projectile enemies get their own level (5) so the ramp from
 * level 3 stays gentle. Coordinates are world pixels; expect to playtest-tune.
 */
export const level4: LevelDef = {
  name: "Traps",
  worldWidth: 2400,
  worldHeight: 540,
  playerSpawn: { x: 70, y: 420 },
  platforms: [
    // Pop-up-spike stretch (learn the telegraph → rise rhythm).
    { x: 0, y: 496, width: 700, height: 44 },
    // Thwomp corridor.
    { x: 700, y: 496, width: 500, height: 44 },
    { x: 700, y: 0, width: 500, height: 110 }, // ceiling the thwomp hangs from
    // Arrow gauntlet with a cover pillar to wait behind.
    { x: 1200, y: 496, width: 600, height: 44 },
    { x: 1440, y: 360, width: 40, height: 136 }, // cover pillar
    // Run-out to the goal.
    { x: 1800, y: 496, width: 600, height: 44 },
  ],
  enemies: [{ x: 1300, y: 456 }],
  spikes: [],
  hazards: [
    // Two pop-up spikes, phase-staggered into a rhythm (both telegraph first).
    { kind: "popupSpike", x: 300, y: 496, tiles: 2, phase: 0 },
    { kind: "popupSpike", x: 520, y: 496, tiles: 2, phase: 0.5 },

    // Thwomp slamming into the corridor floor; pass under during its slow return.
    {
      kind: "thwomp",
      x: 940, y: 110, width: 70, height: 70,
      dropDistance: 300, detectWidth: 90,
    },

    // Arrow shooter firing left across the gauntlet — wait behind the pillar.
    // Stands on the ground, which puts its arrows at chest height: cover is the
    // answer because standing in the open is not survivable.
    { kind: "arrowShooter", x: 1770, y: 496, direction: -1, intervalMs: 1700 },
  ],
  goal: { x: 2280, y: 496 },
};
