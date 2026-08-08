import type { LevelDef } from "./types";

/**
 * Level 9 — "Uprising": the first of two closing stages, 7200px (3x stage 1's
 * 2400px, per the map-length request). Introduces the four new stages 9-10
 * enemies one at a time, each paired with an existing mechanic, then closes
 * with a stage-7-style recap of everything else:
 *
 *   §1  0..1000     warm-up recap (ground enemy, spikes, optional perches)
 *   §2  1000..2100  hammerThrower, paired with a conveyor + a moving-platform pit crossing
 *   §3  2100..3200  flyer, paired with a pendulum + a vertical gear
 *   §4  3200..4300  charger, paired with a trap floor, a thwomp corridor, and a crumbling bridge
 *   §5  4300..5600  dropper, paired with a shielded crest cannon and an aiming turret
 *   §6  5600..7200  recap gauntlet (pop-up spikes, a charger guarding a spring-over-wall) + a
 *                   reprise hammerThrower and a final cannon before the goal
 *
 * Reachability: the player's jump envelope is ~165px up / ~250px across at run
 * speed (same as level7), so every mandatory rise here is <=136px and every
 * unbridged pit <=130px. The one taller reach (ground -> dropper's perch, 136px)
 * sits right at that limit; wider pits (§2's 110px gap, §5's 130px gap) are
 * either within that same jump range or crossed on a moving platform.
 */
export const level9: LevelDef = {
  name: "9 — Uprising",
  worldWidth: 7200,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    // --- §1 warm-up recap (0-1000) ----------------------------------------
    { x: 0, y: 496, width: 1000, height: 44 },
    { x: 280, y: 380, width: 140, height: 24 }, // optional perch, rise 116
    { x: 620, y: 360, width: 140, height: 24 }, // optional perch, rise 136

    // --- §2 hammerThrower + conveyor + moving-platform pit crossing (1000-2100) ---
    // Pit A 1000..1120 (120px, plain jump).
    { x: 1120, y: 496, width: 260, height: 44 },
    { x: 1380, y: 496, width: 260, height: 44, type: "conveyor", direction: 1, beltSpeed: 150 },
    // Pit B 1640..1750 (110px) crossed on a moving platform that shuttles across it.
    {
      x: 1650, y: 470, width: 100, height: 22,
      type: "moving", axis: "horizontal", range: 60, speed: 80,
    },
    { x: 1750, y: 496, width: 350, height: 44 }, // hammerThrower patrols the whole span

    // --- §3 flyer + pendulum + vertical gear (2100-3200) ------------------
    // Pit C 2100..2220 (120px).
    { x: 2220, y: 496, width: 980, height: 44 },

    // --- §4 charger + trap floor + thwomp corridor + crumbling bridge (3200-4300) ---
    // Pit D 3200..3320 (120px).
    { x: 3320, y: 496, width: 200, height: 44 },
    { x: 3520, y: 496, width: 140, height: 44, type: "trapfloor", phase: 0 },
    { x: 3660, y: 496, width: 150, height: 44 }, // thwomp corridor floor
    { x: 3660, y: 0, width: 150, height: 110 }, // ceiling the thwomp hangs from
    { x: 3810, y: 496, width: 70, height: 44, type: "fake", collapseMs: 320, respawn: true },
    { x: 3880, y: 496, width: 420, height: 44 }, // charger patrols the whole span

    // --- §5 dropper + shielded crest cannon + aiming turret (4300-5600) ---
    // Pit E 4300..4430 (130px).
    { x: 4430, y: 496, width: 1170, height: 44 },
    { x: 4700, y: 360, width: 140, height: 24 }, // dropper's perch (rise 136 from the ground)
    { x: 4900, y: 310, width: 90, height: 24 }, // stepping stone up to the crest
    { x: 5000, y: 260, width: 110, height: 24 }, // crest — cannon + guarded shield

    // --- §6 recap gauntlet + reprise + goal (5600-7200) -------------------
    { x: 5600, y: 496, width: 400, height: 44 }, // pop-up spike ground
    { x: 6000, y: 496, width: 460, height: 44 }, // charger's ground, right up to the spring
    { x: 6300, y: 360, width: 40, height: 136 }, // jump obstacle before the spring
    { x: 6460, y: 496, width: 60, height: 24, type: "spring" },
    { x: 6620, y: 240, width: 40, height: 300 }, // wall — only the spring clears it
    { x: 6660, y: 496, width: 540, height: 44 }, // landing + reprise hammerThrower + goal
  ],
  enemies: [
    { x: 700, y: 456 }, // §1 recap
    { x: 1200, y: 456 }, // §2, before the conveyor
    { x: 3100, y: 456 }, // §3, past the pendulum/gear
    { x: 4550, y: 456 }, // §5, before the dropper's perch
    { x: 6740, y: 456 }, // §6, guarding the reprise
  ],
  spikes: [
    { x: 860, y: 472, tiles: 2 }, // §1
    { x: 2500, y: 472, tiles: 2 }, // §3, under the pendulum
    { x: 4150, y: 472, tiles: 2 }, // §4, on the charger's ground (narrows its patrol)
    { x: 5150, y: 472, tiles: 2 }, // §5, past the turret
  ],
  hazards: [
    // §2 — the first hammerThrower, patrolling its whole ground span.
    { kind: "hammerThrower", x: 1900, y: 496 },

    // §3 — a pendulum and a vertical gear sweeping the wide floor below.
    { kind: "pendulum", x: 2400, y: 290, length: 160, amplitudeDeg: 55, periodMs: 2000 },
    { kind: "gear", x: 2650, y: 330, axis: "vertical", range: 130, speed: 90 },
    // The first flyer: swoops from head height down near the floor and back.
    { kind: "flyer", x: 2900, y: 350, axis: "vertical", range: 140, speed: 90 },

    // §4 — a thwomp guarding the corridor, then the first charger past the crumbling bridge.
    { kind: "thwomp", x: 3700, y: 110, width: 70, height: 70, dropDistance: 300, detectWidth: 90 },
    { kind: "charger", x: 4050, y: 496 },

    // §5 — the first dropper on its perch, a shielded crest cannon, and an
    // aiming turret guarding the far end (exempt from the fixed-lane rule, so
    // it needs no cover pillar — see hazard-must-threaten.md).
    { kind: "dropper", x: 4770, y: 360 },
    { kind: "cannon", x: 5060, y: 260, direction: "left" },
    { kind: "turret", x: 5300, y: 496, aimMode: "aim", projectileSpeed: 250, intervalMs: 2000 },

    // §6 — the stage-7-style recap: staggered pop-up spikes, a charger guarding
    // the spring (replaces an arrow shooter that fired away from the player's
    // approach and so never actually threatened anyone), then a reprise
    // hammerThrower (faster than §2's) and a final cannon sweeping the goal run.
    { kind: "popupSpike", x: 5700, y: 496, tiles: 2, phase: 0 },
    { kind: "popupSpike", x: 5880, y: 496, tiles: 2, phase: 0.5 },
    { kind: "charger", x: 6420, y: 496 },
    { kind: "hammerThrower", x: 6900, y: 496, throwIntervalMs: 1400 },
    { kind: "cannon", x: 7100, y: 496, direction: "left" },
  ],
  shieldPickups: [{ x: 5055, y: 235 }], // on the x=5000 crest, right before §5's cannon
  goal: { x: 7140, y: 496 },
};
