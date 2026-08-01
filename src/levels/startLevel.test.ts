import { describe, expect, it } from "vitest";
import { resolveSpawnX, resolveStartLevel } from "./startLevel";

describe("resolveStartLevel", () => {
  it("[Happy] 1-based 스테이지 번호를 0-based 인덱스로 변환", () => {
    expect(resolveStartLevel("7", 7)).toBe(6);
  });
  it("[Boundary] 첫 스테이지", () => {
    expect(resolveStartLevel("1", 7)).toBe(0);
  });
  it("[Boundary] 마지막 스테이지", () => {
    expect(resolveStartLevel("7", 7)).toBe(6);
  });
  it("[Boundary] 범위를 넘으면 null (메뉴로 폴백)", () => {
    expect(resolveStartLevel("8", 7)).toBeNull();
  });
  it("[Boundary] 0은 1-based가 아니므로 null", () => {
    expect(resolveStartLevel("0", 7)).toBeNull();
  });
  it("[Unhappy] 미지정이면 null", () => {
    expect(resolveStartLevel(undefined, 7)).toBeNull();
  });
  it("[Unhappy] 빈 문자열이면 null", () => {
    expect(resolveStartLevel("", 7)).toBeNull();
  });
  it("[Unhappy] 숫자가 아니면 null", () => {
    expect(resolveStartLevel("abc", 7)).toBeNull();
  });
  it("[Unhappy] 정수가 아니면 null", () => {
    expect(resolveStartLevel("7.5", 7)).toBeNull();
  });
});

describe("resolveSpawnX", () => {
  it("[Happy] 월드 안의 좌표를 그대로 반환", () => {
    expect(resolveSpawnX("3600", 5200)).toBe(3600);
  });
  it("[Boundary] 왼쪽 끝(0)은 유효", () => {
    expect(resolveSpawnX("0", 5200)).toBe(0);
  });
  it("[Boundary] 오른쪽 끝(worldWidth)은 유효", () => {
    expect(resolveSpawnX("5200", 5200)).toBe(5200);
  });
  it("[Boundary] 월드를 넘으면 null", () => {
    expect(resolveSpawnX("5201", 5200)).toBeNull();
  });
  it("[Boundary] 음수면 null", () => {
    expect(resolveSpawnX("-1", 5200)).toBeNull();
  });
  it("[Unhappy] 미지정이면 null", () => {
    expect(resolveSpawnX(undefined, 5200)).toBeNull();
  });
  it("[Unhappy] null이면 null", () => {
    expect(resolveSpawnX(null, 5200)).toBeNull();
  });
  it("[Unhappy] 숫자가 아니면 null", () => {
    expect(resolveSpawnX("abc", 5200)).toBeNull();
  });
});
