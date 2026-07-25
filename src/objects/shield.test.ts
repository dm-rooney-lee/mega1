import { describe, expect, it } from "vitest";
import { absorbHit } from "./shield";

describe("absorbHit", () => {
  it("[Happy] 충전이 남아 있으면 막고 1 감소", () => {
    expect(absorbHit(3)).toEqual({ charges: 2, blocked: true });
  });
  it("[Boundary] 마지막 충전도 막고 0으로", () => {
    expect(absorbHit(1)).toEqual({ charges: 0, blocked: true });
  });
  it("[Boundary] 충전 0이면 막지 못함", () => {
    expect(absorbHit(0)).toEqual({ charges: 0, blocked: false });
  });
  it("[Boundary] 음수는 방패 없음으로 취급", () => {
    expect(absorbHit(-1)).toEqual({ charges: 0, blocked: false });
  });
});
