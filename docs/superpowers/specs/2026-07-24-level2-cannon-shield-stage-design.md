# level2 스테이지 설계 — 대포 관문과 방패

작성일: 2026-07-24

## 1. 개요 (무엇을 / 왜)

기존 플랫포머(Phaser 4 + TypeScript)에 두 번째 스테이지 `level2`를 추가한다.
`level1`을 잇는 **조금 더 어려운 정통 후속** 스테이지이며, 두 가지 새 요소를 도입한다:

- **좁은 발판 정밀 점프** — 발판 폭을 `level1`(160~200px)보다 좁게(90~120px) 만들어 점프 정확도를 요구한다.
- **대포와 방패** — 대포가 대포알을 직선으로 발사하고, 플레이어는 방패 아이템으로 대포알을 최대 3회까지 막는다.

새 요소를 도입하므로, 기존의 "레벨은 데이터만 추가하면 된다"는 범위를 넘어 **새 오브젝트(대포·대포알·방패)의 코드와 그림**이 필요하다.

게임에 실제로 `level2`가 나오게 하는 배선 방식은 **최소 교체**로 한다: `GameScene`이 읽는 레벨을 `level1` → `level2`로 바꾼다. `level1.ts` 파일은 지우지 않고 그대로 둔다(나중에 스테이지 진행 시스템을 붙일 때 재사용).

## 2. 게임 규칙 (확정)

| 항목 | 결정 |
|------|------|
| 대포 발사 | 일정 간격(기본 1.5초)마다 **왼쪽(플레이어가 오는 방향)으로 수평 발사** |
| 대포알 | 등속 수평 이동, 중력 없음, 벽(발판)에 닿거나 월드 밖으로 나가면 소멸 |
| 대포 본체 | **접촉해도 무해** — 부딪히거나 밟아도 죽지 않음. 대포알만 치명적 |
| 방패 획득 | 방패 아이템을 밟으면(overlap) 획득, 충전 3회로 시작 |
| 방패 방어 | **자동 방어** — 대포알이 플레이어에 닿으면 별도 조작 없이 자동으로 1회 막고 충전 1 감소(3→2→1→0), 0이 되면 방패 소멸 |
| 방패 적용 범위 | **대포알만** 막는다. 적·가시·구멍(pit)은 방패와 무관하게 기존대로 즉사 |
| 방패 없이 피격 | 대포알에 맞으면 즉사(기존 사망 처리 재사용) |
| 방패는 공용 자원 | 방패 1개(3회)로 스테이지의 두 대포를 모두 감당 → 충전을 어디에 쓸지 관리하는 재미 |

## 3. 레벨 레이아웃

세계 크기: 가로 2600px, 세로 540px (세로는 `level1`과 동일). 좌표는 모두 월드 픽셀.
발판은 왼쪽 위 모서리 (x, y) + 크기로 표기한다.

### 지형(발판)

| 종류 | x | y | width | height | 비고 |
|------|---|---|-------|--------|------|
| 땅 | 0 | 496 | 680 | 44 | 시작 땅 |
| (구멍) | 680 | – | 120 | – | PIT1 (빠지면 사망) |
| 땅 | 800 | 496 | 1080 | 44 | 중앙 땅 |
| (구멍) | 1880 | – | 100 | – | PIT2 |
| 땅 | 1980 | 496 | 620 | 44 | 종반 땅 (대포1·깃발) |
| 공중발판 | 340 | 380 | 110 | 24 | |
| 공중발판 | 620 | 330 | 90 | 24 | 좁음 |
| 공중발판 | 900 | 360 | 110 | 24 | 적 순찰 |
| 공중발판 | 1080 | 270 | 100 | 24 | **방패 위치** |
| 공중발판 | 1260 | 220 | 100 | 24 | 정점 · **대포2 위치** |
| 공중발판 | 1440 | 300 | 110 | 24 | |
| 공중발판 | 1700 | 380 | 110 | 24 | 적 순찰 |
| 공중발판 | 2100 | 330 | 120 | 24 | 종반 |

### 오브젝트

| 오브젝트 | 좌표 | 비고 |
|---------|------|------|
| 플레이어 시작 | x 80, y 400 | |
| 적 | (960, 346) | 발판 900 위 순찰 |
| 적 | (1300, 482) | 중앙 땅 순찰 |
| 적 | (1750, 366) | 발판 1700 위 순찰 |
| 가시 | (1000, 472), 2타일 | 중앙 땅 |
| 가시 | (1500, 472), 2타일 | 중앙 땅 |
| **방패 아이템** | (1120, 250) | 발판 1080 위 — 하늘 초소(대포2) 직전 |
| **대포2 (하늘)** | 발사원 (1270, 205), 왼쪽 | 정점 발판 왼쪽 끝. 사격선 y≈206은 정밀 점프 루트를 위협 |
| **대포1 (종반)** | 발사원 (2360, 452), 왼쪽 | 종반 땅. 사격선 y≈452는 달려오는 플레이어를 위협 |
| 깃발(목표) | (2540, 432) | 대포1 너머 |

> 위 두 표(지형·오브젝트)의 좌표가 레이아웃의 기준이다(자체 완결). 브레인스토밍 단계의 시각 목업은 설계 보조였을 뿐 별도로 읽지 않아도 된다.

### 의도한 플레이 흐름

1. 시작~PIT1: 좁은 발판 계단으로 첫 구멍을 넘는다.
2. 중앙: 적·가시를 정밀 점프로 통과. 발판 1080에서 **방패 획득(3회)**.
3. 하늘 초소(대포2): 발판 1080→정점(1260) **상승 점프 중** 대포2 사격선을 가로지른다. 타이밍으로 회피하거나, 실수하면 방패가 흡수(충전 1 소모). 정점에 착지한 뒤·하강할 때는 안전.
4. PIT2 넘어 종반: 대포1이 왼쪽으로 발사. 남은 방패 충전으로 버티며 대포를 지나 **깃발**에 도달 → 클리어.

## 4. 아키텍처 — 생성/수정 파일

모든 경로는 실제 존재를 확인함(2026-07-24 기준).

### 새로 만드는 파일

| 파일 | 역할 |
|------|------|
| `src/levels/types.ts` | 공유 타입(`Vec2`, `PlatformDef`, `SpikeDef`, `CannonDef`, `LevelDef`)을 여기로 이동 |
| `src/levels/level2.ts` | `level2` 레벨 데이터 |
| `src/objects/Cannon.ts` | 대포. 주기적으로 대포알을 생성. 본체는 무해 |
| `src/objects/Cannonball.ts` | 대포알. 등속 수평 이동, 소멸 관리 |
| `src/objects/ShieldItem.ts` | 방패 아이템 픽업 |
| `src/objects/shield.ts` | 방패 내구도 계산 순수 함수(Phaser 비의존, 테스트 대상) |
| `src/objects/shield.test.ts` | `shield.ts` 단위 테스트 |

### 고치는 파일

| 파일 | 변경 |
|------|------|
| `src/levels/level1.ts` | 타입 정의를 `types.ts`로 옮기고 거기서 import (데이터 값은 그대로) |
| `src/levels/patrol.ts` | `PlatformDef` import 경로를 `./types`로 변경 |
| `src/config.ts` | `CANNON`, `SHIELD` 튜닝 값, `COLORS`·`TEX`에 대포·대포알·방패 항목 추가 |
| `src/scenes/BootScene.ts` | 대포·대포알·방패 텍스처 생성 추가 |
| `src/scenes/GameScene.ts` | 읽는 레벨을 `level2`로 변경 + 대포·대포알·방패·방패HUD 배선 |
| `src/objects/Player.ts` | 방패 상태(`shieldCharges`)와 획득/흡수 메서드·시각효과 추가 |

> **타입 분리 이유**: 현재 `LevelDef` 등 타입이 `level1.ts`에 있어 `level2`·`patrol`이 `level1`을 import하는 어색한 결합이 있다. 레벨을 하나 더 추가하는 김에 타입만 `types.ts`로 분리하는 낮은 위험의 정리다.

## 5. 데이터 구조

`cannons`·`shields`는 **선택 필드**로 추가한다 → `level1`은 이 필드 없이도 유효하고, `GameScene`은 없으면 빈 배열로 처리한다.

```typescript
// src/levels/types.ts
export interface Vec2 { x: number; y: number; }

export interface PlatformDef { x: number; y: number; width: number; height: number; }

export interface SpikeDef { x: number; y: number; tiles: number; } // 32px 타일 개수

export interface CannonDef {
  x: number;              // 대포알이 생성되는 발사원 x
  y: number;              // 발사원 y (= 사격선 높이)
  direction: "left" | "right";
  intervalMs?: number;    // 미지정 시 CANNON.FIRE_INTERVAL_MS
}

export interface LevelDef {
  worldWidth: number;
  worldHeight: number;
  playerSpawn: Vec2;
  platforms: PlatformDef[];
  enemies: Vec2[];
  spikes: SpikeDef[];
  goal: Vec2;
  cannons?: CannonDef[];  // 없으면 대포 없음
  shields?: Vec2[];       // 방패 아이템 스폰 위치들
}
```

## 6. 새 오브젝트 설계

기존 오브젝트(`Player`/`Enemy`/`Goal`)는 모두 `Phaser.Physics.Arcade.Sprite`를 상속하고, 생성자에서 `scene.add.existing(this)` + `scene.physics.add.existing(this)`를 호출한다. 새 오브젝트도 이 패턴을 따른다.

### Cannon (`src/objects/Cannon.ts`)
- `Phaser.Physics.Arcade.Sprite` 상속. `Goal`처럼 `setAllowGravity(false)`, `setImmovable(true)`.
- **본체는 무해**: 플레이어와 충돌/overlap 처리를 걸지 않는다(그냥 그림). → "밟아도 죽지 않음" 보장.
- 생성 시 `direction`, `intervalMs`, 대포알을 담을 그룹 참조를 받는다.
- `update(time)`: 마지막 발사 후 `intervalMs`가 지났으면 발사원 좌표에 `Cannonball`을 하나 생성해 그룹에 넣고 속도를 부여한다.

### Cannonball (`src/objects/Cannonball.ts`)
- `Phaser.Physics.Arcade.Sprite` 상속. `setAllowGravity(false)`.
- 생성 시 방향에 따라 `setVelocityX(±CANNON.BALL_SPEED)`.
- 소멸: (a) 발판과 충돌 시, (b) 월드 밖(x < -margin 또는 x > worldWidth + margin)일 때. `GameScene`이 그룹 단위로 관리한다.

### ShieldItem (`src/objects/ShieldItem.ts`)
- `Goal`과 동일한 정적 픽업 패턴(`setAllowGravity(false)`, `setImmovable(true)`).
- 플레이어와 overlap 시 `player.giveShield()` 호출 후 자신을 `destroy()`.

### Player 방패 상태 (`src/objects/Player.ts` 수정)
- 필드 `shieldCharges: number = 0`.
- `giveShield(): void` — 충전을 `SHIELD.MAX_CHARGES`로 채운다(이미 있으면 재충전).
- `absorbHit(): boolean` — 순수 함수 `shield.absorbHit()`로 다음 상태를 계산해 `shieldCharges`에 반영하고, 막았는지 여부를 반환.
- 시각효과: 방패 보유 중 플레이어를 따라다니는 반투명 링(별도 스프라이트/그래픽). `die()`가 `setTint`를 쓰므로 방패 표시는 tint가 아닌 별도 오브젝트로 구현해 충돌을 피한다.
- 충전 표시는 HUD 텍스트(예: `Shield: ● ● ●`)로도 노출.

## 7. 실행 흐름 (GameScene)

```
create():
  this.level = level2
  기존: 발판/가시/적/플레이어/깃발 생성 + 물리 배선
  추가:
    - cannonballs = physics group
    - buildCannons(): level.cannons?.forEach → new Cannon(..., cannonballs 그룹)
    - buildShields(): level.shields?.forEach → new ShieldItem; overlap(player, item) → player.giveShield(), item.destroy()
    - collider(cannonballs, platforms) → 대포알 소멸
    - overlap(player, cannonballs) → handleCannonballHit(ball)
    - 방패 HUD 텍스트 생성

update(time):
  기존: player.update / enemies.update / 바닥 낙하 사망 체크
  추가:
    - cannons.forEach(c => c.update(time))    // 주기 도래 시 발사
    - 화면 밖 대포알 소멸
    - 방패 HUD 갱신(shieldCharges)

handleCannonballHit(ball):
  if ending or player.dead: return
  if player.shieldCharges > 0:
      player.absorbHit()     // 충전 1 감소, 0 되면 링 제거
      ball.destroy()         // 프레임당 1개 처리(아래 고려사항)
  else:
      ball.destroy()
      handleDeath()          // 기존 사망 경로 재사용
```

## 8. 테스트 (TDD)

`patrol.ts`처럼 방패 내구도 계산을 Phaser 없는 순수 함수로 분리해 테스트한다.

```typescript
// src/objects/shield.ts
export function absorbHit(charges: number): { charges: number; blocked: boolean };
// charges > 0 → { charges: charges - 1, blocked: true }
// charges <= 0 → { charges: 0, blocked: false }
```

`src/objects/shield.test.ts` 필수 케이스:

| 카테고리 | 케이스 | 기대 |
|---------|--------|------|
| `[Happy]` 정상 | `absorbHit(3)` | `{ charges: 2, blocked: true }` |
| `[Boundary]` 경계 | `absorbHit(1)` | `{ charges: 0, blocked: true }` (마지막 방어) |
| `[Boundary]` 경계 | `absorbHit(0)` | `{ charges: 0, blocked: false }` (방패 없음) |
| `[Boundary]` 경계 | `absorbHit(-1)` | `{ charges: 0, blocked: false }` (음수 방어) |
| `[Error]` 예외 | 없음 — 순수 산술이라 외부 의존/IO가 없어 예외 케이스 부재(사유 명시). 경계 케이스가 falsy/음수 분기를 모두 덮음 |

기존 테스트(`src/levels/patrol.test.ts`)는 타입 import 경로 변경 후에도 통과해야 한다.

## 9. 완료조건 (Completion Criteria)

- `npm test`가 전부 통과한다(신규 `shield.test.ts` 포함, 기존 `patrol.test.ts` 유지).
- `npm run dev`로 게임을 켜면 시작 시 `level2`가 로드된다.
- 대포2(하늘)가 왼쪽으로 주기 발사하고, 상승 점프 타이밍으로 회피할 수 있다.
- 발판 1080에서 방패를 획득하면 HUD에 충전 3이 표시된다.
- 대포알에 맞을 때: 방패가 있으면 흡수하며 충전이 1 줄고, 없으면 사망 화면으로 전환된다.
- 대포 본체에 부딪히거나 올라서도 죽지 않는다.
- 대포1을 지나 깃발에 닿으면 클리어(승리 화면) 전환된다.
- `level1.ts`는 삭제되지 않고 존재한다.
- TypeScript 컴파일 오류가 없다.

## 10. 금지사항 (Don'ts)

- `level1.ts`를 삭제하거나 데이터를 덮어쓰지 말 것 → 파일은 보존하고 `GameScene`이 읽는 대상만 바꾼다.
- 대포 본체에 사망 판정을 걸지 말 것 → 대포알(발사체)에만 사망/방어 판정을 건다.
- 방패로 적·가시·구멍까지 막게 하지 말 것 → 방패는 대포알 전용이다.
- 대포알을 생성만 하고 소멸시키지 않는 구현 금지 → 화면 밖·발판 충돌 시 반드시 `destroy()` 한다(객체 누수 방지).
- `LevelDef`의 `cannons`/`shields`를 필수 필드로 만들지 말 것 → 선택 필드로 두어 `level1`이 깨지지 않게 한다.
- 점프로 넘을 수 없는 세로 간격을 배치하지 말 것(아래 제약 참고).

## 11. 고려사항 (Considerations)

- **점프 높이 제약**: 최대 점프 높이 ≈ 165px(`config.ts` 주석). 좁은 발판이라도 인접 발판 간 세로 간격이 이를 넘으면 클리어 불가 → 구현 중 실제 플레이로 도달성 검증.
- **한 프레임 다중 피격**: 대포알 여러 개가 같은 프레임에 겹치면 방패가 한 번에 여러 개 소모될 수 있다 → `handleCannonballHit`에서 프레임당 1개만 처리하거나 짧은 무적 시간을 둔다.
- **방패 밸런스**: 방패 3회로 대포2(회피 가능)와 대포1(버티기)을 모두 감당한다. 발사 간격·노출 거리(방패→대포 거리)를 실제 플레이로 조정한다.
- **경로 선택**: 방패는 하늘 경로(발판) 상에 있으므로, 지면 경로로 대포2를 피해 가면 방패를 못 얻고 종반 대포1을 무방패로 맞는 위험/보상 선택이 생긴다(의도된 창발). 방패를 필수로 만들려면 발판 간격을 조정해 지면 경로를 막는다 — 실제 플레이로 결정.
- **시각 피드백**: 방패 흡수·소멸 시 짧은 플래시로 상태 변화를 알린다.

## 12. 제약사항 (Constraints)

- 스택 고정: Phaser 4 + TypeScript + Vite. 새 라이브러리 도입 없음.
- 그림은 기존 방식대로 `BootScene`에서 도형으로 절차적 생성(이미지 파일 미사용).
- 색상은 기존 `COLORS` 팔레트(PICO-8 계열)에서 선택.
- 테스트는 Phaser 비의존 순수 로직만 대상(기존 프로젝트 방침 유지).
