# 고퍼 자연 세계관 에셋 & 배경음악 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이 게임(Phaser 4 + TypeScript 플랫포머)의 모든 그림(플레이어·기믹 16종·배경·땅)을 픽셀 격자 스타일로 다시 그리고, 낮의 초원→노을 숲→지하 굴 3단계 세계관 배경(2겹 시차)을 넣고, 배경음악을 타이틀부터 끊김없이 재생하게 만든다.

**Architecture:** 렌더러·물리·레벨 데이터는 그대로 두고, `BootScene.ts`의 텍스처 생성 코드와 `config.ts`의 팔레트 상수만 다시 쓴다. 예외 둘: (1) 정적 발판만 `Sprite`→`TileSprite`로 바꿔 늘어짐 없는 반복 무늬를 얻는다. (2) 배경에 `TileSprite` 기반 시차 레이어 1장을 새로 추가한다. 배경음악은 게임 인스턴스 전역 사운드 매니저를 재사용하는 모듈 하나로 넣는다.

**Tech Stack:** Phaser 4.2.1, TypeScript, Vite, Vitest.

## Global Constraints

- 스펙 원본: `docs/superpowers/specs/2026-08-05-gopher-nature-assets-design.md` (검증 완료, `docs/demiurge/rl-verify/gopher-nature-assets-design/report.md` 참고).
- 렌더러 설정(`main.ts`의 `antialias`/`roundPixels`)과 `display.ts`의 `TEXTURE_SCALE`/`snapToDevicePixel`은 **일절 변경 금지** — 최근 6개 커밋이 잡은 화면 일렁임 버그 재발 방지.
- 모든 텍스처는 **2논리단위 격자**에 맞춰 `fillRect`만 사용한다(곡선 도형 `fillRoundedRect`/`fillCircle` 금지).
- 게임 규칙·물리·난이도·레벨 데이터(발판 좌표·크기)는 **일절 변경하지 않는다.**
- **이 저장소의 시각/렌더링 코드(BootScene.ts, GameScene.ts, 오브젝트 클래스)는 프로젝트 전체에 Vitest 테스트가 하나도 없다** — `patrol.ts`/`motion.ts`/`ballistics.ts`/`shield.ts`/`hitbox.ts`처럼 Phaser에서 뽑아낸 순수 함수만 테스트한다는 게 기존 관례다(`CLAUDE.md` "결정론·테스트 분리" 참고). 아래 Task 중 순수 로직이 없는 시각 전용 작업(텍스처 재작성, 배경 레이어, 오디오)은 이 관례를 따라 **Vitest 테스트를 작성하지 않는다** — 대신 `npm run build`(타입체크)와 수동 플레이테스트로 검증한다. 유일하게 순수 함수인 Task 2(`worldForStage`)만 Vitest 테스트를 쓴다.
- 새 파일 `src/worlds.ts`, `src/audio.ts`는 스펙 승인 시점에 그대로 유지하기로 확정됐다(수렴 검증 중 "기존 파일에 통합하자"는 제안이 나왔으나 채택 여부는 사용자 선택 사항으로 남겨졌고, 이 플랜은 승인된 스펙을 그대로 따른다).
- **정정 사항(수렴 검증 반영, 스펙 §5 최신본)**: "6종 기계 발판은 Arcade 물리 컴포넌트 재구현이 필요해 TileSprite를 못 쓴다"는 근거는 삭제됐다 — `physics.add.existing`은 임의 GameObject를 받는 제네릭이라 기술적 장벽은 없다. 이 6종을 TileSprite로 바꾸지 않는 진짜 이유는 "땅이 아니라 기계 장치라 애초에 무늬가 필요 없다"는 디자인 판단뿐이다.

## 코드 인벤토리 검증 (실제 확인 완료)

스펙 §11의 파일 표는 "`src/objects/MovingPlatform.ts` 등 6종 | 텍스처만 재작성"이라 적었지만, 실제로 이 6개(및 다른 10개 기믹) 오브젝트 파일을 전부 열어 확인한 결과 **다음을 제외하면 오브젝트 파일 자체는 단 한 줄도 고칠 필요가 없다**(전부 `TEX.*` 키만 참조하고 색을 직접 그리지 않음):

- `src/objects/Pendulum.ts:46,75` — 사슬을 `COLORS.CHAIN`으로 직접 `Graphics` 선으로 그린다(텍스처 아님). "사슬→덩굴" 룩은 `COLORS.CHAIN` 값만 바꾸면 되므로(선 굵기·형태는 그대로) **이 파일도 코드 변경은 불필요**하다.
- `Turret.ts`(조준선), `Thwomp.ts`/`TrapFloor.ts`/`PopupSpike.ts`(경고 깜빡임 `setTint(COLORS.TELEGRAPH)`)는 전부 **게임플레이 신호색**이라 이번 리스킨과 무관 — 손대지 않는다.
- `Player.ts:159`의 실드 링도 `COLORS.SHIELD`를 참조만 하므로 코드 변경 불필요.

즉 이번 작업에서 실제로 코드를 고치는 파일은 **`config.ts`, `BootScene.ts`, `GameScene.ts`, `MenuScene.ts`, 신규 `worlds.ts`/`audio.ts`뿐**이다. `src/objects/*.ts`는 색상 상수 값이 `config.ts`에서 바뀌는 덕에 자동으로 반영된다.

---

## 스킬 검색 (Skill Discovery)

Memory에 저장된 이전 매핑 테이블 없음(이 세션에 Memory read/write 도구가 연결되어 있지 않음 — 아래 표는 이번 세션의 `~/.claude` 스킬·에이전트 목록 fresh 검색 결과).

| 용도 | 스킬/에이전트 | 적용 Task |
|------|--------------|-----------|
| 코드 리뷰(경량, 반복용) | `/code-review` | Task 1~10 각각 완료 후 |
| 코드 리뷰(다관점·최종 게이트) | `/compound-engineering:ce-code-review` | 전체 완료 후 1회 |
| 앱 실행·시각 확인 | `/run` | Task 3, 4, 6, 7, 8, 9 (시각적 변경) 완료 후 |
| 디버깅 | `/debug` | 빌드 실패·런타임 에러 발생 시 |
| 최종 완료조건 검증 | `/rl` | 전체 Task 완료 후 |

---

## Task List

### Task 1: 팔레트·상수 확장

**Files:**
- Modify: `src/config.ts`

**Interfaces:**
- Consumes: 없음(최상위 상수 파일)
- Produces: `COLORS.OUTLINE`, `COLORS.HILL_FAR`, `COLORS.SKY_DUSK_TOP`, `COLORS.SKY_DUSK_MID`, `COLORS.SKY_DUSK_BOTTOM`, `COLORS.CAVE_ROCK`, `COLORS.DIRT`, `COLORS.DIRT_DETAIL`, `COLORS.GRASS_TOP`(이하 Task 2~10이 참조), `PARALLAX.FAR_FACTOR`, `DEPTH.BACKGROUND_FAR`, `TEX.BG_GRASSLAND`, `TEX.BG_SUNSET`, `TEX.BG_UNDERGROUND`(Task 9가 참조), `TEX.GROUND_TILE`(Task 4가 참조)

- [ ] **Step 1: `COLORS`에 신규 항목 추가**

`src/config.ts`의 `COLORS` 객체(기존 `SHIELD: 0xffec27,` 다음 줄)에 추가:

```ts
  // Gopher-nature reskin (2026-08-05).
  OUTLINE: 0x000000,
  HILL_FAR: 0x008751,
  SKY_DUSK_TOP: 0x7e2553,
  SKY_DUSK_MID: 0xff77a8,
  SKY_DUSK_BOTTOM: 0xffa300,
  CAVE_ROCK: 0x83769c,
  DIRT: 0xab5236,
  DIRT_DETAIL: 0x5f574f,
  GRASS_TOP: 0x00e436,
```

- [ ] **Step 2: 기존 "버려진 기계" 계열 색을 녹빛으로 변경**

같은 `COLORS` 객체 안에서 다음 값을 바꾼다(실루엣은 그대로, 색만 변경 — 스펙 §7):

```ts
  GEAR: 0x5f574f, // was 0x8f8f8f — 녹슨 회색
  TURRET: 0x596652, // was 0xab5236 — 녹슨 카키
  CANNON: 0x596652, // was 0xc2c3c7 — 녹슨 카키
  CANNONBALL: 0x5f574f, // was 0xffa300 — 녹슨 쇠구슬
  PROJECTILE: 0xab5236, // was 0xffec27 — 나무 가시
  SHOOTER: 0x008751, // was 0x422136 — 가시덤불 발사기
  SPRING: 0xff004d, // was 0x00e436 — 버섯 갓(빨강)
  MOVING: 0xab5236, // was 0x1c5fc9 — 나무 통나무
  CONVEYOR: 0x5f4636, // was 0x475c7a — 뿌리 벨트
  PENDULUM_HEAD: 0xab5236, // was 0xffa300 — 솔방울
  CHAIN: 0x008751, // was 0xc2c3c7 — 덩굴
  THWOMP: 0x5f574f, // was 0x7e2553 — 바위
  GOAL: 0x00e436, // 유지 — 나뭇잎 깃발도 초록이라 값 그대로
  SHIELD: 0x00e436, // was 0xffec27 — 나뭇잎 방패(플레이어 실드 링도 자동 반영)
  SPIKE: 0xab5236, // was 0xfff1e8 — 가시덤불(갈색)
  CONVEYOR_ARROW: 0xfff1e8, // was 0x9bb0c9 — 뿌리 사이 밝은 섬유질(대비용)
```

- [ ] **Step 3: `PARALLAX`, `DEPTH.BACKGROUND_FAR` 추가**

`CAMERA` 상수 블록 다음에 추가:

```ts
/** 먼 배경 레이어의 시차 배율. */
export const PARALLAX = {
  /** 카메라 스크롤 대비 배경이 움직이는 비율(5배 느림). */
  FAR_FACTOR: 0.2,
} as const;
```

`DEPTH` 객체의 `BACKGROUND: -10,` 다음 줄에 추가:

```ts
  BACKGROUND_FAR: -5,
```

- [ ] **Step 4: 신규 `TEX` 키 추가**

`TEX` 객체의 `SHIELD: "tex-shield",` 다음 줄에 추가:

```ts
  GROUND_TILE: "tex-ground-tile",
  BG_GRASSLAND: "tex-bg-grassland",
  BG_SUNSET: "tex-bg-sunset",
  BG_UNDERGROUND: "tex-bg-underground",
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공 (아직 아무도 새 키를 참조하지 않으므로 미사용 경고 없이 타입체크만 통과)

- [ ] **Step 6: 커밋**

```bash
git add src/config.ts
git commit -m "feat(assets): extend palette and constants for gopher-nature reskin"
```

---

### Task 2: 세계 매핑 모듈 (`src/worlds.ts`)

**Files:**
- Create: `src/worlds.ts`
- Test: `src/worlds.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `export const WORLDS: readonly ["grassland","sunset","underground"]`, `export type World = "grassland" | "sunset" | "underground"`, `export function worldForStage(index: number): World` — Task 9(`GameScene.ts`)가 이 함수를 `import { worldForStage } from "../worlds"`로 사용한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/worlds.test.ts` 새로 작성:

```ts
import { describe, it, expect } from "vitest";
import { worldForStage } from "./worlds";

describe("worldForStage", () => {
  // [Happy] 각 세계의 대표 스테이지가 올바른 세계를 반환한다.
  it("returns grassland for stage index 0 (stage 1)", () => {
    expect(worldForStage(0)).toBe("grassland");
  });

  it("returns sunset for stage index 3 (stage 4)", () => {
    expect(worldForStage(3)).toBe("sunset");
  });

  it("returns underground for stage index 5 (stage 6)", () => {
    expect(worldForStage(5)).toBe("underground");
  });

  // [Boundary] 세계 경계에 있는 인덱스(2↔3, 4↔5)가 정확히 갈린다.
  it("stage index 2 (last grassland stage) is still grassland", () => {
    expect(worldForStage(2)).toBe("grassland");
  });

  it("stage index 4 (last sunset stage) is still sunset", () => {
    expect(worldForStage(4)).toBe("sunset");
  });

  it("stage index 7 (last stage) is underground", () => {
    expect(worldForStage(7)).toBe("underground");
  });

  // [Boundary] 범위 밖 인덱스는 첫 세계로 폴백한다(레벨 데이터의 levelAt과 동일 관례).
  it("falls back to the first world for a negative index", () => {
    expect(worldForStage(-1)).toBe("grassland");
  });

  it("falls back to the first world for an out-of-range index", () => {
    expect(worldForStage(99)).toBe("grassland");
  });
});
```

> **예외 케이스 없음에 대한 사유**: `worldForStage`는 배열 조회 + `??` 폴백뿐인 순수 함수라 예외를 던지지 않는다(레벨 데이터의 `levelAt()`과 동일한 패턴). 위 8개 테스트가 Happy 3종 + Boundary 5종(세계 경계 2개 + 범위 밖 2개)을 모두 덮는다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- worlds.test.ts`
Expected: FAIL — `Cannot find module './worlds'`

- [ ] **Step 3: 최소 구현 작성**

`src/worlds.ts` 새로 작성:

```ts
/**
 * 스테이지 인덱스(0-based) → 세계 매핑. `LevelDef`에 필드를 추가하지 않고
 * 여기서 도출한다(레벨 데이터 스키마 변경 없음).
 */
export const WORLDS = ["grassland", "sunset", "underground"] as const;
export type World = (typeof WORLDS)[number];

const WORLD_FOR_STAGE: World[] = [
  "grassland", "grassland", "grassland",
  "sunset", "sunset",
  "underground", "underground", "underground",
];

export function worldForStage(index: number): World {
  return WORLD_FOR_STAGE[index] ?? WORLD_FOR_STAGE[0];
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- worlds.test.ts`
Expected: PASS (8/8)

- [ ] **Step 5: 커밋**

```bash
git add src/worlds.ts src/worlds.test.ts
git commit -m "feat(worlds): add stage-to-world mapping"
```

---

### Task 3: 플레이어(고퍼) 텍스처 재설계

**Files:**
- Modify: `src/scenes/BootScene.ts` (`makePlayerTexture()` 메서드만)

**Interfaces:**
- Consumes: `COLORS.OUTLINE`, `COLORS.PLAYER`(Task 1)
- Produces: `TEX.PLAYER` 텍스처 모양 변경(키·크기 불변 — `Player.ts`는 무수정)

- [ ] **Step 1: `makePlayerTexture()` 교체**

`src/scenes/BootScene.ts`의 기존 `makePlayerTexture()`(둥근 사각형 버전) 전체를 다음으로 교체:

```ts
/** 고퍼: 각진 실루엣 + 검정 테두리 + 귀·코·앞니·발(14x20 아트 픽셀, 2단위 격자). */
private makePlayerTexture(): void {
  const w = 28;
  const h = 40;
  const g = this.beginTexture();
  const px = (x: number, y: number, pw: number, ph: number, color: number): void => {
    g.fillStyle(color, 1);
    g.fillRect(x * 2, y * 2, pw * 2, ph * 2);
  };

  // 검정 테두리(귀 2개 포함 실루엣).
  px(1, 0, 2, 2, COLORS.OUTLINE);
  px(11, 0, 2, 2, COLORS.OUTLINE);
  px(2, 0, 10, 1, COLORS.OUTLINE);
  px(1, 1, 12, 1, COLORS.OUTLINE);
  px(0, 2, 14, 16, COLORS.OUTLINE);
  px(1, 18, 12, 1, COLORS.OUTLINE);
  px(2, 19, 10, 1, COLORS.OUTLINE);

  // 몸통(테두리 안쪽으로 1아트픽셀 인셋).
  px(3, 1, 8, 1, COLORS.PLAYER);
  px(2, 2, 10, 1, COLORS.PLAYER);
  px(1, 3, 12, 14, COLORS.PLAYER);
  px(2, 17, 10, 1, COLORS.PLAYER);
  px(3, 18, 8, 1, COLORS.PLAYER);

  // 눈.
  px(3, 5, 2, 2, 0xfff1e8);
  px(9, 5, 2, 2, 0xfff1e8);
  px(4, 6, 1, 1, COLORS.OUTLINE);
  px(10, 6, 1, 1, COLORS.OUTLINE);

  // 코 + 앞니(고퍼 정체성 단서).
  px(6, 8, 2, 1, COLORS.OUTLINE);
  px(5, 9, 4, 2, 0xfff1e8);
  px(7, 9, 1, 2, COLORS.OUTLINE);

  // 발.
  px(2, 18, 3, 2, 0xffccaa);
  px(9, 18, 3, 2, 0xffccaa);

  this.endTexture(g, TEX.PLAYER, w, h);
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run build`
Expected: 성공

- [ ] **Step 3: 시각 확인**

Run: `npm run dev` 후 브라우저에서 아무 스테이지나 시작해 플레이어가 각진 실루엣 + 검정 테두리로 보이는지, 좌우 이동 시 `setFlipX`로 자연스럽게 뒤집히는지 확인. 히트박스는 `Player.ts`를 건드리지 않았으므로 점프·충돌 감각이 이전과 동일해야 한다.

- [ ] **Step 4: 커밋**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat(assets): redesign player texture as blocky gopher silhouette"
```

---

### Task 4: 지형(정적 발판) 텍스처 재작성 + TileSprite 전환

**Files:**
- Modify: `src/scenes/BootScene.ts` (신규 `makeGroundTileTexture()` 메서드 추가, `makeRectTexture(TEX.PLATFORM, ...)` 호출 제거)
- Modify: `src/scenes/GameScene.ts` (`makeStaticPlatform()`)

**Interfaces:**
- Consumes: `TEX.GROUND_TILE`(Task 1), `COLORS.GRASS_TOP`/`DIRT`/`DIRT_DETAIL`(Task 1), `TEXTURE_SCALE`(기존 `display.ts`)
- Produces: 정적 발판이 `TileSprite`로 그려짐(물리 판정 동일, `this.platforms` 그룹 멤버십 동일)

- [ ] **Step 1: 흙+풀 타일 텍스처 추가**

`src/scenes/BootScene.ts`의 `makeRectTexture(TEX.PLATFORM, 32, 32, COLORS.PLATFORM, COLORS.PLATFORM_TOP);` 줄을 삭제하고, `create()` 안 같은 자리에 `this.makeGroundTileTexture();`를 추가한다. 그리고 새 private 메서드를 추가:

```ts
/** 반복 배치되는 흙+풀 타일(64x44). 발판 폭에 맞춰 늘리지 않고 TileSprite로 이어붙인다. */
private makeGroundTileTexture(): void {
  const w = 64;
  const h = 44;
  const g = this.beginTexture();
  g.fillStyle(COLORS.GRASS_TOP, 1);
  g.fillRect(0, 0, w, 6);
  g.fillStyle(COLORS.DIRT, 1);
  g.fillRect(0, 6, w, h - 6);
  g.fillStyle(COLORS.DIRT_DETAIL, 1);
  g.fillRect(8, 16, 6, 4);
  g.fillRect(38, 28, 8, 4);
  g.fillRect(20, 12, 4, 4);
  g.fillRect(50, 10, 4, 12);
  this.endTexture(g, TEX.GROUND_TILE, w, h);
}
```

- [ ] **Step 2: `GameScene.makeStaticPlatform()` 교체**

`src/scenes/GameScene.ts`의 기존:

```ts
  private makeStaticPlatform(p: PlatformDef): void {
    const img = this.platforms.create(
      p.x + p.width / 2,
      p.y + p.height / 2,
      TEX.PLATFORM,
    ) as Phaser.Physics.Arcade.Sprite;
    img.setDisplaySize(p.width, p.height);
    img.setDepth(DEPTH.PLATFORM);
    img.refreshBody(); // resize the static body to match the display size
  }
```

를 다음으로 교체:

```ts
  private makeStaticPlatform(p: PlatformDef): void {
    const vis = this.add.tileSprite(
      p.x + p.width / 2,
      p.y + p.height / 2,
      p.width,
      p.height,
      TEX.GROUND_TILE,
    );
    vis.setTileScale(1 / TEXTURE_SCALE, 1 / TEXTURE_SCALE);
    vis.setDepth(DEPTH.PLATFORM);
    this.physics.add.existing(vis, true);
    (vis.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    this.platforms.add(vis);
  }
```

이 교체로 `TEX.PLATFORM`, `COLORS.PLATFORM`, `COLORS.PLATFORM_TOP`을 참조하는 곳이 저장소 전체에 하나도 남지 않는다(전부 이 메서드 하나에서만 쓰였다 — 이 Task의 수정이 만든 데드 코드이므로 `CLAUDE.md`의 "본인의 수정으로 안 쓰이게 된 것은 제거한다" 규칙에 따라 삭제한다). `src/config.ts`에서 다음 세 줄을 삭제한다:

```
  PLATFORM: 0x5f574f,       // COLORS 객체
  PLATFORM_TOP: 0x7d7460,   // COLORS 객체
  PLATFORM: "tex-platform", // TEX 객체
```

삭제 전에 다른 참조가 없는지 확인:

```bash
grep -rn "TEX.PLATFORM\|COLORS.PLATFORM\b\|COLORS.PLATFORM_TOP" src/
```

Expected: `config.ts`의 선언부와 이번에 지운 `GameScene.ts`의 옛 호출부(이미 삭제됨) 외에는 매치되는 곳이 없음.

- [ ] **Step 3: 타입체크**

Run: `npm run build`
Expected: 성공. `this.platforms`는 `Phaser.Physics.Arcade.StaticGroup`이고 `.add()`는 임의 GameObject를 받으므로 타입 오류 없음.

- [ ] **Step 4: 수동 검증(물리 판정 유지 확인)**

Run: `npm run dev`, 브라우저에서 `?stage=1`, `?stage=3`(가장 다양한 폭의 발판), `?stage=7`(가장 긴 스테이지)로 이동해:
1. 여러 폭의 발판(예: level3의 다양한 발판)에서 자갈 무늬 크기가 전부 동일하게 보이는지(늘어지지 않는지) 확인.
2. 발판 위에 착지·좌우로 걷다가 발판 끝에서 떨어지는 판정이 이전과 동일한지(발판 경계에서 판정 밀림 없는지) 확인.
3. 발판 폭이 타일(64)보다 좁은 곳(예: 40폭 발판)에서 타일이 잘려서 채워지는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add src/scenes/BootScene.ts src/scenes/GameScene.ts
git commit -m "feat(terrain): replace stretched platform texture with tiled ground TileSprite"
```

---

### Task 5: 자연 생물·위험 기믹 재설계 (적·가시·진자·압사기)

**Files:**
- Modify: `src/scenes/BootScene.ts` (`makeRectTexture(TEX.ENEMY, ...)` 호출부, `makeSpikeTexture()`, `makePendulumHeadTexture()`, `makeThwompTexture()`)

**Interfaces:**
- Consumes: `COLORS.OUTLINE`, `COLORS.ENEMY`, `COLORS.SPIKE`, `COLORS.PENDULUM_HEAD`, `COLORS.CHAIN`(Task 1에서 재정의됨), `COLORS.THWOMP`
- Produces: 4개 텍스처 모양 변경(키·크기·히트박스 불변)

- [ ] **Step 1: 적(딱정벌레)**

`create()`의 `this.makeRectTexture(TEX.ENEMY, 32, 28, COLORS.ENEMY);` 줄을 삭제하고 새 메서드로 교체:

```ts
/** 적: 딱정벌레 — 둥근 등딱지 대신 각진 갑각 + 화난 눈. */
private makeEnemyTexture(): void {
  const w = 32;
  const h = 28;
  const g = this.beginTexture();
  g.fillStyle(COLORS.OUTLINE, 1);
  g.fillRect(2, 4, 28, 20);
  g.fillStyle(COLORS.ENEMY, 1);
  g.fillRect(4, 6, 24, 16);
  g.fillStyle(COLORS.OUTLINE, 1);
  g.fillRect(6, 10, 4, 4); // left eye
  g.fillRect(22, 10, 4, 4); // right eye
  g.fillRect(0, 8, 4, 2); // left antenna
  g.fillRect(28, 8, 4, 2); // right antenna
  this.endTexture(g, TEX.ENEMY, w, h);
}
```

`create()`에서 `this.makeEnemyTexture();` 호출로 교체.

- [ ] **Step 2: 가시(가시덤불)**

기존 `makeSpikeTexture()`를 다음으로 교체(형태는 유지, 색만 변경 — 히트박스가 삼각 실루엣 크기에 맞춰져 있으므로 모양은 그대로 둔다):

```ts
/** 가시덤불: 기존 삼각 톱니 실루엣 유지, 갈색·진초록 배색으로 변경. */
private makeSpikeTexture(): void {
  const s = 32;
  const g = this.beginTexture();
  g.fillStyle(COLORS.SPIKE, 1);
  for (let i = 0; i < 3; i++) {
    const base = (i * s) / 3;
    const step = s / 3;
    g.fillTriangle(base, s, base + step / 2, 0, base + step, s);
  }
  g.fillStyle(COLORS.HILL_FAR, 1);
  g.fillRect(0, s - 4, s, 4);
  this.endTexture(g, TEX.SPIKE, s, s);
}
```

- [ ] **Step 3: 진자 헤드(솔방울) — 사슬은 Step 1의 `COLORS.CHAIN` 재정의만으로 자동 반영**

기존 `makePendulumHeadTexture()`(8방향 스파이크 원형)를 각진 버전으로 교체:

```ts
/** 솔방울: 사각 비늘이 어긋나게 쌓인 실루엣(원형 히트박스는 Pendulum.ts가 별도 관리, 텍스처만 변경). */
private makePendulumHeadTexture(): void {
  const s = 40;
  const g = this.beginTexture();
  g.fillStyle(COLORS.PENDULUM_HEAD, 1);
  g.fillRect(12, 4, 16, 32);
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 === 0 ? 4 : 12;
    g.fillStyle(COLORS.DIRT_DETAIL, 1);
    g.fillRect(offset, 6 + row * 8, 8, 4);
    g.fillRect(s - offset - 8, 6 + row * 8, 8, 4);
  }
  this.endTexture(g, TEX.PENDULUM_HEAD, s, s);
}
```

- [ ] **Step 4: 압사기(바위)**

기존 `makeThwompTexture()`(자주색 얼굴 블록)를 다음으로 교체(경고 틴트 `COLORS.TELEGRAPH`는 `Thwomp.ts`가 그대로 씌우므로 무관):

```ts
/** 바위 압사기: 회색 돌 + 금 간 무늬 + 화난 눈. */
private makeThwompTexture(): void {
  const w = 60;
  const h = 60;
  const g = this.beginTexture();
  g.fillStyle(COLORS.THWOMP, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(COLORS.DIRT_DETAIL, 1);
  g.fillRect(0, 0, w, 4); // rim
  g.fillRect(10, 30, 20, 3); // crack
  g.fillRect(34, 40, 3, 14); // crack
  g.fillStyle(COLORS.THWOMP_FACE, 1);
  g.fillRect(14, 22, 8, 10); // left eye
  g.fillRect(38, 22, 8, 10); // right eye
  g.fillRect(18, 44, 24, 5); // gritted mouth
  this.endTexture(g, TEX.THWOMP, w, h);
}
```

- [ ] **Step 5: 타입체크 + 시각 확인**

Run: `npm run build` → 성공 확인. `npm run dev`로 `?stage=1`(적·가시), `?stage=3`(진자), `?stage=4`(압사기)에서 각각 새 모양이 보이고, 즉사 판정(적 옆 충돌, 가시 접촉, 진자 헤드 접촉, 압사기 낙하 접촉)이 이전과 동일하게 동작하는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat(assets): redesign enemy, spike, pendulum, thwomp textures"
```

---

### Task 6: 자연 장치형 발판 6종 재설계 (점프대·이동발판·컨베이어·위장발판/낙하함정)

**Files:**
- Modify: `src/scenes/BootScene.ts` (`makeSpringTexture()`, `makeRectTexture(TEX.MOVING, ...)`, `makeConveyorTexture()`, `makeRectTexture(TEX.FAKE, ...)`)

**Interfaces:**
- Consumes: `COLORS.SPRING`, `COLORS.MOVING`, `COLORS.CONVEYOR`, `COLORS.CONVEYOR_ARROW`, `COLORS.FAKE`, `COLORS.DIRT`, `COLORS.HILL_FAR`(Task 1)
- Produces: 4개 텍스처 모양 변경(`TrapFloor`는 `TEX.FAKE`를 그대로 재사용하므로 별도 작업 없음)

- [ ] **Step 1: 점프대(버섯)**

기존 `makeSpringTexture()`(코일 지그재그)를 교체:

```ts
/** 버섯 점프대: 기둥 + 둥근 갓 대신 각진 갓(2단위 격자). */
private makeSpringTexture(): void {
  const w = 32;
  const h = 20;
  const g = this.beginTexture();
  g.fillStyle(0xfff1e8, 1);
  g.fillRect(12, 8, 8, 12); // stem
  g.fillStyle(COLORS.SPRING, 1);
  g.fillRect(0, 0, w, 8); // cap top
  g.fillRect(4, 8, w - 8, 4); // cap rim
  g.fillStyle(0xfff1e8, 1);
  g.fillRect(6, 2, 4, 4); // cap spots
  g.fillRect(22, 2, 4, 4);
  this.endTexture(g, TEX.SPRING, w, h);
}
```

- [ ] **Step 2: 이동발판(통나무)**

`create()`의 `this.makeRectTexture(TEX.MOVING, 32, 32, COLORS.MOVING, 0x4d8fe0);` 줄을 삭제하고 새 메서드 추가:

```ts
/** 나무 통나무: 가로 나이테 띠(늘려도 왜곡 없는 균일 패턴). */
private makeLogTexture(): void {
  const w = 32;
  const h = 32;
  const g = this.beginTexture();
  g.fillStyle(COLORS.MOVING, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(COLORS.DIRT_DETAIL, 1);
  g.fillRect(0, 0, w, 3);
  g.fillRect(0, h - 3, w, 3);
  g.fillStyle(0xfff1e8, 1);
  g.fillRect(0, 14, w, 2); // core ring highlight
  this.endTexture(g, TEX.MOVING, w, h);
}
```

`create()`에서 `this.makeLogTexture();` 호출로 교체.

- [ ] **Step 3: 컨베이어(뿌리 벨트)**

기존 `makeConveyorTexture()`(화살촉 유지, 색만 변경):

```ts
/** 뿌리 벨트: 화살촉 방향 신호는 유지(기능상 필수), 배색만 자연 톤으로. */
private makeConveyorTexture(): void {
  const w = 64;
  const h = 24;
  const g = this.beginTexture();
  g.fillStyle(COLORS.CONVEYOR, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(COLORS.CONVEYOR_ARROW, 1);
  for (let x = 4; x < w; x += 20) {
    g.fillTriangle(x, 6, x, 18, x + 10, 12); // right-pointing chevron
  }
  this.endTexture(g, TEX.CONVEYOR, w, h);
}
```

- [ ] **Step 4: 위장발판/낙하함정(이끼 낀 땅)**

`create()`의 `this.makeRectTexture(TEX.FAKE, 32, 32, COLORS.FAKE, 0x87693f);` 줄을 삭제하고 새 메서드 추가:

```ts
/** 위장발판/낙하함정 공유 텍스처: 새 땅 무늬와 유사한 이끼 낀 흙(구분 단서는 미세한 색조 차이). */
private makeFakeGroundTexture(): void {
  const w = 32;
  const h = 32;
  const g = this.beginTexture();
  g.fillStyle(COLORS.FAKE, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(COLORS.HILL_FAR, 1);
  g.fillRect(0, 0, w, 4);
  this.endTexture(g, TEX.FAKE, w, h);
}
```

`create()`에서 `this.makeFakeGroundTexture();` 호출로 교체.

- [ ] **Step 5: 타입체크 + 시각 확인**

Run: `npm run build` → 성공. `npm run dev`로 `?stage=3`(점프대·이동발판·컨베이어·위장발판 전부 등장)에서 모양 확인 + 점프대 반발력, 이동발판 탑승, 컨베이어 밀림, 위장발판 붕괴가 전부 이전과 동일하게 동작하는지 확인.

- [ ] **Step 6: 커밋**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat(assets): redesign spring, moving platform, conveyor, fake ground textures"
```

---

### Task 7: 버려진 기계 계열 재설계 (톱니·발사체·화살발사기·터렛·대포·대포알)

**Files:**
- Modify: `src/scenes/BootScene.ts` (`makeGearTexture()`, `makeProjectileTexture()`, `makeShooterTexture()`, `makeTurretTexture()`, `makeRectTexture(TEX.CANNON, ...)`, `makeCannonballTexture()`)

**Interfaces:**
- Consumes: `COLORS.GEAR`, `COLORS.PROJECTILE`, `COLORS.SHOOTER`, `COLORS.TURRET`, `COLORS.CANNON`, `COLORS.CANNONBALL`(전부 Task 1에서 녹빛/나무색으로 재정의됨), `COLORS.DIRT_DETAIL`
- Produces: 6개 텍스처의 **색만** 변경(실루엣·좌표는 기존 코드 그대로 — 이미 형태가 뚜렷해 재설계 불필요, 스펙 §7)

이 Task는 **모양 코드를 바꾸지 않는다** — Task 1에서 이미 `COLORS.GEAR`/`TURRET`/`CANNON`/`CANNONBALL`/`PROJECTILE`/`SHOOTER` 값을 녹빛/나무색으로 바꿨으므로, `BootScene.ts`의 `makeGearTexture()`, `makeProjectileTexture()`, `makeShooterTexture()`, `makeTurretTexture()`, `makeCannonballTexture()`, `this.makeRectTexture(TEX.CANNON, 40, 30, COLORS.CANNON, 0xffffff)` 호출은 **전부 색 상수를 그대로 참조하므로 코드 수정 없이 자동으로 새 색이 적용된다.**

- [ ] **Step 1: 확인만 — 코드 변경 없음**

`src/scenes/BootScene.ts`에서 위 6개 메서드의 **주 몸체 색**이 전부 `COLORS.*` 이름으로 참조되는지 확인한다:

```bash
grep -n "fillStyle(0x\|fillStyle(COLORS" src/scenes/BootScene.ts
```

Expected: `makeGearTexture`(허브 `0x4a4a4a`), `makeShooterTexture`(총구 `0x1a0d16`), `makeTurretTexture`(포신 `0x6b2f1e`, 눈 `0xffec27`), `makeRectTexture(TEX.CANNON, ...)`(상단 하이라이트 `0xffffff`)에 하드코딩된 hex가 몇 개 남아 있음을 확인한다 — 이것들은 **어두운 허브·총구·포신, 밝은 눈·하이라이트 같은 중립 보조색**이라 몸체가 무슨 색이든(지금의 회색·적갈색이든, 바뀐 뒤의 녹빛이든) 자연스럽게 어울리므로 **의도적으로 그대로 둔다.** 주 몸체(`COLORS.GEAR`/`PROJECTILE`/`SHOOTER`/`TURRET`/`CANNON`/`CANNONBALL`)만 이름으로 참조되고 있으면 이 Step은 통과다. 주 몸체 색이 하드코딩돼 있는 경우에만 그 줄을 `COLORS.*` 참조로 고친다.

- [ ] **Step 2: 타입체크 + 시각 확인**

Run: `npm run build` → 성공(변경 없으므로 당연히 통과, Task 1의 색 변경이 이미 반영됐는지 확인하는 단계).
`npm run dev`로 `?stage=8`(톱니), `?stage=5`(터렛), `?stage=6`(대포)에서 전부 녹슨 톤으로 보이는지 확인.

- [ ] **Step 3: 커밋**

이 Task는 별도 커밋 없음(Task 1의 커밋에 이미 색 값 변경이 포함됨). 대신 확인 결과만 기록:

```bash
git status --short
# 변경 없으면 그대로 다음 Task로.
```

---

### Task 8: 목표·아이템 재설계 (골·실드)

**Files:**
- Modify: `src/scenes/BootScene.ts` (`makeGoalTexture()`, `makeShieldTexture()`)

**Interfaces:**
- Consumes: `COLORS.GOAL`, `COLORS.SHIELD`(Task 1)
- Produces: 2개 텍스처 모양 변경(깃발을 나뭇잎 모양으로, 방패를 나뭇잎 방패로 — 십자 표식은 가독성 위해 유지)

- [ ] **Step 1: 골(나뭇잎 깃발)**

기존 `makeGoalTexture()`(삼각 깃발)를 교체:

```ts
/** 깃대는 유지, 깃발을 나뭇잎 모양(잎맥 표시)으로. */
private makeGoalTexture(): void {
  const w = 40;
  const h = 64;
  const g = this.beginTexture();
  g.fillStyle(0xfff1e8, 1);
  g.fillRect(4, 0, 4, h); // pole
  g.fillStyle(COLORS.GOAL, 1);
  g.fillRect(8, 6, 24, 20); // leaf body
  g.fillRect(32, 12, 6, 8); // leaf tip
  g.fillStyle(COLORS.HILL_FAR, 1);
  g.fillRect(8, 15, 26, 2); // leaf vein
  this.endTexture(g, TEX.GOAL, w, h);
}
```

- [ ] **Step 2: 실드(나뭇잎 방패)**

기존 `makeShieldTexture()`(방패 + 십자)를 교체(십자 표식은 가독성 위해 유지):

```ts
/** 나뭇잎 방패: 방패 실루엣 유지, 색만 초록으로(십자 표식은 가독성 위해 유지). */
private makeShieldTexture(): void {
  const w = 26;
  const h = 30;
  const g = this.beginTexture();
  g.fillStyle(COLORS.SHIELD, 1);
  g.fillRect(0, 0, w, h - 8);
  g.fillTriangle(0, h - 10, w, h - 10, w / 2, h);
  g.fillStyle(0xfff1e8, 1);
  g.fillRect(w / 2 - 2, 6, 4, 12);
  g.fillRect(w / 2 - 6, 10, 12, 4);
  this.endTexture(g, TEX.SHIELD, w, h);
}
```

- [ ] **Step 3: 타입체크 + 시각 확인**

Run: `npm run build` → 성공. `npm run dev`로 아무 스테이지에서 골(깃발) 확인, `?stage=6`에서 실드 아이템 획득 시 플레이어 주위 링 색도 자동으로 초록빛으로 바뀌는지 확인(`Player.ts:159`가 `COLORS.SHIELD`를 그대로 참조하므로 코드 변경 없이 반영됨).

- [ ] **Step 4: 커밋**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat(assets): redesign goal flag and shield pickup as leaf motifs"
```

---

### Task 9: 세계별 배경 시차 레이어

**Files:**
- Modify: `src/scenes/BootScene.ts` (신규 배경 텍스처 3종 추가)
- Modify: `src/scenes/GameScene.ts` (`drawBackground()`, `setCameraScroll()`, 신규 `layoutParallax()`)

**Interfaces:**
- Consumes: `worldForStage`(Task 2), `TEX.BG_GRASSLAND`/`BG_SUNSET`/`BG_UNDERGROUND`, `PARALLAX.FAR_FACTOR`, `DEPTH.BACKGROUND_FAR`(Task 1), `cameraViewOrigin`/`snapToDevicePixel`(기존 `display.ts`)
- Produces: `GameScene`에 `private farBg!: Phaser.GameObjects.TileSprite;` 필드, `drawBackground()`가 세계별 색+레이어를 그림, `layoutParallax()`가 `setCameraScroll()`에서 호출됨

- [ ] **Step 1: 배경 레이어 텍스처 3종 추가**

`src/scenes/BootScene.ts`의 `create()`에 `this.makeBackgroundTextures();` 호출을 추가하고, 새 private 메서드 추가:

```ts
/** 세계별 먼 배경 레이어(뷰포트 크기로 반복 배치될 소스 타일). */
private makeBackgroundTextures(): void {
  this.makeGrasslandBg();
  this.makeSunsetBg();
  this.makeUndergroundBg();
}

private makeGrasslandBg(): void {
  const w = 480;
  const h = 468;
  const g = this.beginTexture();
  g.fillStyle(COLORS.PLAYER, 1); // sky blue (same hue as the player — outline solves the readability risk)
  g.fillRect(0, 0, w, h);
  g.fillStyle(0xfff1e8, 1);
  g.fillRect(40, 40, 60, 12); // cloud
  g.fillRect(60, 28, 40, 12);
  g.fillRect(300, 60, 70, 12);
  g.fillStyle(COLORS.HILL_FAR, 1);
  g.fillRect(0, h - 120, 160, 120);
  g.fillRect(180, h - 90, 140, 90);
  g.fillRect(340, h - 130, 140, 130);
  this.endTexture(g, TEX.BG_GRASSLAND, w, h);
}

private makeSunsetBg(): void {
  const w = 480;
  const h = 468;
  const g = this.beginTexture();
  g.fillStyle(COLORS.SKY_DUSK_TOP, 1);
  g.fillRect(0, 0, w, h * 0.3);
  g.fillStyle(COLORS.SKY_DUSK_MID, 1);
  g.fillRect(0, h * 0.3, w, h * 0.25);
  g.fillStyle(COLORS.SKY_DUSK_BOTTOM, 1);
  g.fillRect(0, h * 0.55, w, h * 0.45);
  g.fillStyle(0xffec27, 1);
  g.fillRect(w / 2 - 30, h * 0.4, 60, 40); // low sun
  g.fillStyle(COLORS.OUTLINE, 1);
  g.fillRect(30, h - 140, 12, 140); // tree trunk
  g.fillRect(10, h - 200, 50, 70); // tree canopy
  g.fillRect(380, h - 160, 12, 160);
  g.fillRect(355, h - 220, 60, 80);
  this.endTexture(g, TEX.BG_SUNSET, w, h);
}

private makeUndergroundBg(): void {
  const w = 480;
  const h = 468;
  const g = this.beginTexture();
  g.fillStyle(COLORS.BACKGROUND, 1);
  g.fillRect(0, 0, w, h);
  g.fillStyle(COLORS.DIRT_DETAIL, 1);
  g.fillRect(0, 0, w, 40);
  g.fillStyle(COLORS.DIRT, 1);
  g.fillRect(60, 40, 10, 50); // root
  g.fillRect(220, 40, 8, 70);
  g.fillRect(380, 40, 10, 40);
  g.fillStyle(COLORS.CAVE_ROCK, 1);
  g.fillRect(120, 40, 16, 60); // stalactite
  g.fillRect(300, 40, 20, 80);
  g.fillStyle(0xff77a8, 1);
  g.fillRect(150, h - 120, 8, 8); // glowing mushroom accent
  g.fillRect(340, h - 100, 8, 8);
  this.endTexture(g, TEX.BG_UNDERGROUND, w, h);
}
```

- [ ] **Step 2: `GameScene.ts`에 시차 레이어 필드·생성 로직 추가**

`GameScene` 클래스의 필드 선언부(`private ending = false;` 근처)에 추가:

```ts
  private farBg!: Phaser.GameObjects.TileSprite;
```

import 목록에 `worldForStage`를 추가:

```ts
import { worldForStage } from "../worlds";
```

- [ ] **Step 3: `drawBackground()` 교체**

기존:

```ts
  private drawBackground(): void {
    this.add
      .rectangle(0, 0, this.level.worldWidth, this.level.worldHeight, COLORS.BACKGROUND)
      .setOrigin(0, 0)
      .setDepth(DEPTH.BACKGROUND);
  }
```

를 다음으로 교체:

```ts
  private drawBackground(): void {
    const world = worldForStage(this.levelIndex);
    const fillColor =
      world === "grassland" ? COLORS.PLAYER : world === "sunset" ? COLORS.SKY_DUSK_TOP : COLORS.BACKGROUND;
    this.add
      .rectangle(0, 0, this.level.worldWidth, this.level.worldHeight, fillColor)
      .setOrigin(0, 0)
      .setDepth(DEPTH.BACKGROUND);

    const bgTex =
      world === "grassland" ? TEX.BG_GRASSLAND : world === "sunset" ? TEX.BG_SUNSET : TEX.BG_UNDERGROUND;
    this.farBg = this.add.tileSprite(0, 0, 1, 1, bgTex).setOrigin(0, 0).setDepth(DEPTH.BACKGROUND_FAR);
    this.farBg.setTileScale(1 / TEXTURE_SCALE, 1 / TEXTURE_SCALE);
  }
```

- [ ] **Step 4: `layoutParallax()` 추가 + `setCameraScroll()`에서 호출**

`layoutHud()` 메서드 바로 앞에 새 메서드 추가:

```ts
  /**
   * 먼 배경 레이어를 뷰포트 크기로 맞춰 카메라 앞에 고정하고, tilePositionX로 5배
   * 느린 시차를 낸다. tilePositionX도 소수점이면 일렁이므로 snapToDevicePixel로
   * 스냅한다(display.ts 재사용, 새 스냅 함수 없음).
   */
  private layoutParallax(): void {
    if (!this.farBg) return;
    const cam = this.cameras.main;
    const left = cameraViewOrigin(cam.scrollX, cam.width, cam.zoom);
    const top = cameraViewOrigin(cam.scrollY, cam.height, cam.zoom);
    this.farBg.setPosition(left, top);
    this.farBg.setSize(cam.width / cam.zoom, cam.height / cam.zoom);
    this.farBg.tilePositionX = snapToDevicePixel(cam.scrollX * PARALLAX.FAR_FACTOR, cam.zoom);
  }
```

`setCameraScroll()`의 마지막 줄(`this.layoutHud();`) 다음에 추가:

```ts
    this.layoutParallax();
```

import 목록에 `PARALLAX`를 추가(`CAMERA, CANNON, COLORS, DEPTH, TEX` 옆에).

- [ ] **Step 5: 타입체크**

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 시각 확인 (일렁임 회귀 여부 포함)**

Run: `npm run dev`, `?stage=1`(초원)·`?stage=4`(노을)·`?stage=7`(지하, 천장 y=0 스테이지)로 각각 이동해:
1. 배경이 세계별로 다르게 보이는지.
2. 좌우로 걸을 때 먼 배경이 땅보다 느리게 움직이는지(시차 확인).
3. 화면 전체(특히 배경)가 이동 중 일렁이지 않는지 — 일렁이면 `layoutParallax()`의 스냅 계산을 재확인.
4. 창 크기를 바꿔(리사이즈) 배경이 여전히 뷰포트를 완전히 덮는지.

- [ ] **Step 7: 커밋**

```bash
git add src/scenes/BootScene.ts src/scenes/GameScene.ts
git commit -m "feat(background): add per-world parallax background layer"
```

---

### Task 10: 배경음악 통합

**Files:**
- Create: `src/audio.ts`
- Create: `public/audio/bgm.mp3` (사용자의 `~/Downloads/Quarter_Muncher.mp3` 복사)
- Modify: `src/scenes/BootScene.ts` (신규 `preload()`)
- Modify: `src/scenes/MenuScene.ts` (시작 핸들러)

**Interfaces:**
- Consumes: 없음(최상위 모듈)
- Produces: `export function startBgmOnce(scene: Phaser.Scene): void` — `MenuScene`이 사용

- [ ] **Step 1: 오디오 자산 복사**

```bash
mkdir -p public/audio
cp ~/Downloads/Quarter_Muncher.mp3 public/audio/bgm.mp3
```

- [ ] **Step 2: `src/audio.ts` 작성**

```ts
import Phaser from "phaser";

/**
 * 게임 인스턴스 전역에 하나뿐인 Phaser 사운드 매니저를 재사용해, 씬을 오가도
 * 배경음악이 다시 시작되지 않게 한다(scene.sound와 game.sound는 같은 인스턴스).
 */
let bgm: Phaser.Sound.BaseSound | undefined;

export function startBgmOnce(scene: Phaser.Scene): void {
  if (bgm?.isPlaying) return;
  bgm = scene.sound.add("bgm", { loop: true, volume: 0.5 });
  bgm.play();
}
```

- [ ] **Step 3: `BootScene`에 `preload()` 추가**

`src/scenes/BootScene.ts`의 `constructor()` 다음에 새 메서드 추가(지금은 `preload()`가 없음):

```ts
  preload(): void {
    this.load.audio("bgm", "audio/bgm.mp3");
  }
```

- [ ] **Step 4: `MenuScene` 시작 핸들러에서 재생 시작**

`src/scenes/MenuScene.ts` 상단 import에 추가:

```ts
import { startBgmOnce } from "../audio";
```

기존:

```ts
    const start = () => this.scene.start("GameScene", { level: 0 });
    this.input.keyboard!.once("keydown", start);
    this.input.once("pointerdown", start);
```

를 다음으로 교체:

```ts
    const start = () => {
      startBgmOnce(this);
      this.scene.start("GameScene", { level: 0 });
    };
    this.input.keyboard!.once("keydown", start);
    this.input.once("pointerdown", start);
```

같은 파일의 dev 전용 `?stage=N` 분기(`this.scene.start("GameScene", { level: requested, spawnX: ... })` 호출 바로 앞)에도 `startBgmOnce(this);`를 추가한다 — 그렇지 않으면 개발 중 `?stage=`로 바로 들어갈 때 음악이 재생되지 않는다.

- [ ] **Step 5: 타입체크**

Run: `npm run build`
Expected: 성공

- [ ] **Step 6: 수동 검증**

Run: `npm run dev`:
1. 타이틀 화면에서 아무 키나 눌러 게임 시작 → 음악이 재생되는지.
2. 일부러 죽어서 재시도 → 음악이 처음부터 다시 재생되지 않고 이어지는지.
3. 스테이지를 클리어해 다음 스테이지로 → 음악이 끊기지 않는지.
4. `public/audio/bgm.mp3`를 잠시 이름을 바꿔 로딩 실패를 재현 → 콘솔에 경고만 뜨고 게임 진행이 막히지 않는지 확인 후 파일명 원복.

- [ ] **Step 7: 커밋**

```bash
git add src/audio.ts public/audio/bgm.mp3 src/scenes/BootScene.ts src/scenes/MenuScene.ts
git commit -m "feat(audio): add persistent looping background music"
```

---

### Task 11: 전체 통합 플레이테스트

**Files:** 없음(코드 변경 없는 검증 전용 Task)

**Interfaces:** 없음

- [ ] **Step 1: 자동 검증**

```bash
npm test
npm run build
npm run preview
```

Expected: 유닛 테스트 전부 통과(로직 미변경 + Task 2의 신규 8개 테스트), 빌드 성공, 프로덕션 프리뷰 정상 기동.

- [ ] **Step 2: 8개 스테이지 전체 수동 플레이(스펙 §10 체크리스트)**

`npm run dev`로 1~8 스테이지를 전부 `?stage=N`으로 순회하며:
1. 픽셀 일렁임 재발 여부(특히 배경 레이어) — 창 리사이즈도 함께 확인.
2. 위험물 색이 배경에 묻히지 않는지(특히 초원 세계 하늘색 배경 vs 플레이어).
3. 타일링된 정적 발판의 충돌 판정이 기존과 동일한지.
4. 배경음악이 재시도·스테이지 전환·게임오버·승리 화면 전환에도 끊기지 않는지.
5. 세계 3단계(초원→노을→지하)가 스테이지 진행에 따라 자연스럽게 전환되는지.
6. 16종 기믹 전부가 새 실루엣으로 보이고 판정(즉사·처치·픽업)이 이전과 동일한지.

- [ ] **Step 3: 발견된 문제가 있으면 해당 Task로 돌아가 수정 후 재검증**

문제 없으면 다음 단계로.

- [ ] **Step 4: 최종 커밋 없음(이미 Task 1~10에서 전부 커밋됨) — `/rl` 또는 `/compound-engineering:ce-code-review`로 최종 게이트 실행**

---

## 완료조건 (Completion Criteria)

- [ ] `npm test` 전부 통과(기존 + Task 2의 신규 테스트)
- [ ] `npm run build` 성공
- [ ] 8개 스테이지 전체에서 플레이어·기믹 16종·배경·땅이 픽셀 격자 스타일로 보임
- [ ] 배경이 스테이지 진행에 따라 초원→노을→지하로 전환되고 2겹 시차가 보임
- [ ] 타일링된 정적 발판의 충돌 판정이 기존과 동일함(수동 확인)
- [ ] 배경음악이 타이틀부터 재생되어 재시도·스테이지 전환에도 끊기지 않음
- [ ] 화면 일렁임(카메라·배경 레이어) 재발 없음

## 금지사항 (Don'ts)

- 레벨 데이터(발판 좌표·크기, 난이도, 점프 수치)를 수정하지 마라 — 대신 그림·색 상수만 바꿔라.
- `display.ts`의 `TEXTURE_SCALE`/`snapToDevicePixel`/`cameraZoom`이나 `main.ts`의 렌더러 설정을 건드리지 마라 — 대신 기존 함수를 그대로 재사용해라.
- `fillRoundedRect`/`fillCircle` 등 곡선 도형을 새로 쓰지 마라 — 대신 `fillRect`/`fillTriangle`만 써라(기존 삼각형 가시 텍스처는 예외적으로 유지).
- `src/objects/*.ts` 파일을 색상 리스킨 목적으로 수정하지 마라 — 대신 `config.ts`의 `COLORS` 값만 바꿔라(코드 인벤토리 검증 절 참고).
- 정적 발판 외 6종 기계 발판을 TileSprite로 바꾸지 마라 — 대신 늘어져도 왜곡 없는 단순 띠 무늬로 그려라(수렴 검증으로 확정됨).
- 볼륨 조절 UI·음소거 키·효과음을 추가하지 마라 — 요청 범위 밖이다.

## 고려사항 (Considerations)

- 배경 레이어(`farBg`)는 `DEPTH.BACKGROUND_FAR`(-5)에, 실제 발판은 `DEPTH.PLATFORM`(0)에 그려져 겹침 순서가 자동으로 맞다 — 별도 z-order 조정 불필요.
- `TileSprite`는 `tileScaleX`/`Y`를 `1/TEXTURE_SCALE`로 맞춰야 텍스처가 논리 크기로 보인다 — 빠뜨리면 자갈이 6배 확대되어 뭉개진 것처럼 보인다.
- level7·level8(worldWidth 5200)이 가장 긴 스테이지이므로, 배경 레이어의 성능(텍스처 크기 480×468 정도)이 충분한지 그 두 스테이지에서 먼저 확인하는 게 효율적이다.
- 초원 세계 배경색과 플레이어 몸통 색이 같은 계열(`COLORS.PLAYER`)이라는 게 의도된 설계다(검정 테두리가 구분해줌) — 우연한 버그로 오인해 색을 바꾸지 말 것.

## 제약사항 (Constraints)

- Phaser 4.2.1 고정(설치된 버전). `TileSprite`/`physics.add.existing` API는 이 버전 기준으로 검증됐다(`node_modules/phaser/types/phaser.d.ts`).
- Node.js v20.19+/v22.12+ (Vite 8 요구사항, `README.md` 참고).
- 이 저장소는 `docs/superpowers/`가 `.gitignore`에 등재돼 있어 이 플랜·스펙 문서 자체는 git에 커밋되지 않는다(별도 안내 없이 진행 — 코드 변경 커밋만 위 Task대로 진행).
