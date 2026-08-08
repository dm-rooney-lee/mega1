# 스테이지 진입 배너 번호 표시 + 스테이지 2 제목 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스테이지 진입 시 뜨는 제목 배너에 스테이지 번호를 붙이고, 지금 제목이 없는 스테이지 2에도 제목을 붙인다.

**Architecture:** 배너 문구("STAGE 4: Traps")를 만드는 순수 함수 `stageBanner`를 기존 `src/levels/stageLabel.ts`에 추가하고, `src/scenes/GameScene.ts`의 배너 생성 코드가 그 함수를 쓰도록 바꾼다. 번호는 레벨 배열 인덱스에서 계산하므로 레벨 파일에는 번호를 적지 않는다.

**Tech Stack:** TypeScript, Vitest(단위 테스트), Phaser 4(런타임, 이번 변경에서는 텍스트 한 줄만 바뀜).

**참고 스펙:** `docs/superpowers/specs/2026-08-08-stage-title-banner-design.md`

## Global Constraints

- 배너 문구 형식은 `"STAGE {1부터 세는 번호}: {제목}"`으로 고정한다(스펙에서 확정, 예: `"STAGE 4: Traps"`).
- 번호는 `levelIndex`(레벨 배열의 0-based 인덱스)에서 계산한다 — 레벨 파일의 `name` 문자열에 번호를 직접 적지 않는다.
- 화면 우측 상단의 상시 진행도 표시(`stageLabel` 함수, `"STAGE 7/10"` 형식)와 `docs/report/` 아래 문서는 이번 변경 대상이 아니다.
- 새로 추가하는 테스트는 정상 흐름(Happy)과 경계값(Boundary) 카테고리를 포함한다. 예외(Error) 카테고리를 생략하는 경우 그 사유를 테스트 파일 주석에 남긴다(이 저장소 상위 CLAUDE.md의 테스트 작성 규칙).
- 매 커밋마다 pre-commit 훅이 `npm run build`와 `npm test`를 자동 실행한다 — 실패하면 커밋이 막힌다.

---

### Task 1: 배너 문구를 만드는 순수 함수 `stageBanner` 추가

**Files:**
- Modify: `src/levels/stageLabel.ts`
- Test: `src/levels/stageLabel.test.ts`

**Interfaces:**
- Produces: `stageBanner(levelIndex: number, name: string): string` — `levelIndex`는 0-based, 반환값은 `"STAGE {levelIndex + 1}: {name}"` 형식의 문자열. Task 3에서 이 함수를 그대로 가져다 쓴다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/levels/stageLabel.test.ts` 맨 위 import를 아래로 바꾼다(기존 `stageLabel`에 `stageBanner`를 추가):

```typescript
import { describe, expect, it } from "vitest";
import { stageLabel, stageBanner } from "./stageLabel";
```

파일 맨 끝(기존 `describe("stageLabel", ...)` 블록 뒤)에 아래 블록을 추가한다:

```typescript
describe("stageBanner", () => {
  // 정상 흐름
  it("번호와 제목을 합쳐 배너 문구를 만든다", () => {
    expect(stageBanner(3, "Traps")).toBe("STAGE 4: Traps");
  });

  // 경계값
  it("첫 스테이지는 STAGE 1로 표시한다", () => {
    expect(stageBanner(0, "Double Trouble")).toBe("STAGE 1: Double Trouble");
  });

  // 예외 케이스 없음: 문자열을 그대로 이어붙이기만 할 뿐 내부 분기가 없다.
  // 제목 유무에 따른 분기(if (this.level.name))는 GameScene.ts 쪽에 있고,
  // 이 저장소의 다른 Phaser 장면 코드와 마찬가지로 자동화 단위 테스트
  // 대상이 아니다(수동 검증 계획 참고, Task 3).
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/levels/stageLabel.test.ts`
Expected: FAIL — `stageBanner`가 `./stageLabel`에서 export되지 않아 타입/모듈 에러가 난다.

- [ ] **Step 3: 최소 구현 작성**

`src/levels/stageLabel.ts` 맨 끝에 아래 함수를 추가한다(기존 `stageLabel` 함수는 그대로 둔다):

```typescript
/**
 * "STAGE 4: Traps" — the entry banner shown briefly when a stage starts.
 * `levelIndex` is 0-based, matching `stageLabel`.
 */
export function stageBanner(levelIndex: number, name: string): string {
  return `STAGE ${levelIndex + 1}: ${name}`;
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인**

Run: `npx vitest run src/levels/stageLabel.test.ts`
Expected: PASS (기존 `stageLabel` 테스트 6개 + 새 `stageBanner` 테스트 2개, 총 8개 통과)

- [ ] **Step 5: 커밋**

```bash
git add src/levels/stageLabel.ts src/levels/stageLabel.test.ts
git commit -m "feat(hud): add stageBanner to format stage-entry banner text"
```

---

### Task 2: 스테이지 2에 제목 추가

**Files:**
- Modify: `src/levels/level2.ts:12` (`export const level2: LevelDef = {` 바로 다음 줄)

**Interfaces:**
- Consumes: 없음 (데이터 파일 수정만).
- Produces: `level2.name === "Double Trouble"` — Task 3의 수동 검증에서 이 값을 확인한다.

- [ ] **Step 1: `name` 필드 추가**

`src/levels/level2.ts`에서 아래처럼 `export const level2: LevelDef = {` 바로 다음 줄에 `name` 필드를 추가한다(다른 레벨 파일들과 동일하게 첫 필드로 넣는다):

```typescript
export const level2: LevelDef = {
  name: "Double Trouble",
  worldWidth: 3000,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
```

- [ ] **Step 2: 기존 테스트·빌드가 깨지지 않는지 확인**

Run: `npm test`
Expected: PASS (기존 310개 + Task 1에서 늘어난 2개, `level2`를 순회하는 `threat.test.ts`/`patrol.test.ts` 등도 그대로 통과 — `name` 필드는 이 테스트들이 검사하는 위험 판정·패트롤 로직에 영향을 주지 않는다)

Run: `npm run build`
Expected: PASS (타입 에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/levels/level2.ts
git commit -m "feat(levels): give stage 2 a display name (\"Double Trouble\")"
```

---

### Task 3: 진입 배너에 번호 연결 + 수동 검증

**Files:**
- Modify: `src/scenes/GameScene.ts:14` (import), `src/scenes/GameScene.ts:865-876` (`drawHud()`의 배너 생성 블록)

**Interfaces:**
- Consumes: `stageBanner(levelIndex: number, name: string): string` (Task 1), `level2.name === "Double Trouble"` (Task 2).

- [ ] **Step 1: import에 `stageBanner` 추가**

`src/scenes/GameScene.ts` 14번째 줄을 아래로 바꾼다:

```typescript
import { stageLabel, stageBanner } from "../levels/stageLabel";
```

- [ ] **Step 2: 배너 텍스트에 번호 적용**

`src/scenes/GameScene.ts`의 `drawHud()` 안, 아래 블록(현재 865~876번째 줄 부근)을 찾는다:

```typescript
    // Brief level-name banner.
    if (this.level.name) {
      this.levelBanner = this.add
        .text(0, 0, this.level.name, {
          fontFamily: SCREEN_FONT,
          fontSize: "28px",
          color: "#ffec27",
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.HUD);
      this.levelBanner.setStroke("#1d2b53", 5);
      this.tweens.add({ targets: this.levelBanner, alpha: 0, delay: 1800, duration: 800 });
    }
```

`this.level.name`을 텍스트로 직접 쓰던 부분만 `stageBanner(this.levelIndex, this.level.name)`로 바꾼다(다른 줄은 그대로 둔다):

```typescript
    // Brief level-name banner.
    if (this.level.name) {
      this.levelBanner = this.add
        .text(0, 0, stageBanner(this.levelIndex, this.level.name), {
          fontFamily: SCREEN_FONT,
          fontSize: "28px",
          color: "#ffec27",
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.HUD);
      this.levelBanner.setStroke("#1d2b53", 5);
      this.tweens.add({ targets: this.levelBanner, alpha: 0, delay: 1800, duration: 800 });
    }
```

- [ ] **Step 3: 타입체크 + 자동 테스트 확인**

Run: `npm run build`
Expected: PASS

Run: `npm test`
Expected: PASS (전체 312개 테스트 통과 — GameScene.ts는 이 저장소의 기존 관례상 단위 테스트 대상이 아니므로, 여기서는 컴파일 및 회귀 테스트만 확인한다)

- [ ] **Step 4: 수동 검증 (개발 서버)**

Run: `npm run dev`

브라우저에서 아래 세 URL에 각각 접속해 확인한다:

1. `http://localhost:5173/?stage=2` — 진입 시 화면 중앙에 `"STAGE 2: Double Trouble"` 배너가 2초 정도 떴다 사라지는지.
2. `http://localhost:5173/?stage=4` — 진입 시 `"STAGE 4: Traps"` 배너가 뜨는지 (기존에 제목이 있던 스테이지에도 번호가 잘 붙는지).
3. `http://localhost:5173/?stage=10` — 진입 시 `"STAGE 10: Endgame"`처럼 두 자리 번호도 문제없이 뜨는지.

세 화면 모두에서 배너 글자가 화면 폭을 넘치지 않는지, 화면 우측 상단의 기존 `"STAGE N/10"` 표시와 겹치거나 어색해 보이지 않는지 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(hud): show stage number in the stage-entry banner"
```

---

## Self-Review 결과

- **스펙 커버리지**: 스펙의 "스테이지 2 제목"(Task 2), "번호 붙이기"(Task 1·3), "테스트 계획"(Task 1의 정상 흐름·경계값·예외 생략 사유), "수동 검증 계획"의 3개 URL(Task 3 Step 4)을 모두 태스크로 매핑했다. 누락 없음.
- **Placeholder 스캔**: "TBD"·"나중에"·"적절히 처리" 같은 표현 없음. 모든 스텝에 실제 코드/명령어를 포함했다.
- **타입 일관성**: `stageBanner(levelIndex: number, name: string): string`이 Task 1(정의)과 Task 3(사용) 양쪽에서 동일한 이름·인자 순서로 쓰인다.
