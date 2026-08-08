/**
 * 스테이지 인덱스(0-based) → 세계 매핑. `LevelDef`에 필드를 추가하지 않고
 * 여기서 도출한다(레벨 데이터 스키마 변경 없음).
 */
export const WORLDS = ["grassland", "sunset", "underground"] as const;
export type World = (typeof WORLDS)[number];

const WORLD_FOR_STAGE: World[] = [
  "grassland", "grassland", "grassland",
  "sunset", "sunset",
  "underground", "underground", "underground",
  "underground", "underground",
];

export function worldForStage(index: number): World {
  return WORLD_FOR_STAGE[index] ?? WORLD_FOR_STAGE[0];
}
