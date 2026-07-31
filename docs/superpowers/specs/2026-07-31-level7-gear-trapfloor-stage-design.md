# level7 스테이지 설계 — 톱니바퀴 추 & 함정 바닥

작성일: 2026-07-31

## 1. 개요 (무엇을 / 왜)

`level6`("6 — Bombardment", 대포+실드 스테이지) 다음에 오는 새 스테이지 `level7`을 추가한다.
level6의 아이디어(대포, 좁은 발판, 지상 구덩이, 실드 픽업)를 이어받으면서:

- **맵 길이를 2배로 확장**한다 — worldWidth 2600 → **5200**(worldHeight는 카메라 높이 고정 관례상 540 그대로).
- **새 해저드 2종**을 추가한다:
  1. **톱니바퀴 추 (Gear)** — 레일을 왕복 이동하면서 동시에 회전하는, 닿으면 즉사하는 해저드. 기존 `Pendulum`과는 별개의 새 해저드.
  2. **함정 바닥 (TrapFloor)** — 평범한 땅처럼 위장한 바닥 타일. 타이머로 "경고 깜빡임 2회 → 바닥 소멸(구멍) → 자동 복구"를 영원히 반복한다. 구멍이 열렸을 때 그 위에서 떨어지면 기존 낙사 판정으로 사망한다.
- 죽으면 **체크포인트 없이 스테이지 전체를 재시작**하는 기존 5개 스테이지의 규칙을 그대로 유지한다.

새 해저드 2종을 도입하므로, 기존 레벨들처럼 "데이터만 추가"하는 범위를 넘어 **새 오브젝트 코드 2개 + 순수 로직 함수 2개 + 그에 대한 유닛 테스트**가 필요하다.

## 2. 게임 규칙 (확정)

| 항목 | 결정 |
|------|------|
| 레벨 위치 | `levels` 배열 끝에 `level7` 추가(레벨 순서: 1~6은 그대로, `level6` 다음이 `level7`) |
| 맵 크기 | worldWidth 5200 (level6의 2배), worldHeight 540 (변경 없음) |
| 구간 구성 | 4구간 점증 방식: ①웜업(대포 재도입) → ②기어워크스(톱니바퀴 추 단독 등장) → ③트랩드 그라운드(함정 바닥 단독 등장) → ④파이널 건틀릿(셋을 한 번에 결합) |
| 톱니바퀴 추 이동 | 기존 `Pendulum`과 무관한 **새 해저드**. 레일(수평/수직)을 왕복 이동 + 동시에 제자리 회전. 회전은 시각 효과일 뿐(원형 히트박스라 판정 모양은 불변) |
| 톱니바퀴 추 판정 | 원형 히트박스, **접촉 즉시 사망**(밟아서 처치하는 개념 없음 — `Pendulum` 머리와 동일 취급) |
| 함정 바닥 트리거 | **타이머 기반 자동 반복**(플레이어 위치·행동과 무관). 위치마다 `phase`(위상 오프셋)를 다르게 줘서 "불규칙하게 느껴지지만 재시작 시 항상 동일"하게 만든다(진짜 난수 미사용) |
| 함정 바닥 사이클 | solid(위장, 안전) → telegraph(경고 깜빡임, 아직 안전) → solid → telegraph(2번째 경고) → open(바닥 소멸, 충돌 꺼짐) → 자동으로 solid 복귀, 무한 반복 |
| 함정 바닥 사망 방식 | 새 사망 판정 없음 — **기존 낙사 판정**(`player.y > worldHeight + 80` → `handleDeath()`)을 그대로 사용. 따라서 함정 바닥은 반드시 **밑에 아무 바닥도 없는 곳(핏 위)**에 배치해야 한다 |
| 함정 바닥 위장 | 평상시 외형은 기존 `CrumblingPlatform`의 "FAKE" 텍스처(일반 플랫폼과 의도적으로 비슷한 색)를 재사용. 경고 단계에서만 `COLORS.TELEGRAPH`로 빨갛게 깜빡임 |
| 체크포인트 | **없음** — 어디서 죽어도 `level7` 전체를 처음부터 재시작(기존 5개 스테이지와 동일 규칙, 새 시스템 도입 안 함) |

## 3. 레벨 레이아웃

좌표는 모두 월드 픽셀, 발판은 왼쪽 위 모서리 (x, y) + 크기로 표기. 정확한 간격·높이는 `level3.ts`/`level6.ts`의 기존 관례와 동일하게 **구현 단계에서 실제 플레이로 조정**한다(아래 수치는 그 출발점).

### 구간 ① 웜업 (0–1400px) — level6 도입부 재현, 대포 재등장

| 종류 | x | y | width | height | 비고 |
|------|---|---|-------|--------|------|
| 땅 A | 0 | 496 | 640 | 44 | 시작 (플레이어 스폰 80,400) |
| (구멍) | 640 | – | 120 | – | PIT1 |
| 땅 B | 760 | 496 | 640 | 44 | |
| 공중발판 | 300 | 380 | 110 | 24 | |
| 공중발판 | 560 | 330 | 90 | 24 | |
| 공중발판 | 820 | 360 | 130 | 24 | 적 순찰 |
| 공중발판 | 1050 | 260 | 110 | 24 | 크레스트 — **대포 위치** |
| 공중발판 | 1300 | 340 | 110 | 24 | 구간②로 이어지는 착지 |

| 오브젝트 | 좌표 | 비고 |
|---------|------|------|
| 적 | (880, 346) | 발판(820,360) 위 순찰 |
| 가시 | (1000, 472), 2타일 | 땅 B 위 |
| **대포** | 발사원 (1060, 245), 왼쪽 | 크레스트 발판(1050,260) 바로 옆, level6 크레스트 대포와 동일한 상대 배치 |

### 구간 ② 기어워크스 (1400–2820px) — 톱니바퀴 추 단독 등장

| 종류 | x | y | width | height | 비고 |
|------|---|---|-------|--------|------|
| 땅 C | 1400 | 496 | 500 | 44 | |
| (구멍) | 1900 | – | 120 | – | PIT2 |
| 땅 D | 2020 | 496 | 580 | 44 | |
| (구멍) | 2600 | – | 120 | – | PIT3 |
| 땅 E | 2720 | 496 | 100 | 44 | 구간③ 착지 |
| 공중발판 | 1560 | 380 | 110 | 24 | |
| 공중발판 | 1760 | 320 | 100 | 24 | **실드 픽업 위치** |
| 공중발판 | 1960 | 260 | 100 | 24 | 크레스트 (PIT2 위) |
| 공중발판 | 2160 | 340 | 110 | 24 | |
| 공중발판 | 2400 | 400 | 110 | 24 | |
| 공중발판 | 2560 | 340 | 100 | 24 | PIT3 앞 |

| 오브젝트 | 좌표 | 비고 |
|---------|------|------|
| **실드 픽업** | (1810, 295) | 발판(1760,320) 위 |
| **톱니바퀴 추 #1** | 피벗 (1860, 300), 수평, range 100, speed 90 | 발판(1760,320)↔(1960,260) 사이 틈을 가로로 왕복 |
| **톱니바퀴 추 #2** | 피벗 (2335, 330), 수직, range 140, speed 90 | 발판(2160,340)↔(2400,400) 사이 틈을 세로로 왕복 |

### 구간 ③ 트랩드 그라운드 (2820–4000px) — 함정 바닥 단독 등장

지상 구간 전체가 "안전한 섬(정적 발판) ↔ 함정 바닥" 교대로 이어진다. 모든 타일이 같은 y=496 지면선 위에 있고, 함정 바닥 밑에는 아무 것도 없다(진짜 구멍).

| 종류 | x | y | width | height | 비고 |
|------|---|---|-------|--------|------|
| 땅 F (안전) | 2820 | 496 | 100 | 44 | |
| **함정 바닥 #1** | 2920 | 496 | 120 | 44 | phase 0 |
| 땅 G (안전) | 3040 | 496 | 80 | 44 | |
| **함정 바닥 #2** | 3120 | 496 | 120 | 44 | phase 0.4 |
| 땅 H (안전, 가시 있음) | 3240 | 496 | 100 | 44 | |
| **함정 바닥 #3** | 3340 | 496 | 140 | 44 | phase 0.7 |
| 땅 I (안전) | 3480 | 496 | 80 | 44 | |
| **함정 바닥 #4** | 3560 | 496 | 120 | 44 | phase 0.15 |
| 땅 J (안전, 구간④로 이어짐) | 3680 | 496 | 320 | 44 | |

| 오브젝트 | 좌표 | 비고 |
|---------|------|------|
| 가시 | (3260, 472), 2타일 | 땅 H 위 — "안전한 섬"에도 약간의 압박 |
| 적 | (3720, 456) | 땅 J 위 순찰 |

### 구간 ④ 파이널 건틀릿 (4000–5200px) — 대포 + 톱니바퀴 추 + 함정 바닥 결합

| 종류 | x | y | width | height | 비고 |
|------|---|---|-------|--------|------|
| 땅 K | 4000 | 496 | 260 | 44 | |
| (구멍) | 4260 | – | 100 | – | PIT4 |
| 땅 L | 4360 | 496 | 140 | 44 | |
| **함정 바닥 #5** | 4500 | 496 | 120 | 44 | phase 0.5 |
| 땅 M (종반 질주) | 4620 | 496 | 580 | 44 | 5200에서 월드 끝과 맞춤 |
| 공중발판 | 4300 | 360 | 110 | 24 | PIT4 위 회피 루트 |
| 공중발판 | 4700 | 330 | 110 | 24 | |
| 공중발판 | 4900 | 380 | 110 | 24 | |

| 오브젝트 | 좌표 | 비고 |
|---------|------|------|
| 적 | (4420, 456) | 땅 L 위 순찰 |
| **톱니바퀴 추 #3** | 피벗 (4855, 300), 수직, range 150, speed 100 | 발판(4700,330)↔(4900,380) 사이 틈 |
| **대포** | 발사원 (4960, 452), 왼쪽 | 종반 질주 구간, level6 종반 대포와 동일한 상대 배치(대포를 지나야 깃발) |
| 깃발(목표) | (5140, 432) | |

> 위 표들의 좌표가 레이아웃의 기준이다(자체 완결). worldWidth = 5200.

### 의도한 플레이 흐름

1. **웜업**: level6 도입부와 거의 동일한 리듬(구덩이 하나, 좁은 발판, 크레스트 대포)으로 감을 되살린다.
2. **기어워크스**: 처음 보는 톱니바퀴 추 2개를 각각 수평/수직으로 배치해 "레일 위를 도는 장애물의 타이밍을 읽는 법"만 집중적으로 가르친다. 실드를 챙기면 이후 구간의 대포 피격을 한 번 버틸 수 있다.
3. **트랩드 그라운드**: 겉보기엔 평범한 땅이지만 밟기 전에 경고가 2번 깜빡이는 함정 구간. 안전한 섬 사이를 이동하며 "언제 열리는지"를 관찰하고 타이밍을 맞춰 건넌다.
4. **파이널 건틀릿**: 대포·톱니바퀴 추·함정 바닥이 한 화면에 다 있는 마무리. 남은 실드 충전으로 대포를 버티고, 톱니바퀴 추 타이밍에 맞춰 공중 루트를 건너고, 마지막 함정 바닥을 넘어 깃발에 도달하면 클리어.

## 4. 새 해저드 설계

### 4-1. 톱니바퀴 추 (Gear)

**동작 원리**: `MovingPlatform`이 쓰는 `oscillateOffset` 순수 함수를 그대로 재사용해 레일을 왕복 이동한다. 동시에 새 순수 함수로 회전각을 계산해 스프라이트에 시각적 회전을 준다(원형 히트박스라 판정에는 영향 없음 — `Pendulum` 머리가 회전해도 판정이 원형 그대로인 것과 동일한 이유).

- `Phaser.Physics.Arcade.Sprite` 상속, `body.setAllowGravity(false)`, `body.setImmovable(true)`.
- 원형 히트박스: `body.setCircle(GEAR.RADIUS, inset, inset)` — `Pendulum`의 머리와 같은 기법.
- 플랫폼처럼 태우지 않는다(carry 로직 없음) — 순수 이동+회전 해저드.
- 벽/발판과 충돌하지 않는다(`Pendulum`/`MovingPlatform`과 동일하게, 레벨 데이터에서 range를 지형과 겹치지 않게 배치하는 책임은 레벨 저자에게 있음).

```typescript
// src/objects/Gear.ts
export class Gear extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    opts: {
      axis?: "horizontal" | "vertical";
      range?: number;
      speed?: number;
      phase?: number;
      waitMs?: number;
      rotateDegPerSec?: number;
    } = {},
  );
  /** elapsedMs = scene time, dtMs = frame delta (오프셋은 oscillateOffset, 회전은 gearRotationRad). */
  update(elapsedMs: number, dtMs: number): void;
}
```

이동 로직은 `MovingPlatform.update()`와 거의 동일(오프셋 계산 → 목표 위치로 velocity 이동, 프레임 저더링 방지를 위한 clampAbs 재사용). 다만 캐리(rider) 관련 메서드(`carryDX`/`carryDY`)는 없다 — Gear는 아무도 태우지 않는다.

### 4-2. 함정 바닥 (TrapFloor)

**동작 원리**: 겉모습·정적 바디는 `CrumblingPlatform`과 같은 기법(정적 바디 토글로 충돌 on/off)을 쓰지만, 트리거가 `trigger()`(접촉) 대신 `update(elapsedMs)`(시간 기반, `Pendulum`/`PopupSpike`와 동일 패턴)이고, 한 번 무너지면 끝이 아니라 **영원히 반복**한다.

- `Phaser.Physics.Arcade.Sprite` 상속, `scene.physics.add.existing(this, true)`(정적 바디) — `CrumblingPlatform`과 동일.
- 텍스처는 `TEX.FAKE`를 그대로 재사용(새 텍스처 불필요) — 일반 플랫폼과 의도적으로 비슷하게 위장.
- `update(elapsedMs)`가 매 프레임 `trapFloorPhase()`(신규 순수 함수)를 호출해 현재 단계를 얻고:
  - `"solid"` → `body.enable = true`, `clearTint()`, `setVisible(true)`
  - `"telegraph"` → `body.enable = true`(아직 안전), `setTint(COLORS.TELEGRAPH)`로 깜빡임(`PopupSpike`의 알파 깜빡임과 동일 기법)
  - `"open"` → `body.enable = false`, `setVisible(false)` (플레이어가 위에 있었다면 중력으로 자연히 떨어짐 → 기존 낙사 판정)

```typescript
// src/objects/TrapFloor.ts
export class TrapFloor extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number, y: number, width: number, height: number,
    opts: { telegraphMs?: number; safeMs?: number; openMs?: number; phase?: number } = {},
  );
  update(elapsedMs: number): void;
}
```

## 5. 데이터 구조 변경 (`src/levels/types.ts`)

```typescript
// PlatformType에 "trapfloor" 추가
export type PlatformType =
  | "static" | "moving" | "conveyor" | "spring" | "fake"
  | "trapfloor"; // 함정 바닥 — 자동 사이클로 경고 2번 후 바닥이 열림(구멍 위에만 배치)

export interface PlatformDef {
  // ...기존 필드 동일...

  // type === "trapfloor" (phase는 기존 "moving" 필드와 공유)
  /** 경고 깜빡임 지속 시간(ms). 미지정 시 TRAP_FLOOR.TELEGRAPH_MS. */
  telegraphMs?: number;
  /** 위장 상태로 안전한 구간(ms, 경고 사이/경고 전). 미지정 시 TRAP_FLOOR.SAFE_MS. */
  safeMs?: number;
  /** 바닥이 사라져 있는 시간(ms). 미지정 시 TRAP_FLOOR.OPEN_MS. */
  openMs?: number;
}

/** F-1 — 톱니바퀴 추: 레일 왕복 이동 + 회전, 접촉 즉사. */
export interface GearDef {
  kind: "gear";
  x: number; // 피벗(홈 포지션)
  y: number;
  axis?: "horizontal" | "vertical";
  range?: number;
  speed?: number;
  phase?: number;
  waitMs?: number;
  rotateDegPerSec?: number;
}

export type HazardDef =
  | PendulumDef | PopupSpikeDef | ThwompDef | ShooterDef | TurretDef | CannonDef
  | GearDef; // 추가
```

## 6. 순수 로직 (`src/levels/motion.ts`)

```typescript
/** 톱니바퀴 추의 회전각(라디안). 순수 선형 함수 — 오프셋 이동과 독립적인 시각 회전. */
export function gearRotationRad(
  elapsedMs: number,
  degPerSec: number,
  phase01 = 0,
): number {
  const deg = degPerSec * (elapsedMs / 1000) + phase01 * 360;
  return (deg * Math.PI) / 180;
}

export type TrapFloorPhase = "solid" | "telegraph" | "open";

/**
 * 함정 바닥의 현재 단계. 사이클은 safe → telegraph → safe → telegraph → open →
 * (반복)이며, "경고 2번"은 사용자가 명시한 고정 설계이므로 반복 횟수는
 * 파라미터로 노출하지 않고 함수 안에 고정한다.
 */
export function trapFloorPhase(
  elapsedMs: number,
  telegraphMs: number,
  safeMs: number,
  openMs: number,
  phase01 = 0,
): TrapFloorPhase {
  const cycleMs = 2 * safeMs + 2 * telegraphMs + openMs;
  if (cycleMs <= 0) return "solid";
  const t = mod(elapsedMs + phase01 * cycleMs, cycleMs);
  if (t < safeMs) return "solid";
  if (t < safeMs + telegraphMs) return "telegraph";
  if (t < 2 * safeMs + telegraphMs) return "solid";
  if (t < 2 * safeMs + 2 * telegraphMs) return "telegraph";
  return "open";
}
```

## 7. Config 변경 (`src/config.ts`)

```typescript
/** F-1 톱니바퀴 추. */
export const GEAR = {
  SPEED: 90,             // 레일 이동 속도 (px/s), MOVING_PLATFORM.SPEED와 비슷한 스케일
  ROTATE_DEG_PER_SEC: 220, // 시각 회전 속도
  RADIUS: 20,            // 원형 히트박스 반지름 (Pendulum의 16보다 살짝 큼)
} as const;

/** F-2 함정 바닥. */
export const TRAP_FLOOR = {
  TELEGRAPH_MS: 450, // POPUP_SPIKE.TELEGRAPH_MS와 동일 스케일
  SAFE_MS: 650,       // 위장 상태로 안전한 구간
  OPEN_MS: 1300,      // 바닥이 사라져 있는 시간
} as const;

// COLORS에 추가
GEAR: 0x8f8f8f, // 회색 (PENDULUM_HEAD의 주황과 구분)

// TEX에 추가
GEAR: "tex-gear",
// TrapFloor는 TEX.FAKE를 재사용 — 새 텍스처 키 불필요
```

## 8. 아키텍처 — 생성/수정 파일

모든 경로는 실제 존재를 확인함(2026-07-31 기준).

### 새로 만드는 파일

| 파일 | 역할 |
|------|------|
| `src/levels/level7.ts` | `level7` 레벨 데이터 |
| `src/objects/Gear.ts` | 톱니바퀴 추 해저드 |
| `src/objects/TrapFloor.ts` | 함정 바닥 |

### 고치는 파일

| 파일 | 변경 |
|------|------|
| `src/levels/index.ts` | `levels` 배열에 `level7` 추가 |
| `src/levels/types.ts` | `PlatformType`에 `"trapfloor"` 추가, `PlatformDef`에 `telegraphMs?/safeMs?/openMs?` 추가, `GearDef` 추가 후 `HazardDef` 유니온에 포함 |
| `src/levels/motion.ts` | `gearRotationRad`, `trapFloorPhase` 추가 |
| `src/levels/motion.test.ts` | 위 두 함수의 유닛 테스트 추가 |
| `src/config.ts` | `GEAR`, `TRAP_FLOOR` 튜닝 값, `COLORS.GEAR`, `TEX.GEAR` 추가 |
| `src/scenes/BootScene.ts` | `makeGearTexture()` 추가(원형 몸통 + 사각 톱니, `makePendulumHeadTexture`와 비슷한 구조). TrapFloor는 `TEX.FAKE` 재사용이라 변경 없음 |
| `src/scenes/GameScene.ts` | `gears: Gear[]`, `trapFloors: TrapFloor[]` 필드/리셋 추가, `buildHazard()`의 switch에 `case "gear"`, `buildPlatforms()`의 switch에 `case "trapfloor"`, `update()`에 두 배열의 `update()` 호출, 물리 배선(§9) |

## 9. 실행 흐름 (GameScene)

```
create():
  기존: 발판/가시/적/플레이어/깃발/대포/실드 생성 + 물리 배선 (level6와 동일)
  추가:
    - buildHazard()의 case "gear": new Gear(...) → this.gears.push(...)
    - buildPlatforms()의 case "trapfloor": new TrapFloor(...) → this.trapFloors.push(...)
      (CrumblingPlatform처럼 this.platforms 정적 그룹에는 넣지 않음)
    - overlap(player, gear, () => handleDeath())  // 각 Gear마다
    - collider(player, this.trapFloors)           // 콜백 불필요 — body.enable로만 충돌 결정

update(time, delta):
  기존: player/enemies/pendulums/popupSpikes/movingPlatforms/thwomps/shooters/turrets/cannons update
  추가:
    - for (const g of this.gears) g.update(this.elapsedMs, delta)
    - for (const tf of this.trapFloors) tf.update(this.elapsedMs)
```

## 10. 테스트 (TDD)

`pure-logic-testing` 관례에 따라 `motion.test.ts`에 두 함수의 테스트를 `popupSpikePhase`/`pendulumAngleRad` 테스트와 같은 스타일로 추가한다.

| 함수 | 카테고리 | 케이스 | 기대 |
|------|---------|--------|------|
| `gearRotationRad` | `[Happy]` 정상 | `gearRotationRad(1000, 180)` | 반경 1초에 180도/s → π 라디안 |
| `gearRotationRad` | `[Boundary]` 경계 | `gearRotationRad(0, 180, 0.5)` | `elapsedMs=0`이어도 `phase01=0.5`만큼 오프셋(180도=π) |
| `gearRotationRad` | `[Boundary]` 경계 | `gearRotationRad(5000, 0)` | `degPerSec=0`이면 회전 없음(phase 오프셋만) |
| `gearRotationRad` | `[Error]` 예외 | 없음 — 순수 선형 계산, 분기·외부 의존 없어 예외 케이스 부재(사유 명시) | |
| `trapFloorPhase` | `[Happy]` 정상 | 사이클 초반 | `"solid"` |
| `trapFloorPhase` | `[Boundary]` 경계 | `safeMs` 경계 직후 | `"telegraph"`(1차 경고) |
| `trapFloorPhase` | `[Boundary]` 경계 | 2차 경고 이후 | `"open"` |
| `trapFloorPhase` | `[Boundary]` 경계 | 한 사이클을 꽉 채운 시각 | wrap되어 다시 `"solid"` |
| `trapFloorPhase` | `[Boundary]` 경계 | `phase01` 오프셋 적용 | 사이클이 그만큼 이동 |
| `trapFloorPhase` | `[Boundary]` 경계 | 모든 duration이 0 (degenerate) | `"solid"`로 안전하게 처리 |
| `trapFloorPhase` | `[Error]` 예외 | 없음 — 순수 산술/분기, 외부 의존·IO 없어 예외 케이스 부재(사유 명시) | |

기존 테스트(`motion.test.ts`의 다른 describe 블록들)는 그대로 통과해야 한다.

## 11. 완료조건 (Completion Criteria)

- `npm test`가 전부 통과한다(`gearRotationRad`/`trapFloorPhase` 신규 테스트 포함, 기존 테스트 전부 유지).
- `npm run build`(타입체크 + 번들)가 에러 없이 성공한다.
- `npm run dev`에서 스테이지 6을 클리어하면 `level7`("7 — Cogs & Pitfalls")로 진입한다.
- 구간①: 크레스트 대포가 왼쪽으로 주기 발사하며, level6처럼 상승 점프 타이밍으로 회피 가능하다.
- 구간②: 톱니바퀴 추 2개가 각각 지정된 레일을 왕복하며 회전하고, 접촉 시 즉사한다. 실드를 먼저 획득하면 이후 대포 피격을 흡수한다.
- 구간③: 함정 바닥 4개가 각각 "위장 → 경고 깜빡임 → 위장 → 경고 깜빡임 → 바닥 소멸 → 위장 복귀"를 반복하고, 바닥이 사라진 상태에서 그 위에 있으면 낙사한다. 경고 없이 갑자기 사라지지 않는다.
- 구간④: 대포·톱니바퀴 추·함정 바닥이 한 구간에 공존하며 각자의 규칙대로 동작한다.
- 깃발(5140,432)에 닿으면 클리어(승리 화면 또는 다음 스테이지)로 전환된다.
- `level6.ts` 등 기존 레벨 파일은 변경되지 않는다.
- TypeScript 컴파일 오류가 없다.

## 12. 금지사항 (Don'ts)

- 함정 바닥을 **바닥이 있는 평지 위**에 배치하지 말 것 → 밑에 아무 것도 없는 핏(pit) 위에만 배치한다. 그렇지 않으면 "열려도 안 죽는" 버그처럼 보인다.
- 함정 바닥의 낙사를 위해 **새 사망 판정 코드를 추가하지 말 것** → 기존 `player.y > worldHeight + 80` 낙사 판정을 그대로 재사용한다.
- "경고 2번"을 레벨 데이터의 옵션(반복 횟수 파라미터)으로 노출하지 말 것 → 사용자가 명시한 고정 설계이므로 `trapFloorPhase()` 내부에 고정 사이클로 하드코딩한다.
- 톱니바퀴 추에 밟아서 처치하는(스톰프) 판정을 넣지 말 것 → 접촉 즉시 사망만 있다(`Pendulum`과 동일 취급).
- 함정 바닥·톱니바퀴 추 어디에도 `Math.random()`을 쓰지 말 것 → "불규칙해 보이지만 재시작 시 항상 동일"은 레벨 데이터의 `phase` 오프셋으로만 구현한다(기존 G6/G7 결정론 관례).
- 체크포인트/중간 리스폰 시스템을 새로 만들지 말 것 → 이번 스테이지도 죽으면 전체 재시작하는 기존 방식을 그대로 쓴다.
- `level1.ts`~`level6.ts`를 수정하거나 삭제하지 말 것 → `level7`은 순수 추가다.

## 13. 고려사항 (Considerations)

- **점프 도달성**: 최대 점프 높이 ≈ 165px(`config.ts` 주석). 위 좌표들은 level6의 기존 간격(가로 90~190px, 세로 낙차 50~100px)을 참고해 잡았지만, 실제 구현 중 플레이로 검증 필요 — 특히 구간①의 (820→1050) 크레스트 상승 점프.
- **톱니바퀴 추 타이밍**: 왕복 주기가 너무 빠르면 반응 불가능, 너무 느리면 그냥 기다리는 지루한 구간이 된다 → `GEAR.SPEED`/각 인스턴스 `range`를 실제 플레이로 조정.
- **함정 바닥 사이클 길이**: 현재 기본값 기준 한 사이클 ≈ 3.5초(650+450+650+450+1300ms). 4개 함정 바닥에 다른 `phase`를 줬으므로 동시에 여러 개가 열리는 순간과 전부 안전한 순간이 뒤섞여 예측이 어려워진다 — 실제 플레이로 "너무 자주 겹쳐서 통과 불가능한 구간"이 없는지 확인.
- **파이널 건틀릿 난이도**: 3종 해저드가 동시에 존재하는 구간이라 시각적으로 복잡해질 수 있음 → 대포 발사선과 톱니바퀴 추 레일이 서로 다른 고도/타이밍에 있도록 배치해 "동시에 두 곳을 봐야 하는" 순간을 최소화.
- **맵이 2배로 길어짐에 따른 체감 난이도**: 체크포인트가 없으므로 마지막 구간에서 죽으면 처음부터 다시 시작해야 한다 — 의도된 긴장감이지만, 구현 후 전체 클리어 소요 시간이 과도하게 길지 않은지(예: 90초 이내) 실제 플레이로 확인.

## 14. 제약사항 (Constraints)

- 스택 고정: Phaser 4 + TypeScript + Vite. 새 라이브러리 도입 없음.
- 그림은 기존 방식대로 `BootScene`에서 도형으로 절차적 생성(이미지 파일 미사용).
- 색상은 기존 `COLORS` 팔레트(PICO-8 계열)에서 선택.
- 테스트는 Phaser 비의존 순수 로직만 대상(기존 프로젝트 방침 유지) — `Gear`/`TrapFloor` 클래스 자체는 단위 테스트 대상이 아니고, 내부에서 쓰는 `gearRotationRad`/`trapFloorPhase`만 테스트한다.
