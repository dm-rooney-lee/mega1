/**
 * Central tuning knobs for the game. Keeping these in one place makes it easy to
 * tweak "game feel" without hunting through the code.
 */
export const GAME = {
  WIDTH: 960,
  HEIGHT: 540,
} as const;

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

export const CANNON = {
  /** 발사 간격(ms). */
  FIRE_INTERVAL_MS: 1500,
  /** 대포알 수평 속도(px/s). */
  BALL_SPEED: 320,
} as const;

export const SHIELD = {
  /** 방패 획득 시 충전 횟수(막을 수 있는 대포알 수). */
  MAX_CHARGES: 3,
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
  CANNON: 0xc2c3c7,
  CANNONBALL: 0xffa300,
  SHIELD: 0x29adff,
} as const;

/** Keys used to look up textures generated in BootScene. */
export const TEX = {
  PLAYER: "tex-player",
  PLATFORM: "tex-platform",
  ENEMY: "tex-enemy",
  SPIKE: "tex-spike",
  GOAL: "tex-goal",
  CANNON: "tex-cannon",
  CANNONBALL: "tex-cannonball",
  SHIELD: "tex-shield",
} as const;
