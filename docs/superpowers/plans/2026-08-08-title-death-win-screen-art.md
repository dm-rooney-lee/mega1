# 타이틀·사망·클리어 화면 그림 넣기 — 구현 계획

> **작업자에게:** 이 계획은 `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`로 한 작업씩 실행한다. 각 단계는 체크박스(`- [ ]`)로 추적한다.

**설계 문서:** `docs/superpowers/specs/2026-08-08-title-death-win-screen-art-design.md`

**목표:** 게임을 하지 않는 세 화면(타이틀·죽음·전체 클리어)에 배경색과 그림을 넣고 글꼴을 픽셀 서체로 바꾼다. 게임 제목을 `Let's go!!`로 바꾸고, 죽음 화면에 어느 스테이지에서 끝났는지 표시한다.

**방식:** 화면마다 세 겹으로 쌓는다 — 배경색은 코드가 화면 전체를 칠하고, 그림은 SVG 파일 한 장을 가운데 얹고, 글자는 코드가 그린다. 배경을 그림에 넣지 않는 이유는 화면 가로 폭이 854~1100으로 변하기 때문이다. 그림·글자 배치는 기존 화면 도우미(`textScreen.ts`)를 확장해 한곳에서 처리한다.

**기술:** Phaser 4.2.1, TypeScript, Vite 8, Vitest 4, `@fontsource/press-start-2p` 5.3.0

## 전체 제약 (모든 작업에 적용)

- 논리 좌표계는 **세로 540 고정, 가로 854~1100 가변**이다. 모든 좌표·크기는 논리 단위로 쓰고, 화면 배율은 배치할 때 곱한다.
- **게임플레이(스테이지 안) 수치·물리·소리·그림을 건드리지 않는다.** 바뀌는 것은 세 화면의 겉모습뿐이다.
- **새 씬(화면)을 만들지 않는다.** 기존 세 화면만 고친다.
- **이번 작업이 새로 넣는 색**은 전부 `src/config.ts`에 모은다. 씬 파일에 새 색 문자열을 직접 쓰지 않는다.
  - 기존 코드에 이미 박혀 있는 색 문자열(`"#ff004d"`, `"#fff1e8"` 등)은 작업 5~7에서 그 줄을 통째로 다시 쓸 때 함께 사라진다. 작업 5 이전에 남아 있는 것은 위반이 아니다.
- SVG 파일 루트에 `width`/`height`를 픽셀 값으로 **반드시** 적는다. Phaser가 이 값을 읽어 크기를 계산한다.
- SVG 파일에 **배경을 칠하지 않는다.** 배경은 코드가 화면 전체에 칠한다.
- 글꼴은 저장소에 포함한다. 실행 중 외부 서버에서 내려받지 않는다.
- 커밋 훅이 `npm run build`와 `npm test`를 돌린다. 둘 다 통과해야 커밋된다.

---

## 파일 구조

| 파일 | 책임 | 작업 |
|---|---|---|
| `src/levels/stageLabel.ts` | `STAGE 7/8` 문구 한 줄을 만드는 순수 함수 | 신규 |
| `src/levels/stageLabel.test.ts` | 위 함수의 단위 테스트 | 신규 |
| `src/scenes/screen.ts` | 세 화면 공통 배치 — 글자·제목·그림·띠를 논리 좌표로 등록하고 창 크기에 맞춰 다시 배치 | `textScreen.ts`에서 이름 변경 + 확장. 그림은 작업 2, 띠는 작업 4, 제목은 작업 5에서 각각 쓰이는 자리와 함께 추가 |
| `src/scenes/MenuScene.ts` | 타이틀 화면 구성 | 수정 |
| `src/scenes/GameOverScene.ts` | 죽음 화면 구성 | 수정 |
| `src/scenes/WinScene.ts` | 클리어 화면 구성 | 수정 |
| `src/scenes/BootScene.ts` | 그림 3장 불러오기 | 수정 (3줄 추가) |
| `src/scenes/GameScene.ts` | 플레이 중 진행 표시에 위 순수 함수 사용 | 수정 (1줄) |
| `src/config.ts` | 화면 색과 그림 이름 | 수정 |
| `src/main.ts` | 글꼴을 받은 뒤 게임 시작 | 수정 |
| `public/ui/title-scene.svg` | 타이틀 지형·캐릭터 그림 | 신규 |
| `public/ui/death-scene.svg` | 죽음 화면 적·가시 그림 | 신규 |
| `public/ui/win-gopher.svg` | 클리어 화면 월계관 고퍼 그림 | 신규 |
| `README.md` | 직접 확인 항목 | 수정 |

`index.html`은 손대지 않는다 — 설계 문서는 여기에 글꼴을 선언한다고 적었지만, 글꼴 꾸러미가 선언까지 함께 제공하므로 `src/main.ts`에서 한 줄로 불러오는 편이 더 짧다. 라이선스 파일도 꾸러미에 포함되어 있어 설계의 제약(저장소 포함, 외부 서버 미사용)을 그대로 만족한다.

---

## 사용할 스킬·에이전트

`~/.claude/skills`, `~/.claude/agents`, 이 저장소의 `.claude/skills`를 실제로 검색해 정리했다. 이전 매핑 기록은 없어 새로 찾았다.

| 스킬 / 에이전트 | 용도 | 적용 작업 |
|---|---|---|
| `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans` | 계획을 한 작업씩 실행 | 전체 |
| `superpowers:test-driven-development` | 실패하는 테스트를 먼저 쓰고 통과시키기 | 작업 1 |
| `code-review` (기본 제공) | 작업마다 가볍게 반복 리뷰 → 중요 지적 0건까지 | 작업 1~7 |
| `compound-engineering:ce-code-review` | 전체 완료 후 다관점 정밀 리뷰 1회 | 작업 8 뒤 |
| `rl` | 각 작업과 계획 전체의 완료조건 검증 | 전체 |
| `compound-engineering:ce-doc-review` + `rl-verify` | 이 계획 문서 자체의 품질·기술적 타당성 검증 | 계획 작성 직후 |

**해당 없음으로 확인한 것** — 이 저장소의 `add-hazard-type` 스킬은 새 해저드·오브젝트 타입을 추가할 때 쓰는 것이라 이번 작업과 무관하다. `frontend-design`·`vercel-*` 계열은 웹/React 전용이며 이 프로젝트는 Phaser 캔버스 게임이라 적용하지 않는다.

---

## Task 1 — 스테이지 표기 문구를 테스트 가능한 함수로 분리

플레이 중 화면 우측 위에 `STAGE 7/8`이 이미 뜨는데, 그 문구가 `GameScene` 안에 직접 박혀 있다. 죽음 화면에도 같은 문구가 필요하므로 순수 함수로 빼내 양쪽이 함께 쓴다. 두 벌로 복사하면 나중에 표기를 바꿀 때 한쪽만 바뀐다.

**파일:**
- 생성: `src/levels/stageLabel.ts`
- 생성: `src/levels/stageLabel.test.ts`
- 수정: `src/scenes/GameScene.ts:674`

**주고받는 것:**
- 내보냄: `stageLabel(levelIndex: number, levelCount: number): string` — `levelIndex`는 0부터 세는 배열 인덱스, 반환 문구는 1부터 센다.

- [ ] **1단계: 실패하는 테스트 작성**

`src/levels/stageLabel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { stageLabel } from "./stageLabel";

describe("stageLabel", () => {
  // 정상 흐름
  it("0부터 세는 인덱스를 1부터 세는 표기로 바꾼다", () => {
    expect(stageLabel(6, 8)).toBe("STAGE 7/8");
  });

  // 경계값
  it("첫 스테이지", () => {
    expect(stageLabel(0, 8)).toBe("STAGE 1/8");
  });
  it("마지막 스테이지", () => {
    expect(stageLabel(7, 8)).toBe("STAGE 8/8");
  });
  it("스테이지가 하나뿐일 때", () => {
    expect(stageLabel(0, 1)).toBe("STAGE 1/1");
  });

  // 잘못된 입력 — 거부하지 않고 가장 가까운 유효 값으로 보정한다
  it("음수 인덱스는 첫 스테이지로 보정한다", () => {
    expect(stageLabel(-3, 8)).toBe("STAGE 1/8");
  });
  it("스테이지 수를 넘는 인덱스는 마지막 스테이지로 보정한다", () => {
    expect(stageLabel(99, 8)).toBe("STAGE 8/8");
  });
  it("정수가 아닌 인덱스는 내려서 맞춘다", () => {
    expect(stageLabel(2.7, 8)).toBe("STAGE 3/8");
  });
});
```

- [ ] **2단계: 실패 확인**

실행: `npx vitest run src/levels/stageLabel.test.ts`
예상: `Failed to resolve import "./stageLabel"` 로 실패

- [ ] **3단계: 최소 구현 작성**

`src/levels/stageLabel.ts`:

```ts
/**
 * "STAGE 7/8" — the progress line, shown both in the play HUD and on the death
 * screen. Pure (no Phaser, no DOM) so it can be unit-tested like the other
 * level helpers.
 *
 * `levelIndex` is 0-based (an index into the `levels` registry) while the label
 * counts from 1, matching how stages are numbered everywhere else in the UI.
 *
 * Out-of-range indices are clamped rather than rejected. The death screen
 * already falls back to stage 0 when it is handed nothing, and a
 * wrong-but-plausible number reads better there than a blank or a crash.
 */
export function stageLabel(levelIndex: number, levelCount: number): string {
  const last = Math.max(1, levelCount);
  const shown = Math.min(Math.max(Math.floor(levelIndex) + 1, 1), last);
  return `STAGE ${shown}/${last}`;
}
```

- [ ] **4단계: 통과 확인**

실행: `npx vitest run src/levels/stageLabel.test.ts`
예상: 7개 테스트 PASS

- [ ] **5단계: 플레이 화면이 이 함수를 쓰게 바꾸기**

`src/scenes/GameScene.ts` — 임포트 구역에 추가:

```ts
import { stageLabel } from "../levels/stageLabel";
```

`src/scenes/GameScene.ts:674` 를 바꾼다:

```ts
// 바꾸기 전
      .text(0, 0, `STAGE ${this.levelIndex + 1}/${levels.length}`, {

// 바꾼 뒤
      .text(0, 0, stageLabel(this.levelIndex, levels.length), {
```

- [ ] **6단계: 전체 검사**

실행: `npm test && npm run build`
예상: 테스트 전부 통과, 타입 검사·빌드 통과

- [ ] **7단계: 직접 확인**

실행: `npm run dev` → `http://localhost:5173/?stage=3`
예상: 우측 위 표기가 그대로 `STAGE 3/8`

- [ ] **8단계: 커밋**

```bash
git add src/levels/stageLabel.ts src/levels/stageLabel.test.ts src/scenes/GameScene.ts
git commit -m "refactor(hud): extract the stage progress label into a tested helper

The death screen needs the same line, and a second copy of the template
would drift the moment either side changes."
```

**이 작업의 완료조건**
- `npx vitest run src/levels/stageLabel.test.ts` 가 7개 통과
- `npm run build` 통과
- 플레이 화면 우측 위 표기가 이전과 글자 하나까지 동일

**스킬 매핑:** `superpowers:test-driven-development` → 이후 `code-review` 반복(중요 지적 0건까지) → `rl`로 완료조건 검증

---

## Task 2 — 화면 도우미가 그림도 다루게 확장

지금 `textScreen.ts`는 글자 줄만 논리 좌표로 등록해두고, 창 크기가 바뀌면 배율을 곱해 다시 배치한다. 그림에도 똑같은 규칙이 필요하다. 규칙을 두 벌로 만들지 않고 같은 목록에 태워 한곳에서 배치한다.

글자 전용이 아니게 되므로 파일과 함수 이름을 바꾼다.

> 제목(외곽선 있는 큰 글자)과 배경 띠도 결국 이 도우미가 맡지만, **여기서 미리 만들지 않는다.** 띠는 작업 4가, 제목은 작업 5가 처음 쓰는 자리에서 각각 추가한다. 쓰는 데 없이 먼저 만들면 그 시점엔 아무도 부르지 않는 코드가 된다.

**파일:**
- 이름 변경: `src/scenes/textScreen.ts` → `src/scenes/screen.ts`
- 수정: `src/scenes/MenuScene.ts:4,47`
- 수정: `src/scenes/GameOverScene.ts:2,27`
- 수정: `src/scenes/WinScene.ts:2,15`

**주고받는 것:**
- 내보냄: `SCREEN_FONT: string` — 세 화면이 쓰는 글꼴 이름
- 내보냄: `centredScreen(scene: Phaser.Scene)` — 반환 객체의 메서드:
  - `add(y: number, size: number, content: string, color: string, bold?: boolean): Phaser.GameObjects.Text`
  - `addImage(y: number, w: number, h: number, key: string): Phaser.GameObjects.Image | null`
  - `start(): void`
- 이후 작업이 여기에 덧붙일 것: `addBand`(작업 4), `addTitle`(작업 5)
- 그리는 순서가 곧 겹치는 순서다. 뒤에 놓일 것(띠 → 그림 → 글자) 순으로 부른다.

- [ ] **1단계: 파일 이름 바꾸기**

```bash
git mv src/scenes/textScreen.ts src/scenes/screen.ts
```

- [ ] **2단계: `src/scenes/screen.ts` 전체를 아래 내용으로 교체**

```ts
import Phaser from "phaser";
import { cameraZoom } from "../display";

/**
 * The title, death and win screens are all the same shape: a stack of centred
 * rows — text and pictures — authored in the same 540-tall logical space as the
 * levels.
 *
 * The canvas buffer is sized in physical pixels (see display.ts), so those
 * logical units get scaled up here. For text that also rasterises the glyphs at
 * the screen's real density rather than magnifying a small texture, which is
 * what made this text mushy before.
 *
 * Rows are drawn in the order they are added, so a screen adds its picture
 * before the text that sits on top of it.
 */

/**
 * Pixel typeface for every screen, with the old font left behind it: if the
 * font file never arrives the screens still read, just in the previous face.
 * `main.ts` waits for it before the game starts.
 */
export const SCREEN_FONT = '"Press Start 2P", monospace';

type Row =
  | { kind: "text"; text: Phaser.GameObjects.Text; y: number; size: number }
  | { kind: "image"; image: Phaser.GameObjects.Image; y: number; w: number; h: number };

export function centredScreen(scene: Phaser.Scene) {
  const rows: Row[] = [];

  const layout = (): void => {
    const scale = cameraZoom(scene.scale.height);
    const cx = scene.scale.width / 2;
    for (const row of rows) {
      if (row.kind === "text") {
        row.text.setFontSize(Math.round(row.size * scale)).setPosition(cx, row.y * scale);
      } else {
        row.image.setDisplaySize(row.w * scale, row.h * scale).setPosition(cx, row.y * scale);
      }
    }
  };

  return {
    /** `y` and `size` are logical units. Position is applied by `start`. */
    add(
      y: number,
      size: number,
      content: string,
      color: string,
      bold = false,
    ): Phaser.GameObjects.Text {
      const text = scene.add
        .text(0, 0, content, {
          fontFamily: SCREEN_FONT,
          color,
          ...(bold ? { fontStyle: "bold" } : {}),
        })
        .setOrigin(0.5);
      rows.push({ kind: "text", text, y, size });
      return text;
    },

    /**
     * A picture centred on the column. `w`/`h` are its logical size — the
     * texture is TEXTURE_SCALE times larger (see display.ts) and this shrinks it
     * back down.
     *
     * Returns null when the texture is missing, which is what happens if the
     * SVG failed to load. These screens still read without their picture, so a
     * missing one is skipped rather than drawn as Phaser's placeholder box.
     */
    addImage(y: number, w: number, h: number, key: string): Phaser.GameObjects.Image | null {
      if (!scene.textures.exists(key)) return null;
      const image = scene.add.image(0, 0, key).setOrigin(0.5);
      rows.push({ kind: "image", image, y, w, h });
      return image;
    },

    /** Lays the rows out and keeps them right as the window changes. */
    start(): void {
      layout();
      // The Scale Manager outlives the scene, so the listener has to be dropped.
      scene.scale.on(Phaser.Scale.Events.RESIZE, layout);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.scale.off(Phaser.Scale.Events.RESIZE, layout);
      });
    },
  };
}
```

- [ ] **3단계: 세 화면의 임포트와 호출 고치기**

`src/scenes/MenuScene.ts:4`, `src/scenes/GameOverScene.ts:2`, `src/scenes/WinScene.ts:2` 각각:

```ts
// 바꾸기 전
import { centredTextScreen } from "./textScreen";
// 바꾼 뒤
import { centredScreen } from "./screen";
```

`src/scenes/MenuScene.ts:47`, `src/scenes/GameOverScene.ts:27`, `src/scenes/WinScene.ts:15` 각각:

```ts
// 바꾸기 전
    const screen = centredTextScreen(this);
// 바꾼 뒤
    const screen = centredScreen(this);
```

- [ ] **4단계: 남은 옛 이름이 없는지 확인**

실행: `grep -rn "centredTextScreen\|textScreen" src README.md docs || echo "남은 참조 없음"`
예상: `남은 참조 없음`

- [ ] **5단계: 전체 검사**

실행: `npm test && npm run build`
예상: 전부 통과

- [ ] **6단계: 직접 확인**

실행: `npm run dev`
예상: **세 화면이 지금과 똑같이 보인다.** 새 기능을 아직 아무도 쓰지 않고, 글꼴 파일도 아직 없어 예비 글꼴로 그려지기 때문이다. 화면이 달라 보이면 되돌리고 원인을 찾는다.

- [ ] **7단계: 커밋**

```bash
git add src/scenes/screen.ts src/scenes/MenuScene.ts src/scenes/GameOverScene.ts src/scenes/WinScene.ts
git commit -m "refactor(screens): let the screen helper place pictures too

The three non-gameplay screens are about to gain artwork, and it needs the
same logical-units-times-scale placement the text already gets. Sharing one
row list keeps a single resize handler per screen instead of two."
```

**이 작업의 완료조건**
- `grep -rn "centredTextScreen" src` 결과 없음
- `npm test && npm run build` 통과
- 세 화면의 겉모습이 작업 전과 동일

**스킬 매핑:** `code-review` 반복(중요 지적 0건까지) → `rl`로 완료조건 검증

---

## Task 3 — 픽셀 글꼴 적용

**파일:**
- 수정: `package.json` (의존성 추가)
- 수정: `src/main.ts`
- 수정: `src/scenes/MenuScene.ts`, `src/scenes/GameOverScene.ts`, `src/scenes/WinScene.ts` (글자 크기 조정)

**주고받는 것:**
- 사용: 작업 2의 `SCREEN_FONT`
- 이후 작업이 기대하는 것: 세 화면의 모든 글자가 `Press Start 2P`로 그려진다

- [ ] **1단계: 글꼴 꾸러미 설치**

```bash
npm install @fontsource/press-start-2p@5.3.0
```

설치되는 것: 글꼴 파일(woff2/woff), `@font-face` 선언이 담긴 CSS, `LICENSE`(SIL Open Font License 1.1). 전부 저장소의 `node_modules`에 들어오고 빌드 시 결과물에 함께 묶이므로, 실행 중 외부 서버에 접속하지 않는다.

- [ ] **2단계: `src/main.ts`에서 글꼴을 불러오고 기다리기**

파일 맨 위 임포트 구역, `import Phaser from "phaser";` 바로 아래에 추가:

```ts
// Latin only — every label on the screens is ASCII, and the other subsets are
// several times the size for glyphs this game never draws.
import "@fontsource/press-start-2p/latin-400.css";
```

그리고 `const game = new Phaser.Game(config);` **바로 위**에 추가:

```ts
// Phaser bakes glyphs into a texture when it creates a Text object, so a font
// that arrives afterwards does not redraw labels already on screen — the title
// would stay in the fallback face for the life of the page. The stylesheet above
// declares `font-display: swap`, and this await is what stops that swap from
// being visible.
//
// A missing or broken font file settles this promise too; the CSS keeps
// `monospace` behind it, so the game still starts and still reads.
await document.fonts.load('16px "Press Start 2P"').catch(() => {});
```

최상위 `await`는 `tsconfig.json`과 `vite.config.ts`가 모두 ES2022를 대상으로 하므로 그대로 쓸 수 있다.

- [ ] **3단계: 실제 글자 폭 재기**

실행: `npm run dev` → 브라우저 개발자 도구 콘솔에 붙여넣기

```js
const c = document.createElement("canvas").getContext("2d");
c.font = '100px "Press Start 2P"';
console.log("글자 하나 폭 =", c.measureText("M").width, "(글자 크기 100 기준)");
console.log("소문자 확인:", c.measureText("g").width);
```

예상: 글자 하나 폭이 100 근처. 이 값을 `w`라 하면 **문구 가로폭 ≈ 글자 수 × 글자 크기 × (w/100)** 이다. 아래 4단계의 크기는 `w=100`을 가정한 값이므로, 다르게 나오면 그 비율만큼 크기를 낮춘다.

같은 화면에서 `Let's go!!`의 **소문자 모양**도 눈으로 확인한다. 어색하면 임의로 대문자로 바꾸지 말고 **보고한 뒤 지시를 기다린다.**

- [ ] **4단계: 지금 화면의 글자 크기를 넘치지 않게 조정**

새 글꼴은 지금 글꼴보다 글자가 넓다. 아직 화면을 새로 구성하기 전이므로, 현재 문구가 가장 좁은 화면(가로 854)에서 넘치지 않도록 크기만 낮춘다.

> 여기서 정한 크기 대부분은 작업 5~7이 화면을 다시 구성하면서 지운다. **그래도 지금 맞춰야 한다** — 이 계획은 작업 하나가 끝날 때마다 게임이 멀쩡히 돌아가는 상태로 남기는 것을 전제로 한다. 이 단계를 건너뛰면 작업 3만 끝난 시점에 글자가 화면 밖으로 삐져나간 채로 커밋된다. 낭비가 아니라 각 작업을 독립적으로 검증 가능하게 만드는 값이다.

`src/scenes/MenuScene.ts`:

```ts
// 바꾸기 전
    screen.add(180, 56, "PLATFORMER POC", "#29adff", true);
    screen.add(250, 20, "a tiny Phaser 4 platformer", "#fff1e8");
    const prompt = screen.add(360, 24, "press any key to start", "#00e436");
// 바꾼 뒤
    screen.add(180, 50, "PLATFORMER POC", "#29adff", true);
    screen.add(250, 16, "a tiny Phaser 4 platformer", "#fff1e8");
    const prompt = screen.add(360, 18, "press any key to start", "#00e436");
```

`src/scenes/GameOverScene.ts`:

```ts
// 바꾸기 전
    screen.add(200, 56, "YOU DIED", "#ff004d", true);
    screen.add(300, 22, "press SPACE / ENTER to retry", "#fff1e8");
    screen.add(340, 18, "ESC for menu", "#7d7460");
// 바꾼 뒤
    screen.add(200, 80, "YOU DIED", "#ff004d", true);
    screen.add(300, 18, "press SPACE / ENTER to retry", "#fff1e8");
    screen.add(340, 14, "ESC for menu", "#7d7460");
```

`src/scenes/WinScene.ts`:

```ts
// 바꾸기 전
    screen.add(200, 52, "YOU WIN!", "#00e436", true);
    screen.add(260, 20, "all stages cleared", "#fff1e8");
    screen.add(300, 22, "press SPACE / ENTER to play again", "#fff1e8");
    screen.add(340, 18, "ESC for menu", "#7d7460");
// 바꾼 뒤
    screen.add(200, 76, "YOU WIN!", "#00e436", true);
    screen.add(260, 18, "all stages cleared", "#fff1e8");
    screen.add(300, 14, "press SPACE / ENTER to play again", "#fff1e8");
    screen.add(340, 14, "ESC for menu", "#7d7460");
```

계산 근거(글자 하나 폭 = 글자 크기 기준):

| 문구 | 글자 수 | 크기 | 가로폭 | 854에서 여유 |
|---|---|---|---|---|
| `PLATFORMER POC` | 14 | 50 | 700 | 77씩 |
| `a tiny Phaser 4 platformer` | 26 | 16 | 416 | 219씩 |
| `press any key to start` | 22 | 18 | 396 | 229씩 |
| `YOU DIED` | 8 | 80 | 640 | 107씩 |
| `press SPACE / ENTER to retry` | 28 | 18 | 504 | 175씩 |
| `YOU WIN!` | 8 | 76 | 608 | 123씩 |
| `press SPACE / ENTER to play again` | 33 | 14 | 462 | 196씩 |
| `all stages cleared` | 18 | 18 | 324 | 265씩 |
| `ESC for menu` | 12 | 14 | 168 | 343씩 |

- [ ] **5단계: 전체 검사**

실행: `npm test && npm run build`
예상: 전부 통과

- [ ] **6단계: 직접 확인**

실행: `npm run dev`
예상:
1. 타이틀·죽음·클리어 세 화면의 글자가 모두 픽셀 서체다.
2. 새로고침 직후 **한순간도 다른 글꼴로 보였다가 바뀌지 않는다.**
3. 창을 가장 좁은 비율(세로로 긴 창)로 끌어도 어느 줄도 좌우로 넘치지 않는다.

- [ ] **7단계: 커밋**

```bash
git add package.json package-lock.json src/main.ts src/scenes/MenuScene.ts src/scenes/GameOverScene.ts src/scenes/WinScene.ts
git commit -m "feat(screens): draw the non-gameplay screens in a pixel typeface

Bundled rather than fetched, so the game keeps working offline and the
licence travels with it. The game waits for the face before booting: Phaser
bakes glyphs into a texture, so a late font never reaches the labels it
already drew."
```

**이 작업의 완료조건**
- `npm test && npm run build` 통과
- 세 화면 모든 글자가 픽셀 서체
- 새로고침 시 글꼴이 바뀌는 깜빡임이 없음
- 가장 좁은 창에서 어느 줄도 넘치지 않음

**스킬 매핑:** `code-review` 반복(중요 지적 0건까지) → `rl`로 완료조건 검증

---

## Task 4 — 화면 색을 설정 파일에 모으고 세 화면 배경 칠하기

**파일:**
- 수정: `src/config.ts`
- 수정: `src/scenes/screen.ts` (`addBand` 추가)
- 수정: `src/scenes/MenuScene.ts`, `src/scenes/GameOverScene.ts`, `src/scenes/WinScene.ts`

**주고받는 것:**
- 내보냄: `SCREEN_COLORS` — 세 화면이 쓰는 색 모음 (CSS 문자열)
- 내보냄: `centredScreen`의 `addBand(yTop: number, yBottom: number, color: string): Phaser.GameObjects.Rectangle`
- 사용: 작업 2의 `centredScreen`

- [ ] **1단계: `src/config.ts`에 색 추가**

`export const TEX = {` 선언 **바로 위**에 넣는다:

```ts
/**
 * Title / death / win screen palette, sampled pixel-by-pixel from the design
 * mockup rather than eyeballed.
 *
 * CSS strings, not the numeric `COLORS` above, because everything on these
 * screens is either a Text colour or a camera background and both take CSS.
 *
 * The picture files in `public/ui/` repeat the character colours (gopher blue,
 * enemy red, grass green). Change one, check the other.
 */
export const SCREEN_COLORS = {
  TITLE_SKY: "#184f88",
  TITLE_LOGO: "#4da7e1",
  TITLE_LOGO_EDGE: "#1d2b53",

  DEATH_BG: "#440a23",
  DEATH_BG_LOW: "#561334",
  DEATH_LINE: "#7e153b",
  DEATH_TITLE: "#f82a31",
  DEATH_TITLE_EDGE: "#000000",
  DEATH_SUBTITLE: "#d7a0a3",

  WIN_BG: "#055a55",
  WIN_TITLE: "#55e853",
  WIN_TITLE_EDGE: "#002600",

  /** Shared by all three screens. */
  PROMPT: "#fff1e8",
  MUTED: "#7d7460",
} as const;
```

- [ ] **2단계: 화면 도우미에 띠 그리기 추가**

죽음 화면은 위아래 색이 다르고 그 경계에 가로선이 있다. 셋 다 **화면 폭 전체**에 닿아야 하는데, 화면 폭은 창 비율에 따라 변한다. 그래서 글자·그림과 같은 목록에 태워 창 크기가 바뀔 때 함께 다시 그린다.

`src/scenes/screen.ts` — `Row` 타입에 갈래를 하나 더한다:

```ts
// 바꾸기 전
type Row =
  | { kind: "text"; text: Phaser.GameObjects.Text; y: number; size: number }
  | { kind: "image"; image: Phaser.GameObjects.Image; y: number; w: number; h: number };

// 바꾼 뒤
type Row =
  | { kind: "text"; text: Phaser.GameObjects.Text; y: number; size: number }
  | { kind: "image"; image: Phaser.GameObjects.Image; y: number; w: number; h: number }
  | { kind: "band"; rect: Phaser.GameObjects.Rectangle; yTop: number; yBottom: number };
```

`layout()` 안의 분기를 셋으로 늘린다:

```ts
// 바꾸기 전
      if (row.kind === "text") {
        row.text.setFontSize(Math.round(row.size * scale)).setPosition(cx, row.y * scale);
      } else {
        row.image.setDisplaySize(row.w * scale, row.h * scale).setPosition(cx, row.y * scale);
      }

// 바꾼 뒤
      if (row.kind === "text") {
        row.text.setFontSize(Math.round(row.size * scale)).setPosition(cx, row.y * scale);
      } else if (row.kind === "image") {
        row.image.setDisplaySize(row.w * scale, row.h * scale).setPosition(cx, row.y * scale);
      } else {
        // Bands span the whole canvas, however wide the window happens to be.
        row.rect
          .setSize(scene.scale.width, (row.yBottom - row.yTop) * scale)
          .setPosition(cx, row.yTop * scale);
      }
```

`addImage` 다음에 메서드를 추가한다:

```ts
    /**
     * A full-width horizontal band between two logical heights.
     *
     * `add.rectangle` wants a packed integer while the screen palette is CSS
     * strings (both the camera background and Text want those), so the string
     * is converted here rather than storing each colour twice.
     */
    addBand(yTop: number, yBottom: number, color: string): Phaser.GameObjects.Rectangle {
      const rect = scene.add
        .rectangle(0, 0, 1, 1, Phaser.Display.Color.HexStringToColor(color).color)
        .setOrigin(0.5, 0);
      rows.push({ kind: "band", rect, yTop, yBottom });
      return rect;
    },
```

세 화면 모두 이미 `import { BGM } from "../config";` 를 갖고 있다. **새 임포트 줄을 만들지 말고 그 줄을 넓힌다** — 같은 파일에서 같은 모듈을 두 번 임포트하면 안 된다.

- [ ] **3단계: 타이틀 배경 칠하기**

`src/scenes/MenuScene.ts:6`:

```ts
// 바꾸기 전
import { BGM } from "../config";
// 바꾼 뒤
import { BGM, SCREEN_COLORS } from "../config";
```

`playBgm(this, BGM.SCREEN);` (45번째 줄) **바로 아래**에 추가:

```ts
    this.cameras.main.setBackgroundColor(SCREEN_COLORS.TITLE_SKY);
```

- [ ] **4단계: 죽음 화면 배경 칠하기 (위아래 두 톤 + 경계선)**

`src/scenes/GameOverScene.ts:4`:

```ts
// 바꾸기 전
import { BGM } from "../config";
// 바꾼 뒤
import { BGM, SCREEN_COLORS } from "../config";
```

`const screen = centredScreen(this);` **바로 다음 줄**에, 지금 있는 `screen.add(...)` 세 줄보다 **위에** 넣는다. 띠는 글자보다 먼저 그려져야 뒤에 깔린다:

```ts
    this.cameras.main.setBackgroundColor(SCREEN_COLORS.DEATH_BG);

    // The ground the hazards stand on: a lighter half below, and a bright line
    // where the two meet. Both are painted here rather than baked into the
    // picture, because they have to reach both edges of a window whose width
    // varies (854-1100 logical units).
    screen.addBand(245, 540, SCREEN_COLORS.DEATH_BG_LOW);
    screen.addBand(245, 249, SCREEN_COLORS.DEATH_LINE);
```

- [ ] **5단계: 클리어 화면 배경 칠하기**

`src/scenes/WinScene.ts:4`:

```ts
// 바꾸기 전
import { BGM } from "../config";
// 바꾼 뒤
import { BGM, SCREEN_COLORS } from "../config";
```

`playBgm(this, BGM.SCREEN);` (13번째 줄) 바로 아래에 추가:

```ts
    this.cameras.main.setBackgroundColor(SCREEN_COLORS.WIN_BG);
```

- [ ] **6단계: 전체 검사**

실행: `npm test && npm run build`
예상: 전부 통과

- [ ] **7단계: 직접 확인**

실행: `npm run dev`
예상:
1. 타이틀 배경이 파랑, 클리어 배경이 진초록이다.
2. 죽음 화면은 위가 어두운 자주, 아래가 밝은 자주이고 그 경계에 밝은 가로선이 있다.
3. **창을 아무리 넓혀도 가로선과 아래쪽 색이 화면 양 끝까지 닿는다.**

- [ ] **8단계: 커밋**

```bash
git add src/config.ts src/scenes/screen.ts src/scenes/MenuScene.ts src/scenes/GameOverScene.ts src/scenes/WinScene.ts
git commit -m "feat(screens): give the three screens their own backgrounds

Painted in code rather than baked into the artwork: the logical viewport is
854-1100 wide depending on the window, so a full-bleed image would crop
differently at every aspect while a camera background never can."
```

**이 작업의 완료조건**
- `npm test && npm run build` 통과
- 세 화면의 배경색이 설계의 색과 일치
- 어떤 창 비율에서도 배경에 빈 틈이 없고, 죽음 화면 가로선이 양 끝까지 이어짐

**스킬 매핑:** `code-review` 반복(중요 지적 0건까지) → `rl`로 완료조건 검증

---

## Task 5 — 타이틀 화면

**파일:**
- 생성: `public/ui/title-scene.svg`
- 수정: `src/config.ts` (`TEX`에 항목 1개)
- 수정: `src/scenes/screen.ts` (`addTitle` 추가)
- 수정: `src/scenes/BootScene.ts` (`preload`에 1줄)
- 수정: `src/scenes/MenuScene.ts`

**주고받는 것:**
- 내보냄: `TEX.UI_TITLE`
- 내보냄: `centredScreen`의 `addTitle(y: number, size: number, content: string, color: string, edgeColor: string, edgeWidth: number): Phaser.GameObjects.Text` — 작업 6·7도 이걸 쓴다
- 사용: 작업 2의 `addImage`, 작업 4의 `SCREEN_COLORS`

- [ ] **1단계: 화면 도우미에 제목 그리기 추가**

세 화면의 큰 제목은 모두 외곽선이 둘러져 있다. 외곽선 두께도 글자 크기처럼 화면 배율을 따라야 한다 — 두께를 고정하면 큰 화면에서 실처럼 얇아진다.

`src/scenes/screen.ts` — 글자 갈래에 외곽선 두께를 기억할 자리를 만든다:

```ts
// 바꾸기 전
  | { kind: "text"; text: Phaser.GameObjects.Text; y: number; size: number }
// 바꾼 뒤
  | { kind: "text"; text: Phaser.GameObjects.Text; y: number; size: number; edge: number }
```

`layout()`의 글자 분기에 한 줄을 더한다:

```ts
// 바꾸기 전
      if (row.kind === "text") {
        row.text.setFontSize(Math.round(row.size * scale)).setPosition(cx, row.y * scale);
      } else if (row.kind === "image") {

// 바꾼 뒤
      if (row.kind === "text") {
        row.text.setFontSize(Math.round(row.size * scale)).setPosition(cx, row.y * scale);
        // The outline is a pixel width like the glyphs, so it has to grow with them.
        if (row.edge > 0) row.text.setStroke(row.text.style.stroke, row.edge * scale);
      } else if (row.kind === "image") {
```

기존 `add`가 넣는 줄에 `edge: 0`을 붙인다:

```ts
// 바꾸기 전
      rows.push({ kind: "text", text, y, size });
// 바꾼 뒤
      rows.push({ kind: "text", text, y, size, edge: 0 });
```

그리고 `add` 다음에 메서드를 추가한다:

```ts
    /**
     * A headline with an outline around it — the mockup draws all three screen
     * titles that way, and against a busy picture the outline is what keeps the
     * letters readable. `edgeWidth` is a logical width, scaled like the glyphs.
     */
    addTitle(
      y: number,
      size: number,
      content: string,
      color: string,
      edgeColor: string,
      edgeWidth: number,
    ): Phaser.GameObjects.Text {
      const text = scene.add
        .text(0, 0, content, { fontFamily: SCREEN_FONT, color })
        .setOrigin(0.5);
      text.setStroke(edgeColor, edgeWidth);
      rows.push({ kind: "text", text, y, size, edge: edgeWidth });
      return text;
    },
```

- [ ] **2단계: `public/ui/title-scene.svg` 생성**

디렉토리가 없으므로 함께 만든다: `mkdir -p public/ui`

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="180" viewBox="0 0 1100 180">
  <!--
    타이틀 화면의 지형과 캐릭터. 배경(하늘)은 여기 없다 — MenuScene이 칠한다.
    색은 src/config.ts의 SCREEN_COLORS 주석과 짝을 이룬다. 한쪽만 고치지 말 것.
      잔디 #5ADF62 · 발판 #088B4A · 흙 #A05639 · 흙무늬 #5F574F
      고퍼 #53A8F0 · 적 #E12E4C · 테두리 #000000 · 흰색 #FFF1E8

    가로 1100은 가장 넓은 화면 폭이다. 가장 좁은 화면(854)에서는 좌우가 123씩
    잘리므로, 고퍼·적·가시는 가운데 854 안(x 123~977)에 둔다. 양 끝 발판만
    잘려도 되는 자리에 있다.
  -->

  <!-- 왼쪽 발판 (왼쪽 끝이 잘려도 되는 자리) -->
  <g>
    <rect x="0" y="70" width="300" height="8" fill="#5ADF62"/>
    <rect x="0" y="78" width="300" height="78" fill="#088B4A"/>
    <rect x="0" y="156" width="300" height="24" fill="#A05639"/>
    <rect x="40" y="164" width="16" height="6" fill="#5F574F"/>
    <rect x="180" y="162" width="20" height="6" fill="#5F574F"/>
  </g>

  <!-- 가운데 발판 — 고퍼가 이 위에 선다 -->
  <g>
    <rect x="350" y="110" width="270" height="8" fill="#5ADF62"/>
    <rect x="350" y="118" width="270" height="38" fill="#088B4A"/>
    <rect x="350" y="156" width="270" height="24" fill="#A05639"/>
    <rect x="420" y="164" width="18" height="6" fill="#5F574F"/>
  </g>

  <!-- 오른쪽 발판 — 적과 가시가 이 위에 선다 -->
  <g>
    <rect x="670" y="60" width="280" height="8" fill="#5ADF62"/>
    <rect x="670" y="68" width="280" height="88" fill="#088B4A"/>
    <rect x="670" y="156" width="280" height="24" fill="#A05639"/>
    <rect x="760" y="164" width="20" height="6" fill="#5F574F"/>
  </g>

  <!-- 오른쪽 끝에 뜬 작은 발판 (오른쪽 끝이 잘려도 되는 자리) -->
  <g>
    <rect x="1000" y="20" width="100" height="8" fill="#5ADF62"/>
    <rect x="1000" y="28" width="100" height="20" fill="#088B4A"/>
    <rect x="1000" y="48" width="100" height="12" fill="#A05639"/>
  </g>

  <!-- 고퍼 (x 442~470, 발이 가운데 발판 윗면 y=110에 닿는다) -->
  <g>
    <rect x="446" y="66" width="5" height="5" fill="#000000"/>
    <rect x="461" y="66" width="5" height="5" fill="#000000"/>
    <rect x="442" y="70" width="28" height="40" fill="#000000"/>
    <rect x="444" y="72" width="24" height="36" fill="#53A8F0"/>
    <rect x="449" y="80" width="6" height="6" fill="#FFF1E8"/>
    <rect x="457" y="80" width="6" height="6" fill="#FFF1E8"/>
    <rect x="451" y="82" width="3" height="3" fill="#000000"/>
    <rect x="459" y="82" width="3" height="3" fill="#000000"/>
    <rect x="452" y="90" width="8" height="3" fill="#000000"/>
    <rect x="452" y="93" width="8" height="6" fill="#FFF1E8"/>
    <rect x="455" y="93" width="2" height="6" fill="#000000"/>
  </g>

  <!-- 빨간 적 (x 700~732, 오른쪽 발판 윗면 y=60에 닿는다) -->
  <g>
    <rect x="700" y="34" width="32" height="26" fill="#000000"/>
    <rect x="702" y="36" width="28" height="22" fill="#E12E4C"/>
    <rect x="707" y="42" width="5" height="5" fill="#000000"/>
    <rect x="720" y="42" width="5" height="5" fill="#000000"/>
    <rect x="694" y="38" width="6" height="3" fill="#000000"/>
    <rect x="732" y="38" width="6" height="3" fill="#000000"/>
  </g>

  <!-- 가시 3개 (오른쪽 발판 윗면 y=60 위) -->
  <g fill="#088B4A">
    <polygon points="850,60 860,40 870,60"/>
    <polygon points="870,60 880,40 890,60"/>
    <polygon points="890,60 900,40 910,60"/>
  </g>
</svg>
```

- [ ] **3단계: 그림 이름 등록**

`src/config.ts` — `TEX` 객체의 배경 항목들 아래에 추가:

```ts
  // Title / death / win screen artwork, loaded from public/ui rather than drawn
  // here — see BootScene.preload.
  UI_TITLE: "tex-ui-title",
```

- [ ] **4단계: `BootScene`이 그림을 불러오게 하기**

`src/scenes/BootScene.ts` — 임포트에 추가:

```ts
import { TEXTURE_SCALE } from "../display";
```
(이미 임포트되어 있다면 그대로 둔다.)

`preload()` 안, `this.load.audio(...)` 아래에 추가:

```ts
    // Screen artwork. Rasterised at load time — Phaser does not keep SVGs as
    // vectors — so it is baked at the same density as every generated texture
    // (see display.ts) and shrunk back down when placed.
    this.load.svg(TEX.UI_TITLE, "ui/title-scene.svg", { scale: TEXTURE_SCALE });
```

- [ ] **5단계: 타이틀 화면 다시 구성**

`src/scenes/MenuScene.ts:6` — 같은 임포트 줄에 `TEX`를 더한다:

```ts
// 바꾸기 전
import { BGM, SCREEN_COLORS } from "../config";
// 바꾼 뒤
import { BGM, SCREEN_COLORS, TEX } from "../config";
```

작업 3에서 손본 세 줄을 통째로 아래로 교체한다:

```ts
// 바꾸기 전
    screen.add(180, 50, "PLATFORMER POC", "#29adff", true);
    screen.add(250, 16, "a tiny Phaser 4 platformer", "#fff1e8");
    const prompt = screen.add(360, 18, "press any key to start", "#00e436");

// 바꾼 뒤 — 그림을 먼저 넣어야 글자가 그 위에 온다
    screen.addImage(300, 1100, 180, TEX.UI_TITLE);
    screen.addTitle(
      150,
      64,
      "Let's go!!",
      SCREEN_COLORS.TITLE_LOGO,
      SCREEN_COLORS.TITLE_LOGO_EDGE,
      8,
    );
    const prompt = screen.add(445, 18, "press any key to start", SCREEN_COLORS.PROMPT);
```

부제 `a tiny Phaser 4 platformer` 줄은 지운다.

- [ ] **6단계: 전체 검사**

실행: `npm test && npm run build`
예상: 전부 통과

- [ ] **7단계: 직접 확인**

실행: `npm run dev`
예상:
1. 파란 하늘 위에 발판·고퍼·빨간 적·가시가 보인다.
2. 제목이 `Let's go!!`이고 하늘색 글자에 진파랑 외곽선이 있다.
3. 아래에 `press any key to start`가 깜빡인다.
4. **창을 세로로 길게(가장 좁은 폭) 끌어도 고퍼·적·가시가 모두 화면 안에 있다.** 양 끝 발판만 잘린다.
5. 아무 키나 누르면 1스테이지가 시작된다.

- [ ] **8단계: 커밋**

```bash
git add public/ui/title-scene.svg src/config.ts src/scenes/screen.ts src/scenes/BootScene.ts src/scenes/MenuScene.ts
git commit -m "feat(menu): give the title screen its artwork and new name

The picture is 1100 wide, the widest the viewport ever gets, so the narrow
case crops the outer platforms rather than the characters."
```

**이 작업의 완료조건**
- `npm test && npm run build` 통과
- 타이틀에 지형 그림과 `Let's go!!` 제목이 표시됨
- 가장 좁은 창에서도 고퍼·적·가시가 잘리지 않음
- 아무 키로 게임이 시작되는 동작이 그대로임

**스킬 매핑:** `code-review` 반복(중요 지적 0건까지) → `rl`로 완료조건 검증

---

## Task 6 — 죽음 화면

**파일:**
- 생성: `public/ui/death-scene.svg`
- 수정: `src/config.ts` (`TEX`에 항목 1개)
- 수정: `src/scenes/BootScene.ts` (1줄)
- 수정: `src/scenes/GameOverScene.ts`

**주고받는 것:**
- 내보냄: `TEX.UI_DEATH`
- 사용: 작업 1의 `stageLabel`, 작업 2의 `addImage`, 작업 4의 `SCREEN_COLORS`와 이미 놓인 두 개의 띠, 작업 5의 `addTitle`

- [ ] **1단계: `public/ui/death-scene.svg` 생성**

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="70" viewBox="0 0 400 70">
  <!--
    죽음 화면의 적과 가시. 배경과 바닥 가로선은 여기 없다 —
    GameOverScene이 화면 폭 전체에 그린다.
    색: 적 #E12E4C · 가시 #FFF1E8 · 테두리 #000000
    아래끝(y=70)이 바닥선에 닿도록 배치된다.
  -->
  <g>
    <rect x="40" y="40" width="34" height="30" fill="#000000"/>
    <rect x="42" y="42" width="30" height="26" fill="#E12E4C"/>
    <rect x="48" y="48" width="6" height="6" fill="#000000"/>
    <rect x="60" y="48" width="6" height="6" fill="#000000"/>
    <rect x="34" y="44" width="6" height="3" fill="#000000"/>
    <rect x="74" y="44" width="6" height="3" fill="#000000"/>
  </g>
  <g fill="#FFF1E8">
    <polygon points="230,70 244,34 258,70"/>
    <polygon points="258,70 272,34 286,70"/>
    <polygon points="286,70 300,34 314,70"/>
    <polygon points="314,70 328,34 342,70"/>
  </g>
</svg>
```

- [ ] **2단계: 그림 이름 등록**

`src/config.ts` — `TEX`의 `UI_TITLE` 아래에 추가:

```ts
  UI_DEATH: "tex-ui-death",
```

- [ ] **3단계: `BootScene`에 불러오기 한 줄 추가**

`src/scenes/BootScene.ts` — `UI_TITLE` 줄 아래:

```ts
    this.load.svg(TEX.UI_DEATH, "ui/death-scene.svg", { scale: TEXTURE_SCALE });
```

- [ ] **4단계: 죽음 화면 다시 구성**

`src/scenes/GameOverScene.ts` — 설정 임포트 줄에 `TEX`를 더하고, 스테이지 표기에 필요한 두 줄을 새로 추가한다:

```ts
// 4번째 줄을 바꾼다
import { BGM, SCREEN_COLORS, TEX } from "../config";
// 아래 두 줄을 새로 추가한다
import { levels } from "../levels/index";
import { stageLabel } from "../levels/stageLabel";
```

작업 3·4에서 손본 부분을 아래로 교체한다. 순서는 **띠 → 그림 → 글자**다:

```ts
// 바꾸기 전
    screen.addBand(245, 540, SCREEN_COLORS.DEATH_BG_LOW);
    screen.addBand(245, 249, SCREEN_COLORS.DEATH_LINE);
    screen.add(200, 80, "YOU DIED", "#ff004d", true);
    screen.add(300, 18, "press SPACE / ENTER to retry", "#fff1e8");
    screen.add(340, 14, "ESC for menu", "#7d7460");

// 바꾼 뒤
    screen.addBand(245, 540, SCREEN_COLORS.DEATH_BG_LOW);
    screen.addBand(245, 249, SCREEN_COLORS.DEATH_LINE);
    screen.addImage(210, 400, 70, TEX.UI_DEATH);
    screen.addTitle(
      130,
      80,
      "YOU DIED",
      SCREEN_COLORS.DEATH_TITLE,
      SCREEN_COLORS.DEATH_TITLE_EDGE,
      8,
    );
    screen.add(340, 30, "GAME OVER", SCREEN_COLORS.DEATH_SUBTITLE);
    screen.add(385, 20, stageLabel(this.level, levels.length), SCREEN_COLORS.PROMPT);
    screen.add(455, 16, "press SPACE / ENTER or TAP to retry", SCREEN_COLORS.PROMPT);
    screen.add(495, 14, "ESC for menu", SCREEN_COLORS.MUTED);
```

세로 배치가 서로 겹치지 않는지: 제목은 아래끝 170, 그림은 위끝 175 · 아래끝 245, 가로선이 245~249다.

- [ ] **5단계: 전체 검사**

실행: `npm test && npm run build`
예상: 전부 통과

- [ ] **6단계: 직접 확인**

실행: `npm run dev` → `http://localhost:5173/?stage=5` 로 들어가 일부러 죽는다
예상:
1. 자주색 화면에 `YOU DIED`, 그 아래 적과 흰 가시 4개, 바닥 가로선이 보인다.
2. **`STAGE 5/8`** 이 표시된다 — 실제로 죽은 스테이지와 같아야 한다.
3. `SPACE`/`ENTER`/클릭으로 같은 스테이지를 다시 시작하고, `ESC`로 타이틀로 간다.
4. 창을 넓게·좁게 끌어도 글자가 넘치지 않고 가로선이 양 끝까지 닿는다.

- [ ] **7단계: 커밋**

```bash
git add public/ui/death-scene.svg src/config.ts src/scenes/BootScene.ts src/scenes/GameOverScene.ts
git commit -m "feat(gameover): show the hazard art and which stage the run ended on

The stage line reuses the same helper the play HUD does, so the two can
never disagree about how stages are numbered."
```

**이 작업의 완료조건**
- `npm test && npm run build` 통과
- 죽음 화면에 그림과 `GAME OVER`, `STAGE N/8`이 표시됨
- `?stage=5`로 들어가 죽으면 `STAGE 5/8`이 뜸
- 재시도·메뉴 조작이 그대로 동작

**스킬 매핑:** `code-review` 반복(중요 지적 0건까지) → `rl`로 완료조건 검증

---

## Task 7 — 클리어 화면

**파일:**
- 생성: `public/ui/win-gopher.svg`
- 수정: `src/config.ts` (`TEX`에 항목 1개)
- 수정: `src/scenes/BootScene.ts` (1줄)
- 수정: `src/scenes/WinScene.ts`

**주고받는 것:**
- 내보냄: `TEX.UI_WIN`
- 사용: 작업 2의 `addImage`, 작업 4의 `SCREEN_COLORS`, 작업 5의 `addTitle`

- [ ] **1단계: `public/ui/win-gopher.svg` 생성**

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="180" viewBox="0 0 420 180">
  <!--
    클리어 화면의 월계관 쓴 고퍼. 배경은 여기 없다 — WinScene이 칠한다.
    색: 고퍼 #53A8F0 · 월계관 #5ADF62 · 반짝임 #FFEC27
        발 #FFCCAA · 테두리 #000000 · 흰색 #FFF1E8
  -->

  <!-- 월계관: 좌우 잎 5장씩 -->
  <g fill="#5ADF62">
    <ellipse cx="150" cy="140" rx="16" ry="8" transform="rotate(-30 150 140)"/>
    <ellipse cx="132" cy="115" rx="16" ry="8" transform="rotate(-55 132 115)"/>
    <ellipse cx="124" cy="88"  rx="16" ry="8" transform="rotate(-75 124 88)"/>
    <ellipse cx="128" cy="60"  rx="16" ry="8" transform="rotate(-100 128 60)"/>
    <ellipse cx="144" cy="38"  rx="16" ry="8" transform="rotate(-125 144 38)"/>
    <ellipse cx="270" cy="140" rx="16" ry="8" transform="rotate(30 270 140)"/>
    <ellipse cx="288" cy="115" rx="16" ry="8" transform="rotate(55 288 115)"/>
    <ellipse cx="296" cy="88"  rx="16" ry="8" transform="rotate(75 296 88)"/>
    <ellipse cx="292" cy="60"  rx="16" ry="8" transform="rotate(100 292 60)"/>
    <ellipse cx="276" cy="38"  rx="16" ry="8" transform="rotate(125 276 38)"/>
  </g>

  <!-- 고퍼 (가운데, x 175~245) -->
  <g>
    <rect x="181" y="30" width="12" height="12" fill="#000000"/>
    <rect x="227" y="30" width="12" height="12" fill="#000000"/>
    <rect x="175" y="40" width="70" height="120" fill="#000000"/>
    <rect x="180" y="45" width="60" height="110" fill="#53A8F0"/>
    <rect x="192" y="70" width="14" height="14" fill="#FFF1E8"/>
    <rect x="214" y="70" width="14" height="14" fill="#FFF1E8"/>
    <rect x="197" y="75" width="6" height="6" fill="#000000"/>
    <rect x="219" y="75" width="6" height="6" fill="#000000"/>
    <rect x="200" y="95" width="20" height="6" fill="#000000"/>
    <rect x="200" y="101" width="20" height="14" fill="#FFF1E8"/>
    <rect x="208" y="101" width="4" height="14" fill="#000000"/>
    <rect x="180" y="146" width="20" height="14" fill="#FFCCAA"/>
    <rect x="220" y="146" width="20" height="14" fill="#FFCCAA"/>
  </g>

  <!-- 반짝임 -->
  <g fill="#FFEC27">
    <rect x="330" y="40" width="6" height="22"/>
    <rect x="322" y="48" width="22" height="6"/>
    <rect x="86" y="62" width="5" height="18"/>
    <rect x="79" y="68" width="18" height="5"/>
    <rect x="352" y="104" width="4" height="14"/>
    <rect x="347" y="109" width="14" height="4"/>
  </g>
</svg>
```

- [ ] **2단계: 그림 이름 등록**

`src/config.ts` — `TEX`의 `UI_DEATH` 아래에 추가:

```ts
  UI_WIN: "tex-ui-win",
```

- [ ] **3단계: `BootScene`에 불러오기 한 줄 추가**

```ts
    this.load.svg(TEX.UI_WIN, "ui/win-gopher.svg", { scale: TEXTURE_SCALE });
```

- [ ] **4단계: 클리어 화면 다시 구성**

`src/scenes/WinScene.ts:4` — 같은 임포트 줄에 `TEX`를 더한다:

```ts
// 바꾸기 전
import { BGM, SCREEN_COLORS } from "../config";
// 바꾼 뒤
import { BGM, SCREEN_COLORS, TEX } from "../config";
```

작업 3·4에서 손본 부분을 아래로 교체한다:

```ts
// 바꾸기 전
    screen.add(200, 76, "YOU WIN!", "#00e436", true);
    screen.add(260, 18, "all stages cleared", "#fff1e8");
    screen.add(300, 14, "press SPACE / ENTER to play again", "#fff1e8");
    screen.add(340, 14, "ESC for menu", "#7d7460");

// 바꾼 뒤 — 그림을 먼저 넣어야 글자가 그 위에 온다
    screen.addImage(270, 420, 180, TEX.UI_WIN);
    screen.addTitle(
      120,
      76,
      "YOU WIN!",
      SCREEN_COLORS.WIN_TITLE,
      SCREEN_COLORS.WIN_TITLE_EDGE,
      8,
    );
    screen.add(390, 28, "CONGRATULATIONS!", SCREEN_COLORS.PROMPT);
    screen.add(425, 18, "all stages cleared", SCREEN_COLORS.PROMPT);
    screen.add(475, 14, "press SPACE / ENTER or TAP to play again", SCREEN_COLORS.PROMPT);
    screen.add(510, 14, "ESC for menu", SCREEN_COLORS.MUTED);
```

세로 배치: 제목 아래끝 158, 그림 180~360, `CONGRATULATIONS!` 376~404. 겹치지 않는다.

- [ ] **5단계: 전체 검사**

실행: `npm test && npm run build`
예상: 전부 통과

- [ ] **6단계: 직접 확인**

실행: `npm run dev` → `http://localhost:5173/?stage=8` 로 마지막 스테이지에 들어가 깃발까지 간다
예상:
1. 진초록 화면에 `YOU WIN!`, 월계관 쓴 고퍼, `CONGRATULATIONS!`, `all stages cleared`가 보인다.
2. `SPACE`/`ENTER`/클릭으로 1스테이지부터 다시 시작하고, `ESC`로 타이틀로 간다.
3. 창을 넓게·좁게 끌어도 글자가 넘치지 않고 그림 비율이 찌그러지지 않는다.

- [ ] **7단계: 커밋**

```bash
git add public/ui/win-gopher.svg src/config.ts src/scenes/BootScene.ts src/scenes/WinScene.ts
git commit -m "feat(win): crown the gopher on the all-stages-cleared screen"
```

**이 작업의 완료조건**
- `npm test && npm run build` 통과
- 클리어 화면에 월계관 고퍼와 `CONGRATULATIONS!`가 표시됨
- 다시 시작·메뉴 조작이 그대로 동작

**스킬 매핑:** `code-review` 반복(중요 지적 0건까지) → `rl`로 완료조건 검증

---

## Task 8 — 문서 갱신과 전체 점검

**파일:**
- 수정: `README.md`

- [ ] **1단계: `README.md`의 수동 확인 항목 보강**

`**4. 수동 플레이테스트.**` 절의 목록 **끝**에 다음을 덧붙인다:

```markdown
- 타이틀에 지형 그림과 `Let's go!!` 제목이 뜨고, 세 화면의 글자가 픽셀 서체로 보이는지.
- 죽었을 때 자주색 화면에 적·가시 그림과 `STAGE N/8`이 뜨고, N이 실제로 죽은 스테이지와 같은지
  (`?stage=5`로 들어가 죽어 `STAGE 5/8`이 뜨는지 확인).
- 마지막 스테이지를 깼을 때 진초록 화면에 월계관을 쓴 고퍼가 뜨는지.
- 창을 아주 넓게, 아주 좁게 끌었을 때 세 화면 모두 글자가 화면 밖으로 넘치지 않고,
  배경에 빈 틈이 생기지 않으며, 그림 비율이 찌그러지지 않는지.
```

- [ ] **2단계: 전체 흐름 한 번에 점검**

실행: `npm run dev` (쿼리 파라미터 없이 처음부터)

순서대로 확인한다:
1. 타이틀이 뜬다 — 배경·그림·제목·글꼴 모두 정상, 배경음악이 또렷하게 흐른다.
2. 아무 키를 눌러 1스테이지 진입 — 음악이 **작아지고** 효과음이 그 위로 들린다. 우측 위 `STAGE 1/8`.
3. 일부러 죽는다 — 죽음 화면의 배경·그림·`STAGE 1/8` 확인. 음악이 다시 또렷해진다.
4. `ESC`로 타이틀 복귀 — **음악이 끊기지 않고 이어진다**(기존 동작).
5. `?stage=8`로 마지막 스테이지를 깬다 — 클리어 화면 확인.
6. 창 크기를 크게·작게·세로로 길게 바꿔가며 세 화면을 다시 본다.

- [ ] **3단계: 그림이 없을 때도 화면이 성립하는지 확인**

실행: 그림 파일 하나를 잠시 옮겼다가 되돌린다.

```bash
mv public/ui/win-gopher.svg /tmp/win-gopher.svg.bak
npm run dev   # 클리어 화면 확인 후 Ctrl-C
mv /tmp/win-gopher.svg.bak public/ui/win-gopher.svg
```

예상: 클리어 화면에 **그림만 빠지고** 배경색과 글자는 정상. 초록 물음표 상자가 뜨지 않는다. 확인 후 파일을 반드시 되돌린다.

- [ ] **4단계: 프로덕션 빌드로도 확인**

실행: `npm run build && npm run preview`
예상: 빌드된 결과물에서도 세 화면이 개발 서버와 똑같이 보인다. 글꼴과 그림이 결과물에 함께 묶여 나온다.

- [ ] **5단계: 커밋**

```bash
git add README.md
git commit -m "docs: add the three screens to the manual test checklist"
```

**이 작업의 완료조건**
- `README.md`에 세 화면 확인 항목이 추가됨
- 2단계의 6개 확인이 모두 통과
- 그림 파일을 지워도 화면이 성립함
- `npm run preview`로 본 빌드 결과물이 개발 서버와 동일

**스킬 매핑:** `rl`로 계획 전체 완료조건 검증 → `compound-engineering:ce-code-review` 1회 (다관점 정밀 검증)

---

## 계획 전체 완료조건

### 자동 검증

```bash
npm test        # stageLabel 7개 포함 전부 통과
npm run build   # 타입 검사 + 빌드 통과
```

### 직접 확인

작업 8의 2~4단계를 전부 통과할 것.

### 산출물

- 새 파일 5개: `src/levels/stageLabel.ts`, `src/levels/stageLabel.test.ts`, `public/ui/` 아래 SVG 3장
- 이름 바뀐 파일 1개: `src/scenes/textScreen.ts` → `src/scenes/screen.ts`
- 새 의존성 1개: `@fontsource/press-start-2p`

---

## 금지사항

- 그림 파일에 배경을 칠하지 **말 것** → 배경은 코드가 화면 전체에 칠한다.
- 설계 문서의 시안 PNG를 자동 벡터 변환 도구에 넣지 **말 것** → 이 계획에 적힌 SVG를 그대로 쓴다.
- SVG 루트의 `width`/`height`를 빼먹지 **말 것** → Phaser가 이 값으로 크기를 계산한다.
- 씬 파일에 색 문자열(`"#ff004d"` 등)을 직접 쓰지 **말 것** → `SCREEN_COLORS`를 거친다.
- 글꼴을 실행 중 외부 서버에서 내려받지 **말 것** → 꾸러미로 설치해 결과물에 함께 묶는다.
- 글꼴이 도착하기 전에 게임을 시작하지 **말 것** → 첫 화면이 예비 글꼴로 그려진 채 굳는다.
- `Let's go!!`의 대소문자를 임의로 바꾸지 **말 것** → 소문자가 어색하면 보고하고 지시를 기다린다.
- 스테이지 표기 문구를 두 곳에 각각 쓰지 **말 것** → `stageLabel` 하나만 쓴다.
- 시안에 있다고 해서 점수·설정·기록 화면을 만들지 **말 것**.
- 게임플레이(스테이지 안) 그림·수치·소리를 건드리지 **말 것**.

---

## 고려사항

- **그리는 순서가 곧 겹치는 순서다.** 각 화면에서 띠 → 그림 → 글자 순으로 부른다. 순서를 바꾸면 그림이 글자를 덮는다.
- **외곽선 두께도 배율을 곱해야 한다.** 글자 크기만 키우고 외곽선을 그대로 두면 큰 화면에서 선이 실처럼 얇아진다. 화면 도우미가 함께 처리하도록 되어 있다.
- **그림이 차지하는 메모리.** 화면 배율 2인 기기에서 세 장 합쳐 약 19MB, 배율 3인 기기에서 약 43MB다. 문제가 되면 `{ scale: TEXTURE_SCALE }` 대신 상한을 건 값을 넘긴다.
- **가장 좁은 화면이 기준이다.** 글자 폭과 그림 안전 범위는 전부 가로 854를 기준으로 계산했다. 넓은 화면에서는 여유가 늘어날 뿐이다.
- **색이 두 곳에 존재한다.** 고퍼 파랑 같은 색은 `SCREEN_COLORS` 주석과 SVG 파일 양쪽에 적힌다. 서로를 가리키는 주석으로 막지만, 게임 안 고퍼 색을 바꾸는 작업을 할 때는 이 화면들도 함께 확인해야 한다.
- **글자 폭 가정.** 이 계획의 글자 크기는 "글자 하나가 글자 크기만큼 넓다"는 가정 위에 있다. 작업 3의 3단계에서 실제로 재고, 다르면 그 비율만큼 낮춘다.
- **소문자 모양.** 픽셀 글꼴은 대문자 위주로 설계된 경우가 있다. 작업 3에서 눈으로 확인한다.

---

## 제약사항

- **세로 540 고정, 가로 854~1100 가변.** 모든 배치가 이 안에서 성립해야 한다.
- **Phaser는 SVG를 벡터로 유지하지 않는다.** 불러올 때 정한 크기로 한 번 굽는다. 창을 아주 크게 키우면 그림이 조금 부드러워질 수 있고, 이는 게임 안 그림도 이미 받아들이고 있는 절충이다.
- **최상위 `await`** 는 `tsconfig.json`과 `vite.config.ts`가 모두 ES2022를 대상으로 하기 때문에 쓸 수 있다. 둘 중 하나라도 낮추면 `src/main.ts`가 깨진다.
- **커밋 훅이 매 커밋마다 빌드와 테스트를 돌린다.** 중간에 깨진 상태로 커밋할 수 없다.
- **글꼴 라이선스**는 SIL Open Font License 1.1이고 꾸러미에 포함되어 있다. 파일을 손으로 복사해 옮기지 않는다.
- **새 화면(씬)을 만들지 않는다.** 새 화면을 만들면 배경음악을 켜거나 끄는 호출을 반드시 넣어야 하는 저장소 규칙이 걸린다.

---

## 범위 밖 (보고만 하고 손대지 않음)

- 점수 시스템, 설정 화면, 최고 기록.
- 모바일 쓸어넘기기 조작 — 현재 게임은 화면을 누르는 조작만 지원하므로 `TAP`만 안내한다.
- 게임플레이(스테이지 안) 화면의 그림.
- 화면 전환 효과(페이드 등).
