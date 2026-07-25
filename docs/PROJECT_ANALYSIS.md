# 프로젝트 분석 문서

> 작성일: 2026-07-24 · 브랜치: `feature/MEGA-map`
> 목적: 현재 프로젝트 파악 및 **새로운 맵/컨텐츠(장애물·적 유닛·지형) 추가**를 위한 사전 정리

---

## 1. 게임 장르

**2D 사이드스크롤 플랫포머** (Super Mario 계열 POC)

- 좌우 이동 + 점프로 스크롤되는 스테이지를 진행
- 적을 **밟아서(stomp)** 처치, 밟히지 않고 옆/아래로 닿으면 사망
- 스파이크 · 구덩이(pit) · 적이 장애물
- 스테이지 끝의 **깃발(goal)** 에 도달하면 클리어

`package.json` 설명: *"2D platformer POC built with Phaser 4 + TypeScript + Vite"*

---

## 2. 게임 스타일 & 기술 스택

| 항목 | 내용 |
|------|------|
| 엔진 | **Phaser 4** (`^4.2.1`) — Arcade Physics |
| 언어/빌드 | **TypeScript 5.7** + **Vite 8** |
| 테스트 | **Vitest** (Phaser 비의존 순수 로직만 유닛테스트) |
| 아트 | **실제 에셋 없음** — `BootScene`에서 도형으로 **절차적 placeholder 텍스처** 생성 |
| 팔레트 | PICO-8 계열 색상 (`0x1d2b53` 남색 배경 등) |
| 해상도 | 960×540, `Scale.FIT` + 중앙정렬, `pixelArt: true` |

### 게임 필(Game Feel)
POC임에도 조작감에 신경 쓴 요소들이 `Player.ts`에 구현됨:
- **Coyote time** (100ms) — 발판에서 떨어진 직후에도 잠깐 점프 허용
- **Jump buffering** (120ms) — 착지 직전 누른 점프 기억
- **Variable jump height** — 점프 버튼을 빨리 떼면 짧게 (탭=홉, 홀드=풀점프)

---

## 3. 코드 구조

```
src/
├─ main.ts              # Phaser 게임 설정 (씬 등록: Boot→Menu→Game→GameOver→Win)
├─ config.ts            # 튜닝 상수 (물리/속도/색상/텍스처 키) — 밸런싱 한곳 집중
├─ scenes/
│  ├─ BootScene.ts      # placeholder 텍스처 절차 생성 → MenuScene으로
│  ├─ MenuScene.ts      # 타이틀 화면
│  ├─ GameScene.ts      # ★ 핵심: 레벨 빌드 + 물리 충돌 배선 + 승패 처리
│  ├─ GameOverScene.ts  # 사망 화면
│  └─ WinScene.ts       # 클리어 화면
├─ objects/
│  ├─ Player.ts         # 이동/점프/게임필/사망
│  ├─ Enemy.ts          # 좌우 순찰 적 (경계 안에서 왕복 + 벽 반사)
│  └─ Goal.ts           # 도착 깃발 (overlap 판정용)
└─ levels/
   ├─ level1.ts         # ★ 데이터 기반 레벨 정의 (LevelDef 인터페이스)
   ├─ patrol.ts         # 적 순찰 범위 계산 (순수 함수)
   └─ patrol.test.ts    # patrol 유닛테스트
```

### 핵심 설계: 레벨이 "데이터"로 분리됨 (`levels/level1.ts`)

```ts
export interface LevelDef {
  worldWidth: number;
  worldHeight: number;
  playerSpawn: Vec2;
  platforms: PlatformDef[];   // 좌상단 좌표 + 크기 { x, y, width, height }
  enemies: Vec2[];            // 발판 위를 순찰
  spikes: SpikeDef[];         // { x, y, tiles } — 32px 타일 단위
  goal: Vec2;
}
```

좌표는 월드 픽셀 단위. 주석에 *"새 레벨 만들기 = 이 파일 편집, Tiled 타일맵으로 가는 디딤돌(Milestone 4)"* 라고 명시됨.

### 씬 흐름

```
BootScene (텍스처 생성)
   → MenuScene (아무 키 입력)
      → GameScene (플레이)
         ├─ 사망 → GameOverScene → (SPACE/ENTER) GameScene / (ESC) MenuScene
         └─ 클리어 → WinScene → (SPACE/ENTER) GameScene / (ESC) MenuScene
```

### 주요 튜닝 상수 (`config.ts`)

| 상수 | 값 | 의미 |
|------|-----|------|
| `PHYSICS.GRAVITY_Y` | 1400 | 중력 가속도 |
| `PLAYER.MOVE_SPEED` | 260 | 이동 속도 |
| `PLAYER.JUMP_VELOCITY` | -680 | 점프 초기 속도 (최대 점프 ~165px) |
| `PLAYER.STOMP_BOUNCE` | -420 | 적 밟은 후 튕김 |
| `ENEMY.MOVE_SPEED` | 70 | 적 순찰 속도 |

---

## 4. 현재 맥(Mac) 환경 상황

| 항목 | 상태 |
|------|------|
| Node | **v24.8.0** (README 요구 v20.19+/v22.12+ 충족 ✅) |
| npm | 11.6.0 |
| 의존성 | `node_modules` 설치 완료 ✅ |
| Dev 서버 | **미실행** (포트 5173 비어 있음) |
| 프로덕션 빌드 | `dist/` 존재 (번들 ~1.4MB) |
| Git 브랜치 | **`feature/MEGA-map`** (main에서 분기) |
| 커밋 이력 | `initial commit` 단 1개 |
| 변경사항 | `package-lock.json`만 수정됨(M), 소스 변경 없음 |

### 실행 명령어

```bash
npm run dev       # Vite 개발 서버 (localhost:5173, 핫리로드)
npm test          # Vitest 유닛테스트 1회
npm run test:watch# 테스트 감시 모드
npm run build     # tsc --noEmit + Vite 프로덕션 빌드 → dist/
npm run preview   # dist/ 빌드 미리보기
```

---

## 5. 새 맵/컨텐츠 추가를 위한 진단

> **다음 작업 목표:** 새 맵을 만들 때 새로운 **장애물 · 적 유닛 · 지형**을 함께 추가.

### 🔧 먼저 손봐야 할 병목 (현재 "1레벨 전용" 하드코딩)

1. **`GameScene.ts:26` — `this.level = level1;`**
   level1을 직접 import·하드코딩. → 씬이 레벨을 파라미터로 받도록 변경 필요
   `this.scene.start('GameScene', { level })`
2. **씬 전환 하드코딩** — GameOver/Win이 무조건 `GameScene`으로만 복귀.
   → 현재/다음 레벨 개념(레벨 인덱스·레지스트리) 필요
3. **레벨 레지스트리 부재** — 레벨 목록/순서를 담는 `levels/index.ts` 없음

### ➕ 확장 포인트별 작업 가이드

새 컨텐츠 종류별로 건드려야 하는 위치:

#### A. 새로운 지형 (platform 종류)
- **데이터:** `LevelDef.platforms`에 항목 추가 (기본 정적 발판은 데이터만으로 OK)
- **특수 지형**(이동 발판·일방통행·미끄러운 바닥 등)이 필요하면:
  - `levels/level1.ts`의 `PlatformDef`에 `type` 필드 확장
  - `GameScene.buildPlatforms()`에서 타입별 분기 처리
  - 이동 발판은 `objects/`에 별도 클래스 권장

#### B. 새로운 장애물 (스파이크 외)
- **패턴:** `SpikeDef`처럼 `LevelDef`에 새 필드 추가 (예: `lava`, `fallingRock`)
- `GameScene`에 `buildXxx()` 메서드 + `physics.add.overlap`/`collider` 배선 추가
- 텍스처는 `BootScene`에 절차 생성 메서드 추가 + `config.ts`의 `TEX`/`COLORS`에 키 등록

#### C. 새로운 적 유닛
- **패턴:** 현재 `Enemy.ts`는 좌우 순찰 1종만 존재
  - 공통 로직을 `BaseEnemy`로 추출하거나, `Enemy`를 상속해 신규 타입 작성
  - 예: 점프하는 적, 날아다니는 적, 돌진하는 적, 발사체를 쏘는 적
- **데이터:** `LevelDef.enemies`를 `Vec2[]` → `EnemyDef[]`(위치 + `type`)로 확장
- `GameScene.buildEnemies()`에서 타입별로 알맞은 클래스 인스턴스화
- 밟기/피격 판정은 `GameScene.handlePlayerEnemy()`에서 확장 (예: 밟을 수 없는 적)

#### D. 실제 아트 교체 (선택)
- `BootScene`의 절차 텍스처를 `this.load.image(...)`로 교체
- 나머지 코드는 `TEX.*` 키로만 참조하므로 **국소 변경**으로 끝남

### 권장 진행 순서

1. **다중 레벨 구조 리팩토링** — GameScene을 레벨 파라미터로 받게 만들고, `levels/index.ts` 레지스트리 + 진행(다음 레벨) 로직 구축
2. **컨텐츠 타입 확장** — `LevelDef`의 `enemies`/`platforms`/장애물 필드에 `type` 도입
3. **신규 오브젝트 클래스 작성** — 새 적/장애물/지형을 `objects/`에 추가, `BootScene`에 텍스처, `config.ts`에 상수
4. **새 맵 데이터 작성** — `level2.ts` 등에서 신규 컨텐츠를 배치
5. **테스트** — 순수 로직(순찰 범위, AI 판정 등)은 `*.test.ts`로 커버

---

## 6. 참고: 데이터 기반 레벨 예시 (`level1.ts`)

```ts
export const level1: LevelDef = {
  worldWidth: 2400,
  worldHeight: 540,
  playerSpawn: { x: 80, y: 400 },
  platforms: [
    { x: 0, y: 496, width: 640, height: 44 },    // 지면 (구덩이로 분할)
    { x: 760, y: 496, width: 900, height: 44 },
    { x: 1760, y: 496, width: 640, height: 44 },
    { x: 360, y: 380, width: 160, height: 24 },   // 공중 발판
    // ...
  ],
  enemies: [
    { x: 950, y: 320 },   // 넓은 공중 발판 순찰
    { x: 1200, y: 456 },  // 긴 지면 순찰
    { x: 1820, y: 456 },  // 깃발 근처 순찰
  ],
  spikes: [
    { x: 1120, y: 472, tiles: 3 },
  ],
  goal: { x: 2260, y: 432 },
};
```
