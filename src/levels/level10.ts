import type { LevelDef } from "./types";

/**
 * Level 10 — "Endgame": the final stage, 7200px (3x stage 1's 2400px, matching
 * stage 9). Where stage 9 introduced each of the four new enemies one at a
 * time, this stage combines them with each other and with the older mechanics
 * from the very first section, escalating into a dense finale:
 *
 *   §1  0..1000     quick pendulum + vertical-gear open (faster pace than stage 9's)
 *   §2  1000..2200  hammerThrower and charger share one corridor, split by a spike
 *   §3  2200..3400  flyer overhead while a staircase climbs to a crest cannon + aiming turret
 *   §4  3400..4600  dropper, paired with a trap floor and a crumbling bridge
 *   §5  4600..6000  the total-war section: every stages-9-10 enemy plus a thwomp
 *                   and pop-up spikes, all in one long corridor
 *   §6  6000..7200  cannon + spring-over-wall + a final aiming turret, then the goal
 *
 * Reachability: same envelope as stage 9 (~165px up / ~250px across at run
 * speed) — every mandatory rise here is <=136px (the §3 staircase climbs in
 * three <=116px steps) and every unbridged pit <=120px.
 */
export const level10: LevelDef = {
  name: "Endgame",
  worldWidth: 7200,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    // --- §1 quick pendulum + gear open (0-1000) ---------------------------
    { x: 0, y: 496, width: 1000, height: 44 },

    // --- §2 hammerThrower + charger, split by a spike (1000-2200) --------
    // Pit A 1000..1120 (120px).
    { x: 1120, y: 496, width: 1080, height: 44 },

    // --- §3 flyer overhead + staircase to a crest cannon/turret (2200-3400) ---
    // Pit B 2200..2320 (120px).
    { x: 2320, y: 496, width: 1080, height: 44 },
    { x: 2600, y: 380, width: 100, height: 24 }, // step 1, rise 116
    { x: 2760, y: 320, width: 100, height: 24 }, // step 2, rise 60
    { x: 2900, y: 260, width: 110, height: 24 }, // crest — cannon + guarded shield, rise 60

    // --- §4 dropper + trap floor + crumbling bridge (3400-4600) -----------
    // Pit C 3400..3520 (120px).
    { x: 3520, y: 496, width: 100, height: 44 },
    { x: 3620, y: 496, width: 120, height: 44, type: "trapfloor", phase: 0.3 },
    { x: 3740, y: 496, width: 80, height: 44 },
    { x: 3820, y: 496, width: 90, height: 44, type: "fake", collapseMs: 320, respawn: true },
    { x: 3910, y: 496, width: 690, height: 44 },
    { x: 4200, y: 360, width: 140, height: 24 }, // dropper's perch, rise 136

    // --- §5 total war: every new enemy + thwomp + pop-ups + arrows (4600-6000) ---
    // Pit D 4600..4720 (120px).
    { x: 4720, y: 496, width: 1280, height: 44 },
    { x: 5000, y: 0, width: 150, height: 110 }, // ceiling the thwomp hangs from
    { x: 5400, y: 360, width: 120, height: 24 }, // perch shared by the flyer's low point and the dropper

    // --- §6 cannon + spring-over-wall + final turret + goal (6000-7200) ---
    // Pit E 6000..6120 (120px).
    { x: 6120, y: 496, width: 400, height: 44 },
    { x: 6520, y: 496, width: 60, height: 24, type: "spring" },
    { x: 6680, y: 220, width: 40, height: 320 }, // wall — only the spring clears it
    { x: 6720, y: 496, width: 480, height: 44 },
  ],
  enemies: [
    { x: 850, y: 456 }, // §1
    { x: 2400, y: 456 }, // §3, before the staircase
    { x: 4450, y: 456 }, // §4, past the dropper
    { x: 5150, y: 456 }, // §5, in the thick of it
    { x: 5950, y: 456 }, // §5, replaces the old arrow shooter near the x=5800 spike
    { x: 6200, y: 456 }, // §6, before the spring
    { x: 6820, y: 456 }, // §6, guarding the goal run
  ],
  spikes: [
    { x: 150, y: 472, tiles: 2 }, // §1 — an early warning this stage means business
    { x: 1650, y: 472, tiles: 2 }, // §2 — splits the hammerThrower/charger patrol territory
    { x: 3050, y: 472, tiles: 1 }, // §3, before the turret
    { x: 5800, y: 472, tiles: 2 }, // §5, caps the total-war patrol territory
    { x: 6250, y: 472, tiles: 1 }, // §6, before the spring
  ],
  hazards: [
    // §1 — a quick pendulum + vertical gear, faster than stage 9's introduction.
    { kind: "pendulum", x: 400, y: 280, length: 175, amplitudeDeg: 50, periodMs: 1800 },
    { kind: "gear", x: 700, y: 320, axis: "vertical", range: 120, speed: 100 },

    // §2 — hammerThrower and charger split by the x=1650 spike, so neither
    // strays into the other's territory.
    { kind: "hammerThrower", x: 1400, y: 496, throwIntervalMs: 1500 },
    { kind: "charger", x: 1900, y: 496, detectRangeX: 250, chargeSpeed: 200 },

    // §3 — a flyer sweeping overhead while the staircase climbs to a
    // shielded crest cannon and a fixed-direction turret.
    { kind: "flyer", x: 2500, y: 340, axis: "vertical", range: 130, speed: 100 },
    { kind: "cannon", x: 2955, y: 260, direction: "left" },
    { kind: "turret", x: 3200, y: 496, aimMode: "fixed", direction: -1, intervalMs: 1800 },

    // §4 — the first dropper of this stage, on its own perch.
    { kind: "dropper", x: 4270, y: 360, detectRangeX: 100 },

    // §5 — total war: every stages-9-10 enemy at once, plus a thwomp and
    // pop-up spikes, all sharing one long corridor. A plain patrol enemy (see
    // the `enemies` list, x=5950) closes it out, in place of an arrow shooter
    // that used to sit there.
    { kind: "thwomp", x: 5040, y: 110, width: 70, height: 70, dropDistance: 300, detectWidth: 90 },
    { kind: "hammerThrower", x: 4900, y: 496, throwIntervalMs: 1400 },
    { kind: "charger", x: 5250, y: 496, detectRangeX: 240, chargeSpeed: 200 },
    { kind: "flyer", x: 5650, y: 330, axis: "vertical", range: 150, speed: 100 }, // clear of the x=5400 perch below
    { kind: "dropper", x: 5470, y: 360, detectRangeX: 100 },
    { kind: "popupSpike", x: 5700, y: 496, tiles: 2, phase: 0 },

    // §6 — a callback cannon before the spring, then a final aiming turret
    // guarding the goal run.
    { kind: "cannon", x: 6350, y: 496, direction: "left" },
    { kind: "turret", x: 6900, y: 496, aimMode: "aim", projectileSpeed: 260, intervalMs: 1800 },
  ],
  shieldPickups: [{ x: 2955, y: 230 }], // on the x=2900 crest, right before §3's cannon
  goal: { x: 7150, y: 496 },
};
