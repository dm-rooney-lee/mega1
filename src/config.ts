/**
 * Central tuning knobs for the game. Keeping these in one place makes it easy to
 * tweak "game feel" without hunting through the code.
 *
 * Every value here is in logical units — the same space the levels are authored
 * in. The viewport is no longer a fixed size (it is 540 logical units tall with a
 * width that follows the window), but that is a rendering concern only: see
 * `src/display.ts`.
 */

/** Size of one tile-based hazard cell (spikes, pop-up spikes). */
export const TILE = 32;

/**
 * Spike hitbox, shared by the fixed spikes and the pop-up ones. Only part of the
 * `TILE`-sized art is solid, so the offsets are measured from the sprite's top
 * left. `src/levels/threat.ts` reads these to work out how high a spike reaches.
 */
export const SPIKE = {
  BODY_WIDTH: 28,
  BODY_HEIGHT: 18,
  BODY_OFFSET_X: 2,
  BODY_OFFSET_Y: 14,
} as const;

/** How the camera trails the player. */
export const CAMERA = {
  /**
   * Follow smoothing, per second. 6.32 reproduces the old per-frame lerp of 0.1
   * at 60fps (`1 - e^(-6.32/60) = 0.1`) while staying the same at any frame rate.
   */
  SMOOTH_PER_SEC: 6.32,
} as const;

/** 먼 배경 레이어의 시차 배율. */
export const PARALLAX = {
  /** 카메라 스크롤 대비 배경이 움직이는 비율(5배 느림). */
  FAR_FACTOR: 0.2,
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
  /**
   * Hitbox size, a little smaller than the 28x40 art so tight jumps feel fair.
   * `BODY_HEIGHT` also fixes how tall a standing player is, which is what every
   * hazard has to reach to be a threat at all — see `src/levels/threat.ts`.
   */
  BODY_WIDTH: 24,
  BODY_HEIGHT: 38,
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
  /** Block size used when a level doesn't give one. */
  WIDTH: 60,
  HEIGHT: 60,
  DETECT_WIDTH: 70,
  DROP_SPEED: 900,
  RETURN_SPEED: 130,
  DROP_DISTANCE: 220,
  BOTTOM_WAIT_MS: 400,
  /** Short wind-up flash before it drops (visual telegraph). */
  TELEGRAPH_MS: 220,
} as const;

/** F-1 Gear hazard (level7) — rail-riding, spinning, instant-death on contact. */
export const GEAR = {
  /** Rail travel speed (px/s), same scale as MOVING_PLATFORM.SPEED. */
  SPEED: 90,
  /** Visual spin rate — purely cosmetic (hitbox stays circular). */
  ROTATE_DEG_PER_SEC: 220,
  /** Circular hitbox radius. */
  RADIUS: 20,
} as const;

/** F-2 Trap floor (level7) — disguised ground that warns twice, then opens. */
export const TRAP_FLOOR = {
  /** Warning-flicker duration (ms), same scale as POPUP_SPIKE.TELEGRAPH_MS. */
  TELEGRAPH_MS: 450,
  /** Disguised/safe duration between warnings (ms). */
  SAFE_MS: 650,
  /** How long the floor stays open (no collision) before resetting (ms). */
  OPEN_MS: 1300,
} as const;

/** D Projectiles (shared by arrow shooters and turrets). */
export const PROJECTILE = {
  /** Art size, which is also the hitbox — half the height is how far a shot reaches above and below its line. */
  WIDTH: 22,
  HEIGHT: 10,
  SPEED: 300,
  /** Pool size — max simultaneous projectiles across all sources. */
  POOL_SIZE: 32,
  /** Despawn after travelling this far from spawn (px). */
  RANGE: 900,
} as const;

/** D-1 Arrow / dart shooter. */
export const SHOOTER = {
  /** Art size. Standing on a surface puts the muzzle half this height above it. */
  WIDTH: 26,
  HEIGHT: 34,
  /** Gap between the sprite's edge and where its arrows appear, so they clear the body. */
  MUZZLE_GAP: 6,
  INTERVAL_MS: 1600,
} as const;

/** D-2 Turret. */
export const TURRET = {
  /** Art size. The barrel sits on the top edge, so a mounted turret fires from `surface - HEIGHT`. */
  WIDTH: 34,
  HEIGHT: 30,
  INTERVAL_MS: 2200,
  /**
   * Aim-line telegraph before an aimed shot. The aim is locked at the start of
   * this window (it doesn't track you), so a longer warning just means a fairer
   * dodge window, not a longer lock-on.
   */
  TELEGRAPH_MS: 550,
} as const;

/** E-1 Cannon (ported from the level2 branch's cannon+shield stage). */
export const CANNON = {
  /** Art size. Balls leave from the sprite's centre, i.e. half this height above the surface. */
  WIDTH: 40,
  HEIGHT: 30,
  /** Cannonball art size, which is also its hitbox. */
  BALL_DIAMETER: 16,
  /** Fire interval (ms). */
  FIRE_INTERVAL_MS: 1500,
  /** Cannonball horizontal speed (px/s). */
  BALL_SPEED: 320,
  /** ms of invulnerability after a cannonball hit is resolved (prevents one volley draining multiple shield charges in a single frame). */
  HIT_COOLDOWN_MS: 150,
} as const;

/** E-2 Shield pickup (blocks a number of cannonball hits before breaking). */
export const SHIELD = {
  /** Charges granted on pickup (number of cannonballs it can absorb). */
  MAX_CHARGES: 3,
} as const;

/** Placeholder-art palette (swapped for real sprites in Milestone 4). */
export const COLORS = {
  BACKGROUND: 0x1d2b53,
  PLAYER: 0x29adff,
  ENEMY: 0xff004d,
  SPIKE: 0xab5236,
  GOAL: 0x00e436,
  // New content.
  SPRING: 0xff004d,
  MOVING: 0xab5236,
  CONVEYOR: 0x5f4636,
  CONVEYOR_ARROW: 0xfff1e8,
  FAKE: 0x9c4a30, // deliberately close to the real ground tile's colors — spotting it is a reward
  PENDULUM_HEAD: 0xab5236,
  CHAIN: 0x008751,
  THWOMP: 0x5f574f,
  THWOMP_FACE: 0xffccaa,
  GEAR: 0x5f574f,
  PROJECTILE: 0xab5236,
  SHOOTER: 0x008751,
  TURRET: 0x596652,
  TELEGRAPH: 0xff004d,
  CANNON: 0x596652,
  CANNONBALL: 0x5f574f,
  SHIELD: 0x00e436,
  // Gopher-nature reskin (2026-08-05).
  OUTLINE: 0x000000,
  HILL_FAR: 0x008751,
  SKY_DUSK_TOP: 0x7e2553,
  SKY_DUSK_MID: 0xff77a8,
  SKY_DUSK_BOTTOM: 0xffa300,
  CAVE_ROCK: 0x83769c,
  DIRT: 0xab5236,
  DIRT_DETAIL: 0x5f574f,
  GRASS_TOP: 0x00e436,
} as const;

/** Keys used to look up textures generated in BootScene. */
export const TEX = {
  PLAYER: "tex-player",
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
  GEAR: "tex-gear",
  PROJECTILE: "tex-projectile",
  SHOOTER: "tex-shooter",
  TURRET: "tex-turret",
  CANNON: "tex-cannon",
  CANNONBALL: "tex-cannonball",
  SHIELD: "tex-shield",
  GROUND_TILE: "tex-ground-tile",
  BG_GRASSLAND: "tex-bg-grassland",
  BG_SUNSET: "tex-bg-sunset",
  BG_UNDERGROUND: "tex-bg-underground",
} as const;

/**
 * G5 — render order. One layer per role so overlaps are predictable instead of
 * insertion-order accidents. background < platform < hazard < enemy <
 * projectile < player < effect < HUD.
 */
export const DEPTH = {
  BACKGROUND: -10,
  BACKGROUND_FAR: -5,
  PLATFORM: 0,
  HAZARD: 10,
  ENEMY: 20,
  PROJECTILE: 30,
  PLAYER: 40,
  EFFECT: 50,
  HUD: 1000,
} as const;

/**
 * 배경음악 볼륨 — 화면에 따라 다르다(src/audio.ts). 음악은 한 번 켜지면 멈추지
 * 않고, 화면이 바뀔 때마다 이 값들 사이를 오간다.
 *
 * 플레이 중에는 효과음이 묻히지 않도록 음악이 뒤로 물러난다. GAMEPLAY이 SFX의
 * MASTER_VOLUME보다 확실히 낮아야 효과음이 위로 튀어나온다 — 이 관계가 깨지면
 * 장애물·발사·점프 소리가 음악에 잡아먹힌다.
 */
export const BGM = {
  /** 타이틀·게임오버·승리 화면 — 음악이 주인공인 구간. */
  SCREEN: 0.5,
  /** 플레이 중 — 배경으로 깔리는 구간. */
  GAMEPLAY: 0.2,
} as const;

/**
 * SFX 합성 튜닝 — Web Audio로 즉석 합성(외부 오디오 파일 없음, src/audio.ts).
 * freqStart/freqEnd는 Hz, durationMs는 ms. 정확한 "소리 느낌"은 플레이테스트로
 * 이 값들만 조정해 반복 튜닝한다(코드 변경 불필요).
 */
export const SFX = {
  /** 모든 효과음에 곱해지는 전체 볼륨(0..1). */
  MASTER_VOLUME: 0.4,
  JUMP: { freqStart: 500, freqEnd: 900, durationMs: 90 },
  ENEMY_KILL: { freqStart: 600, freqEnd: 150, durationMs: 140 },
  FIRE: { freqStart: 900, freqEnd: 500, durationMs: 70 },
  CANNON: { durationMs: 180, filterFreq: 300 },
  SHIELD_BLOCK: { freqStart: 700, freqEnd: 700, durationMs: 90 },
  ROCK_DROP: { durationMs: 220, filterFreq: 150 },
  DEATH: { freqStart: 500, freqEnd: 80, durationMs: 400 },
  PENDULUM_SWING: { durationMs: 100, filterFreq: 800 },
  /** notes scheduled via scene timers, destroyed 500ms after playWin() fires (GameScene.handleWin) — keep noteDurationMs * (notes.length - 1) well under 500 or the last note(s) silently never play. */
  WIN: { notes: [523, 659, 784], noteDurationMs: 120 },
  SHIELD_PICKUP: { freqStart: 400, freqEnd: 1000, durationMs: 150 },
  SPRING_BOUNCE: { freqStart: 300, freqEnd: 1100, durationMs: 160 },
} as const;
