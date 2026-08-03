import { describe, expect, it } from "vitest";
import {
  cameraZoom,
  computeDisplay,
  DESIGN_WIDTH,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH_MAX,
  LOGICAL_WIDTH_MIN,
  MAX_PIXEL_RATIO,
} from "./display";

describe("computeDisplay", () => {
  it("[Happy] 레티나 창을 빈틈없이 채우고 버퍼를 물리 픽셀과 1:1로 맞춘다", () => {
    const d = computeDisplay(1512, 900, 2);
    expect(d.bufferWidth).toBe(3024);
    expect(d.bufferHeight).toBe(1800);
    expect(d.cssWidth).toBe(1512);
    expect(d.cssHeight).toBe(900);
    expect(d.barWidth).toBe(0);
    expect(d.barHeight).toBe(0);
    expect(d.logicalWidth).toBeCloseTo(907.2, 3);
    expect(d.zoom).toBeCloseTo(1800 / LOGICAL_HEIGHT, 6);
  });

  it("[Happy] 16:9 창에서는 논리 가로가 원래 설계 폭과 같아진다", () => {
    const d = computeDisplay(1920, 1080, 1);
    expect(d.logicalWidth).toBeCloseTo(DESIGN_WIDTH, 6);
    expect(d.bufferWidth).toBe(1920);
    expect(d.bufferHeight).toBe(1080);
    expect(d.barWidth).toBe(0);
  });

  it("[Happy] 카메라 배율은 항상 논리 세로 540을 버퍼 세로에 대응시킨다", () => {
    for (const [w, h, dpr] of [
      [1512, 900, 2],
      [1920, 1080, 1],
      [2560, 1080, 2],
      [800, 1000, 3],
    ] as const) {
      const d = computeDisplay(w, h, dpr);
      expect(d.bufferHeight / d.zoom).toBeCloseTo(LOGICAL_HEIGHT, 6);
      // Rounding the buffer to whole physical pixels can shift the visible width
      // by a fraction of a logical unit. Anything under one unit is invisible.
      expect(Math.abs(d.bufferWidth / d.zoom - d.logicalWidth)).toBeLessThan(1);
    }
  });

  it("[Boundary] 초광각 창은 논리 가로를 상한으로 묶고 좌우에만 띠를 만든다", () => {
    const d = computeDisplay(2560, 1080, 1);
    expect(d.logicalWidth).toBe(LOGICAL_WIDTH_MAX);
    expect(d.cssHeight).toBe(1080);
    expect(d.barHeight).toBe(0);
    expect(d.barWidth).toBeGreaterThan(0);
    expect(d.cssWidth).toBeLessThan(2560);
  });

  it("[Boundary] 세로로 긴 창은 논리 가로를 하한으로 묶고 위아래에만 띠를 만든다", () => {
    const d = computeDisplay(800, 1000, 2);
    expect(d.logicalWidth).toBe(LOGICAL_WIDTH_MIN);
    expect(d.cssWidth).toBe(800);
    expect(d.barWidth).toBe(0);
    expect(d.barHeight).toBeGreaterThan(0);
  });

  it("[Boundary] 논리 세로는 어떤 창에서도 540에서 벗어나지 않는다", () => {
    for (const [w, h] of [
      [400, 2000],
      [4000, 400],
      [1, 1],
      [3440, 1440],
    ] as const) {
      const d = computeDisplay(w, h, 2);
      expect(d.bufferHeight / d.zoom).toBeCloseTo(LOGICAL_HEIGHT, 6);
    }
  });

  it("[Boundary] 화면 배율 1이면 버퍼와 CSS 크기가 같다", () => {
    const d = computeDisplay(1280, 720, 1);
    expect(d.pixelRatio).toBe(1);
    expect(d.bufferWidth).toBe(d.cssWidth);
    expect(d.bufferHeight).toBe(d.cssHeight);
  });

  it("[Boundary] 화면 배율은 상한에서 잘린다", () => {
    const capped = computeDisplay(1512, 900, 4);
    expect(capped.pixelRatio).toBe(MAX_PIXEL_RATIO);
    expect(capped.bufferHeight).toBe(900 * MAX_PIXEL_RATIO);

    const under = computeDisplay(1512, 900, 0.5);
    expect(under.pixelRatio).toBe(1);
  });

  it("[Boundary] 창 크기가 정확히 상한 비율이면 띠가 생기지 않는다", () => {
    const height = 540;
    const d = computeDisplay(LOGICAL_WIDTH_MAX, height, 1);
    expect(d.logicalWidth).toBe(LOGICAL_WIDTH_MAX);
    expect(d.barWidth).toBe(0);
    expect(d.barHeight).toBe(0);
  });

  it("[Error] 잘못된 화면 배율은 1로 되돌린다", () => {
    for (const bad of [0, -2, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(computeDisplay(1512, 900, bad).pixelRatio).toBe(1);
    }
  });

  it("[Error] 창 크기가 0이나 NaN이어도 유효한 양수 버퍼를 낸다", () => {
    for (const [w, h] of [
      [0, 0],
      [Number.NaN, 900],
      [1512, Number.NaN],
      [-100, -100],
    ] as const) {
      const d = computeDisplay(w, h, 2);
      expect(Number.isFinite(d.bufferWidth)).toBe(true);
      expect(Number.isFinite(d.bufferHeight)).toBe(true);
      expect(d.bufferWidth).toBeGreaterThan(0);
      expect(d.bufferHeight).toBeGreaterThan(0);
      expect(d.zoom).toBeGreaterThan(0);
    }
  });
});

describe("cameraZoom", () => {
  it("[Happy] 버퍼 세로를 논리 세로로 나눈 값", () => {
    expect(cameraZoom(1080)).toBeCloseTo(2, 6);
    expect(cameraZoom(1800)).toBeCloseTo(1800 / 540, 6);
  });

  it("[Boundary] 버퍼 세로가 논리 세로와 같으면 배율 1", () => {
    expect(cameraZoom(LOGICAL_HEIGHT)).toBe(1);
  });

  it("[Error] 0이나 NaN이면 배율 1로 되돌린다", () => {
    expect(cameraZoom(0)).toBe(1);
    expect(cameraZoom(Number.NaN)).toBe(1);
  });
});
