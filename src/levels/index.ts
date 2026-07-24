import type { LevelDef } from "./level1";
import { level1 } from "./level1";
import { level2 } from "./level2";

/**
 * The ordered list of stages. GameScene is started with a `level` index into
 * this array; clearing a stage advances to the next, and clearing the last one
 * wins the game. Add stage 3+ by appending here.
 */
export const levels: LevelDef[] = [level1, level2];
