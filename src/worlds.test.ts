import { describe, it, expect } from "vitest";
import { worldForStage } from "./worlds";

describe("worldForStage", () => {
  // [Happy] 각 세계의 대표 스테이지가 올바른 세계를 반환한다.
  it("returns grassland for stage index 0 (stage 1)", () => {
    expect(worldForStage(0)).toBe("grassland");
  });

  it("returns sunset for stage index 3 (stage 4)", () => {
    expect(worldForStage(3)).toBe("sunset");
  });

  it("returns underground for stage index 5 (stage 6)", () => {
    expect(worldForStage(5)).toBe("underground");
  });

  // [Boundary] 세계 경계에 있는 인덱스(2↔3, 4↔5)가 정확히 갈린다.
  it("stage index 2 (last grassland stage) is still grassland", () => {
    expect(worldForStage(2)).toBe("grassland");
  });

  it("stage index 4 (last sunset stage) is still sunset", () => {
    expect(worldForStage(4)).toBe("sunset");
  });

  it("stage index 7 (last stage) is underground", () => {
    expect(worldForStage(7)).toBe("underground");
  });

  // [Boundary] 범위 밖 인덱스는 첫 세계로 폴백한다(레벨 데이터의 levelAt과 동일 관례).
  it("falls back to the first world for a negative index", () => {
    expect(worldForStage(-1)).toBe("grassland");
  });

  it("falls back to the first world for an out-of-range index", () => {
    expect(worldForStage(99)).toBe("grassland");
  });
});
