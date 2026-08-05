import { describe, expect, it } from "vitest";
import { setLogicalBodyCircle, setLogicalBodyOffset, setLogicalBodySize } from "./hitbox";

/**
 * Stands in for a scaled sprite. `applied` reproduces what Arcade does with a
 * dynamic body: it multiplies whatever it was given by the sprite's scale. So a
 * helper is correct exactly when `applied` comes back as the logical value.
 */
function spriteAt(scale: number) {
  const calls: { size?: [number, number]; circle?: [number, number, number]; offset?: [number, number] } = {};
  const sprite = {
    scaleX: scale,
    scaleY: scale,
    body: {
      setSize: (w: number, h: number) => (calls.size = [w, h]),
      setCircle: (r: number, ox = 0, oy = 0) => (calls.circle = [r, ox, oy]),
      setOffset: (x: number, y: number) => (calls.offset = [x, y]),
    },
  };
  const applied = (pair: [number, number]) => pair.map((n) => n * scale);
  return { sprite, calls, applied };
}

describe("setLogicalBodySize", () => {
  it("[Happy] 축소된 스프라이트에서도 바디가 논리 크기 그대로 나온다", () => {
    const { sprite, calls, applied } = spriteAt(0.25);
    setLogicalBodySize(sprite, 24, 38);
    expect(applied(calls.size!)).toEqual([24, 38]);
  });

  it("[Boundary] 배율 1이면 값을 그대로 전달", () => {
    const { sprite, calls } = spriteAt(1);
    setLogicalBodySize(sprite, 28, 26);
    expect(calls.size).toEqual([28, 26]);
  });

  it("[Boundary] 확대된 스프라이트에서도 성립", () => {
    const { sprite, calls, applied } = spriteAt(3.75);
    setLogicalBodySize(sprite, 120, 22);
    expect(applied(calls.size!)).toEqual([120, 22]);
  });

  it("[Error] 배율이 0·NaN이면 1로 취급해 무한대가 나오지 않는다", () => {
    for (const bad of [0, Number.NaN]) {
      const { sprite, calls } = spriteAt(bad);
      setLogicalBodySize(sprite, 24, 38);
      expect(calls.size).toEqual([24, 38]);
      expect(calls.size!.every(Number.isFinite)).toBe(true);
    }
  });
});

describe("setLogicalBodyCircle", () => {
  it("[Happy] 반지름과 오프셋 모두 논리 크기로 되돌아온다", () => {
    const scale = 0.25;
    const { sprite, calls } = spriteAt(scale);
    setLogicalBodyCircle(sprite, 16, 4, 4);
    expect(calls.circle!.map((n) => n * scale)).toEqual([16, 4, 4]);
  });

  it("[Boundary] 오프셋 0도 0으로 유지", () => {
    const { sprite, calls } = spriteAt(0.5);
    setLogicalBodyCircle(sprite, 20, 0, 0);
    expect(calls.circle![1]).toBe(0);
    expect(calls.circle![2]).toBe(0);
  });

  it("[Error] 배율이 0이어도 유한한 값을 낸다", () => {
    const { sprite, calls } = spriteAt(0);
    setLogicalBodyCircle(sprite, 16, 4, 4);
    expect(calls.circle).toEqual([16, 4, 4]);
  });
});

describe("setLogicalBodyOffset", () => {
  it("[Happy] 오프셋이 논리 크기로 되돌아온다", () => {
    const scale = 0.25;
    const { sprite, calls } = spriteAt(scale);
    setLogicalBodyOffset(sprite, 2, 14);
    expect(calls.offset!.map((n) => n * scale)).toEqual([2, 14]);
  });

  it("[Boundary] 배율 1이면 그대로", () => {
    const { sprite, calls } = spriteAt(1);
    setLogicalBodyOffset(sprite, 2, 14);
    expect(calls.offset).toEqual([2, 14]);
  });

  it("[Error] 배율이 NaN이면 1로 취급", () => {
    const { sprite, calls } = spriteAt(Number.NaN);
    setLogicalBodyOffset(sprite, 2, 14);
    expect(calls.offset).toEqual([2, 14]);
  });
});
