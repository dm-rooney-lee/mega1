import { describe, expect, it } from "vitest";
import { looksLikeSvg, pickUsableArt } from "./screenArt";

describe("looksLikeSvg", () => {
  // 정상 흐름
  it("실제 그림 파일의 첫머리를 알아본다", () => {
    expect(looksLikeSvg('<svg xmlns="http://www.w3.org/2000/svg" width="400">')).toBe(true);
  });

  // 경계값
  it("앞에 XML 선언이 붙어 있어도 알아본다", () => {
    expect(looksLikeSvg('<?xml version="1.0"?>\n<svg width="10" height="10"></svg>')).toBe(true);
  });
  it("빈 응답은 그림이 아니다", () => {
    expect(looksLikeSvg("")).toBe(false);
  });
  it("공백뿐인 응답은 그림이 아니다", () => {
    expect(looksLikeSvg("   \n\t ")).toBe(false);
  });

  // 오류 케이스 — 이게 실제로 일어나는 상황이다
  it("서버가 대신 돌려준 앱 HTML 페이지는 그림이 아니다", () => {
    const html = '<!doctype html>\n<html lang="en">\n  <head>\n    <title>Let\'s go!!</title>';
    expect(looksLikeSvg(html)).toBe(false);
  });
  it("svg라는 낱말이 본문에 섞여 있어도 태그가 아니면 그림이 아니다", () => {
    expect(looksLikeSvg("<p>svg 파일을 찾을 수 없습니다</p>")).toBe(false);
  });
});

describe("pickUsableArt", () => {
  const entries = [
    { key: "a", url: "ui/a.svg" },
    { key: "b", url: "ui/b.svg" },
  ];

  // 정상 흐름
  it("전부 진짜 그림이면 전부 통과시킨다", async () => {
    const usable = await pickUsableArt(entries, async () => "<svg></svg>");
    expect(usable.map((e) => e.key)).toEqual(["a", "b"]);
  });

  // 경계값
  it("목록이 비어 있으면 빈 목록을 돌려준다", async () => {
    expect(await pickUsableArt([], async () => "<svg></svg>")).toEqual([]);
  });
  it("일부만 진짜면 그것만 통과시킨다", async () => {
    const usable = await pickUsableArt(entries, async (url) =>
      url.endsWith("a.svg") ? "<svg></svg>" : "<!doctype html>",
    );
    expect(usable.map((e) => e.key)).toEqual(["a"]);
  });

  // 오류 케이스
  it("가져오기가 실패하면 그 그림만 빼고 나머지는 살린다", async () => {
    const usable = await pickUsableArt(entries, async (url) => {
      if (url.endsWith("a.svg")) throw new Error("network down");
      return "<svg></svg>";
    });
    expect(usable.map((e) => e.key)).toEqual(["b"]);
  });
  it("전부 실패해도 예외를 던지지 않고 빈 목록을 돌려준다", async () => {
    const usable = await pickUsableArt(entries, async () => {
      throw new Error("offline");
    });
    expect(usable).toEqual([]);
  });
});
