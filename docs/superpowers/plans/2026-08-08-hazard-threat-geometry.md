# 해저드 위협 기하 교정 — 구현 플랜

> **작업자 안내:** 이 플랜은 Task를 순서대로 하나씩 실행한다. 각 Task는 실패하는 테스트 → 최소 구현 → 통과 → 커밋 순서를 지킨다. 체크박스(`- [ ]`)로 진행을 추적한다.

**설계 문서:** `docs/superpowers/specs/2026-08-08-hazard-threat-geometry-design.md`

**목표:** 8개 스테이지의 모든 해저드가 가만히 서 있는 주인공을 실제로 죽일 수 있게 교정하고, 같은 문제의 재발을 자동 검사로 막는다.

**접근:** 바닥에 서는 설치물의 좌표 규약을 "딛고 선 표면"으로 통일하고 배치를 공용 함수 하나로 모은다. 판정에 쓰이는 크기를 `config.ts`로 모아 게임과 검사가 같은 값을 본다. 그 위에 순수 기하 검사 모듈을 얹어 8개 스테이지를 전수 검사한다.

**기술 스택:** TypeScript, Phaser 4, Vite, Vitest

---

## 전역 제약 (모든 Task에 적용)

- 좌표·속도·중력은 전부 **논리 단위**다. 화면 크기에 맞춰 곱하지 않는다.
- 튜닝 수치는 `src/config.ts`에 둔다. 오브젝트 클래스에 매직넘버를 쓰지 않는다.
- 시간·기하 로직은 Phaser 의존 없는 순수 함수로 분리하고 `*.test.ts`를 짝짓는다.
- 테스트는 `[Happy]` / `[Boundary]` / `[Error]` 세 카테고리를 모두 포함한다. 예외가 자연스럽게 없는 Task는 사유를 명시한다.
- 스프라이트의 `height`는 **텍스처 픽셀**, `displayHeight`가 **논리 픽셀**이다. 배치·크기 계산에는 반드시 후자를 쓴다.
- 커밋 훅이 `npm run build`와 `npm test`를 돌린다. **실패하는 테스트를 커밋할 수 없으므로**, RED 상태는 커밋 전에 해소한다.
- 작업 위치: 워크트리 `/Users/jaeyoungcho/lab/mega1/.claude/worktrees/hazard-threat-geometry`, 브랜치 `worktree-hazard-threat-geometry`.

## 판정 기준 (전 Task 공통 용어)

| 용어 | 정의 | 지면(496) 기준 |
|---|---|---|
| 표면 | 발판 윗면 y (`platform.y`) | 496 |
| 서있는 몸통 밴드 | `[표면 − PLAYER.BODY_HEIGHT, 표면]` | 458 ~ 496 |
| 위험 밴드 | 해저드 히트박스가 지나는 세로 구간 | 항목별 |

---

## 완료조건 (플랜 전체)

1. `npm test` — 신규 단위테스트와 8개 스테이지 전수 검사를 포함해 전부 통과
2. `npm run build` — 타입체크·번들 통과
3. 8개 스테이지의 모든 해저드가 **설치 검증**(표면 위에 있는가)과 **위협 검증**(서있는 몸통을 맞히는가)을 통과
4. 깃발 8개가 전부 지면에 꽂혀, 걸어가기만 해도 클리어됨
5. `.claude/rules/hazard-must-threaten.md`가 존재하고 `CLAUDE.md`가 이를 가리킴
6. `add-hazard-type` 스킬 문서에 검사 모듈 등록 단계가 추가됨

## 금지사항

- 요청되지 않은 리팩터링을 하지 않는다 — 특히 오디오·카메라·표시 계층은 건드리지 않는다.
- 기존 데드 코드(`POPUP_SPIKE.RISE` 등)를 삭제하지 않는다. 보고만 한다.
- 해저드의 **종류를 늘리거나 줄이지 않는다.** 좌표·범위·배치만 고친다.
- 진자의 **줄 길이·진폭·주기를 바꾸지 않는다.** 매다는 지점(pivot y)만 내린다.
- 발사체에 사정거리 제한 코드를 새로 넣지 않는다. 탄도는 지형으로 끝맺는다.
- 실패하는 테스트를 커밋하지 않는다.

## 고려사항

- **화면 픽셀비 의존성**: 이번 버그의 핵심이다. `height`(텍스처)와 `displayHeight`(논리)를 헷갈리면 레티나에서만 재현되는 버그가 된다.
- **정적 바디 순서**: 화살 발사기는 정적 바디다. 바디 생성 후 옮기면 히트박스가 따라오지 않으므로 **배치를 먼저** 한다.
- **탄도 종결**: 포탄을 가슴 높이로 내리면 사정권이 넓어진다. 주인공 진행 방향(오른쪽)으로 날아가는 탄은 반드시 지형으로 막는다.
- **이동 발판 탑승자**: 탑승자의 몸통은 발판 윗면 기준이다. 지상 보행자와 높이가 달라 한 대포가 둘 다 맞힐 수 없다.
- **통과 가능성**: 위협을 강화하면 통과 불가가 될 수 있다. 설계 문서 10장의 시간 계산을 구현 중 재확인한다.

## 제약사항

- 세로 540은 고정이다. 7스테이지는 천장이 y=0에 있어 여유가 없다.
- 정적 발판만 발사체를 막는다(이동·위장·함정·컨베이어·스프링 발판은 `platforms` 그룹에 들어가지 않는다). 탄도 종결 계산은 정적 발판만 고려해야 한다.
- 새 스테이지는 `src/levels/index.ts`의 배열에 추가만 하면 되므로, 검사는 그 배열을 순회해 자동으로 새 스테이지를 포함해야 한다.

---

## 파일 구조

| 파일 | 신규/수정 | 책임 |
|---|---|---|
| `src/objects/mount.ts` | 신규 | 밑동을 표면에 맞춰 세우는 공용 배치 함수 |
| `src/objects/mount.test.ts` | 신규 | 위 함수 단위테스트 |
| `src/levels/threat.ts` | 신규 | 위협·설치 판정 순수 기하 함수 |
| `src/levels/threat.test.ts` | 신규 | 단위테스트 + 8스테이지 전수 검사 |
| `src/config.ts` | 수정 | 판정에 쓰이는 크기 상수 추가 |
| `src/objects/Player.ts` | 수정 | 히트박스 수치를 config에서 읽음 |
| `src/scenes/BootScene.ts` | 수정 | 텍스처 크기를 config에서 읽음 |
| `src/scenes/GameScene.ts` | 수정 | 가시 히트박스를 config에서 읽음 |
| `src/objects/PopupSpike.ts` | 수정 | 〃 |
| `src/objects/Turret.ts` · `Cannon.ts` · `Shooter.ts` | 수정 | 공용 배치 함수 사용 |
| `src/levels/types.ts` | 수정 | y 의미(표면) 주석 명시 |
| `src/levels/level1~8.ts` | 수정 | 좌표·범위 교정, 발판 2개 신설 |
| `.claude/rules/hazard-must-threaten.md` | 신규 | 규칙 문서 |
| `CLAUDE.md` | 수정 | 규칙을 가리키는 한 줄 |
| `.claude/skills/add-hazard-type/SKILL.md` | 수정 | 검사 모듈 등록 단계 추가 |

---

## Task 1: 공용 배치 함수

**완료조건:** `standOnSurface`가 밑동을 표면에 맞추고, `npm test`가 통과한다.
**스킬 매핑:** test-driven-development → code-review

**Files:**
- Create: `src/objects/mount.ts`, `src/objects/mount.test.ts`

**Interfaces:**
- Produces: `standOnSurface(sprite: { displayHeight: number; setPosition(x, y): unknown }, x: number, surfaceY: number): void`

- [ ] **Step 1: 실패하는 테스트 작성** — `src/objects/mount.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { standOnSurface } from "./mount";

/** 축소된 스프라이트 대역. height(텍스처)와 displayHeight(논리)가 다르다는 점이 핵심이다. */
function spriteAt(displayHeight: number) {
  return {
    displayHeight,
    height: displayHeight * 4, // 텍스처 픽셀 — 배치에 쓰이면 안 되는 값
    x: 0,
    y: 0,
    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    },
  };
}

describe("standOnSurface", () => {
  it("[Happy] 밑동이 표면에 닿도록 중심을 절반 높이만큼 올린다", () => {
    const s = spriteAt(30);
    standOnSurface(s, 600, 496);
    expect(s.x).toBe(600);
    expect(s.y).toBe(481); // 496 - 15
    expect(s.y + s.displayHeight / 2).toBe(496);
  });

  it("[Boundary] 텍스처 높이(height)가 아니라 논리 높이를 쓴다", () => {
    const s = spriteAt(30);
    standOnSurface(s, 0, 400);
    expect(s.y).toBe(385); // 텍스처 높이를 썼다면 340이 된다
  });

  it("[Boundary] 높이가 0이면 표면에 그대로 놓는다", () => {
    const s = spriteAt(0);
    standOnSurface(s, 10, 200);
    expect(s.y).toBe(200);
  });
});
```

> `[Error]` 카테고리 없음 — 외부 호출·IO가 없고 입력이 항상 Phaser 스프라이트인 순수 배치 함수라 자연스러운 예외 케이스가 없다(레포 TDD 규칙의 명시 예외).

- [ ] **Step 2: 실패 확인**

Run: `npm test -- mount`
Expected: FAIL — `Failed to resolve import "./mount"`

- [ ] **Step 3: 최소 구현** — `src/objects/mount.ts`

```ts
/**
 * 바닥에 서는 오브젝트의 배치.
 *
 * 텍스처는 논리 크기의 `TEXTURE_SCALE`배로 생성되고 스프라이트는 그만큼 축소된다
 * (`src/display.ts`). 그래서 스프라이트의 `height`는 텍스처 픽셀이고, 화면에서 차지하는
 * 논리 높이는 `displayHeight`다. 이 둘을 헷갈리면 화면 픽셀비에 따라 오브젝트가 공중에
 * 뜬다 — 실제로 터렛이 레티나에서 45px 떠 있었다.
 *
 * 레벨 데이터의 y는 "딛고 선 표면"이므로 배치는 항상 이 함수를 통한다.
 */

/** 이 모듈이 쓰는 부분만 — Phaser import 없이 정적·동적 바디 스프라이트를 모두 받는다. */
type Standable = {
  displayHeight: number;
  setPosition(x: number, y: number): unknown;
};

/** 스프라이트의 밑동이 `surfaceY`에 닿도록 세운다(원점이 중앙인 스프라이트 기준). */
export function standOnSurface(sprite: Standable, x: number, surfaceY: number): void {
  sprite.setPosition(x, surfaceY - sprite.displayHeight / 2);
}
```

- [ ] **Step 4: 통과 확인** — `npm test -- mount` → PASS (3개)
- [ ] **Step 5: 커밋**

```bash
git add src/objects/mount.ts src/objects/mount.test.ts
git commit -m "feat(objects): add a shared surface-mounting helper"
```

---

## Task 2: 판정 수치를 config로 중앙화

**완료조건:** 크기 상수가 `config.ts`에만 존재하고, `npm test`·`npm run build`가 통과하며 **게임 동작은 변하지 않는다**.
**스킬 매핑:** code-review

**Files:**
- Modify: `src/config.ts`, `src/objects/Player.ts`, `src/scenes/BootScene.ts`, `src/scenes/GameScene.ts`, `src/objects/PopupSpike.ts`

**Interfaces:**
- Produces: `PLAYER.BODY_WIDTH/BODY_HEIGHT`, `PROJECTILE.WIDTH/HEIGHT`, `SHOOTER.WIDTH/HEIGHT`, `TURRET.WIDTH/HEIGHT`, `CANNON.WIDTH/HEIGHT/BALL_DIAMETER`, `SPIKE.BODY_WIDTH/BODY_HEIGHT/BODY_OFFSET_X/BODY_OFFSET_Y`

- [ ] **Step 1: config에 상수 추가**

```ts
// PLAYER 블록에 추가
  /** 히트박스 크기(논리 단위). 스프라이트(28x40)보다 조금 작아 빠듯한 점프가 관대해진다. */
  BODY_WIDTH: 24,
  BODY_HEIGHT: 38,

// PROJECTILE 블록에 추가 — 위협 판정이 이 크기를 읽는다
  WIDTH: 22,
  HEIGHT: 10,

// SHOOTER 블록에 추가
  WIDTH: 26,
  HEIGHT: 34,

// TURRET 블록에 추가
  WIDTH: 34,
  HEIGHT: 30,

// CANNON 블록에 추가
  WIDTH: 40,
  HEIGHT: 30,
  BALL_DIAMETER: 16,

// 새 블록 (TILE 근처)
/** 가시 히트박스 — 32px 타일 중 뾰족한 아랫부분만 판정에 쓴다(고정 가시·팝업 가시 공용). */
export const SPIKE = {
  BODY_WIDTH: 28,
  BODY_HEIGHT: 18,
  BODY_OFFSET_X: 2,
  BODY_OFFSET_Y: 14,
} as const;
```

- [ ] **Step 2: 사용처를 상수로 교체**

| 파일 | 지금 | 바뀐 뒤 |
|---|---|---|
| `Player.ts` | `setLogicalBodySize(this, 24, 38)` | `setLogicalBodySize(this, PLAYER.BODY_WIDTH, PLAYER.BODY_HEIGHT)` |
| `BootScene.makeProjectileTexture` | `const w = 22; const h = 10;` | `PROJECTILE.WIDTH / .HEIGHT` |
| `BootScene.makeShooterTexture` | `const w = 26; const h = 34;` | `SHOOTER.WIDTH / .HEIGHT` |
| `BootScene.makeTurretTexture` | `const w = 34; const h = 30;` | `TURRET.WIDTH / .HEIGHT` |
| `BootScene.create` | `makeRectTexture(TEX.CANNON, 40, 30, ...)` | `CANNON.WIDTH, CANNON.HEIGHT` |
| `BootScene.makeCannonballTexture` | `const d = 16;` | `CANNON.BALL_DIAMETER` |
| `GameScene.buildSpikes` | `body.setSize(28, 18).setOffset(2, 14)` | `SPIKE.BODY_*` |
| `PopupSpike` 생성자 | `setLogicalBodySize(t, 28, 18)` / `setLogicalBodyOffset(t, 2, 14)` | `SPIKE.BODY_*` |

- [ ] **Step 3: 회귀 확인** — `npm test` PASS(126) · `npm run build` 성공. 값이 그대로이므로 동작 변화 없음.
- [ ] **Step 4: 커밋**

```bash
git add src/config.ts src/objects/Player.ts src/scenes/BootScene.ts src/scenes/GameScene.ts src/objects/PopupSpike.ts
git commit -m "refactor(config): centralise the sizes hazard judgement depends on"
```

---

## Task 3: 위협 판정 모듈

**완료조건:** `threat.ts`의 순수 함수들이 단위테스트를 통과한다(전수 검사는 Task 4·5에서 붙인다).
**스킬 매핑:** test-driven-development → code-review

**Files:**
- Create: `src/levels/threat.ts`, `src/levels/threat.test.ts`

**Interfaces:**
- Consumes: Task 2의 config 상수
- Produces:

```ts
export type Band = { top: number; bottom: number };
export type Surface = { top: number; low: number; left: number; right: number };

export function standingBand(surface: Surface): Band;
export function bandsOverlap(a: Band, b: Band): boolean;
export function surfacesOf(platforms: PlatformDef[]): Surface[];
export function mountedOn(platforms: PlatformDef[], x: number, surfaceY: number): boolean;
export function laneEnd(level: LevelDef, fromX: number, dir: -1 | 1, band: Band): number;
export function hazardThreat(level: LevelDef, h: HazardDef): { band: Band; left: number; right: number } | null;
export function threatensStandingPlayer(level: LevelDef, h: HazardDef): boolean;
export function mountSurfaceOf(h: HazardDef): number | null;
```

- [ ] **Step 1: 실패하는 테스트 작성** (`[Happy]`·`[Boundary]`·`[Error]` 각각 포함)

핵심 케이스:
- `[Happy]` 표면 496의 서있는 밴드는 458~496이다
- `[Happy]` 지면에 세운 대포의 포탄 밴드(473~489)가 서있는 밴드와 겹친다
- `[Boundary]` 밴드가 1px만 겹쳐도 겹침으로 본다 / 딱 맞닿으면(457~458) 겹치지 않는다
- `[Boundary]` 이동 발판의 표면은 왕복 범위만큼 넓다
- `[Boundary]` 왕복 범위 0인 톱니는 제자리 원이다
- `[Boundary]` 조준형 터렛은 위협 판정 대상이 아니다(`hazardThreat`가 null)
- `[Error]` 발판이 없는 x·y에 설치하면 `mountedOn`이 false
- `[Error]` 알 수 없는 해저드 종류는 `hazardThreat`가 null을 돌려주고 예외를 던지지 않는다

- [ ] **Step 2: 실패 확인** — `npm test -- threat` → FAIL
- [ ] **Step 3: 구현** — 종류별 위험 밴드 계산은 다음 표를 그대로 코드로 옮긴다

| 종류 | 위험 밴드 | x 범위 |
|---|---|---|
| pendulum | `[y + L·cos(진폭) − R, y + L + R]` | `x ± (L·sin(진폭) + R)` |
| gear | `[y − R, y + (수직?범위:0) + R]` | `[x − R, x + (수평?범위:0) + R]` |
| thwomp | `[y + 낙하거리, y + 낙하거리 + 높이]` | `[x, x + 폭]` |
| popupSpike | `[y − TILE + OFFSET_Y, y − TILE + OFFSET_Y + BODY_HEIGHT]` | `[x, x + 타일수·TILE]` |
| arrowShooter | 총구 `y − SHOOTER.HEIGHT/2` ± `PROJECTILE.HEIGHT/2` | 총구에서 `laneEnd`까지 |
| turret(fixed) | 총구 `y − TURRET.HEIGHT` ± `PROJECTILE.HEIGHT/2` | 〃 |
| turret(aim) | — (판정 제외) | — |
| cannon | 포탄 `y − CANNON.HEIGHT/2` ± `BALL_DIAMETER/2` | 〃 |

`laneEnd`는 **정적 발판만** 고려한다(`type`이 없거나 `"static"`). 이동·위장·함정·컨베이어·스프링 발판은 발사체를 막지 않는다.

- [ ] **Step 4: 통과 확인** — `npm test -- threat` → PASS
- [ ] **Step 5: 커밋**

```bash
git add src/levels/threat.ts src/levels/threat.test.ts
git commit -m "feat(levels): add pure threat-geometry judgement for hazards"
```

---

## Task 4: 설치 검증 — 모든 설치물을 표면에 세운다

**완료조건:** 전 스테이지의 바닥 설치물과 깃발이 실제 발판 윗면에 놓이고, 설치 검증 전수 테스트가 통과한다.
**스킬 매핑:** test-driven-development → code-review

**Files:**
- Modify: `src/objects/Turret.ts`, `src/objects/Cannon.ts`, `src/objects/Shooter.ts`, `src/levels/types.ts`, `src/levels/level1~8.ts`, `src/levels/threat.test.ts`

- [ ] **Step 1: 설치 검증 전수 테스트를 threat.test.ts에 추가** — 8스테이지 순회, 터렛·대포·화살 발사기·팝업 가시·깃발이 실제 발판 윗면에 있는지
- [ ] **Step 2: 실패 확인** — `npm test -- threat` → 깃발 8건 + 대포 6건 + 화살 2건 + 고정 터렛 1건 실패
- [ ] **Step 3: 코드 3곳을 공용 배치 함수로 전환**

```ts
// Turret.ts — this.setPosition(x, y - this.height / 2) 를 교체
standOnSurface(this, x, y);

// Cannon.ts — 생성자 끝에 추가
standOnSurface(this, def.x, def.y);

// Shooter.ts — 정적 바디 생성 '전에' 배치해야 히트박스가 따라온다
this.setScale(1 / TEXTURE_SCALE);
standOnSurface(this, x, y);
scene.add.existing(this);
scene.physics.add.existing(this, true);
```

- [ ] **Step 4: 레벨 데이터 좌표 교정**

| 스테이지 | 항목 | 지금 | 바뀐 뒤 |
|---|---|---|---|
| 1~8 | 깃발 | `y: 432` | `y: 496` |
| 4 | 화살 발사기 | `(1770, 452)` | `(1770, 496)` |
| 7 | 화살 발사기 | `(3070, 452)` | `(3070, 496)` |
| 5 | 고정형 터렛 | `(600, 400)` | `(600, 496)` |
| 6 | 정상 대포 | `(1270, 205)` | `(1270, 220)` |
| 6 | 지상 대포 | `(2360, 452)` | `(2360, 496)` |
| 6 | 저지 기둥 | — | 발판 신설 `{ x: 2040, y: 452, width: 24, height: 44 }` |
| 7 | 이동발판 대포 | `(4380, 452)` | `(4320, 452)` + 받침대 신설 `{ x: 4300, y: 452, width: 40, height: 44 }` |
| 7 | 지상 대포 | `(5180, 452)` | `(5180, 496)` |
| 8 | 1구역 대포 | `(1060, 245)` | `(1060, 260)` |
| 8 | 4구역 대포 | `(4960, 452)` | `(4960, 496)` |

`types.ts`의 `TurretDef`·`CannonDef`·`ShooterDef`·`LevelDef.goal` 주석에 "y는 딛고 선 표면"을 명시한다.

- [ ] **Step 5: 통과 확인** — `npm test` PASS · `npm run build` 성공
- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "fix(hazards): stand every mounted hazard and the flag on its surface"
```

---

## Task 5: 위협 검증 — 남은 해저드 교정

**완료조건:** 8스테이지의 모든 해저드가 위협 검증을 통과한다.
**스킬 매핑:** test-driven-development → code-review

**Files:**
- Modify: `src/levels/threat.test.ts`, `src/levels/level3.ts`, `src/levels/level6.ts`, `src/levels/level7.ts`, `src/levels/level8.ts`

- [ ] **Step 1: 위협 검증 전수 테스트 추가** — 각 해저드의 위험 밴드가 걸치는 x 범위 안 어떤 표면의 서있는 밴드와 겹치는지
- [ ] **Step 2: 실패 확인** — 하늘 대포 2건 + 진자 3건 + 수평 톱니 1건 실패
- [ ] **Step 3: 좌표 교정**

| 스테이지 | 항목 | 지금 | 바뀐 뒤 | 근거 |
|---|---|---|---|---|
| 6 | 정상 대포 x | `1270` | `1340` | 포탄이 정상 발판(1260~1360) 위를 훑는다 |
| 8 | 1구역 대포 x | `1060` | `1140` | 포탄이 정상 발판(1050~1160) 위를 훑는다 |
| 3 | 진자 피벗 y | `250` | `280` | 머리 최저점 436 → 466 (몸통 8px 침범) |
| 7 | 진자1 피벗 y | `250` | `270` | 446 → 466 |
| 7 | 진자2 피벗 y | `260` | `300` | 426 → 466 |
| 8 | 수평 톱니 | `x: 1860, range: 100` | `x: 1790, range: 170` | 왕복 구간이 방패 발판(1760~1860)을 덮는다 |

- [ ] **Step 4: 통과 확인** — `npm test` PASS · `npm run build` 성공
- [ ] **Step 5: 통과 가능성 재검증** — 설계 문서 10장의 표를 실제 값으로 재계산해 안전 창 > 통과 소요인지 확인
- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "fix(hazards): retune pendulums, gears and crest cannons to reach a standing player"
```

---

## Task 6: 규칙 문서화

**완료조건:** 규칙 파일이 존재하고, `CLAUDE.md`와 `add-hazard-type` 스킬이 이를 반영한다.
**스킬 매핑:** writing-skills(문서 형식 참고)

**Files:**
- Create: `.claude/rules/hazard-must-threaten.md`
- Modify: `CLAUDE.md`, `.claude/skills/add-hazard-type/SKILL.md`

- [ ] **Step 1: 규칙 파일 작성** — 설계 문서 8장의 5개 항목
- [ ] **Step 2: `CLAUDE.md` "게임 로직 관례"에 한 줄 추가**
- [ ] **Step 3: `add-hazard-type` 스킬에 단계 추가** — 새 해저드는 `threat.ts`의 위험 밴드 계산에도 등록하고 전수 검사를 통과시킨다
- [ ] **Step 4: 커밋**

```bash
git add .claude CLAUDE.md
git commit -m "docs(hazards): require every hazard to threaten a standing player"
```

---

## Task 7: 최종 검증

**완료조건:** 아래 4개가 모두 확인된다.
**스킬 매핑:** verification-before-completion → code-review → ce-code-review

- [ ] **Step 1:** `npm test` — 전부 통과, 전수 검사 포함
- [ ] **Step 2:** `npm run build` — 타입체크·번들 통과
- [ ] **Step 3:** 수정 전/후 대비표를 실제 코드로 산출해 9개 결함이 모두 해소됐는지 확인
- [ ] **Step 4:** 코드 리뷰 → 주요 결함 0건이 될 때까지 수정
- [ ] **Step 5:** 사용자용 수동 확인 안내 작성 (`?stage=N` 링크와 확인 항목)

---

## Self-Review 결과

- **명세 커버리지**: 설계 문서 5~9장의 모든 항목이 Task 1~6에 매핑됨. 10장(통과 가능성)은 Task 5 Step 5, 12장(완료조건)은 Task 7.
- **자리표시자**: 없음. 모든 좌표는 확정값.
- **타입 일관성**: `standOnSurface`(Task 1) → Task 4에서 동일 시그니처로 사용. `Band`/`Surface`(Task 3) → Task 4·5 테스트에서 동일 이름 사용.
- **범위**: 단일 구현 플랜으로 적절. 하위 분해 불필요.
