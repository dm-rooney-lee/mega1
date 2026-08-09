import Phaser from "phaser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BGM_VOLUME } from "./config";
import { fakeLocalStorage } from "./testHelpers";

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

  it("[Happy] 두 번째 호출도 그 시점의 사용자 배율을 다시 읽어 반영한다(첫 호출 때 배율을 고정해두지 않는다)", async () => {
    const { playBgm } = await freshAudio();
    const { setBgmVolume } = await import("./settings");
    const f = fakeScene();

    playBgm(f.scene);
    expect(f.bgm.volume).toBe(BGM_VOLUME);

    setBgmVolume(0.25);
    playBgm(f.scene);

    expect(f.bgm.volume).toBeCloseTo(BGM_VOLUME * 0.25);
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

/**
 * playTone/playNoiseBurst가 실제로 부르는 Web Audio 노드들을 최소한으로
 * 흉내낸다. `gain.exponentialRampToValueAtTime`은 실제 브라우저처럼 목표값이
 * 정확히 0이면 RangeError를 던지게 해서, 효과음 코드가 0을 그대로 넘기면
 * 이 가짜도 똑같이 걸려서 잡아낸다.
 */
function fakeWebAudioScene() {
  const rampTargets: number[] = [];
  const gain = {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn((value: number) => {
      rampTargets.push(value);
      if (value === 0) throw new RangeError("exponential ramp target cannot be 0");
    }),
  };
  const node = { connect: vi.fn() };
  const oscillator = {
    type: "",
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const bufferSource = { buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
  const filter = { type: "", frequency: { setValueAtTime: vi.fn() }, connect: vi.fn() };
  const context = {
    currentTime: 0,
    sampleRate: 44100,
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => ({ ...node, gain })),
    createBuffer: vi.fn(() => ({ getChannelData: () => new Float32Array(4) })),
    createBufferSource: vi.fn(() => bufferSource),
    createBiquadFilter: vi.fn(() => filter),
  };
  const scene = {
    sound: { context, masterMuteNode: {} },
  } as unknown as Phaser.Scene;
  return { scene, rampTargets, context };
}

describe("효과음 볼륨", () => {
  it("[Happy] 평소 볼륨(100%)에서는 바닥값 없이 그대로 재생된다", async () => {
    const { playJump } = await freshAudio();
    const f = fakeWebAudioScene();

    playJump(f.scene);

    // SFX.JUMP는 SFX.MASTER_VOLUME(0.4) × 100% = 0.4를 목표값으로 램프해야
    // 한다 — 볼륨 0 방지용 바닥값(0.0001)에 걸리지 않는다.
    expect(f.rampTargets).toContain(0.4);
  });

  it("[Boundary] 효과음 볼륨을 0으로 낮춰도 exponentialRampToValueAtTime에 정확히 0을 넘기지 않는다 — 넘기면 Web Audio가 RangeError를 던진다", async () => {
    const { playJump } = await freshAudio();
    const { setSfxVolume } = await import("./settings");
    setSfxVolume(0);
    const f = fakeWebAudioScene();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    playJump(f.scene);

    expect(f.rampTargets.some((v) => v === 0)).toBe(false);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it("[Boundary] playCannonFire(노이즈 버스트 계열)도 볼륨 0에서 마찬가지로 0을 넘기지 않는다", async () => {
    const { playCannonFire } = await freshAudio();
    const { setSfxVolume } = await import("./settings");
    setSfxVolume(0);
    const f = fakeWebAudioScene();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    playCannonFire(f.scene);

    expect(f.rampTargets.some((v) => v === 0)).toBe(false);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it("[Error] 순음 합성(playTone 계열)이 실패해도 예외를 밖으로 내보내지 않는다", async () => {
    const { playJump } = await freshAudio();
    const f = fakeWebAudioScene();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    f.context.createOscillator = vi.fn(() => {
      throw new Error("oscillator unavailable");
    });

    expect(() => playJump(f.scene)).not.toThrow();
    // 어느 쪽 합성이 실패했는지 구분되는 메시지인지까지 확인한다 — 그냥
    // "불렸다"만 보면, playTone/playNoiseBurst의 메시지가 나중에 서로
    // 뒤바뀌거나 하나로 뭉개져도 이 테스트는 여전히 통과해버린다.
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("tone synthesis failed"), expect.anything());

    warn.mockRestore();
  });

  it("[Error] 노이즈 합성(playNoiseBurst 계열)이 실패해도 예외를 밖으로 내보내지 않는다", async () => {
    const { playCannonFire } = await freshAudio();
    const f = fakeWebAudioScene();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    f.context.createBufferSource = vi.fn(() => {
      throw new Error("buffer source unavailable");
    });

    expect(() => playCannonFire(f.scene)).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("noise synthesis failed"), expect.anything());

    warn.mockRestore();
  });
});
