import type { LevelDef } from "./types";

/**
 * Level 7 — "Gauntlet": the finale, and at 5200px exactly double the length of
 * stage 6 (2600). Every content family gets one beat, in the order the earlier
 * stages taught them, so the length reads as a victory lap rather than filler:
 *
 *   §1  0..1100    conveyor pushing you into a pop-up-spike rhythm
 *   §2  1100..1780 crumbling bridge over a wide pit, then a two-pendulum gate
 *   §3  1780..3100 thwomp corridor, then an arrow gauntlet with cover
 *   §4  3100..4400 shield perch, then a moving-platform pit crossing under fire
 *   §5  4400..5200 aiming turret, spring over a wall, cannon-swept goal run
 *
 * Reachability: the player's jump envelope is ~165px up / ~250px across at run
 * speed, so every rise here is <=136px and every pit <=140px (the two wider pits
 * are crossed on crumbling or moving platforms). The spring runs at the default
 * SPRING.POWER — a ~316px rise, clear of the 240-high final wall.
 *
 * Cannon lanes are deliberately terminated by terrain (the §4 cover pillar and
 * the §5 wall). Cannonballs only die on static platforms or at the world edge,
 * so in a level this wide an unbounded lane would let a shot fired at t=0 drift
 * back into an area the player is still crossing — every lane here ends on a
 * solid face within ~700px of its cannon.
 */
export const level7: LevelDef = {
  name: "Gauntlet",
  worldWidth: 5200,
  worldHeight: 540,
  playerSpawn: { x: 70, y: 420 },
  platforms: [
    // --- §1 conveyor + pop-up spikes -------------------------------------
    { x: 0, y: 496, width: 420, height: 44 },
    // Belt runs right, straight into the pop-up rhythm — standing still is a trap.
    { x: 420, y: 496, width: 300, height: 44, type: "conveyor", direction: 1, beltSpeed: 150 },
    { x: 720, y: 496, width: 380, height: 44 }, // pop-up spike ground
    { x: 300, y: 372, width: 140, height: 24 }, // optional perch over the belt
    { x: 900, y: 360, width: 120, height: 24 }, // optional hop over the pop-ups

    // --- §2 crumbling bridge + pendulum gate ------------------------------
    // Pit 1100..1320 (220px — too wide to jump) crossed on two crumbling slabs.
    { x: 1110, y: 470, width: 100, height: 22, type: "fake", collapseMs: 320, respawn: true },
    { x: 1230, y: 470, width: 90, height: 22, type: "fake", collapseMs: 320, respawn: true },
    { x: 1320, y: 496, width: 460, height: 44 }, // pendulum walkway

    // --- §3 thwomp corridor + arrow gauntlet ------------------------------
    { x: 1900, y: 496, width: 560, height: 44 }, // corridor floor (pit 1780..1900)
    { x: 1900, y: 0, width: 560, height: 110 }, // ceiling the thwomps hang from
    { x: 2460, y: 496, width: 640, height: 44 }, // arrow gauntlet
    { x: 2700, y: 360, width: 40, height: 136 }, // cover pillar

    // --- §4 shield perch + bombarded pit crossing --------------------------
    { x: 3240, y: 496, width: 500, height: 44 }, // (pit 3100..3240)
    { x: 3320, y: 372, width: 120, height: 24 }, // shield perch (guarded)
    // Cover pillar: hide here to read the cannon, and it eats the §4 lane's shots.
    { x: 3620, y: 400, width: 40, height: 96 },
    // Pit 3740..4000 crossed on a moving platform while the cannon sweeps it.
    {
      x: 3740, y: 452, width: 120, height: 22,
      type: "moving", axis: "horizontal", range: 160, speed: 95,
    },
    { x: 4000, y: 496, width: 400, height: 44 },

    // --- §5 turret, spring over the wall, goal run ------------------------
    { x: 4520, y: 496, width: 340, height: 44 }, // sniper ground (pit 4400..4520)
    { x: 4620, y: 380, width: 40, height: 116 }, // cover from the aiming turret
    { x: 4700, y: 472, width: 60, height: 24, type: "spring" },
    { x: 4860, y: 240, width: 40, height: 300 }, // wall — only the spring clears it
    { x: 4900, y: 496, width: 300, height: 44 }, // landing + goal run
  ],
  enemies: [
    { x: 250, y: 456 }, // start ground
    { x: 360, y: 358 }, // on the x=300 perch
    { x: 1040, y: 456 }, // pop-up ground, past the spikes
    { x: 1600, y: 456 }, // pendulum walkway, right of the thorns
    { x: 2000, y: 456 }, // thwomp corridor
    { x: 2900, y: 456 }, // arrow gauntlet, right of the thorns
    { x: 3380, y: 358 }, // guards the shield perch — stomp it to take the shield
    { x: 4260, y: 456 }, // past the pit, right of the thorns
    { x: 4980, y: 456 }, // last guard on the goal run
  ],
  spikes: [
    { x: 1460, y: 472, tiles: 3 }, // under the pendulums — don't dawdle
    { x: 2560, y: 472, tiles: 2 }, // entering the arrow gauntlet
    { x: 4140, y: 472, tiles: 2 }, // inside the cannon lane
  ],
  hazards: [
    // §1 — phase-staggered pop-up rhythm at the end of the belt.
    { kind: "popupSpike", x: 780, y: 496, tiles: 2, phase: 0 },
    { kind: "popupSpike", x: 960, y: 496, tiles: 2, phase: 0.5 },

    // §2 — two pendulums, offset by half a period, sweeping overlapping arcs.
    // Both anchors sit low enough for the heads to reach a standing player, and
    // both moved left so their arcs stay over the walkway: at x=1700 the lowered
    // second head swung out past the walkway's edge and into the jump across the
    // pit. Their low sweeps stay 27px apart, leaving somewhere to stand between
    // the two timed dashes.
    { kind: "pendulum", x: 1500, y: 270, length: 180, amplitudeDeg: 60, periodMs: 2000 },
    {
      kind: "pendulum",
      x: 1660, y: 300,
      length: 150, amplitudeDeg: 50, periodMs: 1700, phase: 0.5,
    },

    // §3 — two crushers to pass under, then a shooter to wait out behind cover.
    { kind: "thwomp", x: 2060, y: 110, width: 70, height: 70, dropDistance: 300, detectWidth: 90 },
    { kind: "thwomp", x: 2280, y: 110, width: 70, height: 70, dropDistance: 300, detectWidth: 90 },
    { kind: "arrowShooter", x: 3070, y: 496, direction: -1, intervalMs: 1500 },

    // §4 — cannon sweeping the moving-platform crossing; its lane ends on the
    // x=3620 pillar, so the shots stay inside this section.
    // Stands on the ground rather than at the moving platform's ride height: an
    // emplacement up there put its muzzle inside anyone who climbed onto it and
    // cut the guard enemy's patrol in half. On the ground it sweeps the run-up
    // instead, and the crossing is still gated by the pit and the platform timing.
    { kind: "cannon", x: 4380, y: 496, direction: "left", intervalMs: 1800 },

    // §5 — aiming turret guarding the spring (stompable, or dodge from cover).
    {
      kind: "turret",
      x: 4780, y: 496,
      aimMode: "aim", projectileSpeed: 250, intervalMs: 2000,
    },
    // Final callback to stage 6: a cannon sweeping the goal run. Its lane ends
    // on the wall you just sprang over.
    { kind: "cannon", x: 5180, y: 496, direction: "left", intervalMs: 1600 },
  ],
  shieldPickups: [{ x: 3380, y: 350 }], // on the x=3320 perch, right before §4
  goal: { x: 5100, y: 496 },
};
