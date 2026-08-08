import type { LevelDef } from "./types";

/**
 * Level 3 — "Machines": the platform/movement content (group A) plus a pendulum.
 * Conveyor → moving platform over a pit → pendulum walkway → crumbling bridge →
 * spring over a wall → goal. Coordinates are world pixels; expect to playtest-tune.
 */
export const level3: LevelDef = {
  name: "3 — Machines",
  worldWidth: 2800,
  worldHeight: 540,
  playerSpawn: { x: 70, y: 420 },
  platforms: [
    // Start, then a conveyor that pushes you along (stand still = carried right).
    { x: 0, y: 496, width: 600, height: 44 },
    { x: 600, y: 496, width: 320, height: 44, type: "conveyor", direction: 1, beltSpeed: 160 },

    // Pit 920..1080, crossed by a horizontal moving platform.
    {
      x: 940, y: 470, width: 130, height: 22,
      type: "moving", axis: "horizontal", range: 130, speed: 85,
    },

    // Walkway guarded by a pendulum (see hazards).
    { x: 1080, y: 496, width: 360, height: 44 },

    // Pit 1440..1620, crossed by two crumbling platforms (they fall — keep moving).
    { x: 1450, y: 470, width: 110, height: 22, type: "fake", collapseMs: 320, respawn: true },
    { x: 1590, y: 470, width: 110, height: 22, type: "fake", collapseMs: 320, respawn: true },

    // Ground with a spring; a tall wall blocks the path — bounce over it.
    { x: 1620, y: 496, width: 400, height: 44 },
    { x: 1880, y: 472, width: 60, height: 24, type: "spring", power: -1000 },
    { x: 2040, y: 300, width: 40, height: 240 }, // wall

    // Landing + run to the goal.
    { x: 2120, y: 496, width: 680, height: 44 },
  ],
  enemies: [
    { x: 300, y: 456 },
    { x: 1350, y: 456 }, // past the spikes, so it patrols 1276..1440 (see spikes below)
    { x: 2400, y: 456 },
  ],
  spikes: [
    { x: 1180, y: 472, tiles: 3 }, // under the pendulum — don't dawdle
  ],
  hazards: [
    // Hung low enough that its head dips into a standing player: from the old
    // anchor the ball bottomed out 22px above their head, so waiting underneath
    // was free. Lowering the anchor rather than lengthening the chain keeps the
    // authored swing width and timing — a longer chain would widen the arc too.
    {
      kind: "pendulum",
      x: 1260, y: 280,
      length: 170, amplitudeDeg: 58, periodMs: 2100,
    },
  ],
  goal: { x: 2680, y: 496 },
};
