/**
 * Level registry + progression. The playable order lives here so GameScene stays
 * level-agnostic (it just reads `registry.levelIndex`), and adding a level is a
 * one-line change.
 */
import type { LevelDef } from "./types";
import { level1 } from "./level1";
import { level2 } from "./level2";
import { level3 } from "./level3";
import { level4 } from "./level4";

export const levels: LevelDef[] = [level1, level2, level3, level4];

/** The level at `index`, clamped to the first level for out-of-range indices. */
export function levelAt(index: number): LevelDef {
  return levels[index] ?? levels[0];
}

/** Whether `index` refers to a real level (used to decide "next vs. game complete"). */
export function hasLevel(index: number): boolean {
  return index >= 0 && index < levels.length;
}
