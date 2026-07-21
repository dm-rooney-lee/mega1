/**
 * Data-driven level definition. Keeping layout as plain data (separate from the
 * scene logic) means designing a new level is just editing this file — and it's the
 * natural stepping stone to a Tiled tilemap later (Milestone 4).
 *
 * Coordinates are world pixels. Platforms are given by their top-left corner + size.
 */

export interface PlatformDef {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** A spike hazard sits on top of a surface; width in whole spike-tiles (32px each). */
export interface SpikeDef {
  x: number;
  y: number;
  /** Number of 32px spike tiles laid side by side. */
  tiles: number;
}

export interface LevelDef {
  /** Total world size. Wider than the camera so the level scrolls. */
  worldWidth: number;
  worldHeight: number;
  playerSpawn: Vec2;
  platforms: PlatformDef[];
  /** Enemies patrol left/right on whatever platform they stand on. */
  enemies: Vec2[];
  spikes: SpikeDef[];
  goal: Vec2;
}

export const level1: LevelDef = {
  worldWidth: 2400,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    // Ground is split into segments with a gap (a pit) around x=640..760.
    { x: 0, y: 496, width: 640, height: 44 },
    { x: 760, y: 496, width: 900, height: 44 },
    { x: 1760, y: 496, width: 640, height: 44 },
    // Floating platforms.
    { x: 360, y: 380, width: 160, height: 24 },
    { x: 900, y: 360, width: 200, height: 24 },
    { x: 1200, y: 260, width: 160, height: 24 },
    { x: 1480, y: 380, width: 180, height: 24 },
    { x: 1980, y: 360, width: 200, height: 24 },
  ],
  enemies: [
    { x: 950, y: 320 }, // patrols the wide floating platform
    { x: 1200, y: 456 }, // patrols the long ground segment
    { x: 1820, y: 456 }, // patrols near the goal
  ],
  spikes: [
    { x: 1120, y: 472, tiles: 3 }, // spikes on the long ground segment
  ],
  goal: { x: 2260, y: 432 },
};
