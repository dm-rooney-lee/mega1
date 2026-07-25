/**
 * Central tuning knobs for the game. Keeping these in one place makes it easy to
 * tweak "game feel" without hunting through the code.
 */
export const GAME = {
  WIDTH: 960,
  HEIGHT: 540,
} as const;

/** Size of one tile-based hazard cell (spikes, pop-up spikes). */
export const TILE = 32;

export const PHYSICS = {
  /** Downward acceleration (px/s^2). Higher = heavier, snappier fall. */
  GRAVITY_Y: 1400,
} as const;

export const PLAYER = {
  MOVE_SPEED: 260,
  /**
   * Initial upward velocity of a jump (negative = up). Max jump height is
   * JUMP_VELOCITY^2 / (2 * PHYSICS.GRAVITY_Y) — at -680 with gravity 1400 that's
   * ~165px, enough to clear the level's highest ground-to-platform gap (136px).
   */
  JUMP_VELOCITY: -680,
  /** Velocity applied when bouncing off a stomped enemy. */
  STOMP_BOUNCE: -420,
  /** ms of grace after leaving a ledge during which you can still jump. */
  COYOTE_MS: 100,
  /** ms before landing that a jump press is remembered and fires on touchdown. */
  JUMP_BUFFER_MS: 120,
  /**
   * When the jump button is released early, the upward velocity is cut to this
   * fraction — enabling short hops (tap) vs full jumps (hold).
   */
  JUMP_CUT_MULTIPLIER: 0.4,
} as const;

export const ENEMY = {
  MOVE_SPEED: 70,
} as const;

// --- New content tuning (feature/MEGA-map) ---------------------------------

/** A-1 Jump pad / spring. */
export const SPRING = {
  /** Upward launch velocity (negative = up). ~1.9x the normal jump height. */
  POWER: -940,
  /** ms the pad shows its "compressed" squash before the player leaves. */
  SQUASH_MS: 90,
} as const;

/** A-2 Moving platform. */
export const MOVING_PLATFORM = {
  SPEED: 80,
  WAIT_MS: 0,
} as const;

/** A-3 Conveyor belt. */
export const CONVEYOR = {
  /** Horizontal push added to the player's velocity while grounded on it. */
  SPEED: 140,
} as const;

/** B-1 Pendulum spiked ball. */
export const PENDULUM = {
  LENGTH: 150,
  AMPLITUDE_DEG: 55,
  PERIOD_MS: 2200,
  HEAD_RADIUS: 16,
} as const;

/** C-1 Fake / crumbling platform (also used for the trapdoor). */
export const CRUMBLE = {
  /** Delay from first touch to the platform falling away (0 = instant drop). */
  COLLAPSE_MS: 380,
  /** How long it stays gone before respawning (if `respawn`). */
  RESPAWN_MS: 2000,
} as const;

/** C-2 Pop-up spike. */
export const POPUP_SPIKE = {
  TELEGRAPH_MS: 450,
  ACTIVE_MS: 900,
  HIDDEN_MS: 1100,
  /** How far the spikes rise out of the ground when active. */
  RISE: 26,
} as const;

/** C-4 Thwomp / crusher. */
export const THWOMP = {
  DETECT_WIDTH: 70,
  DROP_SPEED: 900,
  RETURN_SPEED: 130,
  DROP_DISTANCE: 220,
  BOTTOM_WAIT_MS: 400,
  /** Short wind-up flash before it drops (visual telegraph). */
  TELEGRAPH_MS: 220,
} as const;

/** D Projectiles (shared by arrow shooters and turrets). */
export const PROJECTILE = {
  SPEED: 300,
  /** Pool size — max simultaneous projectiles across all sources. */
  POOL_SIZE: 32,
  /** Despawn after travelling this far from spawn (px). */
  RANGE: 900,
} as const;

/** D-1 Arrow / dart shooter. */
export const SHOOTER = {
  INTERVAL_MS: 1600,
} as const;

/** D-2 Turret. */
export const TURRET = {
  INTERVAL_MS: 2200,
  /**
   * Aim-line telegraph before an aimed shot. The aim is locked at the start of
   * this window (it doesn't track you), so a longer warning just means a fairer
   * dodge window, not a longer lock-on.
   */
  TELEGRAPH_MS: 550,
} as const;

/** Placeholder-art palette (swapped for real sprites in Milestone 4). */
export const COLORS = {
  BACKGROUND: 0x1d2b53,
  PLAYER: 0x29adff,
  PLATFORM: 0x5f574f,
  PLATFORM_TOP: 0x7d7460,
  ENEMY: 0xff004d,
  SPIKE: 0xfff1e8,
  GOAL: 0x00e436,
  // New content.
  SPRING: 0x00e436,
  MOVING: 0x1c5fc9,
  CONVEYOR: 0x475c7a,
  CONVEYOR_ARROW: 0x9bb0c9,
  FAKE: 0x6b5136, // deliberately close to PLATFORM — spotting it is a reward
  PENDULUM_HEAD: 0xffa300,
  CHAIN: 0xc2c3c7,
  THWOMP: 0x7e2553,
  THWOMP_FACE: 0xffccaa,
  PROJECTILE: 0xffec27,
  SHOOTER: 0x422136,
  TURRET: 0xab5236,
  TELEGRAPH: 0xff004d,
} as const;

/** Keys used to look up textures generated in BootScene. */
export const TEX = {
  PLAYER: "tex-player",
  PLATFORM: "tex-platform",
  ENEMY: "tex-enemy",
  SPIKE: "tex-spike",
  GOAL: "tex-goal",
  // New content.
  SPRING: "tex-spring",
  MOVING: "tex-moving",
  CONVEYOR: "tex-conveyor",
  FAKE: "tex-fake",
  PENDULUM_HEAD: "tex-pendulum-head",
  THWOMP: "tex-thwomp",
  PROJECTILE: "tex-projectile",
  SHOOTER: "tex-shooter",
  TURRET: "tex-turret",
} as const;

/**
 * G5 — render order. One layer per role so overlaps are predictable instead of
 * insertion-order accidents. background < platform < hazard < enemy <
 * projectile < player < effect < HUD.
 */
export const DEPTH = {
  BACKGROUND: -10,
  PLATFORM: 0,
  HAZARD: 10,
  ENEMY: 20,
  PROJECTILE: 30,
  PLAYER: 40,
  EFFECT: 50,
  HUD: 1000,
} as const;
