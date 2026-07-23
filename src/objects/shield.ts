/** 방패 내구도 계산(Phaser 비의존, 단위 테스트 대상). */
export function absorbHit(charges: number): { charges: number; blocked: boolean } {
  if (charges > 0) return { charges: charges - 1, blocked: true };
  return { charges: 0, blocked: false };
}
