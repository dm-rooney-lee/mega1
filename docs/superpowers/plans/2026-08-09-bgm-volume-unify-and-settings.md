# 배경음악 볼륨 통일 + 사용자 볼륨 조절 기능 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 배경음악 볼륨을 4개 화면 전체에서 통일하고, 사용자가 톱니바퀴 아이콘으로 배경음악/효과음 볼륨을 조절할 수 있는 설정 화면을 추가한다.

**Architecture:** 사용자 볼륨 배율은 순수 로직 모듈(`src/settings.ts`)이 `localStorage`에 저장·조회한다. `src/audio.ts`는 재생마다 "config.ts의 튠된 기준값 × settings.ts의 사용자 배율"을 계산해 실제 볼륨으로 쓴다. 설정 UI는 새 `SettingsScene`으로, 4개 화면 모두 `scene.pause()` 후 `scene.run("SettingsScene", ...)`으로 그 위에 모달처럼 띄우고, 닫으면 `scene.resume()`으로 정확히 그 지점에서 이어간다.

**Tech Stack:** Phaser 4, TypeScript, Vite, Vitest.

**참고 스펙:** `docs/superpowers/specs/2026-08-09-bgm-volume-unify-and-settings-design.md` (승인·커밋됨). 이 계획은 그 스펙을 그대로 구현한다 — 설계 근거·기각한 대안은 스펙을 참고하고, 여기서는 반복하지 않는다.

## Global Constraints

- 게임 규칙·물리·난이도는 변경하지 않는다.
- 효과음의 소리 자체(주파수·길이)는 바꾸지 않는다 — 볼륨만 바뀐다.
- 슬라이더는 0~100%이고 100%는 지금 튠된 기준값이다. 100%보다 크게 키우는 기능은 넣지 않는다.
- 새 색상을 만들지 않는다 — `SCREEN_COLORS`/`COLORS`에 이미 있는 값만 쓴다.
- `localStorage` 접근 실패가 게임을 멈추거나 예외를 던지게 하지 않는다.
- 각 코드 작업(Task)은 TDD 3 카테고리(`[Happy]`/`[Boundary]`/`[Error]`, 해당 안 되면 사유 명시) 규칙을 따른다. Phaser 씬 자체(렌더링·클릭)는 이 프로젝트에 씬 단위 자동 테스트가 없으므로(기존 관례) 수동 플레이테스트로 검증한다 — 각 Task 끝에 명시.

---

### Task 1: 사용자 볼륨 배율 저장 모듈 (`src/settings.ts`)

**Files:**
- Create: `src/settings.ts`
- Create: `src/settings.test.ts`

**Interfaces:**
- Consumes: 브라우저 `localStorage` (전역, 테스트에서는 `vi.stubGlobal`로 가짜 주입).
- Produces: `getBgmVolume(): number`, `getSfxVolume(): number`, `setBgmVolume(value: number): void`, `setSfxVolume(value: number): void` — 전부 Task 2(`audio.ts`)와 Task 3(`SettingsScene.ts`)이 그대로 가져다 쓴다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/settings.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 이 프로젝트의 vitest 기본 환경(node)에는 전역 localStorage가 없다(Node 24로
 * 확인됨 — jsdom도 설치돼 있지 않다). src/audio.test.ts가 scene.sound를 가짜로
 *만드는 것과 같은 방식으로, 메모리 기반 가짜 Storage를 주입한다.
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

  it("[Error] localStorage에 깨진 JSON이 들어있으면 기본값으로 폴백한다", async () => {
    localStorage.setItem("mega1-audio-settings", "{not valid json");
    const { getBgmVolume, getSfxVolume } = await freshSettings();
    expect(getBgmVolume()).toBe(1);
    expect(getSfxVolume()).toBe(1);
  });

  it("[Error] localStorage 접근 자체가 예외를 던져도 기본값을 반환하고 예외를 내보내지 않는다", async () => {
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
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- settings.test.ts`
Expected: FAIL — `src/settings.ts`가 아직 없어 `Cannot find module './settings'`.

- [ ] **Step 3: 최소 구현 작성**

`src/settings.ts`:

```ts
/** localStorage에 저장하는 키. 값이 없거나 깨져 있으면 기본값(100%)으로 취급한다. */
const STORAGE_KEY = "mega1-audio-settings";

type AudioSettings = { bgm: number; sfx: number };

const DEFAULTS: AudioSettings = { bgm: 1, sfx: 1 };

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

/**
 * localStorage 접근 자체가 예외를 던지는 환경(프라이빗 브라우징 등)과 저장된
 * JSON이 깨져 있는 경우를 모두 기본값으로 조용히 폴백한다 — src/audio.ts가
 * 오디오 실패를 조용히 넘기는 것과 같은 원칙.
 */
function load(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<AudioSettings>;
    return {
      bgm: clamp01(Number(parsed.bgm)),
      sfx: clamp01(Number(parsed.sfx)),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(settings: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 저장이 막혀 있어도 게임은 계속된다 — 이번 세션 동안은 메모리 값이 아니라
    // 매번 load()가 기본값을 돌려주므로, 조절은 되지만 새로고침하면 초기화된다.
  }
}

export function getBgmVolume(): number {
  return load().bgm;
}

export function getSfxVolume(): number {
  return load().sfx;
}

export function setBgmVolume(value: number): void {
  save({ ...load(), bgm: clamp01(value) });
}

export function setSfxVolume(value: number): void {
  save({ ...load(), sfx: clamp01(value) });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- settings.test.ts`
Expected: PASS — 7개 테스트 전부.

- [ ] **Step 5: 커밋**

```bash
git add src/settings.ts src/settings.test.ts
git commit -m "feat(settings): add persisted BGM/SFX volume multiplier module

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: 배경음악 볼륨 통일 + 사용자 배율 적용 (`config.ts`, `audio.ts`)

**Files:**
- Modify: `src/config.ts` (`BGM` 객체 → `BGM_VOLUME` 단일 상수, `TEX`에 `UI_GEAR` 추가는 Task 3에서)
- Modify: `src/audio.ts` (`playBgm` 시그니처 변경, `refreshBgmVolume` 추가, SFX 볼륨에 사용자 배율 적용)
- Modify: `src/audio.test.ts` (새 시그니처·배율 반영에 맞춰 갱신)
- Modify: `src/scenes/MenuScene.ts`, `src/scenes/GameScene.ts`, `src/scenes/GameOverScene.ts`, `src/scenes/WinScene.ts` (`playBgm(this, BGM.xxx)` → `playBgm(this)`)

**Interfaces:**
- Consumes: Task 1의 `getBgmVolume()`/`getSfxVolume()`.
- Produces: `playBgm(scene: Phaser.Scene): void`, `refreshBgmVolume(): void` — Task 3의 `SettingsScene`이 `refreshBgmVolume()`을 가져다 쓴다. `BGM_VOLUME: number`(from `config.ts`) — Task 2의 테스트가 기대값 계산에 쓴다.

- [ ] **Step 1: 실패하는 테스트로 새 시그니처를 고정**

`src/audio.test.ts` 전체를 다음으로 교체한다(기존 파일의 `playBgm(scene, volume)` 2-인자 호출이 전부 사라진다):

```ts
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

async function freshAudio() {
  vi.resetModules();
  return await import("./audio");
}

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
  const add = vi.fn((_key: string, _config: { volume?: number }) => bgm);
  return { scene: { sound: { add } } as unknown as Phaser.Scene, bgm, add };
}

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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- audio.test.ts`
Expected: FAIL — `playBgm`이 아직 2번째 인자를 요구하고(타입 에러), `refreshBgmVolume`과 `BGM_VOLUME`이 없다.

- [ ] **Step 3: `config.ts`에서 `BGM` 객체를 `BGM_VOLUME` 단일 상수로 교체**

`src/config.ts`에서 (420~433행) 다음 블록을:

```ts
/**
 * 배경음악 볼륨 — 화면에 따라 다르다(src/audio.ts). 음악은 한 번 켜지면 멈추지
 * 않고, 화면이 바뀔 때마다 이 값들 사이를 오간다.
 *
 * 플레이 중에는 효과음이 묻히지 않도록 음악이 뒤로 물러난다. GAMEPLAY이 SFX의
 * MASTER_VOLUME보다 확실히 낮아야 효과음이 위로 튀어나온다 — 이 관계가 깨지면
 * 장애물·발사·점프 소리가 음악에 잡아먹힌다.
 */
export const BGM = {
  /** 타이틀·게임오버·승리 화면 — 음악이 주인공인 구간. */
  SCREEN: 0.5,
  /** 플레이 중 — 배경으로 깔리는 구간. */
  GAMEPLAY: 0.2,
} as const;
```

다음으로 바꾼다:

```ts
/**
 * 배경음악 기준 볼륨(사용자가 설정 화면에서 낮추기 전 값, src/settings.ts).
 * 타이틀·플레이·죽음·승리 4개 화면 전부 이 값 하나를 쓴다 — 화면별로 다르게
 * 주던 것은 2026-08-09에 통일했다(docs/superpowers/specs/2026-08-09-
 * bgm-volume-unify-and-settings-design.md).
 *
 * SFX.MASTER_VOLUME보다 확실히 낮아야 한다 — 이 관계가 깨지면 장애물·발사·
 * 점프 소리가 음악에 잡아먹힌다.
 */
export const BGM_VOLUME = 0.2;
```

- [ ] **Step 4: `audio.ts`에 사용자 배율 적용**

`src/audio.ts`의 import와 `playBgm`을 바꾼다. 기존:

```ts
import Phaser from "phaser";
import { SFX } from "./config";
```

를:

```ts
import Phaser from "phaser";
import { BGM_VOLUME, SFX } from "./config";
import { getBgmVolume, getSfxVolume } from "./settings";
```

로, 그리고 기존 `playBgm` 함수를:

```ts
export function playBgm(scene: Phaser.Scene, volume: number): void {
  try {
    bgm ??= scene.sound.add("bgm", { loop: true, volume });
    if (!bgm.isPlaying) bgm.play();
    bgm.setVolume(volume);
  } catch (e) {
    console.warn("[audio] bgm failed to load/play; continuing without music:", e);
  }
}
```

를 다음으로 바꾼다:

```ts
function effectiveBgmVolume(): number {
  return BGM_VOLUME * getBgmVolume();
}

/**
 * 음악이 기준 볼륨 × 사용자 배율로 흐르게 만든다. 아직 안 켜졌으면 켜고,
 * 이미 흐르고 있으면 볼륨만 다시 계산해 맞춘다.
 */
export function playBgm(scene: Phaser.Scene): void {
  try {
    const volume = effectiveBgmVolume();
    bgm ??= scene.sound.add("bgm", { loop: true, volume });
    if (!bgm.isPlaying) bgm.play();
    bgm.setVolume(volume);
  } catch (e) {
    console.warn("[audio] bgm failed to load/play; continuing without music:", e);
  }
}

/**
 * 설정 화면에서 배경음악 슬라이더를 옮길 때, 지금 흐르는 곡에 새 배율을 바로
 * 반영한다. 음악이 아직 만들어지지 않았으면(설정을 열기 전에는 항상 이미
 * 만들어져 있지만) 아무 일도 하지 않는다.
 */
export function refreshBgmVolume(): void {
  bgm?.setVolume(effectiveBgmVolume());
}
```

그리고 파일 맨 아래, SFX 재생 함수들이 전부 `SFX.MASTER_VOLUME`을 직접 넘기던 자리를 바꾼다. 기존:

```ts
export function playJump(scene: Phaser.Scene): void {
  playTone(scene, SFX.JUMP, SFX.MASTER_VOLUME);
}

export function playEnemyKill(scene: Phaser.Scene): void {
  playTone(scene, SFX.ENEMY_KILL, SFX.MASTER_VOLUME);
}

export function playFire(scene: Phaser.Scene): void {
  playTone(scene, SFX.FIRE, SFX.MASTER_VOLUME);
}

export function playCannonFire(scene: Phaser.Scene): void {
  playNoiseBurst(scene, SFX.CANNON, SFX.MASTER_VOLUME);
}

export function playShieldBlock(scene: Phaser.Scene): void {
  playTone(scene, SFX.SHIELD_BLOCK, SFX.MASTER_VOLUME);
}

export function playRockDrop(scene: Phaser.Scene): void {
  playNoiseBurst(scene, SFX.ROCK_DROP, SFX.MASTER_VOLUME);
}

export function playDeath(scene: Phaser.Scene): void {
  playTone(scene, SFX.DEATH, SFX.MASTER_VOLUME);
}

export function playPendulumSwing(scene: Phaser.Scene): void {
  playNoiseBurst(scene, SFX.PENDULUM_SWING, SFX.MASTER_VOLUME);
}

export function playWin(scene: Phaser.Scene): void {
  playWinJingle(scene, SFX.WIN, SFX.MASTER_VOLUME);
}

export function playShieldPickup(scene: Phaser.Scene): void {
  playTone(scene, SFX.SHIELD_PICKUP, SFX.MASTER_VOLUME);
}

export function playSpringBounce(scene: Phaser.Scene): void {
  playTone(scene, SFX.SPRING_BOUNCE, SFX.MASTER_VOLUME);
}
```

를(각 `SFX.MASTER_VOLUME` 인자만 `effectiveSfxVolume()`으로 교체):

```ts
function effectiveSfxVolume(): number {
  return SFX.MASTER_VOLUME * getSfxVolume();
}

export function playJump(scene: Phaser.Scene): void {
  playTone(scene, SFX.JUMP, effectiveSfxVolume());
}

export function playEnemyKill(scene: Phaser.Scene): void {
  playTone(scene, SFX.ENEMY_KILL, effectiveSfxVolume());
}

export function playFire(scene: Phaser.Scene): void {
  playTone(scene, SFX.FIRE, effectiveSfxVolume());
}

export function playCannonFire(scene: Phaser.Scene): void {
  playNoiseBurst(scene, SFX.CANNON, effectiveSfxVolume());
}

export function playShieldBlock(scene: Phaser.Scene): void {
  playTone(scene, SFX.SHIELD_BLOCK, effectiveSfxVolume());
}

export function playRockDrop(scene: Phaser.Scene): void {
  playNoiseBurst(scene, SFX.ROCK_DROP, effectiveSfxVolume());
}

export function playDeath(scene: Phaser.Scene): void {
  playTone(scene, SFX.DEATH, effectiveSfxVolume());
}

export function playPendulumSwing(scene: Phaser.Scene): void {
  playNoiseBurst(scene, SFX.PENDULUM_SWING, effectiveSfxVolume());
}

export function playWin(scene: Phaser.Scene): void {
  playWinJingle(scene, SFX.WIN, effectiveSfxVolume());
}

export function playShieldPickup(scene: Phaser.Scene): void {
  playTone(scene, SFX.SHIELD_PICKUP, effectiveSfxVolume());
}

export function playSpringBounce(scene: Phaser.Scene): void {
  playTone(scene, SFX.SPRING_BOUNCE, effectiveSfxVolume());
}
```

파일 맨 위 docblock의 "화면마다 볼륨이 달라진다" 설명도 통일된 사실에 맞게 한 줄로 정리한다(15행 부근):

```ts
 * 배경음악은 한 번 켜지면 멈추지 않는다. 볼륨은 기준값(config.ts의
 * BGM_VOLUME) × 사용자가 설정 화면에서 고른 배율(settings.ts)이다.
```

- [ ] **Step 5: 4개 화면의 `playBgm` 호출 수정**

- `src/scenes/MenuScene.ts`: `playBgm(this, BGM.SCREEN);` → `playBgm(this);`. import를 `import { BGM, SCREEN_COLORS, TEX } from "../config";` → `import { SCREEN_COLORS, TEX } from "../config";`로.
- `src/scenes/GameOverScene.ts`: `playBgm(this, BGM.SCREEN);` → `playBgm(this);`. import를 `import { BGM, SCREEN_COLORS, TEX } from "../config";` → `import { SCREEN_COLORS, TEX } from "../config";`로(`MenuScene`과 동일한 줄).
- `src/scenes/WinScene.ts`: `playBgm(this, BGM.SCREEN);` → `playBgm(this);`. import를 `import { BGM, SCREEN_COLORS, TEX } from "../config";` → `import { SCREEN_COLORS, TEX } from "../config";`로(동일).
- `src/scenes/GameScene.ts`: `playBgm(this, BGM.GAMEPLAY);` → `playBgm(this);`. import를 `import { BGM, CAMERA, CANNON, COLORS, DEPTH, PARALLAX, SHIELD, SPIKE, TEX, THWOMP } from "../config";` → `import { CAMERA, CANNON, COLORS, DEPTH, PARALLAX, SHIELD, SPIKE, TEX, THWOMP } from "../config";`로(`BGM,`만 빠진다 — 다른 이름은 전부 그대로 쓰인다).

- [ ] **Step 6: 테스트 통과 + 빌드 확인**

Run: `npm test`
Expected: PASS — 전체 스위트(기존 + `settings.test.ts` + 갱신된 `audio.test.ts`).

Run: `npm run build`
Expected: 타입 에러 없이 빌드 성공(`BGM` 미사용 import를 지우지 않으면 `tsc --noEmit`이 여기서 잡아낸다).

- [ ] **Step 7: 수동 확인**

`npm run dev`로 타이틀·플레이·죽음(`?stage=1`로 들어가 죽어보기)·승리(`?stage=10`) 4개 화면을 순서대로 거치며 배경음악 크기가 전환 시 갑자기 커지거나 작아지지 않는지 귀로 확인한다.

- [ ] **Step 8: 커밋**

```bash
git add src/config.ts src/audio.ts src/audio.test.ts \
  src/scenes/MenuScene.ts src/scenes/GameScene.ts \
  src/scenes/GameOverScene.ts src/scenes/WinScene.ts
git commit -m "feat(audio): unify BGM volume across screens, apply user multiplier

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: 톱니바퀴 아이콘 텍스처 + 설정 화면(`SettingsScene`)

**Files:**
- Modify: `src/config.ts` (`TEX`에 `UI_GEAR` 추가)
- Modify: `src/scenes/BootScene.ts` (`makeSettingsIconTexture()` 추가 + `create()`에서 호출)
- Create: `src/scenes/SettingsScene.ts`
- Modify: `src/main.ts` (`scene: [...]`에 `SettingsScene` 추가)

**Interfaces:**
- Consumes: Task 1의 `getBgmVolume`/`getSfxVolume`/`setBgmVolume`/`setSfxVolume`, Task 2의 `refreshBgmVolume`, `src/scenes/screen.ts`의 `SCREEN_FONT`, `src/display.ts`의 `cameraZoom`.
- Produces: 씬 키 `"SettingsScene"`(Task 4가 `scene.run("SettingsScene", { returnKey })`으로 연다), 텍스처 키 `TEX.UI_GEAR`(Task 4가 4개 화면의 아이콘 스프라이트에 쓴다).

이 Task는 Phaser 씬(렌더링·입력)이라 이 프로젝트에 씬 단위 자동 테스트가 없다(기존 관례 — `MenuScene`/`GameScene` 등 어느 씬도 `.test.ts`가 없다). 검증은 마지막 수동 확인 단계에서 한다.

- [ ] **Step 1: `TEX.UI_GEAR` 추가**

`src/config.ts`의 `TEX` 객체(366~401행)에서 `FALLING_ROCK` 다음, `UI_TITLE` 앞에 추가:

```ts
  FALLING_ROCK: "tex-falling-rock",
  // Settings 아이콘 — UI_TITLE/UI_DEATH/UI_WIN(SVG 로드)과 달리 BootScene에서
  // beginTexture()/endTexture()로 절차적으로 그린다(makeGearTexture 등과 같은 방식).
  UI_GEAR: "tex-ui-gear",
  // Title / death / win screen artwork, loaded from public/ui rather than drawn
  // here — see BootScene.preload.
  UI_TITLE: "tex-ui-title",
```

- [ ] **Step 2: `BootScene`에 아이콘 텍스처 생성 추가**

`src/scenes/BootScene.ts`의 `create()`에서 `this.makeShieldTexture();` 다음 줄에 추가:

```ts
    this.makeShieldTexture();

    // Settings 톱니바퀴 아이콘 — 4개 화면 전부에서 볼륨 설정을 여는 버튼.
    this.makeSettingsIconTexture();

    // Gear hazard (level7).
    this.makeGearTexture();
```

그리고 클래스 안(예: `makeShieldTexture` 다음)에 메서드를 추가한다:

```ts
  /**
   * Settings 버튼 아이콘. makeGearTexture()(레벨8 회전 기어 해저드)와 같은
   * 절차적 드로잉 방식이지만 별도 텍스처(TEX.UI_GEAR)로 — 크기와 색이
   * 해저드용과 다르고, 해저드 텍스처를 UI에 재사용하면 둘의 튜닝이 엉킨다.
   */
  private makeSettingsIconTexture(): void {
    const s = 24;
    const c = s / 2;
    const g = this.beginTexture();
    g.fillStyle(0xfff1e8, 1); // SCREEN_COLORS.PROMPT — 어느 화면 배경에도 또렷하게 보인다.
    g.fillCircle(c, c, 10);
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      g.save();
      g.translateCanvas(c + Math.cos(a) * 10, c + Math.sin(a) * 10);
      g.rotateCanvas(a);
      g.fillRect(-3, -3, 6, 6);
      g.restore();
    }
    g.fillStyle(0x1d2b53, 1); // COLORS.BACKGROUND — 어두운 허브로 톱니와 대비.
    g.fillCircle(c, c, 4);
    this.endTexture(g, TEX.UI_GEAR, s, s);
  }
```

- [ ] **Step 3: `SettingsScene.ts` 작성**

`src/scenes/SettingsScene.ts`:

```ts
import Phaser from "phaser";
import { SCREEN_FONT } from "./screen";
import { cameraZoom } from "../display";
import { getBgmVolume, getSfxVolume, setBgmVolume, setSfxVolume } from "../settings";
import { refreshBgmVolume } from "../audio";
import { COLORS, SCREEN_COLORS } from "../config";

/** CSS 헥스 문자열(SCREEN_COLORS)을 Phaser Shape가 원하는 숫자로 바꾼다. */
const hex = (css: string): number => Phaser.Display.Color.HexStringToColor(css).color;

const PANEL_W = 300;
const PANEL_H = 170;
const TRACK_W = 140;
const LABEL_DX = -130;
const TRACK_DX = -85;
const PCT_DX = 70;

type Row = {
  get: () => number;
  set: (value: number) => void;
  label: Phaser.GameObjects.Text;
  track: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  handle: Phaser.GameObjects.Rectangle;
  pct: Phaser.GameObjects.Text;
  dy: number;
  trackLeft: number;
  trackWidth: number;
};

/**
 * 볼륨 설정 오버레이. `MenuScene`/`GameScene`/`GameOverScene`/`WinScene`이
 * 톱니바퀴를 누르면 자신을 `scene.pause()`한 뒤
 * `scene.run("SettingsScene", { returnKey: this.scene.key })`로 이 씬을 그
 * 위에 띄운다. 닫으면 `scene.resume(returnKey)`로 정확히 그 지점에서 이어지고,
 * 이 씬 자신은 `scene.stop()`으로 완전히 정지한다 — 다음에 다시 열릴 때
 * `run()`이 "실행 중이 아님"으로 보고 새로 `create()`하므로 항상 최신 볼륨
 * 값으로 슬라이더가 그려진다.
 *
 * 카메라 배율은 1로 둔다(제목/죽음/승리 화면과 같음, screen.ts 참고) — 이
 * 화면은 어느 게임 화면 위에도 뜰 수 있어 그 화면의 카메라 배율과 무관해야
 * 한다. 대신 `layout()`이 논리 좌표를 `cameraZoom()`으로 직접 환산한다.
 */
export class SettingsScene extends Phaser.Scene {
  private returnKey = "MenuScene";
  private rows: Row[] = [];
  private draggingRow: Row | null = null;
  private dim!: Phaser.GameObjects.Rectangle;
  private panel!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super("SettingsScene");
  }

  init(data: { returnKey: string }): void {
    this.returnKey = data.returnKey;
  }

  create(): void {
    this.rows = [];
    this.draggingRow = null;

    this.dim = this.add.rectangle(0, 0, 1, 1, 0x000000, 0.55).setOrigin(0, 0);

    this.panel = this.add
      .rectangle(0, 0, 1, 1, hex(SCREEN_COLORS.TITLE_SKY), 1)
      .setStrokeStyle(4, hex(SCREEN_COLORS.PROMPT));
    // 클릭이 패널 바깥(딤 배경)에 떨어졌을 때만 닫히게 하려면 패널도 인터랙티브
    // 대상에 포함되어야 한다 — 리스너는 없어도, currentlyOver에 잡히는 것만으로
    // "패널 안쪽 클릭"과 "바깥 클릭"을 구분할 수 있다(아래 pointerdown 참고).
    this.panel.setInteractive();

    this.title = this.add
      .text(0, 0, "SETTINGS", { fontFamily: SCREEN_FONT, color: SCREEN_COLORS.PROMPT })
      .setOrigin(0.5);

    this.hint = this.add
      .text(0, 0, "ESC or click outside to close", {
        fontFamily: SCREEN_FONT,
        color: SCREEN_COLORS.MUTED,
      })
      .setOrigin(0.5);

    this.rows = [
      this.buildRow(-15, "BGM", getBgmVolume, (v) => {
        setBgmVolume(v);
        refreshBgmVolume();
      }, COLORS.PLAYER),
      this.buildRow(25, "SFX", getSfxVolume, setSfxVolume, COLORS.GOAL),
    ];

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
    });

    // 슬라이더 드래그: 트랙/손잡이의 pointerdown이 draggingRow를 잡고, 씬 전체의
    // pointermove가 값을 갱신하고, pointerup이 놓는다.
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.draggingRow) return;
      this.applyPointerToRow(this.draggingRow, pointer.x);
    });
    this.input.on("pointerup", () => {
      this.draggingRow = null;
    });

    // 패널 바깥(딤 배경)을 클릭하면 닫는다. currentlyOver가 비어 있다는 것은
    // 트랙·손잡이·패널 중 어느 것도 그 클릭 위치에 없었다는 뜻이다 — dim 자체를
    // 인터랙티브로 만들지 않는 이유는, 그러면 dim과 패널/트랙이 동시에
    // "클릭됨" 상태가 되어 슬라이더를 만지자마자 닫혀버리는 순서 문제가 생기기
    // 때문이다(패널·트랙만 인터랙티브로 두면 이 모호함이 없다).
    this.input.on("pointerdown", (_pointer: Phaser.Input.Pointer, currentlyOver: unknown[]) => {
      if (currentlyOver.length === 0) this.close();
    });

    this.input.keyboard!.once("keydown-ESC", () => this.close());
  }

  private buildRow(
    dy: number,
    labelText: string,
    get: () => number,
    set: (value: number) => void,
    fillColor: number,
  ): Row {
    const label = this.add
      .text(0, 0, labelText, { fontFamily: SCREEN_FONT, color: SCREEN_COLORS.PROMPT })
      .setOrigin(0, 0.5);
    const track = this.add
      .rectangle(0, 0, TRACK_W, 10, COLORS.BACKGROUND, 1)
      .setStrokeStyle(2, hex(SCREEN_COLORS.PROMPT))
      .setOrigin(0, 0.5);
    track.setInteractive();
    const fill = this.add.rectangle(0, 0, 1, 6, fillColor, 1).setOrigin(0, 0.5);
    const handle = this.add
      .rectangle(0, 0, 10, 18, hex(SCREEN_COLORS.PROMPT), 1)
      .setStrokeStyle(2, COLORS.OUTLINE)
      .setOrigin(0.5);
    handle.setInteractive();
    const pct = this.add
      .text(0, 0, "", { fontFamily: SCREEN_FONT, color: SCREEN_COLORS.PROMPT })
      .setOrigin(0, 0.5);

    const row: Row = { get, set, label, track, fill, handle, pct, dy, trackLeft: 0, trackWidth: 0 };

    const startDrag = (pointer: Phaser.Input.Pointer) => {
      this.draggingRow = row;
      this.applyPointerToRow(row, pointer.x);
    };
    track.on("pointerdown", startDrag);
    handle.on("pointerdown", startDrag);

    return row;
  }

  /** 포인터의 x좌표를 트랙 위 값(0~1)으로 환산해 저장하고 화면을 갱신한다. */
  private applyPointerToRow(row: Row, pointerX: number): void {
    const value = Phaser.Math.Clamp((pointerX - row.trackLeft) / row.trackWidth, 0, 1);
    row.set(value);
    this.updateRowVisual(row);
  }

  private updateRowVisual(row: Row): void {
    const value = row.get();
    const fillWidth = Math.max(1, row.trackWidth * value);
    row.fill.setSize(fillWidth, row.track.height * 0.6).setPosition(row.trackLeft, row.track.y);
    row.handle.setPosition(row.trackLeft + fillWidth, row.track.y);
    row.pct.setText(`${Math.round(value * 100)}%`);
  }

  /** 창 크기가 바뀔 때마다(그리고 시작 시 한 번) 전부 다시 배치한다. */
  private layout(): void {
    const scale = cameraZoom(this.scale.height);
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.dim.setSize(this.scale.width, this.scale.height);
    this.panel.setSize(PANEL_W * scale, PANEL_H * scale).setPosition(cx, cy);
    this.title.setPosition(cx, cy - 65 * scale).setFontSize(Math.round(18 * scale));
    this.hint.setPosition(cx, cy + 65 * scale).setFontSize(Math.round(10 * scale));

    for (const row of this.rows) {
      const rowY = cy + row.dy * scale;
      const trackLeft = cx + TRACK_DX * scale;
      row.trackLeft = trackLeft;
      row.trackWidth = TRACK_W * scale;

      row.label.setPosition(cx + LABEL_DX * scale, rowY).setFontSize(Math.round(12 * scale));
      row.track.setSize(TRACK_W * scale, 10 * scale).setPosition(trackLeft, rowY);
      row.pct.setPosition(cx + PCT_DX * scale, rowY).setFontSize(Math.round(12 * scale));
      this.updateRowVisual(row);
    }
  }

  private close(): void {
    this.scene.resume(this.returnKey);
    this.scene.stop();
  }
}
```

- [ ] **Step 4: `main.ts`에 씬 등록**

`src/main.ts`에서:

```ts
import { WinScene } from "./scenes/WinScene";
```

다음 줄에 추가:

```ts
import { SettingsScene } from "./scenes/SettingsScene";
```

그리고:

```ts
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene],
```

를:

```ts
  scene: [BootScene, MenuScene, GameScene, GameOverScene, WinScene, SettingsScene],
```

로 바꾼다.

- [ ] **Step 5: 타입체크 + 빌드 확인**

Run: `npm run build`
Expected: 성공. (이 Task는 아직 4개 화면이 `SettingsScene`을 열지 않으므로 플레이로는 확인할 수 없다 — Task 4에서 눈으로 확인한다.)

- [ ] **Step 6: 커밋**

```bash
git add src/config.ts src/scenes/BootScene.ts src/scenes/SettingsScene.ts src/main.ts
git commit -m "feat(settings): add settings overlay scene and gear icon texture

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 4개 화면에 톱니바퀴 아이콘 연결

**Files:**
- Modify: `src/scenes/MenuScene.ts`
- Modify: `src/scenes/GameOverScene.ts`
- Modify: `src/scenes/WinScene.ts`
- Modify: `src/scenes/GameScene.ts`

**Interfaces:**
- Consumes: Task 3의 씬 키 `"SettingsScene"`과 텍스처 `TEX.UI_GEAR`.
- Produces: (없음 — 이 Task로 기능이 사용자에게 완성된다.)

이 Task도 Phaser 씬 입력 처리라 자동 테스트가 없다. 마지막 수동 확인 단계가 검증이다.

- [ ] **Step 1: `MenuScene`에 아이콘 추가**

`src/scenes/MenuScene.ts`의 `screen.start();` 다음(`const start = ...` 앞)에 추가:

```ts
    const gear = this.add
      .image(0, 0, TEX.UI_GEAR)
      .setScale(1 / TEXTURE_SCALE)
      .setDepth(DEPTH.HUD)
      .setInteractive({ useHandCursor: true });
    gear.setPosition(this.scale.width - 28, 28);
    // 이 화면은 this.input.once("pointerdown", start)로 "아무 데나 클릭하면
    // 시작"을 걸어 둔다(아래). 톱니바퀴 클릭이 이 리스너까지 함께 발동시키면
    // 설정을 열려는 클릭이 동시에 게임을 시작시켜 버리므로, stopPropagation()
    // 으로 여기서 전파를 끊는다.
    gear.on("pointerdown", (_p: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.scene.pause();
      this.scene.run("SettingsScene", { returnKey: this.scene.key });
    });
```

파일 위쪽 import를 고친다. Task 2 Step 5를 거친 뒤 이 줄은:

```ts
import { SCREEN_COLORS, TEX } from "../config";
```

이고, 여기에 `DEPTH`를 추가하고 `TEXTURE_SCALE` import를 새로 더한다:

```ts
import { SCREEN_COLORS, TEX, DEPTH } from "../config";
import { TEXTURE_SCALE } from "../display";
```

톱니바퀴는 창 크기가 바뀌어도 우측 상단에 붙어 있어야 하므로, 리사이즈에 맞춰 재배치한다. `screen.start()`가 이미 `RESIZE` 리스너를 자기 걸고 있지만 그건 `centredScreen`의 rows만 다시 배치하므로, gear는 별도로 처리한다:

```ts
    const repositionGear = () => gear.setPosition(this.scale.width - 28, 28);
    this.scale.on(Phaser.Scale.Events.RESIZE, repositionGear);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, repositionGear);
    });
```

- [ ] **Step 2: `GameOverScene`에 같은 방식으로 추가**

`src/scenes/GameOverScene.ts`도 Step 1과 완전히 같은 패턴이다 — `screen.start();` 다음에 동일한 gear 생성·`stopPropagation`·리사이즈 코드를 추가한다. import에 `TEX`(이미 있음), `DEPTH`, `TEXTURE_SCALE`을 추가한다.

- [ ] **Step 3: `WinScene`에 같은 방식으로 추가**

`src/scenes/WinScene.ts`도 Step 1과 완전히 같은 패턴이다.

- [ ] **Step 4: `GameScene`에 HUD 아이콘으로 추가**

`GameScene`은 전역 `once("pointerdown", ...)`이 없어 `stopPropagation`이 필요 없다. 대신 기존 HUD(`drawHud()`/`layoutHud()`) 시스템에 맞춰 넣는다 — 이 화면은 카메라가 줌·스크롤되므로 `cameras.main.worldView` 기준 배치를 따라야 한다(다른 방식은 창 크기·화면 배율에 따라 위치가 어긋난다).

`drawHud()`(827행 부근)의 `this.updateShieldIcons();` 다음에 추가:

```ts
    this.gearIcon = this.add
      .image(0, 0, TEX.UI_GEAR)
      .setScale(1 / TEXTURE_SCALE)
      .setDepth(DEPTH.HUD)
      .setInteractive({ useHandCursor: true });
    this.gearIcon.on("pointerdown", () => {
      this.scene.pause();
      this.scene.run("SettingsScene", { returnKey: this.scene.key });
    });
```

클래스 필드 선언(87행 `stageText` 옆)에 추가:

```ts
  private gearIcon!: Phaser.GameObjects.Image;
```

`layoutHud()`(920행 부근)의 `this.stageText.setPosition(...)` 다음에 추가(스테이지 표시 바로 아래, 우측 정렬):

```ts
    this.gearIcon.setPosition(left + width - 16, top + 40);
```

`TEX`/`DEPTH`/`TEXTURE_SCALE`는 이미 이 파일에 import돼 있다(확인: 파일 상단에 `TEX`, `DEPTH`는 기존 import에 있고 `TEXTURE_SCALE`도 이미 쓰이고 있다 — 새 import 불필요).

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 6: 수동 확인 (`npm run dev`)**

1. 타이틀 화면에서 톱니바퀴를 클릭 → 설정 화면이 뜬다. 뒤에 게임이 몰래 시작되지 않는다(화면이 그대로 타이틀로 남아 있다가 설정이 닫혀야 확인 가능 — 닫았을 때 여전히 타이틀이면 통과).
2. `?stage=1`로 플레이 중 톱니바퀴 클릭 → 캐릭터가 그 자리에서 완전히 멈추고, 화면이 어두워지며 설정 박스가 뜬다.
3. BGM 슬라이더를 드래그 → 지금 흐르는 음악 크기가 실시간으로 바뀐다.
4. SFX 슬라이더를 낮추고 닫은 뒤 점프해보면 점프음이 작다.
5. `ESC`로 닫힌다. 딤 배경(박스 바깥) 클릭으로도 닫힌다. 박스 안(트랙 사이 빈 공간) 클릭으로는 닫히지 않는다.
6. 닫으면 플레이 중이던 지점에서 정확히 이어진다(죽지 않는다).
7. `?stage=1`로 죽어서 죽음 화면에서, 그리고 `?stage=10`으로 승리 화면에서 각각 톱니바퀴가 똑같이 동작한다.
8. 볼륨을 낮춘 뒤 브라우저를 새로고침해도 슬라이더 위치와 실제 소리 크기가 유지된다.
9. 창을 아주 좁게/넓게 늘려도 톱니바퀴와 설정 박스가 화면 밖으로 나가거나 겹치지 않는다.

- [ ] **Step 7: 커밋**

```bash
git add src/scenes/MenuScene.ts src/scenes/GameOverScene.ts src/scenes/WinScene.ts src/scenes/GameScene.ts
git commit -m "feat(settings): wire gear icon into all four screens

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: 문서 갱신

**Files:**
- Modify: `.claude/rules/game-feel.md`
- Modify: `CLAUDE.md`
- Modify: `docs/superpowers/specs/2026-08-08-bgm-scene-scoped-design.md`
- Modify: `README.md`

**Interfaces:** 없음(코드 변경 없는 문서 작업).

- [ ] **Step 1: `game-feel.md` 오디오 믹스 절 갱신**

`.claude/rules/game-feel.md`의 "이 저장소의 현재 값" 표와 그 위 다이어그램을 통일된 값 + 사용자 조절 기능 언급으로 바꾼다:

```markdown
이 저장소의 현재 값 (`src/config.ts`):

| 상수 | 값 | 쓰이는 곳 |
|---|---|---|
| `BGM_VOLUME` | `0.2` | 타이틀·플레이·죽음·승리 4개 화면 전부(통일, 2026-08-09) |
| `SFX.MASTER_VOLUME` | `0.4` | 모든 효과음 |

**`BGM_VOLUME` < `SFX.MASTER_VOLUME` 관계가 깨지면 안 된다.** 이 관계가 뒤집혀 있었던 것(음악 0.5 > 효과음 0.4)이 "플레이 중에 효과음이 안 들린다"의 진짜 원인이었다.

사용자가 이 두 값에 곱해지는 배율을 톱니바퀴 버튼(4개 화면 모두)으로 직접 낮출 수 있다 — `src/settings.ts`, `src/scenes/SettingsScene.ts`.
```

(다이어그램의 `0.5 │ ░░░░░░░ ...` 줄은 이제 존재하지 않는 화면별 차이를 보여주므로, `0.2` 한 줄만 남기고 "메뉴류" 표시는 지운다. 다이어그램을 다시 그릴 필요 없이 그 줄만 삭제하고 표 아래 설명으로 대체해도 충분하다.)

- [ ] **Step 2: `CLAUDE.md` 게임 로직 관례 갱신**

`CLAUDE.md`의 다음 문장:

> 새 화면(씬)을 만들 때는 `create()`에서 `playBgm(this, 볼륨)`을 반드시 호출한다. ... 볼륨은 `config.ts`의 `BGM.SCREEN`(음악이 주인공인 화면)과 `BGM.GAMEPLAY`(효과음이 주인공인 플레이 중) 중에서 고른다.

를:

> 새 화면(씬)을 만들 때는 `create()`에서 `playBgm(this)`를 반드시 호출한다. 배경음악은 한 번 켜지면 멈추지 않고 씬 생명주기 밖(오디오 모듈)에 살아 있으므로, 호출하지 않는 화면은 이전 화면의 볼륨을 그대로 물려받는다. 볼륨은 `config.ts`의 `BGM_VOLUME` 하나로 통일되어 있고(2026-08-09), 화면별로 고를 필요가 없다 — 사용자가 설정 화면에서 낮춘 배율만 곱해진다.

로 바꾼다.

- [ ] **Step 3: `bgm-scene-scoped-design.md` 13절에 안내 추가**

`docs/superpowers/specs/2026-08-08-bgm-scene-scoped-design.md`의 13절(`## 13. 개정 — ...`) 바로 아래에 한 줄 추가:

```markdown
## 13. 개정 — 플레이 중에는 끄지 않고 볼륨만 낮춘다 (현재 동작)

> ⚠️ **이 절도 2026-08-09에 대체됐다.** 화면별 볼륨 차이(`BGM.SCREEN`/`BGM.GAMEPLAY`)는 통일됐고, 사용자가 직접 조절하는 기능이 추가됐다 — `docs/superpowers/specs/2026-08-09-bgm-volume-unify-and-settings-design.md` 참고. 이 절은 그 결정에 이르기까지의 배경(플레이 중 완전 무음이 허전했던 이유)으로만 남긴다.

### 왜 바꿨나
```

- [ ] **Step 4: `README.md` 갱신**

"조작" 표 다음에 한 줄 추가(설정 버튼 안내):

```markdown
화면 우측 상단의 톱니바퀴(⚙) 아이콘을 누르면 배경음악·효과음 볼륨을 각각 조절할 수 있는 설정 화면이 열립니다. 플레이 중에 열면 게임이 잠시 멈추고, 닫으면 멈췄던 지점에서 그대로 이어집니다. 조절한 값은 브라우저에 저장되어 다음에 다시 열어도 유지됩니다.
```

"수동 플레이테스트" 체크리스트 끝에 추가:

```markdown
- 4개 화면(타이틀·플레이·죽음·승리) 모두에서 톱니바퀴로 설정 화면이 열리고, `ESC`나 바깥 클릭으로 닫히며, 플레이 중이었다면 그 지점에서 이어지는지.
- 설정 화면에서 배경음악/효과음 슬라이더를 조절하면 소리 크기가 즉시 바뀌고, 새로고침 후에도 유지되는지.
```

- [ ] **Step 5: 빌드 확인 (문서만 바꿨지만 훅이 함께 돈다)**

Run: `npm run build && npm test`
Expected: 기존과 동일하게 성공(문서만 바꿨으므로 코드 결과는 변하지 않는다).

- [ ] **Step 6: 커밋**

```bash
git add .claude/rules/game-feel.md CLAUDE.md \
  docs/superpowers/specs/2026-08-08-bgm-scene-scoped-design.md README.md
git commit -m "docs: reflect unified BGM volume and settings feature

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: 최종 검증

**Files:** 없음(검증만).

**Interfaces:** 없음.

- [ ] **Step 1: 전체 자동 검증**

```bash
npm run build
npm test
```

Expected: 둘 다 exit 0.

- [ ] **Step 2: 스펙 5절 수동 체크리스트 전부 재확인**

`docs/superpowers/specs/2026-08-09-bgm-volume-unify-and-settings-design.md` 5절의 8개 항목을 처음부터 다시 순서대로 확인한다(Task 4에서 이미 확인했지만, 문서 갱신 후 전체를 한 번 더 통과시켜 회귀가 없는지 본다).

- [ ] **Step 3: 완료 보고**

모든 체크박스가 통과하면 이 계획은 끝이다. 실패한 항목이 있으면 원인을 분석해 보완 Task를 이 문서 끝에 추가하고(완료조건·스킬 매핑 포함) 다시 수행한다.
