/**
 * Level registry + progression. The ordered list of stages lives here so
 * GameScene stays level-agnostic (it's started with a `level` index into this
 * array); clearing a stage advances to the next, and clearing the last one wins
 * the game. Adding a stage is a one-line change.
 */
import type { LevelDef } from "./types";
import { level1 } from "./level1";
import { level2 } from "./level2";
import { level3 } from "./level3";
import { level4 } from "./level4";
import { level5 } from "./level5";
import { level6 } from "./level6";
import { level7 } from "./level7";
import { level8 } from "./level8";

export const levels: LevelDef[] = [level1, level2, level3, level4, level5, level6, level7, level8];

/** The level at `index`, clamped to the first level for out-of-range indices. */
export function levelAt(index: number): LevelDef {
  return levels[index] ?? levels[0];
}

/** Whether `index` refers to a real level (used to decide "next vs. game complete"). */
export function hasLevel(index: number): boolean {
  return index >= 0 && index < levels.length;
}
