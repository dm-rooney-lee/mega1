/**
 * 데이터 기반 레벨 정의. 레이아웃을 순수 데이터로 두어 씬 로직과 분리한다.
 * 공유 타입은 ./types 참조.
 */
import type { LevelDef } from "./types";

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
