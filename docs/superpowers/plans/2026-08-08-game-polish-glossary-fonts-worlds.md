# Game Polish Pass: Glossary, Stage Names, Retro HUD Font, Dev-Only Guards, World Ratio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up six small inconsistencies in the platformer (mega1): give the codebase a naming glossary, tidy the stage-entry name banner, make the in-play HUD use the same retro pixel font as the title/death/win screens, remove the on-screen control hint, re-verify the dev-only debug displays are stripped from production, and make the background-theme ratio (grassland/sunset/underground) scale dynamically instead of being hand-maintained.

**Architecture:** Six independent, low-risk changes to an existing Phaser 4 + TypeScript + Vite 2D platformer. Five are content/style edits (level data strings, one font-family constant swap, deleting dead HUD code, a doc-only addition, a re-verification with no code change). One (Task 6) replaces a hardcoded array with a pure apportionment function, following the existing `stageLabel.ts` pattern of passing `levels.length` explicitly rather than importing the levels module.

**Tech Stack:** Phaser 4, TypeScript, Vite, Vitest (unit tests), `@fontsource/press-start-2p` (bundled pixel font).

## Global Constraints

- Do not add a `name` field to `src/levels/level2.ts` — it has none today and that is existing, intentional behavior (no banner shows for stage 2).
- Do not touch `src/levels/stageLabel.ts` or the persistent "STAGE N/10" HUD text it powers — already plain, unrelated to this work.
- Do not swap the shield counter's `"●"` character for anything else without a follow-up decision — font-fallback rendering of that one glyph is an accepted, already-documented tradeoff (see Task 3).
- Do not touch hazard placement, hitbox sizes, or any file under the `threat.ts` / `pure-logic-testing.md` hazard-verification path — none of these six tasks change gameplay judgment logic.
- Do not add a second `import.meta.env.DEV` guard on top of the three that already exist (`MenuScene.ts`, `BootScene.ts`, `GameScene.ts`) — Task 5 is re-verification only.
- Do not touch `src/scenes/BootScene.ts`'s background-texture generation (`makeGrasslandBg`/`makeSunsetBg`/`makeUndergroundBg`) — it already builds all three textures regardless of stage count or ratio.
- Do not reorder `WORLDS` in `src/worlds.ts` (`grassland → sunset → underground` is the intentional morning → afternoon → underground progression).
- Do not hardcode a `stageCount === 10` special case anywhere — the point of Task 6 is that the ratio holds for any stage count.
- `Press Start 2P` ships with only the 400 (Regular) weight (`@fontsource/press-start-2p/latin-400.css`); do not set `fontStyle: "bold"` against it (browser-synthesized "faux bold" blurs pixel-font edges) — remove existing bold usage instead (Task 3).
- After each code-writing task (1, 3, 4, 6), run `/code-review` and iterate until zero P0/P1 findings remain. After all six tasks are done, run `/compound-engineering:ce-code-review` once as a final multi-perspective gate, then confirm `npm test` and `npm run build` both pass.

---

## Task 1: Strip the number-dash prefix from stage banner names

**Files:**
- Modify: `src/levels/level1.ts:15`, `src/levels/level3.ts:9`, `src/levels/level4.ts:10`, `src/levels/level5.ts:12`, `src/levels/level6.ts:11`, `src/levels/level7.ts:26`, `src/levels/level8.ts:12`, `src/levels/level9.ts:24`, `src/levels/level10.ts:22`

**Interfaces:**
- Consumes: nothing new — each file already has a `name?: string` field on its exported `LevelDef` object (see `src/levels/types.ts:243-245`).
- Produces: nothing new — the same `LevelDef.name` field, just with a different string value. `src/scenes/GameScene.ts:879-889` already reads `this.level.name` unchanged; no other task depends on the new string values except Task 2 (the glossary references the post-rename names).

The persistent "STAGE N/10" HUD text (`src/levels/stageLabel.ts`) already shows the stage number at all times, so the entry-banner name doesn't need to repeat it — that redundant "N — " prefix is the only thing being removed, not the words after it (they're already natural English).

- [ ] **Step 1: Confirm the current (prefixed) values**

Run: `grep -n 'name:' src/levels/level*.ts`

Expected output (9 lines, one per file with a `name` field — `level2.ts` has none and won't appear):
```
src/levels/level1.ts:15:  name: "1 — Warm Up",
src/levels/level3.ts:9:  name: "3 — Machines",
src/levels/level4.ts:10:  name: "4 — Traps",
src/levels/level5.ts:12:  name: "5 — Snipers",
src/levels/level6.ts:11:  name: "6 — Bombardment",
src/levels/level7.ts:26:  name: "7 — Gauntlet",
src/levels/level8.ts:12:  name: "8 — Cogs & Pitfalls",
src/levels/level9.ts:24:  name: "9 — Uprising",
src/levels/level10.ts:22:  name: "10 — Endgame",
```

- [ ] **Step 2: Edit each of the 9 files**

In each file, change the `name:` line to drop the `"N — "` prefix, keeping everything after it verbatim:

`src/levels/level1.ts:15`
```ts
  name: "Warm Up",
```

`src/levels/level3.ts:9`
```ts
  name: "Machines",
```

`src/levels/level4.ts:10`
```ts
  name: "Traps",
```

`src/levels/level5.ts:12`
```ts
  name: "Snipers",
```

`src/levels/level6.ts:11`
```ts
  name: "Bombardment",
```

`src/levels/level7.ts:26`
```ts
  name: "Gauntlet",
```

`src/levels/level8.ts:12`
```ts
  name: "Cogs & Pitfalls",
```

`src/levels/level9.ts:24`
```ts
  name: "Uprising",
```

`src/levels/level10.ts:22`
```ts
  name: "Endgame",
```

- [ ] **Step 3: Confirm the new values**

Run: `grep -n 'name:' src/levels/level*.ts`
Expected: same 9 lines as Step 1, but none of them contain a digit followed by `" — "` — every value starts directly with a letter.

- [ ] **Step 4: Run the existing suite (regression check)**

Run: `npm test`
Expected: all existing tests pass unchanged — this task touches only display strings, not hazard placement or level geometry, so `threat.test.ts` and friends are unaffected.

- [ ] **Step 5: Manual check**

Run `npm run dev`, open `http://localhost:5173/?stage=6` in a browser, and confirm the stage-entry banner reads "Bombardment" with no leading number or dash.

- [ ] **Step 6: Commit**

```bash
git add src/levels/level1.ts src/levels/level3.ts src/levels/level4.ts src/levels/level5.ts src/levels/level6.ts src/levels/level7.ts src/levels/level8.ts src/levels/level9.ts src/levels/level10.ts
git commit -m "polish: drop redundant number prefix from stage banner names"
```

---

## Task 2: Write `docs/glossary.md`

**Files:**
- Create: `docs/glossary.md`

**Interfaces:**
- Consumes: the post-Task-1 stage names (this task should run after Task 1 so the glossary reflects the final banner text), and the class names/file paths verified during planning (every name below was confirmed to exist with `ls`/`grep` against `src/objects/`).
- Produces: nothing consumed by other tasks — this is a standalone reference document.

Write the file with exactly this content:

```markdown
# 게임 용어집 (Glossary)

이 문서는 게임 내 캐릭터·스테이지·몹·기믹의 한글 명칭과 실제 코드 식별자(클래스명·파일 경로)를 매핑합니다. 목적은 프롬프트나 대화에서 "차저", "감지 돌진적" 같은 이름만으로도 어떤 파일을 가리키는지 바로 찾을 수 있게 하는 것입니다. 몹·기믹의 동작 설명은 이미 [`docs/report/game-guide.md`](report/game-guide.md)와 [`docs/CONTENT_REQUIREMENTS.md`](CONTENT_REQUIREMENTS.md)에 정리되어 있으므로 여기서는 반복하지 않고, 그 문서들에 없는 코드 매핑만 채웁니다.

## 캐릭터

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 고퍼(비공식 별칭) | `Player` | `src/objects/Player.ts` |

## 스테이지 (10개)

| 번호 | 배너 이름 | 레벨 파일 | 테마 |
|---|---|---|---|
| 1 | Warm Up | `src/levels/level1.ts` | 기본 이동·적·구덩이·가시로 몸풀기 |
| 2 | *(게임 내 표시 이름 없음)* | `src/levels/level2.ts` | 구덩이 2개로 늘어난, 스테이지 1의 살짝 어려운 버전 |
| 3 | Machines | `src/levels/level3.ts` | 컨베이어·이동 발판·진자 |
| 4 | Traps | `src/levels/level4.ts` | 화살 발사기·팝업 가시·쓰웜프 |
| 5 | Snipers | `src/levels/level5.ts` | 조준 터렛 |
| 6 | Bombardment | `src/levels/level6.ts` | 대포, 실드 아이템 첫 등장 |
| 7 | Gauntlet | `src/levels/level7.ts` | 그동안 나온 기믹 총출동 |
| 8 | Cogs & Pitfalls | `src/levels/level8.ts` | 회전 기어·크럼블 바닥 |
| 9 | Uprising | `src/levels/level9.ts` | 신규 몹 4종(망치 투척몹·공중 패트롤몹·감지 돌진적·수직 낙하몹) 등장 |
| 10 | Endgame | `src/levels/level10.ts` | 모든 기믹·몹 총결산 |

## 밟아서 처치 가능한 몹

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 기본 패트롤 적 | `Enemy` | `src/objects/Enemy.ts` |
| 망치 투척몹 | `HammerThrower` | `src/objects/HammerThrower.ts` |
| 공중 패트롤몹 | `Flyer` | `src/objects/Flyer.ts` |
| 감지 돌진적 | `Charger` | `src/objects/Charger.ts` |
| 수직 낙하몹 | `Dropper` | `src/objects/Dropper.ts` |

## 고정 위험 요소 (즉사, 밟기 불가)

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 고정 가시 | 없음 (레벨 데이터 `SpikeDef`) | `src/levels/types.ts` |
| 팝업 가시 | `PopupSpike` | `src/objects/PopupSpike.ts` |
| 진자 | `Pendulum` | `src/objects/Pendulum.ts` |
| 회전 기어 | `Gear` | `src/objects/Gear.ts` |
| 쓰웜프 | `Thwomp` | `src/objects/Thwomp.ts` |

## 발판·지형 기믹

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 이동 발판 | `MovingPlatform` | `src/objects/MovingPlatform.ts` |
| 컨베이어 | `Conveyor` | `src/objects/Conveyor.ts` |
| 스프링 | `Spring` | `src/objects/Spring.ts` |
| 크럼블 바닥 / 위장 발판 | `CrumblingPlatform` | `src/objects/CrumblingPlatform.ts` |
| 위장 발판(자동 순환형) | `TrapFloor` | `src/objects/TrapFloor.ts` |

## 원거리 공격

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 화살/다트 발사기 | `Shooter` | `src/objects/Shooter.ts` |
| 터렛 | `Turret` | `src/objects/Turret.ts` |
| 대포 | `Cannon` | `src/objects/Cannon.ts` |
| (터렛/발사기 공용 투사체) | `Projectile`, `ProjectilePool` | `src/objects/Projectile.ts`, `src/objects/ProjectilePool.ts` |
| (대포알) | `Cannonball` | `src/objects/Cannonball.ts` |
| (망치 투척몹의 투사체) | `Hammer` | `src/objects/Hammer.ts` |
| (수직 낙하몹의 투사체) | `FallingRock` | `src/objects/FallingRock.ts` |

## 기타 오브젝트

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 실드 픽업 | `ShieldItem` | `src/objects/ShieldItem.ts` |
| 깃발(스테이지 목표) | `Goal` | `src/objects/Goal.ts` |

## 배경 테마

| 사용자 표현 | 코드명 | 정의 위치 |
|---|---|---|
| 아침 | `grassland` | `src/worlds.ts` (`WORLDS` 배열) |
| 오후 | `sunset` | `src/worlds.ts` |
| 땅굴 | `underground` | `src/worlds.ts` |

스테이지 인덱스 → 테마 배정은 `worldForStage(index, stageCount)`(`src/worlds.ts`)가 계산합니다. 비율은 3:3:4(아침:오후:땅굴)이며, 스테이지 수가 바뀌어도 이 비율이 자동으로 유지됩니다.

## 참고: 자연 리스킨 시각 별칭

아래는 순수하게 그림 스타일을 가리키는 비공식 별칭이며 클래스명과는 무관합니다(`src/scenes/BootScene.ts`의 텍스처 생성 주석 기반).

| 시각 별칭 | 실제 클래스 |
|---|---|
| 버섯 점프대 | `Spring` |
| 나무 통나무 | `MovingPlatform` |
| 뿌리 벨트 | `Conveyor` |
| 솔방울(진자 머리) | `Pendulum` |
| 바위 압사기 | `Thwomp` |
| 가시덤불 | (스파이크, 클래스 없음) |
| 나뭇잎 깃발 | `Goal` |
| 나뭇잎 방패 | `ShieldItem` |
| 딱정벌레 | `Enemy` |
```

- [ ] **Step 1: Write the file**

Create `docs/glossary.md` with the exact content above.

- [ ] **Step 2: Verify every class name in the file actually exists**

Run:
```bash
for f in Player Enemy HammerThrower Flyer Charger Dropper PopupSpike Pendulum Gear Thwomp MovingPlatform Conveyor Spring CrumblingPlatform TrapFloor Shooter Turret Cannon Projectile ProjectilePool Cannonball Hammer FallingRock ShieldItem Goal; do
  test -f "src/objects/$f.ts" && echo "OK  $f" || echo "MISSING $f"
done
```
Expected: every line prints `OK` — no `MISSING` lines.

- [ ] **Step 3: Verify the stage table matches the post-Task-1 level files**

Run: `grep -n 'name:' src/levels/level*.ts`
Expected: the 9 values match the "배너 이름" column exactly (no `"N — "` prefixes).

- [ ] **Step 4: Commit**

```bash
git add docs/glossary.md
git commit -m "docs: add code-to-Korean-name glossary for stages, mobs, and gimmicks"
```

---

## Task 3: Apply the retro pixel font to the in-play HUD

**Files:**
- Modify: `src/scenes/GameScene.ts:848-891` (the `shieldText`, `stageText`, `debugCoordText`, `levelBanner` blocks inside `drawHud()`)
- Read (no changes): `src/scenes/screen.ts:24` (`SCREEN_FONT` constant, already exported)

**Interfaces:**
- Consumes: `SCREEN_FONT` — `export const SCREEN_FONT = '"Press Start 2P", monospace';` from `src/scenes/screen.ts:24`.
- Produces: nothing new — same four `Phaser.GameObjects.Text` fields (`shieldText`, `stageText`, `debugCoordText`, `levelBanner`), just a different `fontFamily` value. Task 4 deletes a fifth text object (`hudHint`) that this task deliberately leaves untouched (see Step 2 note).

- [ ] **Step 1: Add the import**

At the top of `src/scenes/GameScene.ts`, add this import alongside the existing scene imports (near line 14, after `import { stageLabel } from "../levels/stageLabel";`):

```ts
import { SCREEN_FONT } from "./screen";
```

- [ ] **Step 2: Confirm the current state**

Run: `grep -n 'fontFamily' src/scenes/GameScene.ts`

Expected: 5 matches, all `fontFamily: "monospace"`, in this order top-to-bottom: `hudHint`, `shieldText`, `stageText`, `debugCoordText`, `levelBanner`. (Step 1's new import shifts every line number below it by +1 from what's quoted elsewhere in this plan — match by surrounding code, not by the exact line number.)

The first match belongs to `hudHint`, which Task 4 deletes entirely — **do not touch it in this task**. The other four are this task's target.

- [ ] **Step 3: Edit `shieldText` (around line 848-855)**

Before:
```ts
    this.shieldText = this.add
      .text(0, 0, this.shieldLabel(), {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#29adff",
      })
      .setDepth(DEPTH.HUD);
```

After:
```ts
    this.shieldText = this.add
      .text(0, 0, this.shieldLabel(), {
        fontFamily: SCREEN_FONT,
        fontSize: "18px",
        color: "#29adff",
      })
      .setDepth(DEPTH.HUD);
```

- [ ] **Step 4: Edit `stageText` (around line 858-866)**

Before:
```ts
    this.stageText = this.add
      .text(0, 0, stageLabel(this.levelIndex, levels.length), {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#00e436",
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.HUD);
```

After:
```ts
    this.stageText = this.add
      .text(0, 0, stageLabel(this.levelIndex, levels.length), {
        fontFamily: SCREEN_FONT,
        fontSize: "16px",
        color: "#00e436",
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.HUD);
```

- [ ] **Step 5: Edit `debugCoordText` (around line 871-876)**

Before:
```ts
    if (import.meta.env.DEV) {
      this.debugCoordText = this.add
        .text(0, 0, "", { fontFamily: "monospace", fontSize: "14px", color: "#ff77a8" })
        .setDepth(DEPTH.HUD);
      this.debugCoordText.setStroke("#1d2b53", 4);
    }
```

After:
```ts
    if (import.meta.env.DEV) {
      this.debugCoordText = this.add
        .text(0, 0, "", { fontFamily: SCREEN_FONT, fontSize: "14px", color: "#ff77a8" })
        .setDepth(DEPTH.HUD);
      this.debugCoordText.setStroke("#1d2b53", 4);
    }
```

- [ ] **Step 6: Edit `levelBanner` (around line 879-891) — drop `fontStyle: "bold"` too**

Before:
```ts
    if (this.level.name) {
      this.levelBanner = this.add
        .text(0, 0, this.level.name, {
          fontFamily: "monospace",
          fontSize: "28px",
          color: "#ffec27",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.HUD);
      this.levelBanner.setStroke("#1d2b53", 5);
      this.tweens.add({ targets: this.levelBanner, alpha: 0, delay: 1800, duration: 800 });
    }
```

After:
```ts
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

(`fontStyle: "bold"` is removed — only the 400/Regular weight of Press Start 2P is loaded, so a `bold` request triggers the browser's synthetic-bold rendering, which blurs pixel-font edges; the font is already visually heavy without it.)

- [ ] **Step 7: Confirm the new state**

Run: `grep -n 'fontFamily' src/scenes/GameScene.ts`
Expected: 5 matches total. The first (`hudHint`) still reads `"monospace"` — that is correct at this point in the plan (Task 4 removes it next). The other 4 (`shieldText`, `stageText`, `debugCoordText`, `levelBanner`) now read `SCREEN_FONT`, not the string `"monospace"`.

- [ ] **Step 8: Run the existing suite and build**

Run: `npm test && npm run build`
Expected: both pass — this is a `fontFamily` value swap plus one field removal, no logic path changes.

- [ ] **Step 9: Manual check**

Run `npm run dev`, enter any stage, and confirm the shield counter, stage indicator, and level-name banner all render in the same blocky pixel typeface as the title screen. Resize the browser window to both a very wide and a very narrow width and confirm none of these HUD texts overlap or clip. If overlap/clipping does occur, do not reposition the text — instead lower that text's `fontSize` in 2px steps (e.g. `stageText` 16px → 14px) and re-check, keeping `fontFamily: SCREEN_FONT`.

- [ ] **Step 10: Code review gate**

Run `/code-review` against this change. Fix any P0/P1 findings and re-run until none remain.

- [ ] **Step 11: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(hud): use the title/death/win screens' pixel font for in-play HUD text"
```

---

## Task 4: Remove the on-screen control hint

**Files:**
- Modify: `src/scenes/GameScene.ts:84` (field declaration), `:836-845` (creation block inside `drawHud()`), `:897` (`hudTexts()`), `:931` (`layoutHud()` guard), `:938` (`layoutHud()` positioning)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new. After this task, `shieldText` is the first field `drawHud()` unconditionally creates each level load (replacing `hudHint`'s former role as the "has the HUD been built yet?" sentinel used by `layoutHud()`).

This task must run after Task 3, since Task 3 explicitly left `hudHint`'s `fontFamily: "monospace"` in place — this task deletes that line along with the rest of `hudHint`.

- [ ] **Step 1: Confirm the current state**

Run: `grep -n hudHint src/scenes/GameScene.ts`

Expected output (6 lines: field declaration, 2 lines inside the creation block, one in the tween call, one in `hudTexts()`, one guard, one position call):
```
84:  private hudHint!: Phaser.GameObjects.Text;
836:    this.hudHint = this.add
844:    this.hudHint.setStroke("#1d2b53", 4);
845:    this.tweens.add({ targets: this.hudHint, alpha: 0, delay: 5000, duration: 1000 });
897:    const texts = [this.hudHint, this.shieldText, this.stageText];
931:    if (!this.hudHint) return;
938:    this.hudHint.setPosition(left + 16, top + 14);
```
(Line numbers may drift by a few lines after Task 3's edits removed the `fontStyle: "bold"` line and added the `SCREEN_FONT` import — use this grep's live output, not the exact numbers, to locate each edit below.)

- [ ] **Step 2: Delete the field declaration**

Remove this line (near line 84):
```ts
  private hudHint!: Phaser.GameObjects.Text;
```

- [ ] **Step 3: Delete the creation block inside `drawHud()`**

Remove this entire block:
```ts
    this.hudHint = this.add
      .text(
        0,
        0,
        "Arrows / A,D to move  •  Space / W / Up to jump  •  stomp enemies, reach the flag",
        { fontFamily: "monospace", fontSize: "15px", color: "#fff1e8" },
      )
      .setDepth(DEPTH.HUD);
    this.hudHint.setStroke("#1d2b53", 4);
    this.tweens.add({ targets: this.hudHint, alpha: 0, delay: 5000, duration: 1000 });
```

- [ ] **Step 4: Update `hudTexts()`**

Before:
```ts
  private hudTexts(): Phaser.GameObjects.Text[] {
    const texts = [this.hudHint, this.shieldText, this.stageText];
    if (this.levelBanner) texts.push(this.levelBanner);
    if (this.debugCoordText) texts.push(this.debugCoordText);
    return texts;
  }
```

After:
```ts
  private hudTexts(): Phaser.GameObjects.Text[] {
    const texts = [this.shieldText, this.stageText];
    if (this.levelBanner) texts.push(this.levelBanner);
    if (this.debugCoordText) texts.push(this.debugCoordText);
    return texts;
  }
```

- [ ] **Step 5: Update the `layoutHud()` "already built?" guard**

Before:
```ts
    // The camera is placed before the HUD exists, on the first frame of a level.
    if (!this.hudHint) return;
```

After:
```ts
    // The camera is placed before the HUD exists, on the first frame of a level.
    if (!this.shieldText) return;
```

(`shieldText`, like the old `hudHint`, is unconditionally created every time `drawHud()` runs, so it serves the same "has the HUD been built yet?" role.)

- [ ] **Step 6: Delete the `hudHint` positioning line in `layoutHud()`**

Remove this line:
```ts
    this.hudHint.setPosition(left + 16, top + 14);
```

Leave the following lines (positioning `shieldText`, `stageText`, `levelBanner`, `debugCoordText`) exactly as they are — do **not** change their y-coordinates. `hudHint` used to fade out 5-6 seconds after a level started anyway, so for most of every stage's playtime that `top+14` slot was already visually empty while `shieldText` sat below it at `top+40` — deleting `hudHint` doesn't introduce a new visual gap, it just makes permanent what players already saw most of the time.

- [ ] **Step 7: Confirm the new state**

Run: `grep -n hudHint src/scenes/GameScene.ts`
Expected: no output (empty result).

Run: `grep -n 'fontFamily' src/scenes/GameScene.ts`
Expected: 4 lines total, all `SCREEN_FONT` — no `"monospace"` literal remains anywhere in the file.

- [ ] **Step 8: Run the existing suite and build**

Run: `npm test && npm run build`
Expected: both pass.

- [ ] **Step 9: Manual check**

Run `npm run dev`, enter any stage, and confirm: no control-hint text appears anywhere (not even briefly), and the shield counter / stage indicator / level banner still appear at their usual positions.

- [ ] **Step 10: Code review gate**

Run `/code-review` against this change. Fix any P0/P1 findings and re-run until none remain.

- [ ] **Step 11: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "polish: remove the on-screen control hint (no replacement)"
```

---

## Task 5: Re-verify dev-only debug displays are stripped from production (no code change)

**Files:** none modified — read-only verification of `src/scenes/MenuScene.ts:19`, `src/scenes/BootScene.ts:83-99`, `src/scenes/GameScene.ts` (the `debugCoordText` block), and the built output under `dist/`.

**Interfaces:** none — this task consumes nothing and produces nothing for later tasks.

This task exists because the user was worried the coordinate display and the `?stage=`/`?level=`/`?x=` URL parameters might leak into the production build. Investigation already confirmed all three are correctly guarded by `import.meta.env.DEV` and are absent from a real `npm run build` bundle. This task is the paper trail that re-confirms it after the other five tasks have touched the same file (`GameScene.ts`).

- [ ] **Step 1: Confirm all three guards are still in source**

Run:
```bash
grep -n "import.meta.env.DEV" src/scenes/MenuScene.ts src/scenes/BootScene.ts src/scenes/GameScene.ts
```
Expected: one match in each file (`MenuScene.ts` guarding `?stage=`/`?x=`, `BootScene.ts` guarding `?level=`, `GameScene.ts` guarding the coordinate-display text).

- [ ] **Step 2: Build production output and inspect it**

Run: `npm run build`

Then search the built bundle for the dev-only markers:
```bash
grep -c "askedStage" dist/assets/*.js
grep -c "devLevelFromQuery" dist/assets/*.js
```
Expected: both commands report `0` occurrences of the dev-only *executable* branches (`askedStage` assignment/read, the `devLevelFromQuery()` call site) in the built JS — Vite's `import.meta.env.DEV` check is statically `false` in a production build, so the bundler dead-code-eliminates those branches. (The unexecuted `debugCoordText` field reference may still appear as an inert, always-`undefined` optional-chained expression — that's harmless and does not need to be removed.)

- [ ] **Step 3: Serve the production build and confirm no dev URL params work**

Run: `npm run preview`, then open `http://localhost:4173/?stage=6` in a browser.
Expected: the title screen loads normally (not stage 6) — the dev-only stage-skip logic does not run in the production build.

- [ ] **Step 4: Record the result**

No file changes are made in this task. If any of the above checks fail (a guard is missing, or the dev-only branch appears live in the production bundle), stop and open a new task to add the missing guard before continuing to Task 6 — do not proceed with a known production leak.

---

## Task 6: Make the background-theme ratio (3:3:4) scale dynamically

**Files:**
- Modify: `src/worlds.ts` (replace the hardcoded array with a proportional-apportionment function)
- Modify: `src/scenes/GameScene.ts:804` (pass `levels.length` to `worldForStage`)
- Modify: `src/worlds.test.ts` (rewrite for the new 3:3:4 ratio and the new two-argument signature)

**Interfaces:**
- Consumes: `levels.length` from `src/levels/index.ts` (already imported into `GameScene.ts` at line 11 and already used the same way at line 859's `stageLabel(this.levelIndex, levels.length)` call — no new import needed).
- Produces: `worldForStage(index: number, stageCount: number): World` — the signature changes from the current single-argument `worldForStage(index: number): World`. The only caller in production code is `GameScene.ts:804`, updated in this task.

**Background:** `src/worlds.ts` currently hardcodes a 10-entry array (`WORLD_FOR_STAGE`) that a human extended by hand from 8 to 10 entries when stages 9-10 were added (git commit `ea4330b`: "worlds.ts extended (2x underground)"), which is how the ratio drifted from an original 3:2:3 to today's 3:2:5. This task removes that array in favor of a pure function that computes the split from any stage count.

- [ ] **Step 1: Write the failing tests first**

Replace the full contents of `src/worlds.test.ts` with:

```ts
import { describe, it, expect } from "vitest";
import { worldForStage } from "./worlds";

describe("worldForStage", () => {
  // [Happy] each world's representative stage returns the right world at a 10-stage, 3:3:4 split.
  it("returns grassland for stage index 0 (stage 1) at stageCount 10", () => {
    expect(worldForStage(0, 10)).toBe("grassland");
  });

  it("returns sunset for stage index 4 (stage 5) at stageCount 10", () => {
    expect(worldForStage(4, 10)).toBe("sunset");
  });

  it("returns underground for stage index 8 (stage 9) at stageCount 10", () => {
    expect(worldForStage(8, 10)).toBe("underground");
  });

  // [Boundary] the world boundaries (2|3, 5|6) split exactly where 3:3:4 says they should.
  it("stage index 2 (last grassland stage) is still grassland", () => {
    expect(worldForStage(2, 10)).toBe("grassland");
  });

  it("stage index 3 (first sunset stage) is sunset", () => {
    expect(worldForStage(3, 10)).toBe("sunset");
  });

  it("stage index 5 (last sunset stage) is still sunset", () => {
    expect(worldForStage(5, 10)).toBe("sunset");
  });

  it("stage index 6 (first underground stage) is underground", () => {
    expect(worldForStage(6, 10)).toBe("underground");
  });

  it("stage index 9 (last stage) is underground", () => {
    expect(worldForStage(9, 10)).toBe("underground");
  });

  // [Boundary] out-of-range indices fall back to the first world (same convention as levelAt).
  it("falls back to the first world for a negative index", () => {
    expect(worldForStage(-1, 10)).toBe("grassland");
  });

  it("falls back to the first world for an out-of-range index", () => {
    expect(worldForStage(99, 10)).toBe("grassland");
  });

  // [Boundary] the ratio is computed dynamically — a non-10 stage count still apportions 3:3:4 by weight.
  it("apportions 13 stages as 4:4:5 via the largest-remainder method", () => {
    expect(worldForStage(0, 13)).toBe("grassland");
    expect(worldForStage(3, 13)).toBe("grassland");
    expect(worldForStage(4, 13)).toBe("sunset");
    expect(worldForStage(7, 13)).toBe("sunset");
    expect(worldForStage(8, 13)).toBe("underground");
    expect(worldForStage(12, 13)).toBe("underground");
  });

  // [Error]: not applicable — worldForStage is a pure arithmetic function with no I/O
  // or thrown exceptions, so there is no error path to cover.
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/worlds.test.ts`
Expected: FAIL — `worldForStage` still takes one argument, so every two-argument call in the new tests either type-errors (in a real TS build) or silently ignores the second argument and returns the old 3:2:5 mapping, producing mismatches like `worldForStage(4, 10)` returning `"grassland"` (old array index 4) instead of the expected `"sunset"`.

- [ ] **Step 3: Replace `src/worlds.ts` with the apportioning implementation**

```ts
/**
 * 스테이지 인덱스(0-based) → 세계 매핑. `LevelDef`에 필드를 추가하지 않고
 * 여기서 도출한다(레벨 데이터 스키마 변경 없음).
 *
 * 비율은 3:3:4(grassland:sunset:underground)로 고정되어 있고, 스테이지 총
 * 개수(stageCount)에 비례 배분한다 — 정수로 안 떨어지면 최대 나머지법
 * (largest remainder method)으로 근사한다. 스테이지가 늘어나도 배열을 손으로
 * 고칠 필요가 없다.
 */
export const WORLDS = ["grassland", "sunset", "underground"] as const;
export type World = (typeof WORLDS)[number];

const RATIO: Record<World, number> = { grassland: 3, sunset: 3, underground: 4 };

function worldCounts(stageCount: number): Record<World, number> {
  const totalWeight = WORLDS.reduce((sum, w) => sum + RATIO[w], 0);
  const raw = WORLDS.map((w) => (stageCount * RATIO[w]) / totalWeight);
  const floors = raw.map(Math.floor);
  let remaining = stageCount - floors.reduce((a, b) => a + b, 0);

  const byLargestRemainder = raw
    .map((value, i) => ({ i, remainder: value - floors[i] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let k = 0; k < remaining; k++) floors[byLargestRemainder[k].i]++;

  return Object.fromEntries(WORLDS.map((w, i) => [w, floors[i]])) as Record<World, number>;
}

export function worldForStage(index: number, stageCount: number): World {
  if (index < 0 || index >= stageCount) return WORLDS[0];

  const counts = worldCounts(stageCount);
  let cursor = 0;
  for (const world of WORLDS) {
    cursor += counts[world];
    if (index < cursor) return world;
  }
  return WORLDS[0];
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run src/worlds.test.ts`
Expected: PASS — all 11 assertions succeed.

- [ ] **Step 5: Update the call site in `GameScene.ts`**

`src/scenes/GameScene.ts:804`, before:
```ts
    const world = worldForStage(this.levelIndex);
```

After:
```ts
    const world = worldForStage(this.levelIndex, levels.length);
```

- [ ] **Step 6: Run the full suite and build**

Run: `npm test && npm run build`
Expected: both pass. (`npm test` re-runs `src/worlds.test.ts` alongside everything else; `npm run build` type-checks the new two-argument call site.)

- [ ] **Step 7: Manual check**

Run `npm run dev`. Visit `http://localhost:5173/?stage=6` and confirm the background is now the sunset (orange/pink/purple) theme, not the underground (dark cave) theme it used to be — stage 6 is the one stage whose theme actually changes under the new 3:3:4 ratio. Then check `http://localhost:5173/?stage=7` and confirm it's underground, matching the new boundary.

- [ ] **Step 8: Code review gate**

Run `/code-review` against this change. Fix any P0/P1 findings and re-run until none remain.

- [ ] **Step 9: Commit**

```bash
git add src/worlds.ts src/worlds.test.ts src/scenes/GameScene.ts
git commit -m "feat(worlds): compute background-theme ratio dynamically (3:3:4) instead of a hardcoded array"
```

---

## Final Gate (after all six tasks)

- [ ] Run `/compound-engineering:ce-code-review` once across the full diff for a multi-perspective (spec compliance + code quality) final check.
- [ ] Run `npm test` — full suite passes.
- [ ] Run `npm run build` — type-check and bundling both succeed.
- [ ] Manual playtest per `README.md`'s existing checklist: confirm no regressions in movement, enemy stomping, hazard death, flag-clear, and the title/death/win screens, in addition to this plan's own six checks above.
