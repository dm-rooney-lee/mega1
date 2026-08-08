import type { LevelDef } from "./types";

/**
 * Level 5 — "Snipers": the projectile enemies (group D), eased in, then a finale
 * that combines them with a moving platform. FIXED turret on the approach (learn
 * to stomp / dodge a straight shot) → AIMING turret behind a cover pillar → a pit
 * you cross on a moving platform while a second aiming turret fires (time the
 * crossing off its telegraph). Aim locks at the telegraph, so it's "step out of
 * the line", not a homing lock-on. Coordinates are world pixels; tune in play.
 */
export const level5: LevelDef = {
  name: "Snipers",
  worldWidth: 2500,
  worldHeight: 540,
  playerSpawn: { x: 70, y: 420 },
  platforms: [
    // Approach, then a low ledge to read the turret's rhythm from.
    { x: 0, y: 496, width: 900, height: 44 },
    { x: 520, y: 400, width: 160, height: 24 }, // vantage ledge

    // Pit 900..1040, then the aiming-turret gauntlet with cover.
    { x: 1040, y: 496, width: 560, height: 44 },
    { x: 1240, y: 360, width: 40, height: 136 }, // cover pillar

    // Finale: pit 1600..1860 crossed by a moving platform, under sniper fire.
    {
      x: 1600, y: 452, width: 120, height: 22,
      type: "moving", axis: "horizontal", range: 160, speed: 95,
    },

    // Landing + run to the goal.
    { x: 1860, y: 496, width: 640, height: 44 },
  ],
  enemies: [{ x: 2250, y: 456 }],
  spikes: [],
  hazards: [
    // Fixed turret: fires straight left toward the approaching player; stompable.
    // On the ground so its shot crosses the route everyone takes, and clear of the
    // x=520..680 ledge — under that roof the jump tops out one pixel inside the
    // shot band, which would make the dodge this beat teaches impossible.
    { kind: "turret", x: 760, y: 496, aimMode: "fixed", direction: -1 },

    // Aiming turret behind the pillar: slower shot + long locked telegraph.
    {
      kind: "turret",
      x: 1520, y: 496,
      aimMode: "aim", projectileSpeed: 240, intervalMs: 2400,
    },

    // Second aiming turret past the pit — fires while you ride the platform across.
    {
      kind: "turret",
      x: 2100, y: 496,
      aimMode: "aim", projectileSpeed: 250, intervalMs: 2200,
    },
  ],
  goal: { x: 2400, y: 496 },
};
