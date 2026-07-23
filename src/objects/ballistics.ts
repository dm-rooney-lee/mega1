/** 대포/대포알 판정용 순수 함수(Phaser 비의존, 단위 테스트 대상). */

/** 마지막 발사 후 간격이 지났으면 true. */
export function shouldFire(now: number, lastFiredAt: number, intervalMs: number): boolean {
  return now - lastFiredAt >= intervalMs;
}

/** x가 월드 양끝(+여백)을 벗어나 대포알을 없애야 하면 true. */
export function isOffWorld(x: number, worldWidth: number, margin = 40): boolean {
  return x < -margin || x > worldWidth + margin;
}
