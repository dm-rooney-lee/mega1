# README·glossary.md 경계 재정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `docs/report/game-guide.md`의 플레이어용 내용을 `README.md`에 통합하고, 몹/기믹 동작 설명은 `docs/glossary.md`로 옮겨 유일한 출처로 만든 뒤 `game-guide.md`를 삭제한다.

**Architecture:** 코드 변경 없음. 마크다운 3개 파일(`README.md`, `docs/glossary.md`, `docs/report/game-guide.md`)만 대상으로 하는 순수 문서 재배치.

**Tech Stack:** Markdown, 검증은 `npm run build` / `npm test` / `grep`.

**설계 근거:** `docs/superpowers/specs/2026-08-09-readme-glossary-consolidation-design.md` (사용자 승인 완료).

## Global Constraints

- `src/` 아래 코드는 어떤 파일도 수정하지 않는다.
- `docs/CONTENT_REQUIREMENTS.md`, `docs/PROJECT_ANALYSIS.md`, `docs/report/ai-usage-report.md`는 범위 밖이다 — 손대지 않는다(단, `glossary.md`가 이 문서들을 인용하는 문장 자체는 제거 대상).
- 이 작업에는 코드 로직이 없으므로 TDD(실패하는 테스트 먼저 작성) 절차를 적용하지 않는다 — 대신 각 Task는 `grep`/`diff`로 실제 파일 내용을 확인하는 검증 스텝으로 테스트를 대체한다.
- 새로 들어가는 설명 문장은 전부 `docs/report/game-guide.md`에 이미 있고 코드와 대조 검증된 문장을 그대로 재사용한다 — 새로 창작하지 않는다.
- 세 Task 모두 `docs/report/game-guide.md`가 삭제되기 전에 그 내용을 옮겨야 하므로, **Task 3(삭제)은 Task 1·2가 끝난 뒤에만 실행한다.**

---

### Task 1: README.md — 게임 개요·플레이 방법·빌드 실행 섹션 추가

**Files:**
- Modify: `README.md`

**Interfaces:** 없음(마크다운 문서, 코드 인터페이스 없음).

- [ ] **Step 1: 현재 파일을 확인한다**

Run: `cat -n README.md`

3~4번째 줄이 아래와 정확히 일치하는지 확인(다르면 이 Task를 진행하기 전에 멈추고 최신 내용을 다시 확인한다):

```
   3 **Phaser 4**, **TypeScript**, **Vite**로 만든 작은 2D 플랫포머 개념증명(PoC, Proof of Concept)입니다.
   4 방향키(또는 `A`/`D`)로 이동하고, `Space`/`W`/`Up`으로 점프하고, 적을 밟아 처치하고, 깃발에 도달하세요.
```

- [ ] **Step 2: 최상단 소개 문단을 트리밍하고 "게임 개요"·"플레이 방법" 섹션을 추가한다**

`Edit` 도구로 다음 `old_string`을 찾아 `new_string`으로 교체한다:

old_string:
````
**Phaser 4**, **TypeScript**, **Vite**로 만든 작은 2D 플랫포머 개념증명(PoC, Proof of Concept)입니다.
방향키(또는 `A`/`D`)로 이동하고, `Space`/`W`/`Up`으로 점프하고, 적을 밟아 처치하고, 깃발에 도달하세요.

## 사전 준비
````

new_string:
````
**Phaser 4**, **TypeScript**, **Vite**로 만든 작은 2D 플랫포머 개념증명(PoC, Proof of Concept)입니다. 목표는 단순합니다 — 각 스테이지를 걷고 뛰어 통과해 깃발에 도달하는 것.

## 게임 개요

- 총 **10개 스테이지**를 순서대로 플레이합니다.
- 밟아서 처치할 수 있는 몹부터 즉사형 장애물, 원거리 공격까지 **16종 이상의 해저드**가 등장합니다(자세한 소개는 아래 [플레이 방법](#플레이-방법) 참고).
- **체크포인트가 없습니다** — 죽으면 그 스테이지의 처음부터 다시 시작합니다.
- 스토리 없는 순수 액션 플랫포머입니다. 마지막 스테이지를 깨면 월계관을 쓴 고퍼가 등장하는 승리 화면을 볼 수 있습니다.

### 스테이지 구성

| 스테이지 | 테마 | 대표 기믹 |
|---|---|---|
| 1 | Warm Up | 기본 이동·적·구덩이·가시로 몸풀기 |
| 2 | Double Trouble | 구덩이 2개로 늘어난, 스테이지 1의 살짝 어려운 버전 |
| 3 | Machines | 컨베이어·이동 발판·진자 |
| 4 | Traps | 화살 발사기·팝업 가시·쓰웜프 |
| 5 | Snipers | 조준 터렛 |
| 6 | Bombardment | 대포, 실드 아이템 첫 등장 |
| 7 | Gauntlet | 그동안 나온 기믹 총출동 |
| 8 | Cogs & Pitfalls | 회전 기어·크럼블 바닥 |
| 9 | Uprising | 신규 몹 4종(망치 투척몹·공중 패트롤몹·감지 돌진적·수직 낙하몹) 등장 |
| 10 | Endgame | 모든 기믹·몹 총결산 |

## 플레이 방법

### 조작

| 키 | 동작 |
|---|---|
| ← 또는 `A` | 왼쪽으로 이동 |
| → 또는 `D` | 오른쪽으로 이동 |
| ↑ 또는 `W` 또는 `Space` | 점프 — 짧게 누르면 낮게, 길게 누르면 높게 뛰어오릅니다 |

발판 끝에서 살짝 늦게 눌러도, 착지 직전에 살짝 미리 눌러도 점프가 나가도록 약간의 여유 시간을 두고 있어 조작감이 뻑뻑하지 않습니다.

### 목표와 승패

- **클리어**: 스테이지의 깃발에 도달하면 그 스테이지를 클리어하고, 잠시 후 자동으로 다음 스테이지가 시작됩니다. 10번째 스테이지까지 클리어하면 승리 화면이 뜹니다.
- **사망**: 구덩이에 빠지거나, 가시류·즉사형 해저드·적·투사체에 닿으면 그 자리에서 사망하고 스테이지 처음부터 다시 시작합니다.
- **적 처치**: 적의 **위에서 밟으면** 처치되고 플레이어가 살짝 튀어오릅니다(바운스). 옆이나 아래에서 부딪히면 사망 처리됩니다 — 이 규칙은 밟아서 처치 가능한 몹 전체(아래 참고)에 공통으로 적용됩니다.
- **실드 아이템**: 스테이지 6부터 등장하는 픽업으로, 주우면 대포알이나 화살/터렛 발사체 한 번을 막아줍니다. 단, 망치나 낙석에는 효과가 없고 가시·진자·기어 같은 즉사형 장애물도 막아주지 않습니다.

### 해저드 소개

몹과 해저드가 16종 이상으로 많아 4개 카테고리로 나뉩니다. 각각의 정확한 동작은 [`docs/glossary.md`](docs/glossary.md)에 정리되어 있습니다.

- **밟아서 처치 가능한 몹** — 위에서 밟으면 처치, 옆/아래로 부딪히면 사망
- **발판·지형 기믹** — 밟고 지나가는 지형이지만 평범하지 않게 움직이거나 무너짐
- **고정 위험 요소** — 접촉하면 즉시 사망, 밟아서 처치할 수 없음
- **원거리 공격** — 발사체에 맞으면 사망(실드가 있으면 한 번 막아줌), 발사대 몸통을 어떻게 할 수 있는지는 종류마다 다름

## 사전 준비
````

- [ ] **Step 3: 변경을 확인한다**

Run: `git diff -- README.md | head -60`
Expected: 위 old_string이 사라지고 new_string 블록이 들어가 있음. 그 아래 "## 사전 준비"부터 "## 게임 실행"까지는 변경 없이 그대로 남아있어야 한다.

- [ ] **Step 4: "빌드된 파일로 실행하기" 섹션을 "게임 실행" 다음, "테스트" 앞에 추가한다**

`Edit` 도구로 다음 `old_string`을 찾아 `new_string`으로 교체한다(이 블록은 "게임 실행" 섹션의 마지막 문단이므로 Step 2의 편집과 겹치지 않는다):

old_string:
````
`ESC`가 고장난 게 아니라 의도된 개발용 동작이니, 타이틀 화면을 보려면 주소창에서 `?stage=...` 부분을 지우고 새로고침하세요.

## 테스트
````

new_string:
````
`ESC`가 고장난 게 아니라 의도된 개발용 동작이니, 타이틀 화면을 보려면 주소창에서 `?stage=...` 부분을 지우고 새로고침하세요.

## 빌드된 파일로 실행하기

`npm run build`로 만든 배포용 결과물(`dist/`)을 실제로 실행하는 방법입니다. 이 명령 자체(내부적으로 `tsc --noEmit`과 `vite build`를 실행)는 아래 "테스트" 섹션의 2번에서 개발 검증 목적으로 다시 설명합니다 — 거기는 "이 빌드가 깨지지 않았는가"를 확인하는 절이고, 여기는 "만들어진 결과물을 실제로 어떻게 실행하는가"를 다루는 절이라는 점이 다릅니다.

**`dist/index.html`을 브라우저에서 더블클릭해 직접 열지 마세요.** 빌드 결과물은 `<script type="module">`로 산출되는데, 대부분의 브라우저는 `file://` 경로에서 모듈 스크립트를 CORS 정책으로 차단해 게임이 로드되지 않습니다. 반드시 `http://`로 서빙하는 로컬 서버를 통해 열어야 합니다.

가장 간단한 방법은 저장소를 그대로 갖고 있는 경우입니다:

```bash
npm run preview
```

`dist/`를 로컬 서버로 서빙하고 `http://localhost:4173`에서 게임이 바로 열립니다.

## 테스트
````

- [ ] **Step 5: 변경을 확인한다**

Run: `grep -n "## 빌드된 파일로 실행하기" README.md`
Expected: 1개 매치.

- [ ] **Step 6: "테스트 > 4. 수동 플레이테스트" 체크리스트의 몹 나열 항목을 축약한다**

`Edit` 도구로 다음 `old_string`을 찾아 `new_string`으로 교체한다:

old_string:
````
- **스테이지 9·10의 신규 몹 4종** (`?stage=9`로 들어가 확인):
  - 망치 투척몹 — 걸어다니다 멈춰서 망치를 포물선으로 던지는지, 밟으면 처치되는지, 망치에 맞으면 게임 오버로 이어지는지.
  - 공중 패트롤몹 — 정해진 경로를 왕복하며, 몸에 닿으면 게임 오버, 밟으면 처치되는지.
  - 감지 돌진적 — 평소엔 천천히 왕복하다 가까이 가면 빠르게 돌진해오는지, 돌진 중에도 밟으면 처치되는지.
  - 수직 낙하몹 — 발판 위에 가만히 있다가 그 아래를 지나가면 예고 후 바위를 떨어뜨리는지, 밟으면 처치되는지.
  - 스테이지 9·10 모두 기존 몹·기믹(진자·기어·트웜프·화살 발사기·터렛·대포·팝업 스파이크·이동 발판·컨베이어·스프링·위장 발판·크럼블 바닥)이 신규 몹과 함께 등장하는지.
````

new_string:
````
- **스테이지 9·10의 신규 몹 4종** (`?stage=9`로 들어가 확인, 몹 목록과 동작은 위 "플레이 방법 > 해저드 소개" 참고): 각 몹이 정상적으로 공격하고, 몸에 닿으면 게임 오버로 이어지고, 밟으면 처치되는지 확인.
- 스테이지 9·10 모두 기존 몹·기믹이 신규 몹과 함께 등장하는지.
````

- [ ] **Step 7: 전체 diff를 검토한다**

Run: `git diff -- README.md`
Expected: Step 2, 4, 6에서 의도한 3개 편집만 보이고 그 외 줄은 변경되지 않았다.

- [ ] **Step 8: 커밋한다**

```bash
git add README.md
git commit -m "docs(readme): fold game-guide.md content into README

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: docs/glossary.md — 서두 문장 정리 + 동작 설명 추가

**Files:**
- Modify: `docs/glossary.md`

**Interfaces:** 없음.

- [ ] **Step 1: 서두 문장을 교체한다**

`Edit` 도구로 다음 `old_string`을 찾아 `new_string`으로 교체한다:

old_string:
```
이 문서는 게임 내 캐릭터·스테이지·몹·기믹의 한글 명칭과 실제 코드 식별자(클래스명·파일 경로)를 매핑합니다. 목적은 프롬프트나 대화에서 "차저", "감지 돌진적" 같은 이름만으로도 어떤 파일을 가리키는지 바로 찾을 수 있게 하는 것입니다. 몹·기믹의 동작 설명은 이미 [`docs/report/game-guide.md`](report/game-guide.md)와 [`docs/CONTENT_REQUIREMENTS.md`](CONTENT_REQUIREMENTS.md)에 정리되어 있으므로 여기서는 반복하지 않고, 그 문서들에 없는 코드 매핑만 채웁니다.
```

new_string:
```
이 문서는 게임 내 캐릭터·스테이지·몹·기믹의 한글 명칭, 실제 코드 식별자(클래스명·파일 경로), 그리고 각 몹·기믹이 어떻게 동작하는지를 함께 정리합니다. 목적은 프롬프트나 대화에서 "차저", "감지 돌진적" 같은 이름만으로도 어떤 파일을 가리키고 어떻게 동작하는지 바로 찾을 수 있게 하는 것입니다. 게임을 처음 소개하는 내용(장르, 스테이지 구성, 조작법, 실행 방법)은 [`README.md`](../README.md)에 있으므로 여기서는 반복하지 않습니다.
```

- [ ] **Step 2: 스테이지 표에서 "테마" 열을 삭제하고 스테이지 2 이름을 고정한다**

원본 스테이지 2 행(`| 2 | *(게임 내 표시 이름 없음)* | ... |`)은 낡은 정보다 — `src/levels/level2.ts:13`에 `name: "Double Trouble"`이 이미 있다(1차 출처로 확인됨, `game-guide.md`에는 이미 반영되어 있었음). 이번 편집에서 같이 고친다.

`Edit` 도구로 다음 `old_string`을 찾아 `new_string`으로 교체한다:

old_string:
````
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
````

new_string:
````
## 스테이지 (10개)

테마 소개는 [`README.md`](../README.md)의 "게임 개요 > 스테이지 구성" 참고.

| 번호 | 배너 이름 | 레벨 파일 |
|---|---|---|
| 1 | Warm Up | `src/levels/level1.ts` |
| 2 | Double Trouble | `src/levels/level2.ts` |
| 3 | Machines | `src/levels/level3.ts` |
| 4 | Traps | `src/levels/level4.ts` |
| 5 | Snipers | `src/levels/level5.ts` |
| 6 | Bombardment | `src/levels/level6.ts` |
| 7 | Gauntlet | `src/levels/level7.ts` |
| 8 | Cogs & Pitfalls | `src/levels/level8.ts` |
| 9 | Uprising | `src/levels/level9.ts` |
| 10 | Endgame | `src/levels/level10.ts` |
````

- [ ] **Step 3: "밟아서 처치 가능한 몹" 표에 "동작" 열을 추가한다**

old_string:
````
## 밟아서 처치 가능한 몹

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 기본 패트롤 적 | `Enemy` | `src/objects/Enemy.ts` |
| 망치 투척몹 | `HammerThrower` | `src/objects/HammerThrower.ts` |
| 공중 패트롤몹 | `Flyer` | `src/objects/Flyer.ts` |
| 감지 돌진적 | `Charger` | `src/objects/Charger.ts` |
| 수직 낙하몹 | `Dropper` | `src/objects/Dropper.ts` |
````

new_string:
````
## 밟아서 처치 가능한 몹

공통 규칙: 위에서 밟으면 처치, 옆/아래로 부딪히면 사망.

| 한글 명칭 | 코드 식별자 | 파일 | 동작 |
|---|---|---|---|
| 기본 패트롤 적 | `Enemy` | `src/objects/Enemy.ts` | 정해진 구간을 왕복 |
| 망치 투척몹 | `HammerThrower` | `src/objects/HammerThrower.ts` | 걸어다니다 멈춰서 망치를 포물선으로 던짐(망치 자체는 실드로 막을 수 없음) |
| 공중 패트롤몹 | `Flyer` | `src/objects/Flyer.ts` | 정해진 공중 경로를 왕복 |
| 감지 돌진적 | `Charger` | `src/objects/Charger.ts` | 평소엔 느리게 왕복하다 플레이어가 가까워지면 빠르게 돌진(돌진 중에도 밟으면 처치됨) |
| 수직 낙하몹 | `Dropper` | `src/objects/Dropper.ts` | 발판 위에 가만히 있다가 그 아래를 지나가면 예고 후 바위를 떨어뜨림(바위도 실드로 막을 수 없음) |
````

- [ ] **Step 4: "고정 위험 요소" 표에 "동작" 열을 추가한다**

old_string:
````
## 고정 위험 요소 (즉사, 밟기 불가)

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 고정 가시 | 없음 (레벨 데이터 `SpikeDef`) | `src/levels/types.ts` |
| 팝업 가시 | `PopupSpike` | `src/objects/PopupSpike.ts` |
| 진자 | `Pendulum` | `src/objects/Pendulum.ts` |
| 회전 기어 | `Gear` | `src/objects/Gear.ts` |
| 쓰웜프 | `Thwomp` | `src/objects/Thwomp.ts` |
````

new_string:
````
## 고정 위험 요소 (즉사, 밟기 불가)

공통 규칙: 접촉하면 즉시 사망, 밟아서 처치할 수 없음.

| 한글 명칭 | 코드 식별자 | 파일 | 동작 |
|---|---|---|---|
| 고정 가시 | 없음 (레벨 데이터 `SpikeDef`) | `src/levels/types.ts` | 바닥에 고정된 가시 |
| 팝업 가시 | `PopupSpike` | `src/objects/PopupSpike.ts` | 바닥에 숨어 있다 주기적으로 튀어나옴(튀어나오기 전에 깜빡이며 예고) |
| 진자 | `Pendulum` | `src/objects/Pendulum.ts` | 고정된 지점에서 좌우로 흔들리는 가시 달린 구 |
| 회전 기어 | `Gear` | `src/objects/Gear.ts` | 정해진 경로를 오가며 회전하는 톱니바퀴 |
| 쓰웜프 | `Thwomp` | `src/objects/Thwomp.ts` | 위에서 대기하다 플레이어가 지나가면 예고 후 빠르게 내려찍고, 다시 천천히 올라감(내려찍는 순간만 위험) |
````

- [ ] **Step 5: "발판·지형 기믹" 표에 "동작" 열을 추가한다**

old_string:
````
## 발판·지형 기믹

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 이동 발판 | `MovingPlatform` | `src/objects/MovingPlatform.ts` |
| 컨베이어 | `Conveyor` | `src/objects/Conveyor.ts` |
| 스프링 | `Spring` | `src/objects/Spring.ts` |
| 크럼블 바닥 / 위장 발판 | `CrumblingPlatform` | `src/objects/CrumblingPlatform.ts` |
| 위장 발판(자동 순환형) | `TrapFloor` | `src/objects/TrapFloor.ts` |
````

new_string:
````
## 발판·지형 기믹

공통 규칙: 밟고 지나가는 지형이지만 평범하지 않게 움직이거나 무너짐.

| 한글 명칭 | 코드 식별자 | 파일 | 동작 |
|---|---|---|---|
| 이동 발판 | `MovingPlatform` | `src/objects/MovingPlatform.ts` | 정해진 경로를 오가며 플레이어를 태우고 이동 |
| 컨베이어 | `Conveyor` | `src/objects/Conveyor.ts` | 발판 위에서 플레이어가 한쪽으로 밀려남 |
| 스프링 | `Spring` | `src/objects/Spring.ts` | 밟으면 위로 튕겨 오름 |
| 크럼블 바닥 / 위장 발판 | `CrumblingPlatform` | `src/objects/CrumblingPlatform.ts` | 밟으면 무너져 사라짐 |
| 위장 발판(자동 순환형) | `TrapFloor` | `src/objects/TrapFloor.ts` | 밟으면 무너져 사라짐(자동으로 순환 반복) |
````

- [ ] **Step 6: "원거리 공격" 표에 "동작" 열을 추가한다**

old_string:
````
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
````

new_string:
````
## 원거리 공격

공통 규칙: 발사체에 맞으면 사망(실드가 있으면 한 번 막아줌). 발사대 몸통 자체를 어떻게 할 수 있는지는 종류마다 다름.

| 한글 명칭 | 코드 식별자 | 파일 | 동작 |
|---|---|---|---|
| 화살/다트 발사기 | `Shooter` | `src/objects/Shooter.ts` | 고정된 위치에서 일정 주기로 화살을 발사. 몸통이 단단해 밟아도 파괴되지 않음 |
| 터렛 | `Turret` | `src/objects/Turret.ts` | 일정 주기로 발사체를 쏘며, 정해진 방향으로 쏘거나 플레이어를 조준해서 쏨(조준 시에는 미리 조준선으로 예고). 몸통은 위에서 밟으면 파괴됨 |
| 대포 | `Cannon` | `src/objects/Cannon.ts` | 일정 주기로 대포알을 발사. 몸통 자체는 플레이어와 부딪히지 않아 위험하지도, 밟아서 파괴할 수도 없음 |
| (터렛/발사기 공용 투사체) | `Projectile`, `ProjectilePool` | `src/objects/Projectile.ts`, `src/objects/ProjectilePool.ts` | 터렛·화살 발사기가 발사하는 투사체(실드로 막을 수 있음) |
| (대포알) | `Cannonball` | `src/objects/Cannonball.ts` | 대포가 발사하는 투사체(실드로 막을 수 있음) |
| (망치 투척몹의 투사체) | `Hammer` | `src/objects/Hammer.ts` | 망치 투척몹이 던지는 투사체(실드로 막을 수 없음) |
| (수직 낙하몹의 투사체) | `FallingRock` | `src/objects/FallingRock.ts` | 수직 낙하몹이 떨어뜨리는 투사체(실드로 막을 수 없음) |
````

- [ ] **Step 7: 전체 diff를 검토한다**

Run: `git diff -- docs/glossary.md`
Expected: 서두 문장 1군데, 스테이지 표 1군데, 해저드 4개 표 각 1군데 — 총 6개 편집만 보인다. "캐릭터", "기타 오브젝트", "배경 테마", "참고: 자연 리스킨 시각 별칭" 섹션은 diff에 나오지 않는다.

- [ ] **Step 8: 커밋한다**

```bash
git add docs/glossary.md
git commit -m "docs(glossary): add behavior descriptions, drop stale doc references

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: docs/report/game-guide.md 삭제 + 참조 정리

**Files:**
- Delete: `docs/report/game-guide.md`

**Interfaces:** 없음.

**Depends on:** Task 1, Task 2 (그 문서의 내용이 이미 옮겨져 있어야 한다).

- [ ] **Step 1: Task 1·2가 끝났는지 확인한다**

Run: `git log --oneline -3`
Expected: Task 1·2의 커밋 2개가 보인다.

- [ ] **Step 2: 삭제 전 마지막으로 이 파일을 참조하는 곳을 전부 찾는다**

Run: `grep -rln "game-guide" --include="*.md" --include="*.ts" . 2>/dev/null | grep -v node_modules`
Expected: `docs/report/game-guide.md` 자기 자신과 `docs/superpowers/plans/2026-08-08-game-polish-glossary-fonts-worlds.md`(과거 계획 문서, 기록이므로 그대로 둔다) 두 개만 나온다. `docs/glossary.md`나 `README.md`가 나오면 Task 1·2가 덜 끝난 것이므로 멈추고 확인한다.

- [ ] **Step 3: 파일을 삭제한다**

```bash
git rm docs/report/game-guide.md
```

- [ ] **Step 4: 삭제를 확인한다**

Run: `ls docs/report/`
Expected: `ai-usage-report.md`만 남아있다.

- [ ] **Step 5: 커밋한다**

```bash
git commit -m "docs: remove game-guide.md, superseded by README + glossary

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: 전체 검증

**Files:** 없음(검증 전용, 코드/문서 수정 없음).

**Depends on:** Task 1, 2, 3.

- [ ] **Step 1: 빌드가 통과하는지 확인한다**

Run: `npm run build`
Expected: exit 0. (문서만 바뀌었으므로 `tsc --noEmit`·`vite build` 모두 영향 없어야 한다.)

- [ ] **Step 2: 테스트가 통과하는지 확인한다**

Run: `npm test`
Expected: 기존과 동일한 테스트 파일 수·통과 수(회귀 없음).

- [ ] **Step 3: 저장소 전체에서 game-guide 참조가 과거 기록 외에는 없는지 최종 확인한다**

Run: `grep -rln "game-guide" --include="*.md" --include="*.ts" . 2>/dev/null | grep -v node_modules`
Expected: `docs/superpowers/plans/2026-08-08-game-polish-glossary-fonts-worlds.md` 단 1개만 나온다.

- [ ] **Step 4: 설계 문서의 완료 조건을 체크리스트로 재확인한다**

`docs/superpowers/specs/2026-08-09-readme-glossary-consolidation-design.md`의 "완료 조건" 섹션 6개 항목을 하나씩 대조:
- [ ] `docs/report/game-guide.md` 삭제됨
- [ ] `README.md`에 "게임 개요"·"플레이 방법"·"빌드된 파일로 실행하기" 섹션 존재, 최상단에 조작 힌트·game-guide.md 링크 없음
- [ ] `docs/glossary.md` 해저드 4개 표에 "동작" 열 존재, 스테이지 표에 "테마" 열 없음
- [ ] `docs/glossary.md` 서두에 game-guide.md·CONTENT_REQUIREMENTS.md 참조 없음
- [ ] 저장소 전체에서 game-guide 참조가 과거 계획 문서 외에는 없음
- [ ] `npm run build`, `npm test` 통과

모두 충족되면 이 계획은 완료다. 커밋은 각 Task에서 이미 끝났으므로 이 Task는 커밋하지 않는다.
