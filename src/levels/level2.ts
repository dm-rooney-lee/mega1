import type { LevelDef } from "./types";

/**
 * 두 번째 스테이지. 좁은 발판 정밀 점프 + 대포 2문(하늘/종반)·방패 1개.
 * 좌표는 월드 픽셀. 발판은 왼쪽 위 모서리 + 크기.
 */
export const level2: LevelDef = {
  worldWidth: 2600,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    // 땅(구멍으로 분리): PIT1=680~800, PIT2=1880~1980
    { x: 0, y: 496, width: 680, height: 44 },
    { x: 800, y: 496, width: 1080, height: 44 },
    { x: 1980, y: 496, width: 620, height: 44 },
    // 좁은 공중 발판(90~120px)
    { x: 340, y: 380, width: 110, height: 24 },
    { x: 620, y: 330, width: 90, height: 24 },
    { x: 900, y: 360, width: 110, height: 24 },
    { x: 1080, y: 270, width: 100, height: 24 }, // 방패 위치
    { x: 1260, y: 220, width: 100, height: 24 }, // 정점 · 대포2
    { x: 1440, y: 300, width: 110, height: 24 },
    { x: 1700, y: 380, width: 110, height: 24 },
    { x: 2100, y: 330, width: 120, height: 24 },
  ],
  enemies: [
    { x: 960, y: 346 }, // 발판 900 위
    { x: 1300, y: 482 }, // 중앙 땅
    { x: 1750, y: 366 }, // 발판 1700 위
  ],
  spikes: [
    { x: 1000, y: 472, tiles: 2 },
    { x: 1500, y: 472, tiles: 2 },
  ],
  cannons: [
    { x: 1270, y: 205, direction: "left" }, // 하늘(정점 발판 왼쪽 끝)
    { x: 2360, y: 452, direction: "left" }, // 종반 지면
  ],
  shields: [{ x: 1120, y: 250 }], // 발판 1080 위, 하늘 초소 직전
  goal: { x: 2540, y: 432 },
};
