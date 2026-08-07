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
 * 물리 동작을 검증하는 것과 같은 방식이다. play/stop이 isPlaying을 실제로 바꿔야
 * "이미 재생 중이면 건드리지 않는다"를 제대로 검증할 수 있다.
 */
function fakeScene() {
  const bgm = {
    isPlaying: false,
    play: vi.fn(() => {
      bgm.isPlaying = true;
    }),
    stop: vi.fn(() => {
      bgm.isPlaying = false;
    }),
  };
  const add = vi.fn(() => bgm);
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
  it("[Happy] 아무것도 재생 중이 아니면 음악을 만들어 재생한다", async () => {
    const { playBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene);

    expect(f.add).toHaveBeenCalledWith("bgm", expect.objectContaining({ loop: true }));
    expect(f.bgm.play).toHaveBeenCalledTimes(1);
  });

  it("[Boundary] 이미 재생 중이면 다시 만들지도 재생하지도 않는다", async () => {
    const { playBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene);
    playBgm(f.scene);

    expect(f.add).toHaveBeenCalledTimes(1);
    expect(f.bgm.play).toHaveBeenCalledTimes(1);
  });

  it("[Boundary] 멈춘 뒤 다시 켜면 기존 음악을 재사용한다", async () => {
    const { playBgm, stopBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene);
    stopBgm();
    playBgm(f.scene);

    expect(f.add).toHaveBeenCalledTimes(1);
    expect(f.bgm.play).toHaveBeenCalledTimes(2);
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

describe("stopBgm", () => {
  it("[Happy] 재생 중이면 멈춘다", async () => {
    const { playBgm, stopBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene);
    stopBgm();

    expect(f.bgm.stop).toHaveBeenCalledTimes(1);
    expect(f.bgm.isPlaying).toBe(false);
  });

  it("[Boundary] 음악을 만든 적이 없으면 아무 일도 하지 않는다", async () => {
    const { stopBgm } = await freshAudio();

    expect(() => stopBgm()).not.toThrow();
  });

  it("[Boundary] 스테이지가 넘어갈 때마다 반복해서 멈춰도 재사용 중인 음악 객체가 흐트러지지 않는다", async () => {
    const { playBgm, stopBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene);
    stopBgm();
    stopBgm();
    playBgm(f.scene);

    expect(f.add).toHaveBeenCalledTimes(1);
    expect(f.bgm.isPlaying).toBe(true);
  });
});
