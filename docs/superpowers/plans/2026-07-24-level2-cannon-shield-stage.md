# level2 대포·방패 스테이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `level1`을 잇는 두 번째 스테이지 `level2`(좁은 발판 정밀 점프 + 대포/방패 기믹)를 추가하고, `GameScene`이 이를 로드하게 한다.

**Architecture:** 레벨은 순수 데이터(`LevelDef`)로 정의하고 `GameScene`이 읽어 월드를 구성하는 기존 구조를 따른다. 대포·대포알·방패는 기존 오브젝트 패턴(`Phaser.Physics.Arcade.Sprite` 상속 + 씬에 등록)을 그대로 따르는 새 클래스로 만들고, 타이밍·경계·방패 내구도 같은 판정 로직은 Phaser 비의존 순수 함수로 분리해 단위 테스트한다(기존 `patrol.ts` 방식).

**Tech Stack:** Phaser 4.2, TypeScript 5.7, Vite 8, Vitest 4 (테스트는 순수 로직만).

## Global Constraints

- Phaser 4 + TypeScript + Vite 스택 고정. 새 런타임 의존성 추가 금지.
- 그림(텍스처)은 `BootScene`에서 도형으로 절차적 생성. 이미지 파일 미사용.
- 색상은 기존 `COLORS` 팔레트(PICO-8 계열 hex)에서만 선택.
- 단위 테스트는 Phaser 비의존 순수 로직만 대상(`import { describe, expect, it } from "vitest";`).
- `level1.ts`는 삭제·덮어쓰기 금지. 파일 보존, `GameScene`이 읽는 대상만 교체.
- `LevelDef.cannons`/`shields`는 **선택 필드**로 둔다(그래야 `level1`이 안 깨진다).
- 대포 본체에는 사망 판정을 걸지 않는다. 대포알(발사체)에만 사망/방어 판정.
- 방패는 대포알만 막는다. 적·가시·구멍은 방패와 무관하게 즉사.
- 점프 최대 높이 ≈ 165px 제약(`config.ts`)을 넘는 세로 간격 배치 금지.

## 검증 명령 (공통)

- 타입체크: `npx tsc --noEmit` → 오류 0.
- 전체 테스트: `npx vitest run` → 전부 PASS.
- 수동 실행: `npm run dev` → 브라우저에서 확인(자동 클릭 불가 항목).

## 스킬 매핑 (Skill Discovery)

Memory에 이전 매핑 없음(fresh). 이 프로젝트는 TypeScript/Phaser 게임 — **React/Next.js가 아니므로 Vercel 계열 스킬(vercel-react-best-practices 등)은 해당 없음.**

| 스킬/도구 | 용도 | 적용 Task |
|-----------|------|-----------|
| superpowers:test-driven-development | 순수 로직 RED→GREEN | Task 3, 4 |
| superpowers:subagent-driven-development / executing-plans | 플랜 실행 | 전체 |
| /code-review (내장, 경량) | Task별 결함 점검(P0/P1 0건까지 반복) | 코드 작성 Task 전부 (1,2,5~10) |
| /compound-engineering:ce-code-review | 플랜 전체 완료 후 다관점 최종 게이트 | 완료 후 1회 |
| superpowers:systematic-debugging | 버그·예상외 동작 시 | 필요시 |
| /rl | Task별/플랜 완료조건 검증 | 각 Task 후 + 최종 |

> 코드 리뷰 루프(내장 리뷰 통과 ≠ 면제): 각 코드 Task 완료 후 /code-review로 P0/P1 0건까지 반복, 플랜 전체 완료 후 /compound-engineering:ce-code-review 1회.

---

### Task 1: 공유 타입을 `types.ts`로 분리

기능 변화 없는 정리 작업. 타입을 한곳으로 모으고 `CannonDef`와 선택 필드를 미리 추가해 이후 Task의 토대를 만든다.

**Files:**
- Create: `src/levels/types.ts`
- Modify: `src/levels/level1.ts` (인터페이스 제거 + import 추가)
- Modify: `src/levels/patrol.ts:1` (import 경로)
- Modify: `src/levels/patrol.test.ts:2` (import 경로)
- Modify: `src/scenes/GameScene.ts:3` (import 경로 분리)

**Interfaces:**
- Produces: `Vec2`, `PlatformDef`, `SpikeDef`, `CannonDef`, `LevelDef` (from `src/levels/types.ts`)

- [ ] **Step 1: `src/levels/types.ts` 생성**

```typescript
/**
 * 레벨 데이터의 공유 타입. 레벨 파일·씬·유틸이 공통으로 참조한다.
 * 좌표는 월드 픽셀. 발판은 왼쪽 위 모서리 + 크기로 지정.
 */
export interface Vec2 {
  x: number;
  y: number;
}

export interface PlatformDef {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 표면 위에 놓이는 가시. width는 32px 타일 개수. */
export interface SpikeDef {
  x: number;
  y: number;
  tiles: number;
}

/** 대포. (x, y)는 대포알이 생성되는 발사원이자 사격선 높이. */
export interface CannonDef {
  x: number;
  y: number;
  direction: "left" | "right";
  /** 미지정 시 config의 기본 발사 간격 사용. */
  intervalMs?: number;
}

export interface LevelDef {
  worldWidth: number;
  worldHeight: number;
  playerSpawn: Vec2;
  platforms: PlatformDef[];
  enemies: Vec2[];
  spikes: SpikeDef[];
  goal: Vec2;
  /** 없으면 대포 없음. */
  cannons?: CannonDef[];
  /** 방패 아이템 스폰 위치들. */
  shields?: Vec2[];
}
```

- [ ] **Step 2: `src/levels/level1.ts`의 인터페이스 제거 + import 교체**

파일 맨 위의 JSDoc과 네 개의 `export interface`(PlatformDef, Vec2, SpikeDef, LevelDef) 블록 전체를 아래로 교체한다. `export const level1: LevelDef = { ... }` 데이터 본문은 **그대로 둔다**.

```typescript
/**
 * 데이터 기반 레벨 정의. 레이아웃을 순수 데이터로 두어 씬 로직과 분리한다.
 * 공유 타입은 ./types 참조.
 */
import type { LevelDef } from "./types";

export const level1: LevelDef = {
  // ↓ 기존 데이터 그대로 유지
  worldWidth: 2400,
  // ... (변경하지 말 것)
};
```

- [ ] **Step 3: `src/levels/patrol.ts` import 경로 변경**

1번 줄을 교체:

```typescript
import type { PlatformDef } from "./types";
```

- [ ] **Step 4: `src/levels/patrol.test.ts` import 경로 변경**

2번 줄을 교체:

```typescript
import type { PlatformDef } from "./types";
```

- [ ] **Step 5: `src/scenes/GameScene.ts` import 분리**

기존 3번 줄 `import { level1, type LevelDef } from "../levels/level1";` 을 두 줄로 교체(아직 level1 사용 유지):

```typescript
import { level1 } from "../levels/level1";
import type { LevelDef } from "../levels/types";
```

- [ ] **Step 6: 타입체크 + 기존 테스트 통과 확인**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 컴파일 오류 0, `patrolBoundsFor` 테스트 전부 PASS.

- [ ] **Step 7: Commit**

```bash
git add src/levels/types.ts src/levels/level1.ts src/levels/patrol.ts src/levels/patrol.test.ts src/scenes/GameScene.ts
git commit -m "refactor: extract shared level types into types.ts"
```

---

### Task 2: config에 대포·방패·색상·텍스처 키 추가

**Files:**
- Modify: `src/config.ts` (블록 추가 + COLORS/TEX 확장)

**Interfaces:**
- Produces: `CANNON.FIRE_INTERVAL_MS`, `CANNON.BALL_SPEED`, `SHIELD.MAX_CHARGES`, `COLORS.CANNON`, `COLORS.CANNONBALL`, `COLORS.SHIELD`, `TEX.CANNON`, `TEX.CANNONBALL`, `TEX.SHIELD`

- [ ] **Step 1: `ENEMY` 블록 아래에 `CANNON`·`SHIELD` 추가**

`export const ENEMY = { ... } as const;` 바로 다음에 삽입:

```typescript
export const CANNON = {
  /** 발사 간격(ms). */
  FIRE_INTERVAL_MS: 1500,
  /** 대포알 수평 속도(px/s). */
  BALL_SPEED: 320,
} as const;

export const SHIELD = {
  /** 방패 획득 시 충전 횟수(막을 수 있는 대포알 수). */
  MAX_CHARGES: 3,
} as const;
```

- [ ] **Step 2: `COLORS`에 3개 색 추가**

`COLORS` 객체 안 `GOAL: 0x00e436,` 다음 줄에 추가:

```typescript
  CANNON: 0xc2c3c7,
  CANNONBALL: 0xffa300,
  SHIELD: 0x29adff,
```

- [ ] **Step 3: `TEX`에 3개 키 추가**

`TEX` 객체 안 `GOAL: "tex-goal",` 다음 줄에 추가:

```typescript
  CANNON: "tex-cannon",
  CANNONBALL: "tex-cannonball",
  SHIELD: "tex-shield",
```

- [ ] **Step 4: 타입체크**

Run: `npx tsc --noEmit`
Expected: 오류 0.

- [ ] **Step 5: Commit**

```bash
git add src/config.ts
git commit -m "feat: add cannon/shield tuning + palette/texture keys to config"
```

---

### Task 3: 방패 내구도 순수 로직 + 테스트 (TDD)

**Files:**
- Create: `src/objects/shield.ts`
- Test: `src/objects/shield.test.ts`

**Interfaces:**
- Produces: `absorbHit(charges: number): { charges: number; blocked: boolean }`

- [ ] **Step 1: 실패하는 테스트 작성 (`src/objects/shield.test.ts`)**

```typescript
import { describe, expect, it } from "vitest";
import { absorbHit } from "./shield";

describe("absorbHit", () => {
  it("[Happy] 충전이 남아 있으면 막고 1 감소", () => {
    expect(absorbHit(3)).toEqual({ charges: 2, blocked: true });
  });
  it("[Boundary] 마지막 충전도 막고 0으로", () => {
    expect(absorbHit(1)).toEqual({ charges: 0, blocked: true });
  });
  it("[Boundary] 충전 0이면 막지 못함", () => {
    expect(absorbHit(0)).toEqual({ charges: 0, blocked: false });
  });
  it("[Boundary] 음수는 방패 없음으로 취급", () => {
    expect(absorbHit(-1)).toEqual({ charges: 0, blocked: false });
  });
});
```
> [Error] 카테고리: 외부 의존/IO 없는 순수 산술이라 예외 케이스 부재. 경계 케이스가 falsy(0)·음수 분기를 모두 덮음.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/objects/shield.test.ts`
Expected: FAIL — "absorbHit is not defined" / 모듈 없음.

- [ ] **Step 3: 최소 구현 (`src/objects/shield.ts`)**

```typescript
/** 방패 내구도 계산(Phaser 비의존, 단위 테스트 대상). */
export function absorbHit(charges: number): { charges: number; blocked: boolean } {
  if (charges > 0) return { charges: charges - 1, blocked: true };
  return { charges: 0, blocked: false };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/objects/shield.test.ts`
Expected: 4개 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/objects/shield.ts src/objects/shield.test.ts
git commit -m "feat: add pure shield-durability logic with tests"
```

---

### Task 4: 발사 타이밍·경계 순수 로직 + 테스트 (TDD)

**Files:**
- Create: `src/objects/ballistics.ts`
- Test: `src/objects/ballistics.test.ts`

**Interfaces:**
- Produces: `shouldFire(now: number, lastFiredAt: number, intervalMs: number): boolean`, `isOffWorld(x: number, worldWidth: number, margin?: number): boolean`

- [ ] **Step 1: 실패하는 테스트 작성 (`src/objects/ballistics.test.ts`)**

```typescript
import { describe, expect, it } from "vitest";
import { isOffWorld, shouldFire } from "./ballistics";

describe("shouldFire", () => {
  it("[Happy] 간격이 지났으면 발사", () => {
    expect(shouldFire(2000, 400, 1500)).toBe(true);
  });
  it("[Boundary] 정확히 간격에 도달하면 발사", () => {
    expect(shouldFire(1500, 0, 1500)).toBe(true);
  });
  it("[Boundary] 간격 직전에는 발사 안 함", () => {
    expect(shouldFire(1499, 0, 1500)).toBe(false);
  });
});

describe("isOffWorld", () => {
  it("[Happy] 범위 안이면 off-world 아님", () => {
    expect(isOffWorld(1200, 2600)).toBe(false);
  });
  it("[Boundary] 왼쪽 여백을 넘으면 off-world", () => {
    expect(isOffWorld(-41, 2600, 40)).toBe(true);
  });
  it("[Boundary] 오른쪽 여백을 넘으면 off-world", () => {
    expect(isOffWorld(2641, 2600, 40)).toBe(true);
  });
  it("[Boundary] 여백 경계값은 아직 on-world", () => {
    expect(isOffWorld(-40, 2600, 40)).toBe(false);
  });
});
```
> [Error] 카테고리: 외부 의존/IO 없는 순수 비교 연산이라 예외 케이스 부재. 경계 케이스가 등호·여백 경계를 덮음.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/objects/ballistics.test.ts`
Expected: FAIL — 모듈/함수 없음.

- [ ] **Step 3: 최소 구현 (`src/objects/ballistics.ts`)**

```typescript
/** 대포/대포알 판정용 순수 함수(Phaser 비의존, 단위 테스트 대상). */

/** 마지막 발사 후 간격이 지났으면 true. */
export function shouldFire(now: number, lastFiredAt: number, intervalMs: number): boolean {
  return now - lastFiredAt >= intervalMs;
}

/** x가 월드 양끝(+여백)을 벗어나 대포알을 없애야 하면 true. */
export function isOffWorld(x: number, worldWidth: number, margin = 40): boolean {
  return x < -margin || x > worldWidth + margin;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/objects/ballistics.test.ts`
Expected: 7개 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/objects/ballistics.ts src/objects/ballistics.test.ts
git commit -m "feat: add pure ballistics helpers (shouldFire, isOffWorld) with tests"
```

---

### Task 5: Player 방패 상태 + ShieldItem 픽업

**Files:**
- Modify: `src/objects/Player.ts` (방패 상태·메서드·링 시각효과)
- Create: `src/objects/ShieldItem.ts`

**Interfaces:**
- Consumes: `absorbHit` (from `./shield`), `SHIELD.MAX_CHARGES`, `COLORS.SHIELD`, `TEX.SHIELD` (from `../config`)
- Produces: `Player.shieldCharges: number` (getter), `Player.giveShield(): void`, `Player.absorbHit(): boolean`; `ShieldItem.collect(player: Player): void`

- [ ] **Step 1: `src/objects/Player.ts` 전체를 아래로 교체**

```typescript
import Phaser from "phaser";
import { COLORS, PLAYER, SHIELD, TEX } from "../config";
import { absorbHit as absorbShieldHit } from "./shield";

type Keys = {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
};

/**
 * 플레이어. 이동/점프 + game feel(coyote time, jump buffer, 가변 점프 높이)에
 * 더해 방패 상태(대포알을 자동으로 막는 충전)를 관리한다.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private keys: Keys;
  private lastGroundedAt = 0;
  private jumpPressedAt = -Infinity;
  private jumpHeld = false;
  private isDead = false;
  private shieldChargesValue = 0;
  private shieldRing?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.PLAYER);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);
    this.body.setSize(24, 38);

    const kb = scene.input.keyboard!;
    this.keys = {
      left: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      ],
      right: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      ],
      jump: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ],
    };
  }

  private anyDown(list: Phaser.Input.Keyboard.Key[]): boolean {
    return list.some((k) => k.isDown);
  }

  update(time: number): void {
    // 방패 링은 죽었든 살았든 플레이어를 따라다닌다.
    if (this.shieldRing) this.shieldRing.setPosition(this.x, this.y);
    if (this.isDead) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) this.lastGroundedAt = time;

    const left = this.anyDown(this.keys.left);
    const right = this.anyDown(this.keys.right);
    if (left && !right) {
      this.setVelocityX(-PLAYER.MOVE_SPEED);
      this.setFlipX(true);
    } else if (right && !left) {
      this.setVelocityX(PLAYER.MOVE_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    const jumpDown = this.anyDown(this.keys.jump);
    if (jumpDown && !this.jumpHeld) {
      this.jumpPressedAt = time;
    }

    const withinCoyote = time - this.lastGroundedAt <= PLAYER.COYOTE_MS;
    const bufferedJump = time - this.jumpPressedAt <= PLAYER.JUMP_BUFFER_MS;
    if (bufferedJump && withinCoyote) {
      this.jump();
      this.jumpPressedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
    }

    if (!jumpDown && this.jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * PLAYER.JUMP_CUT_MULTIPLIER);
    }
    this.jumpHeld = jumpDown;
  }

  private jump(): void {
    this.setVelocityY(PLAYER.JUMP_VELOCITY);
  }

  bounce(): void {
    this.setVelocityY(PLAYER.STOMP_BOUNCE);
  }

  get dead(): boolean {
    return this.isDead;
  }

  get shieldCharges(): number {
    return this.shieldChargesValue;
  }

  /** 방패 획득: 충전을 최대치로 채우고 아우라 링을 표시. */
  giveShield(): void {
    this.shieldChargesValue = SHIELD.MAX_CHARGES;
    if (!this.shieldRing) {
      this.shieldRing = this.scene.add
        .circle(this.x, this.y, 26)
        .setStrokeStyle(3, COLORS.SHIELD, 0.9)
        .setDepth(this.depth - 1);
    }
  }

  /** 대포알 1발 흡수. 막았으면 true 반환. 충전 0이 되면 링 제거. */
  absorbHit(): boolean {
    const result = absorbShieldHit(this.shieldChargesValue);
    this.shieldChargesValue = result.charges;
    if (this.shieldChargesValue === 0 && this.shieldRing) {
      this.shieldRing.destroy();
      this.shieldRing = undefined;
    }
    return result.blocked;
  }

  die(): void {
    if (this.isDead) return;
    this.isDead = true;
    if (this.shieldRing) {
      this.shieldRing.destroy();
      this.shieldRing = undefined;
    }
    this.setTint(0xff004d);
    this.body.setVelocity(0, -300);
    this.body.checkCollision.none = true;
  }
}
```

- [ ] **Step 2: `src/objects/ShieldItem.ts` 생성**

```typescript
import Phaser from "phaser";
import { TEX } from "../config";
import type { Player } from "./Player";

/**
 * 밟으면(overlap) 플레이어에게 방패를 주는 픽업. Goal처럼 중력 없는 정적 스프라이트.
 */
export class ShieldItem extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.SHIELD);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setOrigin(0.5, 0.5);

    // 눈에 띄게 위아래로 살짝 떠다니게.
    scene.tweens.add({
      targets: this,
      y: y - 6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  /** 플레이어에게 방패를 주고 픽업을 제거. */
  collect(player: Player): void {
    player.giveShield();
    this.destroy();
  }
}
```

- [ ] **Step 3: 타입체크**

Run: `npx tsc --noEmit`
Expected: 오류 0. (런타임 배선은 Task 10에서, 순수 로직은 Task 3에서 검증됨.)

- [ ] **Step 4: Commit**

```bash
git add src/objects/Player.ts src/objects/ShieldItem.ts
git commit -m "feat: add player shield state and ShieldItem pickup"
```

---

### Task 6: Cannonball (대포알)

**Files:**
- Create: `src/objects/Cannonball.ts`

**Interfaces:**
- Consumes: `CANNON.BALL_SPEED`, `TEX.CANNONBALL` (from `../config`)
- Produces: `new Cannonball(scene, x, y, direction: "left" | "right")`

- [ ] **Step 1: `src/objects/Cannonball.ts` 생성**

```typescript
import Phaser from "phaser";
import { CANNON, TEX } from "../config";

/**
 * 대포 발사체: 등속 수평 이동, 중력 없음. Cannon이 생성하고,
 * GameScene이 발판 충돌·월드 이탈 시 소멸시킨다.
 */
export class Cannonball extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: "left" | "right") {
    super(scene, x, y, TEX.CANNONBALL);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setOrigin(0.5, 0.5);
    const sign = direction === "left" ? -1 : 1;
    this.setVelocityX(sign * CANNON.BALL_SPEED);
  }
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 오류 0.

- [ ] **Step 3: Commit**

```bash
git add src/objects/Cannonball.ts
git commit -m "feat: add Cannonball projectile"
```

---

### Task 7: Cannon (대포)

**Files:**
- Create: `src/objects/Cannon.ts`

**Interfaces:**
- Consumes: `CannonDef` (from `../levels/types`), `shouldFire` (from `./ballistics`), `Cannonball` (from `./Cannonball`), `TEX.CANNON`, `CANNON.FIRE_INTERVAL_MS` (from `../config`)
- Produces: `new Cannon(scene, def: CannonDef, balls: Phaser.Physics.Arcade.Group)`, `Cannon.update(time: number): void`

- [ ] **Step 1: `src/objects/Cannon.ts` 생성**

```typescript
import Phaser from "phaser";
import { CANNON, TEX } from "../config";
import type { CannonDef } from "../levels/types";
import { shouldFire } from "./ballistics";
import { Cannonball } from "./Cannonball";

/**
 * 주기적으로 대포알을 발사하는 대포. 본체는 무해(충돌 미배선) — 대포알만 치명적.
 */
export class Cannon extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private direction: "left" | "right";
  private intervalMs: number;
  private lastFiredAt = 0;
  private balls: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, def: CannonDef, balls: Phaser.Physics.Arcade.Group) {
    super(scene, def.x, def.y, TEX.CANNON);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setOrigin(0.5, 0.5);
    this.setFlipX(def.direction === "left");

    this.direction = def.direction;
    this.intervalMs = def.intervalMs ?? CANNON.FIRE_INTERVAL_MS;
    this.balls = balls;
  }

  update(time: number): void {
    if (!shouldFire(time, this.lastFiredAt, this.intervalMs)) return;
    this.lastFiredAt = time;
    const ball = new Cannonball(this.scene, this.x, this.y, this.direction);
    this.balls.add(ball);
  }
}
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 오류 0.

- [ ] **Step 3: Commit**

```bash
git add src/objects/Cannon.ts
git commit -m "feat: add Cannon that periodically fires cannonballs"
```

---

### Task 8: BootScene에 대포·대포알·방패 텍스처 추가

**Files:**
- Modify: `src/scenes/BootScene.ts` (create()에 호출 3개 + 메서드 3개)

**Interfaces:**
- Consumes: `COLORS.CANNON/CANNONBALL/SHIELD`, `TEX.CANNON/CANNONBALL/SHIELD`
- Produces: `TEX.CANNON`, `TEX.CANNONBALL`, `TEX.SHIELD` 텍스처 (BootScene 로드 후 사용 가능)

- [ ] **Step 1: create()에 텍스처 생성 호출 추가**

`makeGoalTexture();` 다음 줄(그리고 `this.scene.start("MenuScene");` 이전)에 추가:

```typescript
    this.makeRectTexture(TEX.CANNON, 40, 30, COLORS.CANNON, 0xffffff);
    this.makeCannonballTexture();
    this.makeShieldTexture();
```

- [ ] **Step 2: 클래스에 텍스처 생성 메서드 2개 추가**

`makeGoalTexture()` 메서드 뒤(클래스 닫는 `}` 직전)에 추가:

```typescript
  /** 대포알: 작은 원. */
  private makeCannonballTexture(): void {
    const d = 16;
    const g = this.add.graphics();
    g.fillStyle(COLORS.CANNONBALL, 1);
    g.fillCircle(d / 2, d / 2, d / 2);
    g.generateTexture(TEX.CANNONBALL, d, d);
    g.destroy();
  }

  /** 방패 아이템: 방패 모양 + 흰 십자. */
  private makeShieldTexture(): void {
    const w = 26;
    const h = 30;
    const g = this.add.graphics();
    g.fillStyle(COLORS.SHIELD, 1);
    g.fillRoundedRect(0, 0, w, h - 8, 5);
    g.fillTriangle(0, h - 10, w, h - 10, w / 2, h);
    g.fillStyle(0xffffff, 1);
    g.fillRect(w / 2 - 2, 6, 4, 12);
    g.fillRect(w / 2 - 6, 10, 12, 4);
    g.generateTexture(TEX.SHIELD, w, h);
    g.destroy();
  }
```
> 대포 텍스처는 기존 `makeRectTexture`(회색 블록 + 밝은 윗면)를 재사용하므로 별도 메서드 불필요.

- [ ] **Step 3: 타입체크 + 실행 스모크**

Run: `npx tsc --noEmit`
Expected: 오류 0.
Run: `npm run dev` → 브라우저에서 콘솔 에러 없이 메뉴 화면이 뜨는지 확인(텍스처 생성이 부팅을 막지 않음).

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: generate cannon/cannonball/shield placeholder textures"
```

---

### Task 9: level2 데이터 파일

**Files:**
- Create: `src/levels/level2.ts`

**Interfaces:**
- Consumes: `LevelDef` (from `./types`)
- Produces: `export const level2: LevelDef`

- [ ] **Step 1: `src/levels/level2.ts` 생성**

```typescript
import type { LevelDef } from "./types";

/**
 * 두 번째 스테이지. 좁은 발판 정밀 점프 + 대포 2문(하늘/종반)·방패 1개.
 * 좌표는 월드 픽셀. 발판은 왼쪽 위 모서리 + 크기.
 */
export const level2: LevelDef = {
  worldWidth: 2600,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    // 땅(구멍으로 분리): PIT1=680~800, PIT2=1880~1980
    { x: 0, y: 496, width: 680, height: 44 },
    { x: 800, y: 496, width: 1080, height: 44 },
    { x: 1980, y: 496, width: 620, height: 44 },
    // 좁은 공중 발판(90~120px)
    { x: 340, y: 380, width: 110, height: 24 },
    { x: 620, y: 330, width: 90, height: 24 },
    { x: 900, y: 360, width: 110, height: 24 },
    { x: 1080, y: 270, width: 100, height: 24 }, // 방패 위치
    { x: 1260, y: 220, width: 100, height: 24 }, // 정점 · 대포2
    { x: 1440, y: 300, width: 110, height: 24 },
    { x: 1700, y: 380, width: 110, height: 24 },
    { x: 2100, y: 330, width: 120, height: 24 },
  ],
  enemies: [
    { x: 960, y: 346 }, // 발판 900 위
    { x: 1300, y: 482 }, // 중앙 땅
    { x: 1750, y: 366 }, // 발판 1700 위
  ],
  spikes: [
    { x: 1000, y: 472, tiles: 2 },
    { x: 1500, y: 472, tiles: 2 },
  ],
  cannons: [
    { x: 1270, y: 205, direction: "left" }, // 하늘(정점 발판 왼쪽 끝)
    { x: 2360, y: 452, direction: "left" }, // 종반 지면
  ],
  shields: [{ x: 1120, y: 250 }], // 발판 1080 위, 하늘 초소 직전
  goal: { x: 2540, y: 432 },
};
```

- [ ] **Step 2: 타입체크**

Run: `npx tsc --noEmit`
Expected: 오류 0 (선택 필드 `cannons`/`shields`가 `LevelDef`에 존재).

- [ ] **Step 3: Commit**

```bash
git add src/levels/level2.ts
git commit -m "feat: add level2 stage data (narrow platforms + 2 cannons + shield)"
```

---

### Task 10: GameScene에 level2 로드 + 대포/방패/HUD 배선

**Files:**
- Modify: `src/scenes/GameScene.ts` (전체 교체)

**Interfaces:**
- Consumes: `level2` (from `../levels/level2`), `Cannon`, `ShieldItem`, `isOffWorld`, `Player.shieldCharges/giveShield/absorbHit`
- Produces: 실행 가능한 level2 스테이지 (완료조건 전부 충족)

- [ ] **Step 1: `src/scenes/GameScene.ts` 전체를 아래로 교체**

```typescript
import Phaser from "phaser";
import { COLORS, TEX } from "../config";
import { level2 } from "../levels/level2";
import type { LevelDef } from "../levels/types";
import { patrolBoundsFor } from "../levels/patrol";
import { isOffWorld } from "../objects/ballistics";
import { Player } from "../objects/Player";
import { Enemy } from "../objects/Enemy";
import { Goal } from "../objects/Goal";
import { Cannon } from "../objects/Cannon";
import { ShieldItem } from "../objects/ShieldItem";

/**
 * 플레이 씬. LevelDef를 읽어 월드(발판/적/가시/대포/방패/깃발)를 만들고
 * 물리 상호작용을 배선하며 승/패 전환을 처리한다.
 */
export class GameScene extends Phaser.Scene {
  private level!: LevelDef;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Enemy[];
  private cannons!: Cannon[];
  private cannonballs!: Phaser.Physics.Arcade.Group;
  private shieldText!: Phaser.GameObjects.Text;
  private ending = false;
  private hitCooldownUntil = 0;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.level = level2;
    this.ending = false;
    this.enemies = [];
    this.cannons = [];
    this.hitCooldownUntil = 0;

    this.physics.world.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);

    this.buildPlatforms();
    const spikes = this.buildSpikes();
    this.buildEnemies();

    this.player = new Player(this, this.level.playerSpawn.x, this.level.playerSpawn.y);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    const goal = new Goal(this, this.level.goal.x, this.level.goal.y);

    this.cannonballs = this.physics.add.group({ allowGravity: false });
    this.buildCannons();
    const shieldItems = this.buildShields();

    // --- Physics wiring ---
    this.physics.add.collider(this.player, this.platforms);
    for (const enemy of this.enemies) {
      this.physics.add.collider(enemy, this.platforms);
      this.physics.add.overlap(this.player, enemy, () => this.handlePlayerEnemy(enemy));
    }
    this.physics.add.overlap(this.player, spikes, () => this.handleDeath());
    this.physics.add.overlap(this.player, goal, () => this.handleWin());

    // 대포알은 발판에 닿으면 소멸. 대포 '본체'는 플레이어와 배선하지 않아 무해.
    this.physics.add.collider(this.cannonballs, this.platforms, (ball) => {
      (ball as Phaser.Physics.Arcade.Sprite).destroy();
    });
    this.physics.add.overlap(this.player, this.cannonballs, (_p, ball) => {
      this.handleCannonballHit(ball as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, shieldItems, (_p, item) => {
      (item as ShieldItem).collect(this.player);
    });

    this.drawHud();
  }

  update(time: number): void {
    this.player.update(time);
    for (const enemy of this.enemies) enemy.update();
    for (const cannon of this.cannons) cannon.update(time);

    // 월드를 벗어난 대포알 소멸(객체 누수 방지).
    // destroy()가 그룹 배열을 변형하므로 복사본을 순회한다.
    for (const ball of [...this.cannonballs.getChildren()]) {
      const b = ball as Phaser.Physics.Arcade.Sprite;
      if (isOffWorld(b.x, this.level.worldWidth)) b.destroy();
    }

    this.shieldText.setText(this.shieldLabel());

    if (!this.ending && this.player.y > this.level.worldHeight + 80) {
      this.handleDeath();
    }
  }

  // --- World construction ---

  private buildPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    for (const p of this.level.platforms) {
      const img = this.platforms.create(
        p.x + p.width / 2,
        p.y + p.height / 2,
        TEX.PLATFORM,
      ) as Phaser.Physics.Arcade.Sprite;
      img.setDisplaySize(p.width, p.height);
      img.refreshBody();
    }
  }

  private buildSpikes(): Phaser.Physics.Arcade.StaticGroup {
    const spikes = this.physics.add.staticGroup();
    for (const s of this.level.spikes) {
      for (let i = 0; i < s.tiles; i++) {
        const spike = spikes.create(
          s.x + i * 32 + 16,
          s.y + 16,
          TEX.SPIKE,
        ) as Phaser.Physics.Arcade.Sprite;
        const body = spike.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(28, 18).setOffset(2, 14);
      }
    }
    return spikes;
  }

  private buildEnemies(): void {
    for (const e of this.level.enemies) {
      const [left, right] = patrolBoundsFor(this.level.platforms, e.x, e.y);
      this.enemies.push(new Enemy(this, e.x, e.y, left, right));
    }
  }

  private buildCannons(): void {
    for (const def of this.level.cannons ?? []) {
      this.cannons.push(new Cannon(this, def, this.cannonballs));
    }
  }

  private buildShields(): Phaser.Physics.Arcade.Group {
    const shields = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const s of this.level.shields ?? []) {
      shields.add(new ShieldItem(this, s.x, s.y));
    }
    return shields;
  }

  // --- Interactions / outcomes ---

  private handlePlayerEnemy(enemy: Enemy): void {
    if (this.ending || this.player.dead || enemy.dead) return;

    const stomping =
      this.player.body.velocity.y > 0 &&
      this.player.body.bottom <= enemy.body.top + 12;

    if (stomping) {
      enemy.squash();
      this.player.bounce();
    } else {
      this.handleDeath();
    }
  }

  /** 대포알 피격: 방패 있으면 흡수(충전 1), 없으면 사망. 프레임당 1회로 제한. */
  private handleCannonballHit(ball: Phaser.Physics.Arcade.Sprite): void {
    if (this.ending || this.player.dead || !ball.active) return;
    ball.destroy();
    if (this.time.now < this.hitCooldownUntil) return;
    this.hitCooldownUntil = this.time.now + 150;
    if (this.player.shieldCharges > 0) {
      this.player.absorbHit();
      this.cameras.main.flash(120, 41, 173, 255);
    } else {
      this.handleDeath();
    }
  }

  private handleWin(): void {
    if (this.ending) return;
    this.ending = true;
    this.player.body.stop();
    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(500, () => this.scene.start("WinScene"));
  }

  private handleDeath(): void {
    if (this.ending) return;
    this.ending = true;
    this.player.die();
    this.cameras.main.stopFollow();
    this.cameras.main.shake(200, 0.01);
    this.time.delayedCall(800, () => this.scene.start("GameOverScene"));
  }

  private shieldLabel(): string {
    const n = this.player.shieldCharges;
    return n > 0 ? `Shield: ${"●".repeat(n)}` : "Shield: --";
  }

  private drawHud(): void {
    const hint = this.add
      .text(
        16,
        14,
        "Arrows / A,D move  •  Space / W / Up jump  •  방패로 대포알을 막고 깃발에 도달",
        {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#fff1e8",
        },
      )
      .setScrollFactor(0)
      .setDepth(1000);
    hint.setStroke("#1d2b53", 4);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 5000,
      duration: 1000,
    });

    this.shieldText = this.add
      .text(16, 40, this.shieldLabel(), {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#29adff",
      })
      .setScrollFactor(0)
      .setDepth(1000);
    this.shieldText.setStroke("#1d2b53", 4);

    this.add
      .rectangle(0, 0, this.level.worldWidth, this.level.worldHeight, COLORS.BACKGROUND)
      .setOrigin(0, 0)
      .setDepth(-10);
  }
}
```

- [ ] **Step 2: 타입체크 + 전체 테스트**

Run: `npx tsc --noEmit && npx vitest run`
Expected: 컴파일 오류 0, 모든 테스트 PASS.

- [ ] **Step 3: 실행 스모크 (완료조건 수동 확인)**

Run: `npm run dev` → 브라우저에서 아래를 하나씩 확인:
  1. 시작 시 level2가 로드된다(좁은 발판, 넓은 맵).
  2. 발판 1080의 방패를 밟으면 HUD가 `Shield: ●●●`로 바뀌고 플레이어에 링이 생긴다.
  3. 하늘 대포(정점)가 왼쪽으로 주기 발사하고, 상승 점프 타이밍으로 회피 가능하다.
  4. 대포알에 맞을 때: 방패 있으면 파란 플래시 + 충전 1 감소, 없으면 사망 화면으로 전환.
  5. 대포 본체에 겹쳐도 죽지 않는다.
  6. 종반 대포를 지나 깃발에 닿으면 승리 화면으로 전환.
  7. 콘솔 에러 없음.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: load level2 and wire cannons, shield pickup, and HUD"
```

---

## 완료조건 (Completion Criteria)

- `npx vitest run` 전부 PASS (`shield.test.ts`, `ballistics.test.ts`, 기존 `patrol.test.ts`).
- `npx tsc --noEmit` 오류 0.
- `npm run dev` 시작 시 level2 로드.
- 방패 획득 → HUD 충전 3 표시 + 링 표시.
- 대포알 피격: 방패 있으면 흡수(충전 감소), 없으면 사망 전환.
- 대포 본체 접촉으로는 죽지 않음.
- 종반 대포를 지나 깃발 도달 시 승리 전환.
- `src/levels/level1.ts` 존재(미삭제).

## 금지사항 (Don'ts)

- `level1.ts` 삭제/덮어쓰기 대신 → 파일 보존, `GameScene`의 로드 대상만 교체.
- 대포 본체에 사망 판정 걸기 대신 → 대포알에만 판정.
- 방패로 적·가시·구멍 막기 대신 → 방패는 대포알 전용.
- 대포알 생성 후 방치 대신 → 발판 충돌·월드 이탈 시 반드시 `destroy()`.
- `cannons`/`shields`를 필수 필드로 만들기 대신 → 선택 필드 유지(`level1` 보호).

## 고려사항 (Considerations)

- 점프 도달성: 좁은 발판 간 세로 간격이 ≈165px 초과면 클리어 불가 → Task 10 스모크에서 실제 점프로 확인, 안 되면 `level2.ts` 좌표 조정.
- 한 프레임 다중 피격: `hitCooldownUntil`(150ms)로 짧은 무적을 둬 대포알이 겹쳐도 충전이 한꺼번에 여러 개 소모되지 않게 함.
- 방패 밸런스: 3회로 대포2(회피 가능)+대포1을 감당. 스모크 후 발사 간격(`CANNON.FIRE_INTERVAL_MS`)·좌표로 조정.
- 경로 선택: 방패는 하늘 경로에 있음 → 지면 경로로 대포2를 피하면 무방패로 종반을 맞는 위험/보상(의도된 창발).

## 제약사항 (Constraints)

- 스택 고정(Phaser4/TS/Vite). 새 의존성 없음.
- 텍스처는 `BootScene` 절차적 생성. 색은 `COLORS` 팔레트.
- 단위 테스트는 Phaser 비의존 순수 로직만. Phaser 통합부는 타입체크 + 수동 스모크로 검증.

## 실행 후 검증 (플랜 단위)

- 각 코드 Task 완료 후 `/code-review` → 발견된 P0/P1 수정 → 재실행, **잔존 P0/P1 0건까지 반복**.
- 플랜 전체 완료 후 `/compound-engineering:ce-code-review` 1회(다관점 최종 게이트).
- 최종 `/rl`로 위 완료조건 전 항목 재검증. 미충족 시 보완 Task를 끝에 추가(동일 규격).
