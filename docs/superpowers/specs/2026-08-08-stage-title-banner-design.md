# 스테이지 진입 배너에 번호 표시 + 스테이지 2 제목 추가

## 배경

스테이지에 진입하면 화면 중앙에 2초 정도 제목 배너가 떴다 사라진다(예: "Warm Up", "Traps"). 이 배너는 `src/levels/levelN.ts`의 `LevelDef.name` 필드 값을 그대로 보여주는데, 10개 스테이지 중 스테이지 2만 이 필드가 비어 있어 배너 자체가 뜨지 않는다. 나머지 9개 스테이지의 배너 문구에는 원래부터 스테이지 번호가 붙어 있지 않았다(번호는 화면 우측 상단에 항상 떠 있는 "STAGE 7/10" 형식의 진행도 표시가 별도로 담당한다).

## 목표

1. 스테이지 2에도 다른 스테이지처럼 진입 배너가 뜨도록 제목을 붙인다.
2. 모든 스테이지의 진입 배너 문구 앞에 스테이지 번호를 붙인다 (예: `"Traps"` → `"STAGE 4: Traps"`).

## 범위

**포함**: 실제 플레이 화면에 보이는 진입 배너(`src/scenes/GameScene.ts`)와 그 문구를 만드는 레벨 데이터(`src/levels/level2.ts`, `src/levels/stageLabel.ts`).

**제외**: 화면 우측 상단의 상시 진행도 표시("STAGE 7/10")는 이미 번호를 포함하고 있어 변경하지 않는다. `docs/report/` 아래의 문서(게임 가이드 등)도 이번 변경 대상이 아니다 — git으로 추적되지 않는 별도 초안 문서이며, 이번 작업은 인게임 화면만을 대상으로 한다.

## 설계

### 스테이지 2 제목

`src/levels/level2.ts`의 `LevelDef`에 `name: "Double Trouble"`을 추가한다. 스테이지 2는 코드 주석에 적혀 있듯 새로운 기믹 없이 스테이지 1의 구성 요소(구덩이, 가시밭, 적)가 정확히 두 배로 늘어난 것이 특징이다(구덩이 1→2개, 가시밭 1→2군데, 적 3→5마리). 다른 스테이지들이 대표 기믹을 제목으로 쓰는 것과 달리, 스테이지 2는 이 "두 배로 늘어난" 특징 자체를 제목으로 삼는다.

### 번호 붙이기

번호를 각 스테이지 파일의 `name` 문자열에 직접 박아 넣지 않는다. 10개 파일에 번호를 하드코딩하면 스테이지 순서가 바뀌거나 스테이지가 추가·삭제될 때마다 일일이 손으로 맞춰야 하기 때문이다. 대신 스테이지가 배열에서 몇 번째인지(`levelIndex`)로부터 번호를 계산해 붙인다. 우측 상단의 "STAGE 7/10" 표시도 이미 같은 방식(`stageLabel` 함수)을 쓰고 있다.

`src/levels/stageLabel.ts`에 `stageBanner(levelIndex, name)` 함수를 새로 추가한다. `levelIndex`는 0부터 세는 배열 인덱스이고 화면에는 1부터 세는 번호로 바꿔 보여준다(기존 `stageLabel` 함수와 동일한 규칙).

```
stageBanner(3, "Traps") → "STAGE 4: Traps"
stageBanner(0, "Double Trouble") → "STAGE 1: Double Trouble"
```

`src/scenes/GameScene.ts`의 `drawHud()`에서 배너 텍스트를 만들 때 `this.level.name`을 그대로 쓰던 자리에 `stageBanner(this.levelIndex, this.level.name)`을 쓰도록 바꾼다. 배너가 뜨는 조건(`if (this.level.name)`), 글자 크기·색상·사라지는 애니메이션 등 나머지는 그대로 둔다.

## 테스트 계획

`src/levels/stageLabel.test.ts`에 `stageBanner` 테스트를 추가한다.

- **정상 흐름**: `stageBanner(3, "Traps")`가 `"STAGE 4: Traps"`를 반환하는지 확인.
- **경계값**: `stageBanner(0, "Double Trouble")`가 `"STAGE 1: Double Trouble"`을 반환하는지 확인(첫 스테이지, 0→1 변환이 올바른지).
- **예외 케이스는 두지 않는다**: `stageBanner`는 문자열을 그대로 이어붙이기만 할 뿐 내부에 조건 분기가 없다. 제목이 있을 때만 배너를 띄우는 분기(`if (this.level.name)`)는 `GameScene.ts` 쪽에 있는데, 이 파일은 Phaser 장면(scene) 코드라 이 저장소의 기존 관례상 자동화 단위 테스트 대상이 아니다(다른 장면 파일들도 마찬가지로 테스트 파일이 없다). 이 부분은 아래 수동 검증으로 확인한다.

## 수동 검증 계획

`npm run dev` 실행 후 아래를 눈으로 확인한다.

- `http://localhost:5173/?stage=2` — 진입 시 `"STAGE 2: Double Trouble"` 배너가 뜨는지.
- `http://localhost:5173/?stage=4` — 진입 시 `"STAGE 4: Traps"` 배너가 뜨는지 (기존에 제목이 있던 스테이지에도 번호가 잘 붙는지 확인).
- `http://localhost:5173/?stage=10` — 진입 시 `"STAGE 10: Endgame"`처럼 두 자리 번호도 문제없이 뜨는지.
- 위 화면들에서 배너 글자가 화면 폭을 넘치지 않는지, 화면 우측 상단의 기존 "STAGE N/10" 표시와 겹치거나 어색해 보이지 않는지.

## 완료 조건

- `npm test`가 새로 추가한 `stageBanner` 테스트를 포함해 전부 통과한다.
- `npm run build`가 타입 에러·번들링 에러 없이 통과한다.
- 위 수동 검증 계획의 세 가지 스테이지 진입 화면을 실제로 확인했다.
