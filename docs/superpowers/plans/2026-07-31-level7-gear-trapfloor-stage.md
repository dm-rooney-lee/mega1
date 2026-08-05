---
type: feat
origin: docs/superpowers/specs/2026-07-31-level7-gear-trapfloor-stage-design.md
---

# level7 스테이지 (톱니바퀴 추 + 함정 바닥) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new stage `level7` (worldWidth 5200, double `level6`'s 2600) that reuses `level6`'s cannon/shield idea and introduces two brand-new hazards — a moving+spinning "Gear" and an auto-cycling disguised "TrapFloor" — across four escalating zones, with no checkpoint system.

**Architecture:** Two new hazard classes (`Gear`, `TrapFloor`) follow the existing time-driven-hazard pattern (`Pendulum`, `PopupSpike`, `CrumblingPlatform`): each has a pure, Phaser-free motion/logic function in `src/levels/motion.ts` (unit tested) and a thin Phaser wrapper class that calls it every frame. Both are wired into `GameScene` the same way every other hazard/platform type already is — a `kind`/`type` field in the level data, a `switch` branch in `buildHazard()`/`buildPlatforms()`, a per-frame `update()` call, and a physics collider/overlap. `TrapFloor` deliberately introduces no new death logic — falling through it is caught by the existing fall-off-the-world check.

**Tech Stack:** Phaser 4 + TypeScript + Vite (unchanged). Vitest for unit tests. No new dependencies.

## 완료조건 (Completion Criteria)

- `npm test`가 전부 통과한다 (`gearRotationRad`/`trapFloorPhase` 신규 테스트 포함, 기존 테스트 전부 유지) — 검증: `npm test`
- `npm run build`(타입체크 + 번들)가 에러 없이 성공한다 — 검증: `npm run build`
- `npm run dev`에서 스테이지 6을 클리어하면 `level7`("7 — Cogs & Pitfalls")로 진입한다.
- 구간①: 크레스트 대포가 왼쪽으로 주기 발사하며 상승 점프 타이밍으로 회피 가능하다.
- 구간②: 톱니바퀴 추 2개가 각각 지정된 레일을 왕복하며 회전하고, 접촉 시 즉사한다. 실드를 먼저 획득하면 이후 대포 피격을 흡수한다.
- 구간③: 함정 바닥 4개가 각각 "위장 → 경고 깜빡임 → 위장 → 경고 깜빡임 → 바닥 소멸 → 위장 복귀"를 반복하고, 바닥이 사라진 상태에서 그 위에 있으면 낙사한다. 경고 없이 갑자기 사라지지 않는다.
- 구간④: 대포·톱니바퀴 추·함정 바닥이 한 구간에 공존하며 각자의 규칙대로 동작한다.
- 깃발(5140,432)에 닿으면 클리어(승리 화면 또는 다음 스테이지)로 전환된다.
- `level1.ts`~`level6.ts` 등 기존 레벨 파일은 변경되지 않는다.

## 금지사항 (Don'ts)

- `Math.random()`을 쓰지 말고, 레벨 데이터의 `phase` 오프셋으로 "불규칙해 보이지만 재시작 시 항상 동일"하게 만들 것 — G6/G7 결정론 관례.
- 튜닝 수치(속도·지속시간·반지름 등)를 오브젝트 클래스에 매직넘버로 박지 말고, `src/config.ts`의 `GEAR`/`TRAP_FLOOR` 상수로 정의할 것 (`.claude/rules/no-hardcoded-tuning.md`).
- 시간/기하 기반 해저드 로직을 클래스 안에 직접 쓰지 말고, `src/levels/motion.ts`의 Phaser 비의존 순수 함수 + `motion.test.ts` 테스트로 분리할 것 (`.claude/rules/pure-logic-testing.md`).
- "경고 2번"을 레벨 데이터의 옵션(반복 횟수 파라미터)으로 노출하지 말고, `trapFloorPhase()` 내부에 고정 사이클로 하드코딩할 것 — 사용자가 명시한 고정 설계.
- 함정 바닥의 낙사를 위해 새 사망 판정 코드를 추가하지 말고, 기존 `player.y > worldHeight + 80` 낙사 판정을 그대로 재사용할 것.
- 톱니바퀴 추에 밟아서 처치하는(스톰프) 판정을 넣지 말고, 접촉 즉시 사망만 둘 것(`Pendulum` 머리와 동일 취급).
- `level1.ts`~`level6.ts`를 수정하지 말고, `level7`은 순수 추가로만 둘 것.
- 체크포인트/중간 리스폰 시스템을 새로 만들지 말고, 죽으면 스테이지 전체를 재시작하는 기존 방식을 그대로 쓸 것.

## 고려사항 (Considerations)

- **점프 도달성**: 최대 점프 높이 ≈ 165px(`config.ts` 주석). Task 3의 좌표는 level6의 기존 간격을 참고해 잡았지만, 실제 플레이로 검증 필요 — 특히 구간①의 (820→1050) 크레스트 상승 점프.
- **톱니바퀴 추 타이밍**: 왕복 주기가 너무 빠르면 반응 불가능, 너무 느리면 지루해진다 → `GEAR.SPEED`/각 인스턴스 `range`를 Task 3의 수동 플레이테스트에서 조정.
- **함정 바닥 사이클 길이**: 기본값 기준 한 사이클 ≈ 3.5초. 4개 함정 바닥에 다른 `phase`를 줬으므로 동시에 여러 개가 열리는 순간과 전부 안전한 순간이 뒤섞인다 → "겹쳐서 통과 불가능한 구간"이 없는지 Task 3의 수동 플레이테스트로 확인.
- **파이널 건틀릿 난이도**: 3종 해저드가 동시에 존재해 시각적으로 복잡해질 수 있음 → 대포 발사선과 톱니바퀴 추 레일을 서로 다른 고도/타이밍에 배치해 "동시에 두 곳을 봐야 하는" 순간을 최소화(이미 Task 3의 좌표에 반영됨, 실제 플레이로 재확인).
- **체감 난이도**: 체크포인트가 없어 마지막 구간에서 죽으면 처음부터 다시 시작 — 의도된 긴장감이지만, 전체 클리어 소요 시간이 과도하게 길지 않은지(예: 90초 이내) Task 3에서 확인.

## 제약사항 (Constraints)

- 스택 고정: Phaser 4 + TypeScript + Vite. 새 라이브러리 도입 없음.
- 그림은 기존 방식대로 `BootScene`에서 도형으로 절차적 생성(이미지 파일 미사용) — `Gear` 텍스처도 동일.
- 색상은 기존 `COLORS` 팔레트(PICO-8 계열)에서 선택.
- 테스트는 Phaser 비의존 순수 로직만 대상(기존 프로젝트 방침) — `Gear`/`TrapFloor` 클래스 자체는 단위 테스트 대상이 아니고, `gearRotationRad`/`trapFloorPhase`만 테스트한다.
- 이 프로젝트는 React/Next.js가 아닌 Phaser 게임이므로 Vercel 관련 best-practice 스킬은 적용 대상이 아니다.

## 스킬 검색 (Skill Discovery)

Memory에 이 프로젝트(`mega1`)의 이전 스킬 매핑 테이블이 없어(신규 세션) `~/.claude/skills`, `~/.claude/agents`, 프로젝트 로컬 `.claude/skills`, 설치된 플러그인을 처음부터 검색했다.

| 스킬/에이전트 | 용도 | 적용 대상 |
|---|---|---|
| `add-hazard-type` (프로젝트 로컬, `.claude/skills/add-hazard-type/SKILL.md`) | 새 해저드/오브젝트 타입 추가 시 건드려야 할 파일의 락스텝 체크리스트 | Task 1(Gear), Task 2(TrapFloor) — 계획 작성 중 대조 완료(누락 없음), 구현 시 재확인 권장 |
| `/code-review` | 코드 작성 Task 완료 후 경량·반복 리뷰(P0/P1 0건까지) | Task 1, Task 2, Task 3 각각 |
| `/rl` | Task별 완료조건 수렴 검증 | Task 1, Task 2, Task 3 각각 + 전체 완료 후 최종 검증 |
| `/compound-engineering:ce-doc-review` | 이 플랜 문서 자체의 명확성·완전성·구체성·YAGNI 검증 | 이 플랜 문서 (실행 전 1회) |
| `/rl-verify` | 이 플랜의 기술적 사실 여부·실현 가능성 다관점 검증 | 이 플랜 문서 (ce-doc-review 이후 1회) |
| `/compound-engineering:ce-code-review` | 전체 Task 완료 후 다관점(스펙 준수+코드 품질) 최종 게이트 | 플랜 전체 완료 후 1회 |
| `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans` | Task 실행 메커니즘(택1) | 전체 실행 |

Vercel 관련 스킬(`/vercel-react-best-practices` 등)은 검색했으나 이 프로젝트가 Phaser 게임(React/Next.js 아님)이라 적용 대상에서 제외했다.

---

### Task 1: Gear hazard (motion function + object + wiring)

**Files:**
- Modify: `src/levels/motion.ts` — add `gearRotationRad`
- Modify: `src/levels/motion.test.ts` — add tests for `gearRotationRad`
- Modify: `src/config.ts` — add `GEAR`, `COLORS.GEAR`, `TEX.GEAR`
- Modify: `src/levels/types.ts` — add `GearDef`, add it to the `HazardDef` union
- Modify: `src/scenes/BootScene.ts` — add `makeGearTexture()`
- Create: `src/objects/Gear.ts`
- Modify: `src/scenes/GameScene.ts` — wire up `Gear`

**Interfaces:**
- Consumes: `oscillateOffset(elapsedMs, range, speed, phase01?, waitMs?): number` (already exists in `src/levels/motion.ts`, used by `MovingPlatform`)
- Produces:
  - `gearRotationRad(elapsedMs: number, degPerSec: number, phase01?: number): number` in `src/levels/motion.ts`
  - `GEAR = { SPEED, ROTATE_DEG_PER_SEC, RADIUS }` in `src/config.ts`
  - `GearDef` type (`kind: "gear"`) in `src/levels/types.ts`, included in the `HazardDef` union
  - `Gear` class in `src/objects/Gear.ts`: `new Gear(scene, x, y, opts?)`, `.update(elapsedMs, dtMs)`, `.body` (circular hitbox)
  - `GameScene` handles `{ kind: "gear", ... }` hazards end-to-end (build, update, death on contact)

**완료조건:** `npm test`에서 `gearRotationRad` 테스트 4개 통과 + `npm run build` 성공 + `level6`가 영향받지 않음(해당 레벨에 `"gear"` 해저드가 없으므로 동작 변화 없음).

**스킬 매핑:** `add-hazard-type`(락스텝 체크리스트 — 이미 대조 완료: types.ts → BootScene → config.ts → objects/ → GameScene → 레벨 파일 → build/test 순서를 그대로 따름) · Task 완료 후 `/code-review`(P0/P1 0건까지 반복) · `/rl`(위 완료조건으로 검증).

- [ ] **Step 1: Write the failing test for `gearRotationRad`**

Add to `src/levels/motion.test.ts` (new `describe` block, alongside the existing ones):

```typescript
import { gearRotationRad, trapFloorPhase } from "./motion";
```

(add `gearRotationRad, trapFloorPhase` to the existing import list at the top of the file, next to `oscillateOffset` etc. — `trapFloorPhase` will be implemented in Task 2, so leave it imported but untested for now)

```typescript
describe("gearRotationRad", () => {
  it("is zero at t=0 with no phase", () => {
    expect(gearRotationRad(0, 180)).toBe(0);
  });

  it("advances proportionally to degPerSec and elapsed time", () => {
    // 180 deg/s for 1000ms = 180 degrees = PI radians.
    expect(gearRotationRad(1000, 180)).toBeCloseTo(Math.PI);
  });

  it("applies a phase offset even at elapsedMs=0", () => {
    // phase 0.5 of a full turn = 180 degrees = PI radians.
    expect(gearRotationRad(0, 180, 0.5)).toBeCloseTo(Math.PI);
  });

  it("returns a constant (phase-only) angle when degPerSec is 0", () => {
    expect(gearRotationRad(5000, 0, 0.25)).toBeCloseTo(Math.PI / 2);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test`
Expected: FAIL — `gearRotationRad` (and `trapFloorPhase`) is not exported from `./motion` (TypeScript/Vitest module error).

- [ ] **Step 3: Implement `gearRotationRad`**

Add to `src/levels/motion.ts`, after `oscillateOffset` and before the `PopupSpikePhase` section:

```typescript
/**
 * Rotation angle (radians) for a spinning gear hazard. Purely a visual effect —
 * the gear's hitbox is circular, so rotating it never changes the hit shape.
 * Pure linear function of elapsed time, mirroring how `pendulumAngleRad` derives
 * its motion from `elapsedMs` alone (deterministic, restart-safe).
 */
export function gearRotationRad(
  elapsedMs: number,
  degPerSec: number,
  phase01 = 0,
): number {
  const deg = degPerSec * (elapsedMs / 1000) + phase01 * 360;
  return (deg * Math.PI) / 180;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test`
Expected: The 4 new `gearRotationRad` tests PASS. (The `trapFloorPhase` import will still cause a module error — that's expected until Task 2. If Vitest fails the whole file on the bad import, temporarily comment out the `trapFloorPhase` import and the describe block for it, and restore both in Task 2's Step 1.)

- [ ] **Step 5: Commit**

```bash
git add src/levels/motion.ts src/levels/motion.test.ts
git commit -m "feat(level7): add gearRotationRad pure function"
```

- [ ] **Step 6: Add `GEAR` config and texture/color keys**

In `src/config.ts`, add after the `THWOMP` block (before the `PROJECTILE` block):

```typescript
/** F-1 Gear hazard (level7) — rail-riding, spinning, instant-death on contact. */
export const GEAR = {
  /** Rail travel speed (px/s), same scale as MOVING_PLATFORM.SPEED. */
  SPEED: 90,
  /** Visual spin rate — purely cosmetic (hitbox stays circular). */
  ROTATE_DEG_PER_SEC: 220,
  /** Circular hitbox radius. */
  RADIUS: 20,
} as const;
```

In the `COLORS` block, add after `THWOMP_FACE: 0xffccaa,`:

```typescript
  GEAR: 0x8f8f8f,
```

In the `TEX` block, add after `THWOMP: "tex-thwomp",`:

```typescript
  GEAR: "tex-gear",
```

- [ ] **Step 7: Add `GearDef` to the level type schema**

In `src/levels/types.ts`, add after the `CannonDef` interface (before `export type HazardDef = ...`):

```typescript
/** F-1 — gear: rides a rail (like a moving platform) while spinning; instant death on contact. */
export interface GearDef {
  kind: "gear";
  /** Home position (pivot) — where the rail path starts. */
  x: number;
  y: number;
  axis?: "horizontal" | "vertical";
  range?: number;
  speed?: number;
  phase?: number;
  waitMs?: number;
  rotateDegPerSec?: number;
}
```

Update the `HazardDef` union to include it:

```typescript
export type HazardDef =
  | PendulumDef
  | PopupSpikeDef
  | ThwompDef
  | ShooterDef
  | TurretDef
  | CannonDef
  | GearDef;
```

- [ ] **Step 8: Add the gear texture to `BootScene`**

In `src/scenes/BootScene.ts`, add a new private method after `makeThwompTexture()`:

```typescript
  /** Gear: a circular hub with square teeth around the rim (distinct silhouette from the pendulum's spikes). */
  private makeGearTexture(): void {
    const s = 44;
    const c = s / 2;
    const g = this.add.graphics();
    g.fillStyle(COLORS.GEAR, 1);
    g.fillCircle(c, c, 15);
    const teeth = 8;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      g.save();
      g.translateCanvas(c + Math.cos(a) * 15, c + Math.sin(a) * 15);
      g.rotateCanvas(a);
      g.fillRect(-4, -4, 8, 8);
      g.restore();
    }
    g.fillStyle(0x4a4a4a, 1);
    g.fillCircle(c, c, 6); // dark hub
    g.generateTexture(TEX.GEAR, s, s);
    g.destroy();
  }
```

In `create()`, add the call just before `this.scene.start("MenuScene");`:

```typescript
    // Gear hazard (level7).
    this.makeGearTexture();

    this.scene.start("MenuScene");
```

- [ ] **Step 9: Create the `Gear` class**

Create `src/objects/Gear.ts`:

```typescript
import Phaser from "phaser";
import { DEPTH, GEAR, TEX } from "../config";
import { gearRotationRad, oscillateOffset } from "../levels/motion";

/**
 * F-1 — a gear that rides a straight rail (same math as MovingPlatform) while
 * spinning in place. The spin is purely visual (circular hitbox never changes
 * shape); the danger is the rail movement itself. Instant death on any contact
 * — no stomp-kill, same as the Pendulum head.
 */
export class Gear extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private readonly homeX: number;
  private readonly homeY: number;
  private readonly axis: "horizontal" | "vertical";
  private readonly range: number;
  private readonly speed: number;
  private readonly phase01: number;
  private readonly waitMs: number;
  private readonly rotateDegPerSec: number;

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
  ) {
    super(scene, x, y, TEX.GEAR);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.HAZARD);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    const inset = this.width / 2 - GEAR.RADIUS;
    this.body.setCircle(GEAR.RADIUS, inset, inset);

    this.homeX = x;
    this.homeY = y;
    this.axis = opts.axis ?? "horizontal";
    this.range = opts.range ?? 0;
    this.speed = opts.speed ?? GEAR.SPEED;
    this.phase01 = opts.phase ?? 0;
    this.waitMs = opts.waitMs ?? 0;
    this.rotateDegPerSec = opts.rotateDegPerSec ?? GEAR.ROTATE_DEG_PER_SEC;
  }

  /** `elapsedMs` = scene time; `dtMs` = frame delta. */
  update(elapsedMs: number, dtMs: number): void {
    const off = oscillateOffset(elapsedMs, this.range, this.speed, this.phase01, this.waitMs);
    const targetX = this.axis === "horizontal" ? this.homeX + off : this.homeX;
    const targetY = this.axis === "vertical" ? this.homeY + off : this.homeY;

    const dtSec = dtMs / 1000;
    const vx = dtSec > 0 ? clampAbs((targetX - this.x) / dtSec, this.speed) : 0;
    const vy = dtSec > 0 ? clampAbs((targetY - this.y) / dtSec, this.speed) : 0;
    this.setVelocity(vx, vy);

    this.setRotation(gearRotationRad(elapsedMs, this.rotateDegPerSec, this.phase01));
  }
}

/** Clamp `v` to the range [-max, max] — same technique as MovingPlatform's velocity cap. */
function clampAbs(v: number, max: number): number {
  return v > max ? max : v < -max ? -max : v;
}
```

- [ ] **Step 10: Wire `Gear` into `GameScene`**

In `src/scenes/GameScene.ts`:

1. Add the import, right after the `Cannon` import:

```typescript
import { Cannon } from "../objects/Cannon";
import { Gear } from "../objects/Gear";
```

2. Add a field, right after `private cannons: Cannon[] = [];`:

```typescript
  private cannons: Cannon[] = [];
  private gears: Gear[] = [];
```

3. In `create()`'s reset block, right after `this.cannons = [];`:

```typescript
    this.cannons = [];
    this.gears = [];
```

4. In `buildHazard()`'s switch, add a case right after the `"cannon"` case:

```typescript
      case "cannon":
        this.cannons.push(new Cannon(this, h, this.cannonballs));
        break;
      case "gear":
        this.gears.push(
          new Gear(this, h.x, h.y, {
            axis: h.axis,
            range: h.range,
            speed: h.speed,
            phase: h.phase,
            waitMs: h.waitMs,
            rotateDegPerSec: h.rotateDegPerSec,
          }),
        );
        break;
```

5. In `create()`'s physics wiring, right after the pendulum overlap loop:

```typescript
    for (const p of this.pendulums) {
      this.physics.add.overlap(this.player, p.head, () => this.handleDeath());
    }
    for (const g of this.gears) {
      this.physics.add.overlap(this.player, g, () => this.handleDeath());
    }
```

6. In `update()`, right after the pendulum update loop:

```typescript
    for (const p of this.pendulums) p.update(this.elapsedMs);
    for (const g of this.gears) g.update(this.elapsedMs, delta);
```

- [ ] **Step 11: Verify the build**

Run: `npm run build`
Expected: Succeeds with no TypeScript errors (this also confirms `GearDef`, `Gear`, and the `GameScene` switch/wiring all type-check together). `level6` is unaffected since it has no `"gear"` hazards.

- [ ] **Step 12: Commit**

```bash
git add src/config.ts src/levels/types.ts src/scenes/BootScene.ts src/scenes/GameScene.ts src/objects/Gear.ts
git commit -m "feat(level7): add Gear hazard object and wiring"
```

---

### Task 2: TrapFloor hazard (motion function + object + wiring)

**Files:**
- Modify: `src/levels/motion.ts` — add `trapFloorPhase` (import was already added as a placeholder in Task 1, Step 1)
- Modify: `src/levels/motion.test.ts` — add tests for `trapFloorPhase`
- Modify: `src/config.ts` — add `TRAP_FLOOR`
- Modify: `src/levels/types.ts` — add `"trapfloor"` to `PlatformType`, add `telegraphMs?/safeMs?/openMs?` to `PlatformDef`
- Create: `src/objects/TrapFloor.ts`
- Modify: `src/scenes/GameScene.ts` — wire up `TrapFloor`

**Interfaces:**
- Consumes: `TEX.FAKE`, `COLORS.TELEGRAPH` (already exist in `src/config.ts`)
- Produces:
  - `trapFloorPhase(elapsedMs: number, telegraphMs: number, safeMs: number, openMs: number, phase01?: number): "solid" | "telegraph" | "open"` in `src/levels/motion.ts`, exported type `TrapFloorPhase`
  - `TRAP_FLOOR = { TELEGRAPH_MS, SAFE_MS, OPEN_MS }` in `src/config.ts`
  - `PlatformType` includes `"trapfloor"`; `PlatformDef` gets `telegraphMs?/safeMs?/openMs?` (reuses the existing `phase?` field)
  - `TrapFloor` class in `src/objects/TrapFloor.ts`: `new TrapFloor(scene, x, y, width, height, opts?)`, `.update(elapsedMs)`
  - `GameScene` handles `{ type: "trapfloor", ... }` platforms end-to-end (build, update, collision toggling)

**완료조건:** `npm test`에서 `trapFloorPhase` 테스트 8개 통과(Task 1의 `gearRotationRad` 테스트도 계속 통과) + `npm run build` 성공 + `level6`가 영향받지 않음(해당 레벨에 `"trapfloor"` 플랫폼이 없으므로 동작 변화 없음).

**스킬 매핑:** `add-hazard-type`(락스텝 체크리스트 — 대조 완료. 이 하저드는 새 텍스처가 필요 없어 BootScene 단계는 의도적으로 생략됨 — TEX.FAKE 재사용) · Task 완료 후 `/code-review`(P0/P1 0건까지 반복) · `/rl`(위 완료조건으로 검증).

- [ ] **Step 1: Write the failing test for `trapFloorPhase`**

If you commented out the `trapFloorPhase` import/describe block in Task 1 Step 4, restore it now. Add to `src/levels/motion.test.ts`:

```typescript
describe("trapFloorPhase", () => {
  // telegraph 400, safe 600, open 1000 -> cycle = 600+400+600+400+1000 = 3000.
  it("is solid at the start of the cycle", () => {
    expect(trapFloorPhase(0, 400, 600, 1000)).toBe("solid");
  });

  it("enters the first telegraph after the first safe window", () => {
    expect(trapFloorPhase(700, 400, 600, 1000)).toBe("telegraph");
  });

  it("returns to solid between the two telegraphs", () => {
    expect(trapFloorPhase(1100, 400, 600, 1000)).toBe("solid");
  });

  it("enters the second telegraph after the second safe window", () => {
    expect(trapFloorPhase(1800, 400, 600, 1000)).toBe("telegraph");
  });

  it("opens after both telegraphs", () => {
    expect(trapFloorPhase(2500, 400, 600, 1000)).toBe("open");
  });

  it("wraps deterministically back to solid after a full cycle", () => {
    expect(trapFloorPhase(3000, 400, 600, 1000)).toBe("solid");
  });

  it("phase offset shifts the cycle", () => {
    // 0.8 of the 3000ms cycle = offset 2400, which falls in the "open" window (2000..3000).
    expect(trapFloorPhase(0, 400, 600, 1000, 0.8)).toBe("open");
  });

  it("guards a degenerate (all-zero) cycle by staying solid", () => {
    expect(trapFloorPhase(1234, 0, 0, 0)).toBe("solid");
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test`
Expected: FAIL — `trapFloorPhase` is not defined/exported yet.

- [ ] **Step 3: Implement `trapFloorPhase`**

Add to `src/levels/motion.ts`, after `popupSpikePhase`:

```typescript
export type TrapFloorPhase = "solid" | "telegraph" | "open";

/**
 * Phase of a disguised trap floor. The cycle is fixed at safe -> telegraph ->
 * safe -> telegraph -> open (warn twice, then the floor opens) — the "twice" is
 * a deliberate design decision, so it is not a parameter. Only "open" removes
 * collision; "telegraph" is a visible warning but still safe to stand on.
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

(`mod` already exists at the bottom of `motion.ts`, used by `oscillateOffset`/`popupSpikePhase` — no changes needed there.)

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test`
Expected: All `trapFloorPhase` tests PASS, and all pre-existing tests (including Task 1's `gearRotationRad` tests) still PASS.

- [ ] **Step 5: Commit**

```bash
git add src/levels/motion.ts src/levels/motion.test.ts
git commit -m "feat(level7): add trapFloorPhase pure function"
```

- [ ] **Step 6: Add `TRAP_FLOOR` config**

In `src/config.ts`, add after the `GEAR` block:

```typescript
/** F-2 Trap floor (level7) — disguised ground that warns twice, then opens. */
export const TRAP_FLOOR = {
  /** Warning-flicker duration (ms), same scale as POPUP_SPIKE.TELEGRAPH_MS. */
  TELEGRAPH_MS: 450,
  /** Disguised/safe duration between warnings (ms). */
  SAFE_MS: 650,
  /** How long the floor stays open (no collision) before resetting (ms). */
  OPEN_MS: 1300,
} as const;
```

- [ ] **Step 7: Extend the platform type schema**

In `src/levels/types.ts`, update `PlatformType`:

```typescript
export type PlatformType =
  | "static"
  | "moving"
  | "conveyor"
  | "spring"
  | "fake"
  | "trapfloor";
```

Add to the `PlatformDef` interface's doc comment list and fields (after the `// type === "fake"` block):

```typescript
  // type === "trapfloor" (reuses `phase` above for the stagger offset)
  /** Warning-flicker duration (ms). Defaults to TRAP_FLOOR.TELEGRAPH_MS. */
  telegraphMs?: number;
  /** Disguised/safe duration between warnings (ms). Defaults to TRAP_FLOOR.SAFE_MS. */
  safeMs?: number;
  /** How long the floor stays open (ms). Defaults to TRAP_FLOOR.OPEN_MS. */
  openMs?: number;
```

Also update the `PlatformType` doc comment at the top of the interface block to mention it:

```typescript
 *   - trapfloor: disguised as a normal platform; auto-cycles forever between
 *               solid, a warning flicker (twice), and briefly having no
 *               collision at all (a hole) before resetting.
```

- [ ] **Step 8: Create the `TrapFloor` class**

Create `src/objects/TrapFloor.ts`:

```typescript
import Phaser from "phaser";
import { COLORS, DEPTH, TEX, TRAP_FLOOR } from "../config";
import { trapFloorPhase } from "../levels/motion";

/**
 * F-2 — a floor tile disguised as normal ground (reuses the "fake" texture) that
 * auto-cycles forever: solid -> warn -> solid -> warn -> open -> repeat. Only
 * "open" disables the body; falling through relies entirely on the scene's
 * existing fall-off-the-world death check, not any logic in this class. Must be
 * placed directly over a real pit (nothing solid underneath) — see level design
 * notes in the level7 spec.
 */
export class TrapFloor extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.StaticBody;

  private readonly telegraphMs: number;
  private readonly safeMs: number;
  private readonly openMs: number;
  private readonly phase01: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    opts: { telegraphMs?: number; safeMs?: number; openMs?: number; phase?: number } = {},
  ) {
    super(scene, x + width / 2, y + height / 2, TEX.FAKE);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(DEPTH.PLATFORM);

    this.telegraphMs = opts.telegraphMs ?? TRAP_FLOOR.TELEGRAPH_MS;
    this.safeMs = opts.safeMs ?? TRAP_FLOOR.SAFE_MS;
    this.openMs = opts.openMs ?? TRAP_FLOOR.OPEN_MS;
    this.phase01 = opts.phase ?? 0;

    this.setDisplaySize(width, height);
    this.body.setSize(width, height);
    this.body.updateFromGameObject();
  }

  update(elapsedMs: number): void {
    const phase = trapFloorPhase(
      elapsedMs,
      this.telegraphMs,
      this.safeMs,
      this.openMs,
      this.phase01,
    );

    switch (phase) {
      case "solid":
        this.body.enable = true;
        this.setVisible(true);
        this.clearTint();
        this.setAlpha(1);
        break;
      case "telegraph":
        this.body.enable = true;
        this.setVisible(true);
        this.setTint(COLORS.TELEGRAPH);
        this.setAlpha(0.5 + 0.5 * Math.abs(Math.sin(elapsedMs / 55)));
        break;
      case "open":
        this.body.enable = false;
        this.setVisible(false);
        break;
    }
  }
}
```

- [ ] **Step 9: Wire `TrapFloor` into `GameScene`**

In `src/scenes/GameScene.ts`:

1. Add the import, right after the `CrumblingPlatform` import:

```typescript
import { CrumblingPlatform } from "../objects/CrumblingPlatform";
import { TrapFloor } from "../objects/TrapFloor";
```

2. Add a field, right after `private crumbles: CrumblingPlatform[] = [];`:

```typescript
  private crumbles: CrumblingPlatform[] = [];
  private trapFloors: TrapFloor[] = [];
```

3. In `buildPlatforms()`, reset the array alongside `springs`/`crumbles` (same pattern — reset here, not in `create()`'s top-level reset block):

```typescript
  private buildPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    this.springs = [];
    this.crumbles = [];
    this.trapFloors = [];
```

4. In `buildPlatforms()`'s switch, add a case right after `"fake"`:

```typescript
        case "fake":
          this.crumbles.push(
            new CrumblingPlatform(this, p.x, p.y, p.width, p.height, {
              collapseMs: p.collapseMs,
              respawn: p.respawn,
            }),
          );
          break;
        case "trapfloor":
          this.trapFloors.push(
            new TrapFloor(this, p.x, p.y, p.width, p.height, {
              telegraphMs: p.telegraphMs,
              safeMs: p.safeMs,
              openMs: p.openMs,
              phase: p.phase,
            }),
          );
          break;
```

5. In `create()`'s physics wiring, right after the crumbles collider:

```typescript
    this.physics.add.collider(this.player, this.crumbles, (_pl, plat) => {
      const cp = plat as CrumblingPlatform;
      if (this.player.body.touching.down && this.player.body.bottom <= cp.body.top + 8) {
        cp.trigger();
      }
    });
    this.physics.add.collider(this.player, this.trapFloors);
```

6. In `update()`, right after the pop-up spike update loop:

```typescript
    for (const s of this.popupSpikes) s.update(this.elapsedMs);
    for (const tf of this.trapFloors) tf.update(this.elapsedMs);
```

- [ ] **Step 10: Verify the build**

Run: `npm run build`
Expected: Succeeds with no TypeScript errors. `level6` is unaffected since it has no `"trapfloor"` platforms.

- [ ] **Step 11: Commit**

```bash
git add src/config.ts src/levels/types.ts src/scenes/GameScene.ts src/objects/TrapFloor.ts
git commit -m "feat(level7): add TrapFloor hazard object and wiring"
```

---

### Task 3: `level7` stage data and registration

**Files:**
- Create: `src/levels/level7.ts`
- Modify: `src/levels/index.ts`

**Interfaces:**
- Consumes: `LevelDef` (`src/levels/types.ts`), `GearDef`/`"gear"` and `"trapfloor"` platform type (Tasks 1–2), everything `GameScene` already wires up for existing hazards/platforms.
- Produces: `level7: LevelDef`, exported and appended to the `levels` array — no new consumers (this is the leaf of the dependency chain).

**완료조건:** 플랜 상단 "완료조건" 섹션의 항목 전체 — `npm test`/`npm run build` 통과, 4구간이 각자의 규칙대로 동작, 깃발 도달 시 클리어, 죽으면 `level7` 전체 재시작.

**스킬 매핑:** Task 완료 후 `/code-review`(P0/P1 0건까지 반복) · `/rl`(완료조건 전체로 검증) · 수동 플레이테스트(Step 5)는 스킬이 아니라 직접 브라우저로 수행.

- [ ] **Step 1: Create the level7 data file**

Create `src/levels/level7.ts`:

```typescript
import type { LevelDef } from "./types";

/**
 * Stage 7 — level6's cannon/shield idea doubled in length (2600 -> 5200px) and
 * escalated across four zones: warm-up (cannon recap) -> gearworks (the new
 * Gear hazard alone) -> trapped ground (the new TrapFloor hazard alone) ->
 * finale (cannon + gear + trap floor together). No checkpoints, same as every
 * other stage — dying restarts the whole level. Coordinates are world pixels;
 * expect to playtest-tune (same convention as level3/level6).
 */
export const level7: LevelDef = {
  name: "7 — Cogs & Pitfalls",
  worldWidth: 5200,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    // --- Zone 1: warm-up (0-1400) — level6 opener recap. Ground split by PIT1=640..760.
    { x: 0, y: 496, width: 640, height: 44 },
    { x: 760, y: 496, width: 640, height: 44 },
    { x: 300, y: 380, width: 110, height: 24 },
    { x: 560, y: 330, width: 90, height: 24 },
    { x: 820, y: 360, width: 130, height: 24 }, // enemy patrol
    { x: 1050, y: 260, width: 110, height: 24 }, // crest — cannon
    { x: 1300, y: 340, width: 110, height: 24 },

    // --- Zone 2: gearworks (1400-2820). PIT2=1900..2020, PIT3=2600..2720.
    { x: 1400, y: 496, width: 500, height: 44 },
    { x: 2020, y: 496, width: 580, height: 44 },
    { x: 2720, y: 496, width: 100, height: 44 },
    { x: 1560, y: 380, width: 110, height: 24 },
    { x: 1760, y: 320, width: 100, height: 24 }, // shield pickup here
    { x: 1960, y: 260, width: 100, height: 24 }, // crest over PIT2
    { x: 2160, y: 340, width: 110, height: 24 },
    { x: 2400, y: 400, width: 110, height: 24 },
    { x: 2560, y: 340, width: 100, height: 24 },

    // --- Zone 3: trapped ground (2820-4000). Safe islands alternating with trap
    // floors; every trap floor sits directly on the ground line with nothing
    // underneath it, so an open trap floor is a real pit.
    { x: 2820, y: 496, width: 100, height: 44 },
    { x: 2920, y: 496, width: 120, height: 44, type: "trapfloor", phase: 0 },
    { x: 3040, y: 496, width: 80, height: 44 },
    { x: 3120, y: 496, width: 120, height: 44, type: "trapfloor", phase: 0.4 },
    { x: 3240, y: 496, width: 100, height: 44 }, // spikes here
    { x: 3340, y: 496, width: 140, height: 44, type: "trapfloor", phase: 0.7 },
    { x: 3480, y: 496, width: 80, height: 44 },
    { x: 3560, y: 496, width: 120, height: 44, type: "trapfloor", phase: 0.15 },
    { x: 3680, y: 496, width: 320, height: 44 },

    // --- Zone 4: finale (4000-5200) — cannon + gear + trap floor together.
    // PIT4=4260..4360.
    { x: 4000, y: 496, width: 260, height: 44 },
    { x: 4360, y: 496, width: 140, height: 44 },
    { x: 4500, y: 496, width: 120, height: 44, type: "trapfloor", phase: 0.5 },
    { x: 4620, y: 496, width: 580, height: 44 }, // final run — cannon fires here
    { x: 4300, y: 360, width: 110, height: 24 }, // escape route over PIT4
    { x: 4700, y: 330, width: 110, height: 24 },
    { x: 4900, y: 380, width: 110, height: 24 },
  ],
  enemies: [
    { x: 880, y: 346 }, // zone 1, on the x=820 platform
    { x: 3720, y: 456 }, // zone 3, on the x=3680 ground
    { x: 4420, y: 456 }, // zone 4, on the x=4360 ground
  ],
  spikes: [
    { x: 1000, y: 472, tiles: 2 }, // zone 1
    { x: 3260, y: 472, tiles: 2 }, // zone 3, on a "safe" island
  ],
  hazards: [
    { kind: "cannon", x: 1060, y: 245, direction: "left" }, // zone 1 crest cannon
    {
      kind: "gear",
      x: 1860,
      y: 300,
      axis: "horizontal",
      range: 100,
      speed: 90,
    }, // zone 2, between the x=1760 and x=1960 platforms
    {
      kind: "gear",
      x: 2335,
      y: 330,
      axis: "vertical",
      range: 140,
      speed: 90,
    }, // zone 2, between the x=2160 and x=2400 platforms
    {
      kind: "gear",
      x: 4855,
      y: 300,
      axis: "vertical",
      range: 150,
      speed: 100,
    }, // zone 4, between the x=4700 and x=4900 platforms
    { kind: "cannon", x: 4960, y: 452, direction: "left" }, // zone 4 final ground run
  ],
  shieldPickups: [{ x: 1810, y: 295 }], // on the x=1760 platform, zone 2
  goal: { x: 5140, y: 432 },
};
```

- [ ] **Step 2: Register level7**

In `src/levels/index.ts`:

```typescript
import { level6 } from "./level6";
import { level7 } from "./level7";

export const levels: LevelDef[] = [level1, level2, level3, level4, level5, level6, level7];
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: All tests pass (existing `patrol.test.ts` and the full `motion.test.ts`, including Tasks 1–2's new tests). No test references `level7` directly — this step confirms nothing else broke.

- [ ] **Step 4: Run the build**

Run: `npm run build`
Expected: Succeeds with no TypeScript errors.

- [ ] **Step 5: Manual playtest**

Run: `npm run dev`, then open the browser and either play from `level1` through to `level7`, or temporarily change `GameScene`'s default level index to jump straight to it for faster iteration (e.g. in `MenuScene` or wherever the start level is chosen — revert this temporary change before committing).

Walk through each zone and confirm against the spec's completion criteria:
- Zone 1: the crest cannon fires left on an interval; you can dodge it on the way up, same feel as `level6`'s crest cannon.
- Zone 2: both gears patrol their rails (one horizontal, one vertical) while visibly spinning; touching either kills you instantly; picking up the shield lets you absorb one cannon hit later.
- Zone 3: each trap floor looks like normal ground, flickers red twice, then disappears; standing on it when it opens makes you fall and die; it later resets back to solid.
- Zone 4: the cannon, a gear, and a trap floor are all present in the same stretch; reaching the flag at (5140, 432) triggers the win/next-level transition.
- Dying anywhere in `level7` restarts `level7` from `playerSpawn`, not a mid-level checkpoint.

- [ ] **Step 6: Commit**

```bash
git add src/levels/level7.ts src/levels/index.ts
git commit -m "feat(level7): add level7 stage data and register it"
```

## Self-Review Notes

- **Spec coverage:** All 4 zones, both new hazards (with their pure functions + tests), the `HazardDef`/`PlatformType` schema changes, the config additions, the BootScene texture, the GameScene wiring, and the no-checkpoint/no-new-death-logic constraints from the spec are each covered by a task or step above.
- **Placeholder scan:** No TBD/TODO; every step has real, complete code.
- **Type consistency:** `Gear`'s constructor opts (`axis/range/speed/phase/waitMs/rotateDegPerSec`) match `GearDef`'s fields exactly, which match what `buildHazard()`'s `"gear"` case passes through. `TrapFloor`'s constructor opts (`telegraphMs/safeMs/openMs/phase`) match the new `PlatformDef` fields exactly, which match what `buildPlatforms()`'s `"trapfloor"` case passes through. `trapFloorPhase`'s parameter order (`telegraphMs, safeMs, openMs`) is used consistently in its tests, its implementation, and both call sites (`TrapFloor.update()`).
