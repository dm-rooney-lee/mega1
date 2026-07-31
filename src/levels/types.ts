/**
 * Shared level-data schema. Layout is plain data (separate from scene logic) so a
 * new level is just a data file — the stepping stone to a Tiled tilemap later.
 *
 * Coordinates are world pixels (G4). Tile-based hazards (spikes) snap to 32px.
 * New content uses optional fields with sensible defaults (G3): `level1` needs no
 * changes and existing behavior is preserved when a field is omitted.
 */

export interface Vec2 {
  x: number;
  y: number;
}

// --- Platforms --------------------------------------------------------------

/**
 * Platform behavior. Omitting `type` (or using "static") is the classic solid
 * platform — so old data keeps working unchanged.
 *   - moving:   travels along an axis and carries riders.
 *   - conveyor: solid, but pushes grounded riders sideways.
 *   - spring:   bounces anything that lands on top.
 *   - fake:     looks solid, then crumbles away shortly after being stepped on
 *               (also serves as the trapdoor; `collapseMs: 0` ≈ pure fake floor).
 *   - trapfloor: disguised as a normal platform; auto-cycles forever between
 *               solid, a warning flicker (twice), and briefly having no
 *               collision at all (a hole) before resetting.
 */
export type PlatformType =
  | "static"
  | "moving"
  | "conveyor"
  | "spring"
  | "fake"
  | "trapfloor";

export interface PlatformDef {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: PlatformType;

  // type === "moving"
  /** Axis of travel. Default "horizontal". */
  axis?: "horizontal" | "vertical";
  /** Distance travelled from the start position to the far endpoint (px). */
  range?: number;
  /** Travel speed (px/s). */
  speed?: number;
  /** Start phase 0..1 along the path (0 = at origin, 0.5 = far end). */
  phase?: number;
  /** Dwell time at each endpoint (ms). */
  waitMs?: number;

  // type === "conveyor"
  /** Belt push direction: -1 = left, 1 = right. Default 1. */
  direction?: -1 | 1;
  /** Belt speed added to a grounded rider (px/s). */
  beltSpeed?: number;

  // type === "spring"
  /** Launch velocity magnitude (px/s, applied upward). */
  power?: number;

  // type === "fake"
  /** Delay from first touch to falling away (ms). 0 = drop immediately. */
  collapseMs?: number;
  /** Whether it respawns after collapsing. */
  respawn?: boolean;

  // type === "trapfloor" (reuses `phase` above for the stagger offset)
  /** Warning-flicker duration (ms). Defaults to TRAP_FLOOR.TELEGRAPH_MS. */
  telegraphMs?: number;
  /** Disguised/safe duration between warnings (ms). Defaults to TRAP_FLOOR.SAFE_MS. */
  safeMs?: number;
  /** How long the floor stays open (ms). Defaults to TRAP_FLOOR.OPEN_MS. */
  openMs?: number;
}

/** A spike hazard sits on top of a surface; width in whole spike-tiles (32px each). */
export interface SpikeDef {
  x: number;
  y: number;
  /** Number of 32px spike tiles laid side by side. */
  tiles: number;
}

// --- Hazards (unified array, discriminated by `kind`) -----------------------

/** B-1 — spiked ball swinging from a fixed pivot. Head contact is instant death. */
export interface PendulumDef {
  kind: "pendulum";
  /** Pivot (anchor) point. */
  x: number;
  y: number;
  /** Chain length from pivot to head center. */
  length?: number;
  /** Swing amplitude to each side, in degrees from vertical. */
  amplitudeDeg?: number;
  /** Full back-and-forth period (ms). */
  periodMs?: number;
  /** Phase offset 0..1 (stagger several pendulums for rhythm puzzles). */
  phase?: number;
}

/** C-2 — spikes hidden in the floor that periodically rise (with a telegraph). */
export interface PopupSpikeDef {
  kind: "popupSpike";
  /** Ground-surface anchor (top-left of the spike row). */
  x: number;
  y: number;
  tiles?: number;
  telegraphMs?: number;
  activeMs?: number;
  hiddenMs?: number;
  /** Phase offset 0..1 within the cycle. */
  phase?: number;
}

/** C-4 — crusher: waits, slams down fast, waits, returns slowly. */
export interface ThwompDef {
  kind: "thwomp";
  /** Home (up) position, top-left of the block. */
  x: number;
  y: number;
  width?: number;
  height?: number;
  dropDistance?: number;
  detectWidth?: number;
  dropSpeed?: number;
  returnSpeed?: number;
  bottomWaitMs?: number;
}

/** D-1 — wall-mounted launcher firing horizontal projectiles on a timer. */
export interface ShooterDef {
  kind: "arrowShooter";
  x: number;
  y: number;
  /** Fire direction: -1 = left, 1 = right. */
  direction: -1 | 1;
  projectileSpeed?: number;
  intervalMs?: number;
}

/** D-2 — turret: shoots projectiles; body is stompable from above. */
export interface TurretDef {
  kind: "turret";
  x: number;
  y: number;
  /** "fixed" fires along `direction`; "aim" leads toward the player. */
  aimMode?: "fixed" | "aim";
  direction?: -1 | 1;
  projectileSpeed?: number;
  intervalMs?: number;
}

/** E-1 — cannon: fires cannonballs on a timer along a fixed left/right line. */
export interface CannonDef {
  kind: "cannon";
  /** Firing origin — also the cannonball's spawn height. */
  x: number;
  y: number;
  direction: "left" | "right";
  /** Defaults to config's CANNON.FIRE_INTERVAL_MS when omitted. */
  intervalMs?: number;
}

/** F-1 — gear: rides a rail (like a moving platform) while spinning; instant death on contact. */
export interface GearDef {
  kind: "gear";
  /** Home position (pivot) — where the rail path starts. */
  x: number;
  y: number;
  axis?: "horizontal" | "vertical";
  range?: number;
  speed?: number;
  phase?: number;
  waitMs?: number;
  rotateDegPerSec?: number;
}

export type HazardDef =
  | PendulumDef
  | PopupSpikeDef
  | ThwompDef
  | ShooterDef
  | TurretDef
  | CannonDef
  | GearDef;

// --- Level ------------------------------------------------------------------

export interface LevelDef {
  /** Optional display name shown briefly on entry. */
  name?: string;
  /** Total world size. Wider than the camera so the level scrolls. */
  worldWidth: number;
  worldHeight: number;
  playerSpawn: Vec2;
  platforms: PlatformDef[];
  /** Enemies patrol left/right on whatever platform they stand on. */
  enemies: Vec2[];
  spikes: SpikeDef[];
  /** New content (pendulums, pop-up spikes, thwomps, shooters, turrets, cannons). */
  hazards?: HazardDef[];
  /** Shield pickup spawn points — collecting one grants absorbing charges. */
  shieldPickups?: Vec2[];
  goal: Vec2;
}
