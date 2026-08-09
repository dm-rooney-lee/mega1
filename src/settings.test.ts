import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 이 프로젝트의 vitest 기본 환경(node)에는 전역 localStorage가 없다(Node 24로
 * 확인됨 — jsdom도 설치돼 있지 않다). src/audio.test.ts가 scene.sound를 가짜로
 * 만드는 것과 같은 방식으로, 메모리 기반 가짜 Storage를 주입한다.
 */
function fakeLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (i: number) => Array.from(store.keys())[i] ?? null,
  } as Storage;
}

async function freshSettings() {
  vi.resetModules();
  return await import("./settings");
}

beforeEach(() => {
  vi.stubGlobal("localStorage", fakeLocalStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("settings", () => {
  it("[Happy] 저장한 배경음악 볼륨을 그대로 읽어온다", async () => {
    const { setBgmVolume, getBgmVolume } = await freshSettings();
    setBgmVolume(0.6);
    expect(getBgmVolume()).toBe(0.6);
  });

  it("[Happy] 배경음악과 효과음 배율은 서로 독립적으로 저장된다", async () => {
    const { setBgmVolume, setSfxVolume, getBgmVolume, getSfxVolume } = await freshSettings();
    setBgmVolume(0.3);
    setSfxVolume(0.9);
    expect(getBgmVolume()).toBe(0.3);
    expect(getSfxVolume()).toBe(0.9);
  });

  it("[Boundary] 저장된 값이 없으면 기본값 1(=100%)을 반환한다", async () => {
    const { getBgmVolume, getSfxVolume } = await freshSettings();
    expect(getBgmVolume()).toBe(1);
    expect(getSfxVolume()).toBe(1);
  });

  it("[Boundary] 범위를 벗어난 값은 0~1로 잘려서 저장된다", async () => {
    const { setBgmVolume, getBgmVolume } = await freshSettings();
    setBgmVolume(-0.3);
    expect(getBgmVolume()).toBe(0);
    setBgmVolume(1.7);
    expect(getBgmVolume()).toBe(1);
  });

  it("[Boundary] 경계값 0과 1 자체는 잘리지 않고 그대로 저장·조회된다", async () => {
    const { setSfxVolume, getSfxVolume } = await freshSettings();
    setSfxVolume(0);
    expect(getSfxVolume()).toBe(0);
    setSfxVolume(1);
    expect(getSfxVolume()).toBe(1);
  });

  it("[Boundary] -Infinity/Infinity가 들어와도 각각 0과 1로(반대로 뒤집히지 않고) 잘린다", async () => {
    const { STORAGE_KEY } = await freshSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bgm: "-Infinity", sfx: "Infinity" }));
    const { getBgmVolume, getSfxVolume } = await freshSettings();
    expect(getBgmVolume()).toBe(0);
    expect(getSfxVolume()).toBe(1);
  });

  it("[Error] localStorage에 깨진 JSON이 들어있으면 기본값으로 폴백한다", async () => {
    const { STORAGE_KEY } = await freshSettings();
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    const { getBgmVolume, getSfxVolume } = await freshSettings();
    expect(getBgmVolume()).toBe(1);
    expect(getSfxVolume()).toBe(1);
  });

  it("[Error] localStorage 접근 자체가 예외를 던져도 기본값을 반환하고 예외를 내보내지 않으며, 저장이 실패해도 이번 세션 동안은 방금 조절한 값이 유지된다", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    const { getBgmVolume, setBgmVolume } = await freshSettings();
    expect(() => getBgmVolume()).not.toThrow();
    expect(getBgmVolume()).toBe(1);
    expect(() => setBgmVolume(0.5)).not.toThrow();
    // 저장(setItem)은 실패했지만, 메모리 캐시는 갱신됐으므로 같은 세션에서
    // 다시 읽으면 기본값(1)이 아니라 방금 설정한 값(0.5)이어야 한다.
    expect(getBgmVolume()).toBe(0.5);
  });
});
