/**
 * 스테이지 인덱스(0-based) → 세계 매핑. `LevelDef`에 필드를 추가하지 않고
 * 여기서 도출한다(레벨 데이터 스키마 변경 없음).
 *
 * 비율은 3:3:4(grassland:sunset:underground)로 고정되어 있고, 스테이지 총
 * 개수(stageCount)에 비례 배분한다 — 정수로 안 떨어지면 최대 나머지법
 * (largest remainder method)으로 근사한다. 스테이지가 늘어나도 배열을 손으로
 * 고칠 필요가 없다.
 */
export const WORLDS = ["grassland", "sunset", "underground"] as const;
export type World = (typeof WORLDS)[number];

const RATIO: Record<World, number> = { grassland: 3, sunset: 3, underground: 4 };

function worldCounts(stageCount: number): Record<World, number> {
  const totalWeight = WORLDS.reduce((sum, w) => sum + RATIO[w], 0);
  const raw = WORLDS.map((w) => (stageCount * RATIO[w]) / totalWeight);
  const floors = raw.map(Math.floor);
  let remaining = stageCount - floors.reduce((a, b) => a + b, 0);

  const byLargestRemainder = raw
    .map((value, i) => ({ i, remainder: value - floors[i] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let k = 0; k < remaining; k++) floors[byLargestRemainder[k].i]++;

  return Object.fromEntries(WORLDS.map((w, i) => [w, floors[i]])) as Record<World, number>;
}

export function worldForStage(index: number, stageCount: number): World {
  if (index < 0 || index >= stageCount) return WORLDS[0];

  const counts = worldCounts(stageCount);
  let cursor = 0;
  for (const world of WORLDS) {
    cursor += counts[world];
    if (index < cursor) return world;
  }
  return WORLDS[0];
}
