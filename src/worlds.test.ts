import { describe, it, expect } from "vitest";
import { worldForStage } from "./worlds";

describe("worldForStage", () => {
  // [Happy] each world's representative stage returns the right world at a 10-stage, 3:3:4 split.
  it("returns grassland for stage index 0 (stage 1) at stageCount 10", () => {
    expect(worldForStage(0, 10)).toBe("grassland");
  });

  it("returns sunset for stage index 4 (stage 5) at stageCount 10", () => {
    expect(worldForStage(4, 10)).toBe("sunset");
  });

  it("returns underground for stage index 8 (stage 9) at stageCount 10", () => {
    expect(worldForStage(8, 10)).toBe("underground");
  });

  // [Boundary] the world boundaries (2|3, 5|6) split exactly where 3:3:4 says they should.
  it("stage index 2 (last grassland stage) is still grassland", () => {
    expect(worldForStage(2, 10)).toBe("grassland");
  });

  it("stage index 3 (first sunset stage) is sunset", () => {
    expect(worldForStage(3, 10)).toBe("sunset");
  });

  it("stage index 5 (last sunset stage) is still sunset", () => {
    expect(worldForStage(5, 10)).toBe("sunset");
  });

  it("stage index 6 (first underground stage) is underground", () => {
    expect(worldForStage(6, 10)).toBe("underground");
  });

  it("stage index 9 (last stage) is underground", () => {
    expect(worldForStage(9, 10)).toBe("underground");
  });

  // [Boundary] out-of-range indices fall back to the first world (same convention as levelAt).
  it("falls back to the first world for a negative index", () => {
    expect(worldForStage(-1, 10)).toBe("grassland");
  });

  it("falls back to the first world for an out-of-range index", () => {
    expect(worldForStage(99, 10)).toBe("grassland");
  });

  // [Boundary] the ratio is computed dynamically — a non-10 stage count still apportions 3:3:4 by weight.
  it("apportions 13 stages as 4:4:5 via the largest-remainder method", () => {
    expect(worldForStage(0, 13)).toBe("grassland");
    expect(worldForStage(3, 13)).toBe("grassland");
    expect(worldForStage(4, 13)).toBe("sunset");
    expect(worldForStage(7, 13)).toBe("sunset");
    expect(worldForStage(8, 13)).toBe("underground");
    expect(worldForStage(12, 13)).toBe("underground");
  });

  // [Error]: not applicable — worldForStage is a pure arithmetic function with no I/O
  // or thrown exceptions, so there is no error path to cover.
});
