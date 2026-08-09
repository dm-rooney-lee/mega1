import Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BGM_VOLUME } from "./config";

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

/**
 * 배경음악 객체는 모듈 안에 남아 다음 호출로 이어진다. 테스트끼리 그 상태가 새지
 * 않도록 매번 모듈을 새로 읽는다.
 */
async function freshAudio() {
  vi.resetModules();
  return await import("./audio");
}

/**
 * Phaser 씬과 사운드 객체를 대신하는 가짜. `hitbox.test.ts`가 가짜 스프라이트로
 * 물리 동작을 검증하는 것과 같은 방식이다. play와 setVolume이 상태를 실제로 바꿔야
 * "이미 재생 중이면 볼륨만 바꾼다"를 제대로 검증할 수 있다.
 */
function fakeScene() {
  const bgm = {
    isPlaying: false,
    volume: 0,
    play: vi.fn(() => {
      bgm.isPlaying = true;
    }),
    setVolume: vi.fn((value: number) => {
      bgm.volume = value;
    }),
  };
  // 만들 때의 볼륨은 일부러 반영하지 않는다. 그래야 볼륨 검증이 전부 setVolume을
  // 거치게 되고, 그 호출이 사라지면 테스트가 잡아낸다.
  const add = vi.fn((_key: string, _config: { volume?: number }) => bgm);
  return { scene: { sound: { add } } as unknown as Phaser.Scene, bgm, add };
}

/** 사운드를 아예 만들지 못하는 씬 — 오디오를 못 쓰는 환경을 흉내낸다. */
function brokenScene(): Phaser.Scene {
  return {
    sound: {
      add: () => {
        throw new Error("no audio device");
      },
    },
  } as unknown as Phaser.Scene;
}

beforeEach(() => {
  vi.stubGlobal("localStorage", fakeLocalStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("playBgm", () => {
  it("[Happy] 처음 부르면 음악을 만들어 기준 볼륨(BGM_VOLUME)으로 재생한다", async () => {
    const { playBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene);

    expect(f.add).toHaveBeenCalledWith("bgm", expect.objectContaining({ loop: true }));
    expect(f.bgm.play).toHaveBeenCalledTimes(1);
    expect(f.bgm.volume).toBe(BGM_VOLUME);
  });

  it("[Happy] 사용자가 배경음악 배율을 낮춰두면 재생 볼륨도 그만큼 낮아진다", async () => {
    const { playBgm } = await freshAudio();
    const { setBgmVolume } = await import("./settings");
    setBgmVolume(0.5);
    const f = fakeScene();

    playBgm(f.scene);

    expect(f.bgm.volume).toBeCloseTo(BGM_VOLUME * 0.5);
  });

  it("[Happy] 이미 재생 중이면 다시 재생하지 않고 볼륨만 다시 맞춘다", async () => {
    const { playBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene);
    playBgm(f.scene);

    expect(f.bgm.play).toHaveBeenCalledTimes(1);
    expect(f.bgm.isPlaying).toBe(true);
    expect(f.bgm.volume).toBe(BGM_VOLUME);
  });

  it("[Boundary] 화면을 여러 번 오가도 음악 객체는 하나만 만들어진다", async () => {
    const { playBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene);
    playBgm(f.scene);
    playBgm(f.scene);

    expect(f.add).toHaveBeenCalledTimes(1);
    expect(f.bgm.play).toHaveBeenCalledTimes(1);
  });

  it("[Error] 음악을 만들지 못해도 예외를 밖으로 내보내지 않는다", async () => {
    const { playBgm } = await freshAudio();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => playBgm(brokenScene())).not.toThrow();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it("[Error] 만들기는 됐지만 재생이 실패해도 예외를 내보내지 않는다", async () => {
    const { playBgm } = await freshAudio();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const f = fakeScene();
    f.bgm.play.mockImplementation(() => {
      throw new Error("playback blocked");
    });

    expect(() => playBgm(f.scene)).not.toThrow();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});

describe("refreshBgmVolume", () => {
  it("[Happy] 이미 흐르는 곡에 새 배율을 즉시 반영한다", async () => {
    const { playBgm, refreshBgmVolume } = await freshAudio();
    const { setBgmVolume } = await import("./settings");
    const f = fakeScene();

    playBgm(f.scene);
    setBgmVolume(0.3);
    refreshBgmVolume();

    expect(f.bgm.volume).toBeCloseTo(BGM_VOLUME * 0.3);
  });

  it("[Boundary] 음악이 아직 만들어지지 않았으면 아무 일도 하지 않는다", async () => {
    const { refreshBgmVolume } = await freshAudio();
    expect(() => refreshBgmVolume()).not.toThrow();
  });
});
