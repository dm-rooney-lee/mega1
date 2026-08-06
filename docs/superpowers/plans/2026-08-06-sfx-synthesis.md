# SFX(효과음) 합성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web Audio API로 즉석 합성한 효과음 11개(점프·적처치·발사·대포·방패막기·바위낙하·사망·철퇴·클리어/승리·방패획득·스프링점프)를 게임에 추가한다.

**Architecture:** `src/config.ts`에 튜닝 수치 테이블(`SFX`)을 두고, `src/audio.ts`에 저수준 Web Audio 합성 프리미티브(톤 스윕/노이즈 버스트/아르페지오)와 이를 감싼 11개 트리거 함수를 추가한다. 각 트리거 함수는 이미 존재하는 상태 변경 지점(`Player.jump()`, `Enemy.squash()` 등)에서 한 줄로 호출한다. 철퇴(Pendulum)의 "호의 최저점을 지날 때" 판정은 `src/levels/motion.ts`에 새 순수함수 `pendulumCrossedBottom`으로 분리해 단위테스트한다.

**Tech Stack:** TypeScript, Phaser 4(`scene.sound`가 감싸고 있는 브라우저 표준 Web Audio API), Vitest.

## Global Constraints

- 외부 오디오 파일을 추가하지 않는다 — 전부 Web Audio로 즉석 합성한다(스펙 §1).
- AudioContext는 **Phaser의 기존 `scene.sound`(WebAudioSoundManager)에서 재사용**한다. 별도 `new AudioContext()`를 만들지 않는다(스펙 §3).
- 합성한 소리는 `context.destination`이 아니라 `masterMuteNode`에 연결한다 — 나중에 전체 음소거 기능이 생기면 함께 꺼지도록(스펙 §3).
- 소리 재생 실패는 `console.warn`만 남기고 게임 진행을 막지 않는다 — 기존 `startBgmOnce()` 패턴을 따른다(스펙 §6).
- 주파수·길이·볼륨 수치는 전부 `src/config.ts`의 `SFX` 테이블에 중앙화한다. 오브젝트 코드에 매직넘버를 쓰지 않는다(`CLAUDE.md` 게임 로직 관례).
- `pendulumCrossedBottom`은 Phaser 비의존 순수함수로 작성하고 `motion.test.ts`에 단위테스트를 추가한다(`.claude/rules/pure-logic-testing.md`). `audio.ts`의 Web Audio 합성 코드는 브라우저 API가 필요해 Vitest로 단위테스트할 수 없다 — 각 작업의 검증은 `npm run build`(타입체크) + `npm test`(회귀) + 최종 수동 플레이테스트로 한다(스펙 §7).

---

## Task 1: `config.ts`에 SFX 튜닝 테이블 추가

**Files:**
- Modify: `src/config.ts:256` (파일 끝, `DEPTH` 블록 뒤에 추가)

**Interfaces:**
- Produces: `export const SFX` — 이후 모든 작업이 이 상수의 키(`JUMP`, `ENEMY_KILL`, `FIRE`, `CANNON`, `SHIELD_BLOCK`, `ROCK_DROP`, `DEATH`, `PENDULUM_SWING`, `WIN`, `SHIELD_PICKUP`, `SPRING_BOUNCE`, `MASTER_VOLUME`)로 참조한다.

이 작업은 순수 데이터 상수 추가이며 분기·로직이 없어 단위테스트 대상이 아니다(사유: 계산이나 조건 분기가 없는 상수 테이블).

- [ ] **Step 1: `src/config.ts` 파일 끝에 SFX 테이블 추가**

```ts
/**
 * SFX 합성 튜닝 — Web Audio로 즉석 합성(외부 오디오 파일 없음, src/audio.ts).
 * freqStart/freqEnd는 Hz, durationMs는 ms. 정확한 "소리 느낌"은 플레이테스트로
 * 이 값들만 조정해 반복 튜닝한다(코드 변경 불필요).
 */
export const SFX = {
  /** 모든 효과음에 곱해지는 전체 볼륨(0..1). */
  MASTER_VOLUME: 0.4,
  JUMP: { freqStart: 500, freqEnd: 900, durationMs: 90 },
  ENEMY_KILL: { freqStart: 600, freqEnd: 150, durationMs: 140 },
  FIRE: { freqStart: 900, freqEnd: 500, durationMs: 70 },
  CANNON: { durationMs: 180, filterFreq: 300 },
  SHIELD_BLOCK: { freqStart: 700, freqEnd: 700, durationMs: 90 },
  ROCK_DROP: { durationMs: 220, filterFreq: 150 },
  DEATH: { freqStart: 500, freqEnd: 80, durationMs: 400 },
  PENDULUM_SWING: { durationMs: 100, filterFreq: 800 },
  WIN: { notes: [523, 659, 784], noteDurationMs: 120 },
  SHIELD_PICKUP: { freqStart: 400, freqEnd: 1000, durationMs: 150 },
  SPRING_BOUNCE: { freqStart: 300, freqEnd: 1100, durationMs: 160 },
} as const;
```

- [ ] **Step 2: 타입체크로 확인**

Run: `npm run build`
Expected: 에러 없이 성공(신규 상수 추가만이라 실패할 이유가 없음).

- [ ] **Step 3: Commit**

```bash
git add src/config.ts
git commit -m "feat(audio): add SFX tuning table to config"
```

---

## Task 2: `pendulumCrossedBottom` 순수함수 + 단위테스트

**Files:**
- Modify: `src/levels/motion.ts:39` (`pendulumHead` 함수 뒤, `oscillateOffset` 앞에 추가)
- Test: `src/levels/motion.test.ts:45` (`pendulumHead` describe 블록 뒤, `oscillateOffset` describe 앞에 추가)

**Interfaces:**
- Produces: `pendulumCrossedBottom(prevElapsedMs: number, elapsedMs: number, periodMs: number, phase01?: number): boolean` — Task 10(Pendulum 배선)이 이 시그니처로 호출한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/levels/motion.test.ts`의 import 목록에 `pendulumCrossedBottom`을 추가하고, `describe("pendulumHead", ...)` 블록 바로 뒤(45번째 줄 다음)에 추가:

```ts
import {
  oscillateOffset,
  pendulumAngleRad,
  pendulumCrossedBottom,
  pendulumHead,
  popupSpikePhase,
  gearRotationRad,
  trapFloorPhase,
} from "./motion";
```

```ts
describe("pendulumCrossedBottom", () => {
  // period 2000ms -> bottom (angle=0) crossings at t=0, 1000, 2000, ... (every half period).
  it("[Happy] detects a crossing when the boundary falls inside the frame", () => {
    expect(pendulumCrossedBottom(900, 1100, 2000)).toBe(true);
  });

  it("[Happy] does not fire when both times land in the same half-period", () => {
    expect(pendulumCrossedBottom(100, 400, 2000)).toBe(false);
  });

  it("[Boundary] does not fire on the very first frame (prev and current both near t=0)", () => {
    expect(pendulumCrossedBottom(0, 16, 2000)).toBe(false);
  });

  it("[Boundary] shifts the crossing point with a phase offset", () => {
    // phase 0.25 of a 2000ms period shifts crossings to t=500, 1500, 2500...
    expect(pendulumCrossedBottom(400, 600, 2000, 0.25)).toBe(true);
    expect(pendulumCrossedBottom(900, 1100, 2000, 0.25)).toBe(false);
  });

  it("[Boundary] guards a non-positive period", () => {
    expect(pendulumCrossedBottom(900, 1100, 0)).toBe(false);
  });
});
```

([Error] 카테고리 없음 — 입력이 항상 유한한 숫자이고 예외를 던지는 외부 의존성이 없는 순수 계산이라 예외 케이스가 존재하지 않음.)

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/levels/motion.test.ts`
Expected: FAIL — `pendulumCrossedBottom is not defined` (아직 `motion.ts`에 구현이 없음).

- [ ] **Step 3: `src/levels/motion.ts`에 최소 구현 작성**

`pendulumHead` 함수(25~39번째 줄) 뒤에 추가:

```ts
/**
 * `[prevElapsedMs, elapsedMs)` 구간 안에서 진자가 호의 최저점(반주기 경계, 가장
 * 빠르게 지나가는 지점)을 지났는지. `pendulumAngleRad`가 이미 `sin` 함수이므로,
 * "최저점을 지났다"는 반주기 경계(0.5 배수)를 넘었는지로 판정할 수 있다.
 */
export function pendulumCrossedBottom(
  prevElapsedMs: number,
  elapsedMs: number,
  periodMs: number,
  phase01 = 0,
): boolean {
  if (periodMs <= 0) return false;
  const prevHalf = Math.floor(2 * (prevElapsedMs / periodMs + phase01));
  const half = Math.floor(2 * (elapsedMs / periodMs + phase01));
  return half !== prevHalf;
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `npx vitest run src/levels/motion.test.ts`
Expected: PASS (5개 신규 테스트 포함 전체 통과).

- [ ] **Step 5: 전체 테스트 스위트로 회귀 확인**

Run: `npm test`
Expected: 기존 117개 + 신규 5개 = 122개 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/levels/motion.ts src/levels/motion.test.ts
git commit -m "feat(levels): add pendulumCrossedBottom pure function"
```

---

## Task 3: `audio.ts`에 저수준 Web Audio 합성 프리미티브 추가

**Files:**
- Modify: `src/audio.ts` (전체 — 기존 `startBgmOnce` 아래에 추가)

**Interfaces:**
- Consumes: 없음(순수 Web Audio 노드 조립).
- Produces:
  - `playTone(scene: Phaser.Scene, opts: { freqStart: number; freqEnd: number; durationMs: number }, volume: number): void`
  - `playNoiseBurst(scene: Phaser.Scene, opts: { durationMs: number; filterFreq: number }, volume: number): void`
  - `playWinJingle(scene: Phaser.Scene, opts: { notes: readonly number[]; noteDurationMs: number }, volume: number): void`
  - Task 4가 이 3개 함수를 `SFX` 파라미터와 함께 호출한다.

브라우저 `AudioContext`가 필요해 Vitest(jsdom 미탑재)로 단위테스트할 수 없다(스펙 §7) — `npm run build`로 타입만 확인하고, 실제 소리는 Task 14의 수동 플레이테스트에서 확인한다.

- [ ] **Step 1: `src/audio.ts`에 컨텍스트 헬퍼 + 3개 프리미티브 작성**

`src/audio.ts` 끝(기존 `startBgmOnce` 함수 뒤)에 추가:

```ts
type ToneOpts = { freqStart: number; freqEnd: number; durationMs: number };
type NoiseOpts = { durationMs: number; filterFreq: number };
type JingleOpts = { notes: readonly number[]; noteDurationMs: number };

/**
 * scene.sound가 WebAudioSoundManager일 때만 그 AudioContext와 마스터 뮤트 게인
 * 노드를 반환한다. HTML5Audio/NoAudio 폴백일 때는 undefined — 효과음은 조용히
 * 생략된다(게임 진행을 막지 않는다는 기존 bgm 원칙과 동일).
 */
function webAudioTarget(
  scene: Phaser.Scene,
): { context: AudioContext; destination: AudioNode } | undefined {
  const manager = scene.sound;
  if (!("context" in manager) || !manager.context) return undefined;
  return { context: manager.context, destination: manager.masterMuteNode };
}

/** 사인파를 freqStart→freqEnd로 스윕하며 짧게 재생(점프/발사/사망 등 순음 계열). */
function playTone(scene: Phaser.Scene, opts: ToneOpts, volume: number): void {
  const target = webAudioTarget(scene);
  if (!target) return;
  try {
    const { context, destination } = target;
    const now = context.currentTime;
    const durationSec = opts.durationMs / 1000;

    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(opts.freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.freqEnd, 1), now + durationSec);

    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(now + durationSec);
  } catch (e) {
    console.warn("[audio] tone synthesis failed; continuing without sound:", e);
  }
}

/** 필터링된 화이트 노이즈를 짧게 재생(대포/바위/철퇴 등 타격·마찰 계열). */
function playNoiseBurst(scene: Phaser.Scene, opts: NoiseOpts, volume: number): void {
  const target = webAudioTarget(scene);
  if (!target) return;
  try {
    const { context, destination } = target;
    const now = context.currentTime;
    const durationSec = opts.durationMs / 1000;

    const buffer = context.createBuffer(1, context.sampleRate * durationSec, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = context.createBufferSource();
    noise.buffer = buffer;

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(opts.filterFreq, now);

    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start(now);
    noise.stop(now + durationSec);
  } catch (e) {
    console.warn("[audio] noise synthesis failed; continuing without sound:", e);
  }
}

/** 짧은 상승 아르페지오(승리/스테이지 클리어 전용) — 음을 순서대로 재생. */
function playWinJingle(scene: Phaser.Scene, opts: JingleOpts, volume: number): void {
  opts.notes.forEach((freq, i) => {
    scene.time.delayedCall(i * opts.noteDurationMs, () => {
      playTone(scene, { freqStart: freq, freqEnd: freq, durationMs: opts.noteDurationMs }, volume);
    });
  });
}
```

- [ ] **Step 2: 타입체크로 확인**

Run: `npm run build`
Expected: 에러 없이 성공. (`scene.sound`가 `NoAudioSoundManager | HTML5AudioSoundManager | WebAudioSoundManager` 유니언이라 `"context" in manager` 체크로 TypeScript가 `WebAudioSoundManager`로 좁혀지는지 여기서 확인된다 — 좁혀지지 않으면 `manager.context`/`manager.masterMuteNode` 접근에서 컴파일 에러가 난다.)

- [ ] **Step 3: 기존 테스트로 회귀 확인**

Run: `npm test`
Expected: 122개 PASS(신규 테스트 없음, Task 2에서 늘어난 수 유지).

- [ ] **Step 4: Commit**

```bash
git add src/audio.ts
git commit -m "feat(audio): add tone/noise/jingle Web Audio synthesis primitives"
```

---

## Task 4: `audio.ts`에 11개 효과음 트리거 함수 추가

**Files:**
- Modify: `src/audio.ts` (Task 3에서 추가한 프리미티브 뒤)

**Interfaces:**
- Consumes: Task 1의 `SFX`(`src/config.ts`), Task 3의 `playTone`/`playNoiseBurst`/`playWinJingle`.
- Produces: `playJump`, `playEnemyKill`, `playFire`, `playCannonFire`, `playShieldBlock`, `playRockDrop`, `playDeath`, `playPendulumSwing`, `playWin`, `playShieldPickup`, `playSpringBounce` — 모두 시그니처 `(scene: Phaser.Scene) => void`. Task 5~13이 이 11개를 각자의 파일에서 import한다.

- [ ] **Step 1: `src/audio.ts` 맨 위 import에 `SFX` 추가**

```ts
import Phaser from "phaser";
import { SFX } from "./config";
```

- [ ] **Step 2: 11개 트리거 함수 작성**

`src/audio.ts` 끝(Task 3의 `playWinJingle` 뒤)에 추가:

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

- [ ] **Step 3: 타입체크로 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 4: 기존 테스트로 회귀 확인**

Run: `npm test`
Expected: 122개 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio.ts
git commit -m "feat(audio): add 11 SFX trigger functions"
```

---

## Task 5: 발사 소리 배선 — `ProjectilePool.fire()`

Turret(조준 포탑)과 Shooter(다트 발사기)가 공용으로 호출하는 단일 지점이라, 여기 한 곳만 고치면 "스나이퍼 총알 발사 소리" 요구사항의 두 오브젝트 모두를 커버한다(스펙 §5, #3행).

**Files:**
- Modify: `src/objects/ProjectilePool.ts` (전체 34줄)

**Interfaces:**
- Consumes: Task 4의 `playFire(scene: Phaser.Scene): void`.
- Produces: 없음(외부에 노출되는 시그니처 변경 없음 — `fire()`의 파라미터/반환형은 그대로).

이 작업은 이미 존재하는 "발사 성공" 분기(`if (!p) return;`)에 부수 효과 한 줄을 추가하는 것이라 새 분기가 없다 — 자동화 테스트 대상이 아니다(사유: 신규 조건 분기 없음, Web Audio는 Vitest로 테스트 불가). `npm run build` + `npm test`로 회귀만 확인한다.

- [ ] **Step 1: `scene` 필드 추가 + `fire()`에서 `playFire` 호출**

`src/objects/ProjectilePool.ts` 전체를 아래로 교체:

```ts
import Phaser from "phaser";
import { PROJECTILE } from "../config";
import { Projectile } from "./Projectile";
import { playFire } from "../audio";

/**
 * D — shared projectile pool. A fixed-size group of reusable Projectiles that
 * every shooter and turret fires from, so bursts never allocate mid-play. The
 * scene wires the group once: overlap(player) = death, collider(platforms) =
 * the projectile is blocked by terrain (cover works).
 */
export class ProjectilePool {
  readonly group: Phaser.Physics.Arcade.Group;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({
      classType: Projectile,
      maxSize: PROJECTILE.POOL_SIZE,
      allowGravity: false,
      runChildUpdate: true,
    });
  }

  /** Fire a projectile from (x, y) with velocity (vx, vy). No-op if the pool is dry. */
  fire(x: number, y: number, vx: number, vy: number, range = PROJECTILE.RANGE): void {
    const p = this.group.get(x, y) as Projectile | null;
    if (!p) return; // pool exhausted — drop the shot rather than grow unbounded
    p.fire(x, y, vx, vy, range);
    playFire(this.scene);
  }

  /** Terrain hit: block the projectile (call from the platform collider). */
  static onTerrainHit(obj: Phaser.Types.Physics.Arcade.GameObjectWithBody): void {
    (obj as Projectile).deactivate();
  }
}
```

- [ ] **Step 2: 타입체크 + 회귀 테스트**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 테스트 122개 PASS.

- [ ] **Step 3: Commit**

```bash
git add src/objects/ProjectilePool.ts
git commit -m "feat(audio): play fire SFX from ProjectilePool (covers Turret + Shooter)"
```

---

## Task 6: 점프·사망 소리 배선 — `Player.ts`

**Files:**
- Modify: `src/objects/Player.ts:1-5` (import), `:126-128` (`jump()`), `:175-186` (`die()`)

**Interfaces:**
- Consumes: Task 4의 `playJump(scene)`, `playDeath(scene)`.
- Produces: 없음(`jump()`/`die()` 시그니처 변경 없음).

`jump()`은 코요테 타임·점프 버퍼링 경로를 포함해 점프가 실제로 발생하는 유일한 지점이라 중복 호출 걱정이 없다. `die()`는 기존 `isDead` 가드가 한 번만 실행되게 이미 보장한다. 두 곳 모두 새 분기가 없어 자동화 테스트 대상이 아니다 — `npm run build` + `npm test`로 회귀만 확인한다.

- [ ] **Step 1: import 추가**

`src/objects/Player.ts` 1~5번째 줄을 아래로 교체:

```ts
import Phaser from "phaser";
import { COLORS, PLAYER, SHIELD, TEX } from "../config";
import { absorbHit as absorbShieldHit } from "./shield";
import { TEXTURE_SCALE } from "../display";
import { setLogicalBodySize } from "./hitbox";
import { playDeath, playJump } from "../audio";
```

- [ ] **Step 2: `jump()`에 소리 추가**

126~128번째 줄:

```ts
  private jump(): void {
    this.setVelocityY(PLAYER.JUMP_VELOCITY);
    playJump(this.scene);
  }
```

- [ ] **Step 3: `die()`에 소리 추가**

176~186번째 줄:

```ts
  /** Play a short death reaction and disable control. */
  die(): void {
    if (this.isDead) return;
    this.isDead = true;
    playDeath(this.scene);
    if (this.shieldRing) {
      this.shieldRing.destroy();
      this.shieldRing = undefined;
    }
    this.setTint(0xff004d);
    this.body.setVelocity(0, -300);
    this.body.checkCollision.none = true; // fall through the world
  }
```

- [ ] **Step 4: 타입체크 + 회귀 테스트**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 122개 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/objects/Player.ts
git commit -m "feat(audio): play jump/death SFX from Player"
```

---

## Task 7: 적 처치 소리 배선 — `Enemy.squash()` / `Turret.kill()`

두 오브젝트 모두 같은 "적 처치" 효과음(`playEnemyKill`)을 재사용한다(스펙 §5, #2행).

**Files:**
- Modify: `src/objects/Enemy.ts:1-4`(import), `:58-70`(`squash()`)
- Modify: `src/objects/Turret.ts:1-5`(import), `:98-111`(`kill()`)

**Interfaces:**
- Consumes: Task 4의 `playEnemyKill(scene)`.
- Produces: 없음(시그니처 변경 없음).

두 메서드 모두 기존 `isDead` 가드가 중복 호출을 막는다 — 새 분기가 없어 자동화 테스트 대상이 아니다.

- [ ] **Step 1: `Enemy.ts` import 추가**

1~4번째 줄을 아래로 교체:

```ts
import Phaser from "phaser";
import { ENEMY, TEX } from "../config";
import { TEXTURE_SCALE } from "../display";
import { setLogicalBodySize } from "./hitbox";
import { playEnemyKill } from "../audio";
```

- [ ] **Step 2: `Enemy.squash()`에 소리 추가**

```ts
  /** Squash and remove after being stomped. */
  squash(): void {
    if (this.isDead) return;
    this.isDead = true;
    playEnemyKill(this.scene);
    this.body.stop();
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      y: this.y + 10,
      alpha: 0,
      duration: 160,
      onComplete: () => this.destroy(),
    });
  }
```

- [ ] **Step 3: `Turret.ts` import 추가**

1~5번째 줄을 아래로 교체:

```ts
import Phaser from "phaser";
import { COLORS, DEPTH, PROJECTILE, TURRET, TEX } from "../config";
import type { Player } from "./Player";
import type { ProjectilePool } from "./ProjectilePool";
import { TEXTURE_SCALE } from "../display";
import { playEnemyKill } from "../audio";
```

- [ ] **Step 4: `Turret.kill()`에 소리 추가**

```ts
  /** Destroyed by a stomp: stop shooting and squash. Live projectiles persist. */
  kill(): void {
    if (this.isDead) return;
    this.isDead = true;
    playEnemyKill(this.scene);
    this.aimLine.clear();
    this.body.enable = false;
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      alpha: 0,
      duration: 160,
      onComplete: () => this.destroy(),
    });
  }
```

- [ ] **Step 5: 타입체크 + 회귀 테스트**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 122개 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/objects/Enemy.ts src/objects/Turret.ts
git commit -m "feat(audio): play enemy-kill SFX from Enemy and Turret stomps"
```

---

## Task 8: 대포 발사 소리 배선 — `Cannon.update()`

**Files:**
- Modify: `src/objects/Cannon.ts:1-6`(import), `:36-45`(`update()`)

**Interfaces:**
- Consumes: Task 4의 `playCannonFire(scene)`.
- Produces: 없음.

- [ ] **Step 1: import 추가**

```ts
import Phaser from "phaser";
import { CANNON, DEPTH, TEX } from "../config";
import type { CannonDef } from "../levels/types";
import { shouldFire } from "./ballistics";
import { Cannonball } from "./Cannonball";
import { TEXTURE_SCALE } from "../display";
import { playCannonFire } from "../audio";
```

- [ ] **Step 2: `update()`에 소리 추가**

```ts
  update(time: number): void {
    if (!shouldFire(time, this.lastFiredAt, this.intervalMs)) return;
    this.lastFiredAt = time;
    const ball = new Cannonball(this.scene, this.x, this.y, this.direction);
    this.balls.add(ball);
    // Group#add re-applies the group's physics defaults (velocityX/Y default
    // to 0) to every member, even one that already has a body — this silently
    // zeroes the velocity set in the Cannonball constructor above. Re-apply it.
    ball.reapplyVelocity();
    playCannonFire(this.scene);
  }
```

- [ ] **Step 3: 타입체크 + 회귀 테스트**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 122개 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/objects/Cannon.ts
git commit -m "feat(audio): play cannon-fire SFX from Cannon"
```

---

## Task 9: 바위 낙하 소리 배선 — `Thwomp.update()`

기존 `shakeCamera(...)` 호출과 같은 지점(착지 충격 시)에 추가한다(스펙 §5, #6행).

**Files:**
- Modify: `src/objects/Thwomp.ts:1-4`(import), `:94-105`(`update()`의 `"dropping"` case)

**Interfaces:**
- Consumes: Task 4의 `playRockDrop(scene)`.
- Produces: 없음.

- [ ] **Step 1: import 추가**

```ts
import Phaser from "phaser";
import { COLORS, DEPTH, THWOMP, TEX } from "../config";
import { shakeCamera } from "../display";
import type { Player } from "./Player";
import { playRockDrop } from "../audio";
```

- [ ] **Step 2: `"dropping"` case에 소리 추가**

```ts
      case "dropping": {
        const step = this.dropSpeed * dtSec;
        this.y += step;
        this.travelled += step;
        if (this.travelled >= this.dropDistance) {
          this.y = this.homeY + this.dropDistance;
          this.mode = "bottom";
          this.timerMs = 0;
          shakeCamera(this.scene.cameras.main, 180, 0.012);
          playRockDrop(this.scene);
        }
        break;
      }
```

- [ ] **Step 3: 타입체크 + 회귀 테스트**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 122개 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/objects/Thwomp.ts
git commit -m "feat(audio): play rock-drop SFX from Thwomp impact"
```

---

## Task 10: 철퇴 이동 소리 배선 — `Pendulum.update()`

Task 2의 `pendulumCrossedBottom`으로 "호의 최저점을 지났는지" 판정하고, 그때만 짧게 재생한다(루프 아님, 스펙 §2 #8행 확정 사항).

**Files:**
- Modify: `src/objects/Pendulum.ts` (전체 79줄)

**Interfaces:**
- Consumes: Task 2의 `pendulumCrossedBottom(prevElapsedMs, elapsedMs, periodMs, phase01?)`, Task 4의 `playPendulumSwing(scene)`.
- Produces: 없음(`update(elapsedMs)` 시그니처 변경 없음 — `GameScene`의 호출부는 무수정).

`Pendulum`은 현재 `scene`을 필드로 저장하지 않는다(생성자 파라미터로만 받음) — `ProjectilePool`과 동일한 이유로 필드를 추가해야 한다.

- [ ] **Step 1: `src/objects/Pendulum.ts` 전체를 아래로 교체**

```ts
import Phaser from "phaser";
import { COLORS, DEPTH, PENDULUM, TEX } from "../config";
import { pendulumAngleRad, pendulumCrossedBottom, pendulumHead } from "../levels/motion";
import { TEXTURE_SCALE } from "../display";
import { setLogicalBodyCircle } from "./hitbox";
import { playPendulumSwing } from "../audio";

/**
 * B-1 — a spiked ball swinging from a fixed pivot. The head is a physics sprite
 * used only for an overlap check (instant death); the chain is decorative and
 * harmless. Motion is a pure function of elapsed time (deterministic), so it
 * resets identically on a scene restart.
 */
export class Pendulum {
  readonly head: Phaser.Physics.Arcade.Image;

  private readonly scene: Phaser.Scene;
  private readonly pivotX: number;
  private readonly pivotY: number;
  private readonly length: number;
  private readonly amplitudeRad: number;
  private readonly periodMs: number;
  private readonly phase01: number;
  private readonly chain: Phaser.GameObjects.Graphics;
  private lastElapsedMs = 0;

  constructor(
    scene: Phaser.Scene,
    pivotX: number,
    pivotY: number,
    opts: {
      length?: number;
      amplitudeDeg?: number;
      periodMs?: number;
      phase?: number;
    } = {},
  ) {
    this.scene = scene;
    this.pivotX = pivotX;
    this.pivotY = pivotY;
    this.length = opts.length ?? PENDULUM.LENGTH;
    this.amplitudeRad = Phaser.Math.DegToRad(opts.amplitudeDeg ?? PENDULUM.AMPLITUDE_DEG);
    this.periodMs = opts.periodMs ?? PENDULUM.PERIOD_MS;
    this.phase01 = opts.phase ?? 0;

    this.chain = scene.add.graphics().setDepth(DEPTH.HAZARD - 1);

    // A small anchor cap at the pivot, purely visual.
    scene.add
      .circle(pivotX, pivotY, 5, COLORS.CHAIN)
      .setDepth(DEPTH.HAZARD);

    this.head = scene.physics.add.image(pivotX, pivotY + this.length, TEX.PENDULUM_HEAD);
    this.head.setScale(1 / TEXTURE_SCALE);
    this.head.setDepth(DEPTH.HAZARD);
    const body = this.head.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    // Circular hitbox a touch smaller than the art (fairer near the edges).
    // displayWidth, not width: the texture is oversized and the sprite scaled down.
    const inset = this.head.displayWidth / 2 - PENDULUM.HEAD_RADIUS;
    setLogicalBodyCircle(this.head, PENDULUM.HEAD_RADIUS, inset, inset);

    this.redraw();
  }

  /** `elapsedMs` is scene time since create() — keeps every pendulum in phase. */
  update(elapsedMs: number): void {
    if (pendulumCrossedBottom(this.lastElapsedMs, elapsedMs, this.periodMs, this.phase01)) {
      playPendulumSwing(this.scene);
    }
    this.lastElapsedMs = elapsedMs;

    const angle = pendulumAngleRad(elapsedMs, this.periodMs, this.amplitudeRad, this.phase01);
    const p = pendulumHead(this.pivotX, this.pivotY, this.length, angle);
    // Move the physics body via its reset so the body tracks the sprite exactly.
    this.head.setPosition(p.x, p.y);
    this.head.setRotation(angle);
    this.redraw();
  }

  private redraw(): void {
    this.chain.clear();
    this.chain.lineStyle(4, COLORS.CHAIN, 1);
    this.chain.lineBetween(this.pivotX, this.pivotY, this.head.x, this.head.y);
  }
}
```

- [ ] **Step 2: 타입체크 + 회귀 테스트**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 122개 PASS.

- [ ] **Step 3: Commit**

```bash
git add src/objects/Pendulum.ts
git commit -m "feat(audio): play pendulum-swing SFX at each bottom crossing"
```

---

## Task 11: 방패 막기 + 클리어/승리 소리 배선 — `GameScene.ts`

**Files:**
- Modify: `src/scenes/GameScene.ts:2`(import), `:564-578`(`handleCannonballHit()`), `:580-596`(`handleWin()`)

**Interfaces:**
- Consumes: Task 4의 `playShieldBlock(scene)`, `playWin(scene)`.
- Produces: 없음.

`handleCannonballHit()`은 `player.shieldCharges > 0`으로 흡수될 때만 재생한다 — 충전이 없어 관통사망하는 경우는 `handleDeath()`를 타므로 Task 6에서 배선한 사망 소리만 난다(스펙 §5, #5행). `handleWin()`은 `this.ending` 가드로 한 번만 실행되므로 중간 스테이지 클리어·최종 승리 공통으로 정확히 한 번 재생된다.

- [ ] **Step 1: import 추가**

`src/scenes/GameScene.ts` 2번째 줄 뒤에 새 줄 추가:

```ts
import { CAMERA, CANNON, COLORS, DEPTH, PARALLAX, TEX } from "../config";
import { playShieldBlock, playWin } from "../audio";
```

- [ ] **Step 2: `handleCannonballHit()`에 소리 추가**

```ts
  /** A cannonball hit: absorbed by a shield charge if the player has one, else lethal. */
  private handleCannonballHit(ball: Phaser.Physics.Arcade.Sprite): void {
    if (this.ending || this.player.dead || !ball.active) return;
    ball.destroy();

    if (this.time.now < this.hitCooldownUntil) return;
    this.hitCooldownUntil = this.time.now + CANNON.HIT_COOLDOWN_MS;

    if (this.player.shieldCharges > 0) {
      this.player.absorbHit();
      playShieldBlock(this);
      this.cameras.main.flash(120, 41, 173, 255);
    } else {
      this.handleDeath();
    }
  }
```

- [ ] **Step 3: `handleWin()`에 소리 추가**

```ts
  private handleWin(): void {
    if (this.ending) return;
    this.ending = true;
    this.player.body.stop();
    playWin(this);
    this.cameras.main.flash(200, 255, 255, 255);

    const next = this.levelIndex + 1;
    this.time.delayedCall(500, () => {
      if (hasLevel(next)) {
        // Advance to the next stage.
        this.scene.start("GameScene", { level: next });
      } else {
        // Cleared the final stage.
        this.scene.start("WinScene");
      }
    });
  }
```

- [ ] **Step 4: 타입체크 + 회귀 테스트**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 122개 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(audio): play shield-block and win SFX from GameScene"
```

---

## Task 12: 방패 획득 소리 배선 — `ShieldItem.collect()`

**Files:**
- Modify: `src/objects/ShieldItem.ts:1-4`(import), `:34-38`(`collect()`)

**Interfaces:**
- Consumes: Task 4의 `playShieldPickup(scene)`.
- Produces: 없음.

`this.destroy()`가 스프라이트를 파괴하기 전에 `this.scene`이 아직 유효할 때 소리를 재생해야 하므로, 호출 순서는 `playShieldPickup(this.scene)` → `this.destroy()`다.

- [ ] **Step 1: import 추가**

```ts
import Phaser from "phaser";
import { DEPTH, TEX } from "../config";
import type { Player } from "./Player";
import { TEXTURE_SCALE } from "../display";
import { playShieldPickup } from "../audio";
```

- [ ] **Step 2: `collect()`에 소리 추가**

```ts
  /** Grants the player a shield and removes the pickup. */
  collect(player: Player): void {
    player.giveShield();
    playShieldPickup(this.scene);
    this.destroy();
  }
```

- [ ] **Step 3: 타입체크 + 회귀 테스트**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 122개 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/objects/ShieldItem.ts
git commit -m "feat(audio): play shield-pickup SFX from ShieldItem"
```

---

## Task 13: 스프링 튕김 소리 배선 — `Spring.tryLaunch()`

**Files:**
- Modify: `src/objects/Spring.ts:1-3`(import), `:40-44`(`tryLaunch()`)

**Interfaces:**
- Consumes: Task 4의 `playSpringBounce(scene)`.
- Produces: 없음.

기존 `body.touching.up` 가드가 "위에서 밟았을 때만" 발사를 허용하므로, 옆면/아래에서 부딪히는 경우엔 소리도 나지 않는다.

- [ ] **Step 1: import 추가**

```ts
import Phaser from "phaser";
import { DEPTH, SPRING, TEX } from "../config";
import type { Player } from "./Player";
import { playSpringBounce } from "../audio";
```

- [ ] **Step 2: `tryLaunch()`에 소리 추가**

```ts
  /**
   * Called from the player↔spring collider. Only a top landing launches; the
   * collider itself blocks the other faces. `body.touching.up` on the static
   * body reliably marks a top contact.
   */
  tryLaunch(player: Player): void {
    if (!this.body.touching.up) return;
    player.launch(this.power);
    playSpringBounce(this.scene);
    this.squash();
  }
```

- [ ] **Step 3: 타입체크 + 회귀 테스트**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 122개 PASS.

- [ ] **Step 4: Commit**

```bash
git add src/objects/Spring.ts
git commit -m "feat(audio): play spring-bounce SFX from Spring"
```

---

## Task 14: 최종 검증 — 빌드/테스트 전체 + 11개 효과음 수동 플레이테스트

**Files:** 없음(검증 전용 작업, 코드 변경 없음).

**Interfaces:** 없음.

- [ ] **Step 1: 전체 빌드**

Run: `npm run build`
Expected: `tsc --noEmit` + `vite build` 모두 에러 없이 성공.

- [ ] **Step 2: 전체 테스트**

Run: `npm test`
Expected: 122개 전부 PASS(Task 2에서 추가한 5개 포함).

- [ ] **Step 3: 개발 서버 실행 후 11개 효과음 수동 확인**

Run: `npm run dev` (브라우저가 `http://localhost:5173`로 열림)

아래 11개를 각각 발생시켜 소리가 나는지 확인한다. 각 항목은 스펙(`docs/superpowers/specs/2026-08-06-sfx-synthesis-design.md`) §5의 트리거 지점과 대응한다.

| # | 확인 방법 | 기대 결과 |
|---|---|---|
| 1 | 점프(Space/W/Up) | 삑 하는 짧은 상승음 |
| 2 | 적을 밟아 처치 | 짧은 처치음(포탑을 밟아도 동일) |
| 3 | 포탑(Turret) 또는 발사기(Shooter) 근처에서 발사되는 순간 | 짧은 발사음(두 종류 다 확인) |
| 4 | 대포(Cannon)가 대포알을 쏘는 순간 | 퍽/쿵 하는 발사음 |
| 5 | 방패를 가진 채 대포알에 맞음 | 막히는 소리(플레이어는 죽지 않음) |
| 6 | 바위 압사기(Thwomp) 밑을 지나 낙하시킴 | 착지 순간 쿵 소리(카메라 흔들림과 동시) |
| 7 | 가시/적/투사체 등에 맞아 사망 | 하강하는 사망음 |
| 8 | 철퇴(Pendulum) 근처에서 몇 초간 관찰 | 호의 최저점을 지날 때마다(주기의 절반마다) 짧은 휙 소리, 계속 나지 않음 |
| 9 | 스테이지 클리어(깃발 도달) — 중간 스테이지 1개, 마지막 스테이지 1개 모두 확인 | 짧은 상승 아르페지오 |
| 10 | 방패 아이템 획득 | 밝은 획득음 |
| 11 | 점프대(Spring)를 위에서 밟아 튕겨나감 | 일반 점프보다 강조된 상승음 |

Expected: 11개 전부 소리가 나고, 8번은 계속 울리지 않고 최저점을 지날 때만 끊어져서 난다. `dev` 서버 콘솔에 `[audio]` 경고가 찍히지 않는다(경고가 찍히면 `scene.sound`가 WebAudioSoundManager가 아니라는 뜻이므로 원인을 파악한다).

- [ ] **Step 4: 문제가 있으면 config.ts의 SFX 수치만 조정**

소리가 너무 크거나 작거나 어색하면, 해당 항목의 `src/config.ts`의 `SFX.<KEY>` 값(주파수·길이·필터 주파수)만 조정하고 Step 1~3을 반복한다. 코드 재작성은 필요 없다.

- [ ] **Step 5: 최종 커밋(수치를 조정했을 경우에만)**

```bash
git add src/config.ts
git commit -m "tune: adjust SFX parameters after playtest"
```
