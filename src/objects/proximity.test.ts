import { describe, expect, it } from "vitest";
import { isBeneath, withinRange } from "./proximity";

describe("withinRange", () => {
  it("[Happy] 가로/세로 모두 범위 안이면 참", () => {
    expect(withinRange(50, 20, 100, 50)).toBe(true);
  });

  it("[Happy] 가로가 범위를 벗어나면 거짓", () => {
    expect(withinRange(150, 0, 100, 50)).toBe(false);
  });

  it("[Boundary] 음수 오프셋도 절대값으로 판정한다", () => {
    expect(withinRange(-90, -40, 100, 50)).toBe(true);
  });

  it("[Boundary] 경계값과 정확히 같으면 범위 안이다", () => {
    expect(withinRange(100, 50, 100, 50)).toBe(true);
  });

  it("[Boundary] 경계값을 1이라도 넘으면 범위 밖이다", () => {
    expect(withinRange(101, 0, 100, 50)).toBe(false);
    expect(withinRange(0, 51, 100, 50)).toBe(false);
  });
});

describe("isBeneath", () => {
  it("[Happy] 가로 범위 안이고 마운트 아래쪽에 있으면 참", () => {
    expect(isBeneath(10, 500, 400, 90)).toBe(true);
  });

  it("[Boundary] 가로 범위 밖이면 거짓", () => {
    expect(isBeneath(200, 500, 400, 90)).toBe(false);
  });

  it("[Boundary] 마운트보다 위(y가 더 작음)면 거짓", () => {
    expect(isBeneath(10, 300, 400, 90)).toBe(false);
  });

  it("[Boundary] 마운트 바닥과 정확히 같은 높이면 거짓(위쪽 경계는 초과만 인정)", () => {
    expect(isBeneath(10, 400, 400, 90)).toBe(false);
  });
});
