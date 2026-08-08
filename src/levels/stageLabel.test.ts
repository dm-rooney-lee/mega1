import { describe, expect, it } from "vitest";
import { stageLabel } from "./stageLabel";

describe("stageLabel", () => {
  // 정상 흐름
  it("0부터 세는 인덱스를 1부터 세는 표기로 바꾼다", () => {
    expect(stageLabel(6, 8)).toBe("STAGE 7/8");
  });

  // 경계값
  it("첫 스테이지", () => {
    expect(stageLabel(0, 8)).toBe("STAGE 1/8");
  });
  it("마지막 스테이지", () => {
    expect(stageLabel(7, 8)).toBe("STAGE 8/8");
  });
  it("스테이지가 하나뿐일 때", () => {
    expect(stageLabel(0, 1)).toBe("STAGE 1/1");
  });

  // 잘못된 입력 — 거부하지 않고 가장 가까운 유효 값으로 보정한다
  it("음수 인덱스는 첫 스테이지로 보정한다", () => {
    expect(stageLabel(-3, 8)).toBe("STAGE 1/8");
  });
  it("스테이지 수를 넘는 인덱스는 마지막 스테이지로 보정한다", () => {
    expect(stageLabel(99, 8)).toBe("STAGE 8/8");
  });
  it("정수가 아닌 인덱스는 내려서 맞춘다", () => {
    expect(stageLabel(2.7, 8)).toBe("STAGE 3/8");
  });
});
