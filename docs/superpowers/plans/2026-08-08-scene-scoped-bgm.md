# 배경음악 재생 범위 구현 계획 — 게임 중에는 효과음만

> **작업자에게:** 이 계획은 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`로 한 작업씩 실행한다. 각 단계는 체크박스(`- [ ]`)로 진행을 추적한다.

**목표:** 배경음악을 타이틀·죽음·클리어 화면에서만 재생하고, 플레이 중에는 효과음만 남긴다.

**접근:** 오디오 모듈의 "한 번 켜면 안 끄는" 함수 하나를 켜기/끄기 두 함수로 나누고, 네 화면이 각자 자기 화면에 맞는 쪽을 호출한다. 음악 객체는 게임 전체에 하나만 만들어 재사용하며, 이미 재생 중일 때 다시 켜라는 요청은 무시해서 음악이 필요한 화면끼리 이동할 때 곡이 끊기지 않게 한다.

**기술 스택:** TypeScript, Phaser 4.2.1, Vite 8, Vitest 4

**설계 문서:** `docs/superpowers/specs/2026-08-08-bgm-scene-scoped-design.md`

**브랜치:** `feat/scene-scoped-bgm` (이미 체크아웃되어 있음)

## 전체 제약

- **모든 커밋은 빌드와 테스트를 통과해야 한다.** 커밋 훅이 `npm run build`(타입 검사 포함)와 `npm test`를 자동으로 돌리므로, 통과하지 못하면 커밋 자체가 거부된다. 함수 이름을 바꾸는 작업과 그 함수를 쓰는 곳을 고치는 작업은 **반드시 같은 커밋에 들어가야 한다.**
- 음악 파일을 추가하지 않는다. 이미 있는 `public/audio/bgm.mp3` 한 곡을 세 화면이 함께 쓴다.
- 효과음을 건드리지 않는다. `src/config.ts`의 `SFX` 값과 11개 효과음 함수는 그대로 둔다.
- 게임 규칙·물리·난이도를 바꾸지 않는다.
- 음악 볼륨 `0.5`는 지금처럼 `src/audio.ts`에 그대로 둔다. `src/config.ts`로 옮기지 않는다(설계 문서 12절에서 범위 밖으로 정함).
- 음악을 끌 때 소리를 서서히 줄이지 않는다. 즉시 멈춘다.
- 음악 관련 실패는 콘솔 경고만 남기고 게임 진행을 막지 않는다.

## 파일 구조

| 파일 | 하는 일 | 이 계획에서 |
|---|---|---|
| `src/audio.ts` | 배경음악 켜고 끄기 + 효과음 11종 | 배경음악 부분만 수정 (1~18행) |
| `src/audio.test.ts` | 배경음악 켜고 끄기 검증 | **새로 만듦** |
| `src/scenes/MenuScene.ts` | 타이틀 화면 | 음악 켜기 호출을 옮기고 개발용 분기의 호출 삭제 |
| `src/scenes/GameScene.ts` | 플레이 화면 | 음악 끄기 호출 추가 |
| `src/scenes/GameOverScene.ts` | 죽음 화면 | 음악 켜기 호출 추가 |
| `src/scenes/WinScene.ts` | 클리어 화면 | 음악 켜기 호출 추가 |

---

## 작업 1: 오디오 모듈에 켜기/끄기 두 함수 만들기

**파일:**
- 수정: `src/audio.ts:1-18` (`startBgmOnce`를 `playBgm` + `stopBgm`으로 대체)
- 생성: `src/audio.test.ts`
- 수정: `src/scenes/MenuScene.ts:5,36,58` (이름만 바꾸는 기계적 수정 — 동작은 그대로)

**인터페이스:**
- 없앰: `startBgmOnce(scene: Phaser.Scene): void`
- 만듦: `playBgm(scene: Phaser.Scene): void` — 이미 재생 중이면 아무것도 하지 않고, 아니면 곡을 처음부터 재생한다
- 만듦: `stopBgm(): void` — 재생 중이면 멈춘다. 씬 인자를 받지 않는다(음악 객체가 모듈 안에 있고 어떤 화면에도 속하지 않기 때문)

**이 작업이 끝난 시점의 동작은 지금과 완전히 같다.** 이름만 바뀌고 끄는 함수가 생겼을 뿐, 아직 아무 화면도 음악을 끄지 않는다. 실제 동작 변경은 작업 2에서 일어난다.

- [ ] **단계 1: 실패하는 테스트 작성**

`src/audio.test.ts`를 새로 만든다.

```ts
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

    expect(f.add).toHaveBeenCalledWith("bgm", { loop: true, volume: 0.5 });
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

  it("[Boundary] 이미 멈춘 뒤 다시 불러도 안전하다 — 스테이지가 넘어갈 때마다 불린다", async () => {
    const { playBgm, stopBgm } = await freshAudio();
    const f = fakeScene();

    playBgm(f.scene);
    stopBgm();
    stopBgm();

    expect(f.bgm.stop).toHaveBeenCalledTimes(2);
    expect(f.bgm.isPlaying).toBe(false);
  });
});
```

- [ ] **단계 2: 테스트가 실패하는지 확인**

실행: `npx vitest run src/audio.test.ts`

예상: 8개 전부 실패. 실패 메시지는 `TypeError: playBgm is not a function`.

- [ ] **단계 3: 오디오 모듈 구현**

`src/audio.ts`의 1~18행 중 **주석 블록부터 `startBgmOnce` 함수 끝까지**(현재 4~18행)를 아래로 교체한다. 맨 위 두 줄(`import Phaser from "phaser";`, `import { SFX } from "./config";`)과 19행 이후(`type ToneOpts` 이하 효과음 코드 전부)는 그대로 둔다.

```ts
/**
 * 게임 인스턴스 전역에 하나뿐인 Phaser 사운드 매니저가 이 음악을 보관하므로, 씬이
 * 끝나도 음악 객체는 살아남는다(scene.sound와 game.sound는 같은 인스턴스).
 *
 * 배경음악은 타이틀·게임오버·승리 화면에서만 흐르고 플레이 중에는 꺼진다. 켜고 끄는
 * 지점은 각 씬의 create()에 있다.
 */
let bgm: Phaser.Sound.BaseSound | undefined;

/**
 * 이미 재생 중이면 그대로 둔다 — 게임오버 화면에서 ESC로 타이틀에 갈 때처럼 음악이
 * 필요한 화면끼리 이동할 때 곡이 처음부터 다시 시작되지 않게 하기 위한 것이다.
 */
export function playBgm(scene: Phaser.Scene): void {
  if (bgm?.isPlaying) return;
  try {
    // 한 번 만든 음악을 계속 재사용한다. 켤 때마다 새로 만들면 죽고 재시도할 때마다
    // 사운드 매니저에 쓰지 않는 음악이 쌓인다.
    bgm ??= scene.sound.add("bgm", { loop: true, volume: 0.5 });
    bgm.play();
  } catch (e) {
    console.warn("[audio] bgm failed to load/play; continuing without music:", e);
  }
}

/** 다음 재생은 곡 처음부터 시작된다 — Phaser가 멈출 때 재생 위치를 0으로 되돌린다. */
export function stopBgm(): void {
  bgm?.stop();
}
```

- [ ] **단계 4: 테스트가 통과하는지 확인**

실행: `npx vitest run src/audio.test.ts`

예상: 8개 전부 통과.

- [ ] **단계 5: 타이틀 화면의 호출 이름 맞추기**

`src/scenes/MenuScene.ts`에서 `startBgmOnce`를 `playBgm`으로 바꾼다. **세 군데 전부** — 5행 import, 36행, 58행. 이 단계를 빼먹으면 타입 검사가 실패해 커밋이 거부된다.

```ts
// 5행
import { playBgm } from "../audio";
```

```ts
// 36행 (개발용 분기 안)
          playBgm(this);
```

```ts
// 58행 (start 함수 안)
      playBgm(this);
```

이름만 바꾼다. 위치를 옮기거나 지우는 것은 작업 2에서 한다.

- [ ] **단계 6: 전체 검사**

실행: `npm run build && npm test`

예상: 타입 검사 통과, 빌드 성공, 테스트 131개(기존 123 + 신규 8) 통과.

- [ ] **단계 7: 커밋**

```bash
git add src/audio.ts src/audio.test.ts src/scenes/MenuScene.ts
git commit -m "$(cat <<'EOF'
refactor(audio): split bgm control into playBgm and stopBgm

startBgmOnce could only ever turn music on, which is why it kept playing
under gameplay. Replace it with a play/stop pair so each scene can decide,
and reuse a single sound object instead of adding a new one per start.

playBgm is a no-op while music is already playing. That is what keeps the
track unbroken when moving between two screens that both want music, such
as game over to title via Esc.

Behaviour is unchanged by this commit: the scenes still only ever call play.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 작업 2: 네 화면에 켜기/끄기 배치하기

**파일:**
- 수정: `src/scenes/MenuScene.ts` (개발용 분기의 호출 삭제, 나머지 호출을 타이틀 글자 만들기 직전으로 이동)
- 수정: `src/scenes/GameScene.ts:3,94`
- 수정: `src/scenes/GameOverScene.ts:1-2,22`
- 수정: `src/scenes/WinScene.ts:1-2,10`

**인터페이스:**
- 사용: 작업 1이 만든 `playBgm(scene: Phaser.Scene): void`, `stopBgm(): void`

**이 작업이 실제 동작 변경이다.** 여기까지 하면 플레이 중에 음악이 멈춘다.

**자동화 테스트를 추가하지 않는 이유:** 각 화면에 한 줄씩 넣는 호출을 검사하는 테스트는 코드를 그대로 옮겨 적는 것에 불과해 아무것도 보장하지 못한다. 실제로 확인해야 할 것("플레이 중에 음악이 안 들리는가")은 화면 전환과 브라우저 오디오가 얽힌 결과라 작업 3의 직접 플레이로만 확인된다.

- [ ] **단계 1: 타이틀 화면 — 개발용 분기의 호출 삭제**

`src/scenes/MenuScene.ts` 36행 `playBgm(this);` 한 줄을 지운다. 삭제 후 그 부분은 이렇게 된다.

```ts
          this.scene.start("GameScene", { level: requested, spawnX: spawnX ?? undefined });
          return;
```

- [ ] **단계 2: 타이틀 화면 — 음악 켜기를 타이틀 글자 만들기 직전으로 옮기기**

`const screen = centredTextScreen(this);` 바로 위에 아래를 넣는다.

```ts
    // 타이틀·게임오버·승리 화면에서만 음악이 흐른다. 위의 개발용 분기로 타이틀을
    // 건너뛸 때는 여기 닿지 않으므로 음악도 켜지지 않는다.
    playBgm(this);

    const screen = centredTextScreen(this);
```

- [ ] **단계 3: 타이틀 화면 — 키 입력 처리에서 음악 켜기 삭제**

`start` 함수에서 `playBgm(this);`를 지운다. 남은 한 줄짜리 본문은 같은 파일의 다른 화면들과 같은 형태로 줄인다(`GameOverScene`의 `retry`가 이 형태다).

```ts
    const start = () => this.scene.start("GameScene", { level: 0 });
```

- [ ] **단계 4: 플레이 화면 — 음악 끄기 추가**

`src/scenes/GameScene.ts` 3행의 import에 `stopBgm`을 넣는다.

```ts
import { playShieldBlock, playWin, stopBgm } from "../audio";
```

94행 `create()` 맨 앞에 아래를 넣는다.

```ts
  create(): void {
    // 플레이 중에는 효과음만 남긴다 — 음악은 타이틀·게임오버·승리 화면 전용이다.
    stopBgm();

    this.level = levelAt(this.levelIndex);
```

- [ ] **단계 5: 죽음 화면 — 음악 켜기 추가**

`src/scenes/GameOverScene.ts` 위쪽 import에 한 줄을 더한다(순서는 `MenuScene`과 같이 오디오를 마지막에).

```ts
import Phaser from "phaser";
import { centredTextScreen } from "./textScreen";
import { playBgm } from "../audio";
```

22행 `create()` 맨 앞에 넣는다.

```ts
  create(): void {
    playBgm(this);

    const screen = centredTextScreen(this);
```

- [ ] **단계 6: 클리어 화면 — 음악 켜기 추가**

`src/scenes/WinScene.ts`에 같은 작업을 한다.

```ts
import Phaser from "phaser";
import { centredTextScreen } from "./textScreen";
import { playBgm } from "../audio";
```

10행 `create()` 맨 앞에 넣는다.

```ts
  create(): void {
    playBgm(this);

    const screen = centredTextScreen(this);
```

- [ ] **단계 7: 전체 검사**

실행: `npm run build && npm test`

예상: 타입 검사 통과, 빌드 성공, 테스트 131개 통과.

- [ ] **단계 8: 커밋**

```bash
git add src/scenes/MenuScene.ts src/scenes/GameScene.ts src/scenes/GameOverScene.ts src/scenes/WinScene.ts
git commit -m "$(cat <<'EOF'
feat(audio): scope bgm to the title, death and win screens

Music now starts when the title screen is drawn rather than when the key
that leaves it is pressed, and gameplay turns it off, so hazards, shots and
jumps are heard against silence.

Death and win screens turn it back on. Because playBgm is a no-op while
music is already playing, Esc from either of those back to the title leaves
the track running instead of restarting it.

The dev-only ?stage= shortcut no longer starts music at all: it returns
before reaching the call, and gameplay would have stopped it immediately.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 작업 3: 직접 플레이해서 확인하기

**이 작업은 사람이 브라우저에서 해야 한다.** 하위 에이전트에게 맡길 수 없다.

**파일:** 없음 (확인만)

- [ ] **단계 1: 개발 서버 실행**

실행: `npm run dev`

브라우저에서 `http://localhost:5173`이 열린다.

- [ ] **단계 2: 아홉 가지 확인**

설계 문서 2절의 화면 이동 표에 있는 아홉 가지 이동을 전부 덮는다.

| # | 확인할 것 | 기대 |
|---|---|---|
| 1 | 타이틀 화면 (한 판 플레이하고 돌아온 뒤) | 🎵 음악이 난다 |
| 2 | 플레이 화면 | 음악이 멈추고, 점프·적 처치 효과음은 그대로 난다 |
| 3 | 죽은 뒤 죽음 화면 | 🎵 음악이 난다 |
| 4 | 죽음 화면에서 `ESC` → 타이틀 | 🎵 음악이 **끊기지 않고 이어진다** |
| 5 | 죽음 화면에서 재시도 (`SPACE`) | 음악이 다시 멈춘다 |
| 6 | 스테이지 1 → 2로 넘어갈 때 | 음악이 켜지지 않는다 |
| 7 | 8개 스테이지 전부 클리어 | 🎵 클리어 화면에서 음악이 난다 |
| 8 | 클리어 화면에서 `ESC` → 타이틀 | 🎵 음악이 **끊기지 않고 이어진다** |
| 9 | 클리어 화면에서 다시하기 (`SPACE`) | 음악이 다시 멈춘다 |

1번은 브라우저 탭을 새로 연 **첫 판에서는 무음일 수 있다.** 브라우저가 사용자 입력 전에는 소리를 막기 때문이며, 설계 문서 3절에서 수용하기로 한 동작이다. 한 판 플레이한 뒤 타이틀로 돌아와 확인한다.

7·8·9번을 빠르게 확인하려면 주소에 `?stage=8`을 붙여 마지막 스테이지부터 시작한다(`http://localhost:5173/?stage=8`). 단 이 경로는 타이틀을 건너뛰므로 1번 확인에는 쓸 수 없다. 6번은 `?stage=1`로 시작해 첫 스테이지를 깨면 된다.

- [ ] **단계 3: 어긋난 것이 있으면 고치고 다시 확인**

고칠 것이 없으면 이 계획은 완료다.

---

## 완료조건

- `npm run build`가 통과한다 (타입 검사 + 빌드)
- `npm test`가 통과한다 — 기존 123개 + 오디오 모듈 신규 8개 = 131개
- 작업 3의 아홉 가지 확인이 전부 기대대로 동작한다
- `src/audio.ts`에 `startBgmOnce`가 남아 있지 않다 (`grep -rn "startBgmOnce" src/`가 아무것도 찾지 못한다)

## 검증된 사실

계획을 쓰면서 실제로 돌려 확인한 것들이다. 구현할 때 다시 의심하지 않아도 된다.

| 확인한 것 | 결과 |
|---|---|
| 테스트 환경(DOM 없는 node)에서 `src/audio.ts`가 정상적으로 읽히는가 | ✅ 된다. `import Phaser from "phaser"`는 타입으로만 쓰여 실행 시점에는 사라진다 |
| 가짜 객체를 `Phaser.Scene` 자리에 넘겨도 타입 검사를 통과하는가 | ✅ 통과한다 (`as unknown as Phaser.Scene`) |
| `vi.resetModules()`로 모듈에 남은 음악 상태가 초기화되는가 | ✅ 된다 |
| 위 테스트 8개가 구현 전에 실제로 실패하는가 | ✅ `TypeError: playBgm is not a function`으로 8개 전부 실패 |
| 위 테스트 8개가 구현 후에 통과하는가 | ✅ 8개 전부 통과, 타입 검사도 통과 |
| 멈춘 음악을 다시 재생하면 곡 처음부터 시작되는가 | ✅ Phaser가 멈출 때 재생 위치를 0으로 되돌린다 (`BaseSound.js:400-413`, `:437-441`) |
| 화면이 끝나도 음악 객체가 살아남는가 | ✅ 화면 종료 처리에 사운드를 정리하는 코드가 없다 |
