import { describe, expect, it } from "vitest";
import {
  cameraZoom,
  computeDisplay,
  DESIGN_WIDTH,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH_MAX,
  LOGICAL_WIDTH_MIN,
  MAX_PIXEL_RATIO,
  shakeCamera,
  snapToDevicePixel,
  textureScale,
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

describe("snapToDevicePixel", () => {
  it("[Happy] 스크롤을 물리 픽셀 격자에 올린다", () => {
    const zoom = 2.8111;
    for (const v of [412.37, 0.1, 1234.5678, -55.4]) {
      const snapped = snapToDevicePixel(v, zoom);
      expect(Number.isInteger(Math.round(snapped * zoom * 1e6) / 1e6)).toBe(true);
      // 잘라낸 양은 물리 픽셀 반 칸을 넘지 않는다 — 움직임은 그대로 매끄럽다.
      expect(Math.abs(snapped - v)).toBeLessThanOrEqual(0.5 / zoom + 1e-9);
    }
  });

  it("[Boundary] 배율 1이면 정수로 반올림한 것과 같다", () => {
    expect(snapToDevicePixel(10.4, 1)).toBe(10);
    expect(snapToDevicePixel(10.6, 1)).toBe(11);
  });

  it("[Boundary] 이미 격자 위에 있으면 값이 변하지 않는다", () => {
    const zoom = 4;
    const onGrid = 100.25; // 100.25 × 4 = 401, 정수
    expect(snapToDevicePixel(onGrid, zoom)).toBeCloseTo(onGrid, 10);
  });

  it("[Boundary] 0은 0으로 남는다", () => {
    expect(snapToDevicePixel(0, 3.33)).toBe(0);
  });

  it("[Error] 배율이 0·음수·NaN이면 1로 취급해 유한한 값을 낸다", () => {
    for (const bad of [0, -2, Number.NaN]) {
      const out = snapToDevicePixel(10.6, bad);
      expect(Number.isFinite(out)).toBe(true);
      expect(out).toBe(11);
    }
  });
});

describe("textureScale", () => {
  it("[Happy] 화면 배율을 따라 커진다 — 카메라 확대를 상쇄할 만큼", () => {
    expect(textureScale(1)).toBe(2);
    expect(textureScale(2)).toBe(4);
    expect(textureScale(3)).toBe(6);
  });

  it("[Happy] 일반적인 창에서 카메라 배율보다 크거나 같다", () => {
    // 카메라 배율 = 창 CSS 세로 × 화면 배율 / 540. 텍스처가 이보다 작으면
    // 확대가 남아 흐려지므로, 흔한 창 크기에서는 항상 충분해야 한다.
    for (const [cssHeight, dpr] of [
      [720, 1],
      [900, 1],
      [800, 2],
      [900, 2],
      [1080, 2],
    ] as const) {
      const zoom = computeDisplay((cssHeight * 16) / 9, cssHeight, dpr).zoom;
      expect(textureScale(dpr)).toBeGreaterThanOrEqual(zoom);
    }
  });

  it("[Boundary] 소수 배율은 반올림해서 쓴다", () => {
    expect(textureScale(1.5)).toBe(4);
    expect(textureScale(2.4)).toBe(4);
  });

  it("[Boundary] 아주 큰 배율에서도 상한 6을 넘지 않는다", () => {
    expect(textureScale(10)).toBe(6);
  });

  it("[Error] 잘못된 값이면 최소 배율로 되돌린다", () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(textureScale(bad)).toBe(2);
    }
  });
});

describe("shakeCamera", () => {
  const spy = (zoom: number) => {
    const calls: { duration: number; intensity: number }[] = [];
    return {
      camera: { zoom, shake: (duration: number, intensity: number) => calls.push({ duration, intensity }) },
      calls,
    };
  };

  it("[Happy] 카메라 배율을 나눠서 화면상 흔들림 크기를 일정하게 유지", () => {
    const { camera, calls } = spy(3.3333333333333335);
    shakeCamera(camera, 180, 0.012);
    expect(calls).toHaveLength(1);
    expect(calls[0].duration).toBe(180);
    expect(calls[0].intensity).toBeCloseTo(0.012 / 3.3333333333333335, 10);
  });

  it("[Happy] 서로 다른 배율에서도 화면상 흔들림이 같아진다", () => {
    // Phaser의 실제 계산: 오프셋 = intensity × 버퍼폭 × 배율.
    // 화면(CSS) 크기로 환산하면 intensity × 배율 × CSS폭이므로, 배율을 나눠주면
    // 어떤 배율에서도 같은 CSS 픽셀만큼 흔들려야 한다.
    const cssWidth = 1512;
    const apparent = (zoom: number) => {
      const { camera, calls } = spy(zoom);
      shakeCamera(camera, 200, 0.01);
      return calls[0].intensity * zoom * cssWidth;
    };
    expect(apparent(1)).toBeCloseTo(apparent(3.3333), 6);
    expect(apparent(1.6667)).toBeCloseTo(apparent(3.3333), 6);
    expect(apparent(1)).toBeCloseTo(0.01 * cssWidth, 6);
  });

  it("[Boundary] 배율 1이면 그대로 전달", () => {
    const { camera, calls } = spy(1);
    shakeCamera(camera, 100, 0.02);
    expect(calls[0].intensity).toBe(0.02);
  });

  it("[Boundary] 흔들림 0은 0으로 남는다", () => {
    const { camera, calls } = spy(2);
    shakeCamera(camera, 100, 0);
    expect(calls[0].intensity).toBe(0);
  });

  it("[Error] 배율이 0·음수·NaN이면 1로 취급해 나눗셈이 깨지지 않는다", () => {
    for (const bad of [0, -2, Number.NaN]) {
      const { camera, calls } = spy(bad);
      shakeCamera(camera, 100, 0.01);
      expect(calls[0].intensity).toBe(0.01);
      expect(Number.isFinite(calls[0].intensity)).toBe(true);
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
