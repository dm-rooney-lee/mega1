import Phaser from "phaser";
import { describe, expect, it, vi } from "vitest";

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

describe("playBgm", () => {
  it("[Happy] 처음 부르면 음악을 만들어 요청한 볼륨으로 재생한다", async () => {
    const { playBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene, 0.5);

    expect(f.add).toHaveBeenCalledWith("bgm", expect.objectContaining({ loop: true }));
    expect(f.bgm.play).toHaveBeenCalledTimes(1);
    expect(f.bgm.volume).toBe(0.5);
  });

  it("[Happy] 이미 재생 중이면 다시 재생하지 않고 볼륨만 바꾼다", async () => {
    const { playBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene, 0.5);
    playBgm(f.scene, 0.2);

    expect(f.bgm.play).toHaveBeenCalledTimes(1);
    expect(f.bgm.volume).toBe(0.2);
    expect(f.bgm.isPlaying).toBe(true);
  });

  it("[Boundary] 화면을 여러 번 오가도 음악 객체는 하나만 만들어진다", async () => {
    const { playBgm } = await freshAudio();
    const f = fakeScene();

    // 타이틀 → 플레이 → 죽음 → 재시도 → 타이틀
    playBgm(f.scene, 0.5);
    playBgm(f.scene, 0.2);
    playBgm(f.scene, 0.5);
    playBgm(f.scene, 0.2);
    playBgm(f.scene, 0.5);

    expect(f.add).toHaveBeenCalledTimes(1);
    expect(f.bgm.play).toHaveBeenCalledTimes(1);
    expect(f.bgm.volume).toBe(0.5);
  });

  it("[Boundary] 같은 볼륨으로 연달아 불러도 중복 재생하지 않는다 — 스테이지가 넘어갈 때마다 불린다", async () => {
    const { playBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene, 0.2);
    playBgm(f.scene, 0.2);
    playBgm(f.scene, 0.2);

    expect(f.add).toHaveBeenCalledTimes(1);
    expect(f.bgm.play).toHaveBeenCalledTimes(1);
    expect(f.bgm.volume).toBe(0.2);
  });

  it("[Error] 음악을 만들지 못해도 예외를 밖으로 내보내지 않는다", async () => {
    const { playBgm } = await freshAudio();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(() => playBgm(brokenScene(), 0.5)).not.toThrow();
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

    expect(() => playBgm(f.scene, 0.5)).not.toThrow();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
