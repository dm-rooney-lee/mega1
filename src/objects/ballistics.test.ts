import { describe, expect, it } from "vitest";
import { isOffWorld, shouldFire } from "./ballistics";

describe("shouldFire", () => {
  it("[Happy] 간격이 지났으면 발사", () => {
    expect(shouldFire(2000, 400, 1500)).toBe(true);
  });
  it("[Boundary] 정확히 간격에 도달하면 발사", () => {
    expect(shouldFire(1500, 0, 1500)).toBe(true);
  });
  it("[Boundary] 간격 직전에는 발사 안 함", () => {
    expect(shouldFire(1499, 0, 1500)).toBe(false);
  });
});

describe("isOffWorld", () => {
  it("[Happy] 범위 안이면 off-world 아님", () => {
    expect(isOffWorld(1200, 2600)).toBe(false);
  });
  it("[Boundary] 왼쪽 여백을 넘으면 off-world", () => {
    expect(isOffWorld(-41, 2600, 40)).toBe(true);
  });
  it("[Boundary] 오른쪽 여백을 넘으면 off-world", () => {
    expect(isOffWorld(2641, 2600, 40)).toBe(true);
  });
  it("[Boundary] 여백 경계값은 아직 on-world", () => {
    expect(isOffWorld(-40, 2600, 40)).toBe(false);
  });
  it("[Boundary] 오른쪽 여백 경계값은 아직 on-world", () => {
    expect(isOffWorld(2640, 2600, 40)).toBe(false);
  });
});
