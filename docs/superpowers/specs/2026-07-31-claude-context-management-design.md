# Claude 컨텍스트 관리 설계

작성일: 2026-07-31

## 배경

이 레포(game-poc)에는 Claude Code(AI 코딩 도구)를 위한 설정이 전혀 없었다 — `CLAUDE.md`도, `.claude/` 디렉토리도 없었다. 여러 기여자가 있는 소규모 팀 레포이고, `docs/superpowers/`에 이전 설계 문서가 이미 존재하는 것으로 보아 이 도구를 계속 쓸 것으로 예상된다. 이번 설계는 앞으로 이 레포에서 작업할 때 필요한 컨텍스트(빌드 방법, 이 코드베이스만의 관례, 알려진 함정)를 어디에 어떻게 남길지 정한다.

## 참고한 용어

- **CLAUDE.md**: Claude Code가 세션 시작 시 항상 읽는 파일. 팀 전체가 공유하는 지침을 담는다.
- **`.claude/rules/`**: 특정 경로의 파일을 건드릴 때만 불러오는 규칙 파일. 여러 폴더에 걸쳐 반복되는 관례(횡단관심사)에 적합하다.
- **Skill**: 필요할 때만 불러오는 절차·워크플로우 묶음. 반복되는 다단계 작업에 적합하다.
- **Hook**: 특정 시점에 무조건 실행되는 스크립트. 지침(CLAUDE.md)은 권고일 뿐이지만 훅은 결정적으로 강제한다.
- **git pre-commit 훅**: git 자체가 커밋 직전에 실행하는 훅. Claude Code를 쓰든 안 쓰든, 사람이 직접 커밋해도 항상 실행된다.

## 최종 설계

### 1. 루트 `CLAUDE.md`

- 빌드/테스트 명령은 `@README.md` import로 가져온다 — README가 이미 상세히 다루고 있어 별도로 다시 적지 않고 한 곳(README)만 관리한다.
- 게임 로직 관례: `config.ts` 중앙화 규칙, `JUMP_VELOCITY` 관련 불변식.
- 코드 서베이로 찾은 6가지 알려진 함정(아래 "알려진 함정" 절 참고)을 짧게 요약.
- 코드 작성 시 행동 지침(가정 명시, 최소 변경, 검증 가능한 목표 등 4원칙 — Andrej Karpathy의 관찰에서 영감받아 제3자가 정리한 커뮤니티 지침을 한국어로 옮김. 카파시 본인이 쓴 글이 아님).
- `docs/superpowers/`에 설계 문서를 먼저 남기는 관례를 짧게 언급.

### 2. `.claude/rules/` (횡단관심사만)

경로 스코프 규칙 2개 — 여러 폴더에 걸쳐 반복되는 관례만 담는다. 한 폴더에만 해당하는 내용은 규칙 파일을 따로 만들지 않고 루트 `CLAUDE.md`에 통합한다(이 레포는 35개 파일 규모의 소규모 코드베이스라, 폴더별 `CLAUDE.md`를 따로 두는 건 과함 — 이건 대규모 코드베이스/모노레포의 컨텍스트 비대화 문제를 푸는 패턴이라 여기엔 해당하지 않는다).

- `pure-logic-testing.md` (`paths: src/levels/**, src/objects/**`): 시간·기하 기반 로직은 Phaser 의존성 없는 순수 함수로 분리하고 `*.test.ts`로 테스트하는 관례.
- `no-hardcoded-tuning.md` (`paths: src/levels/**, src/objects/**, src/scenes/**`): 게임플레이 수치는 `config.ts`에 중앙화하는 관례.

### 3. `.claude/skills/add-hazard-type/`

새 해저드·오브젝트 타입을 추가하는 절차를 담은 Skill. `types.ts` → `BootScene.ts` → `config.ts` → 오브젝트 클래스 → `GameScene.ts` → 레벨 데이터까지 여러 파일을 락스텝으로 고쳐야 하는데 자동 등록이 없다. git 히스토리상 이 작업이 여러 번(스테이지2, 레벨234, 대포/실드) 반복된 것으로 확인돼 Skill로 만들 근거가 있다.

### 4. git pre-commit 훅 (husky)

커밋 전에 `npm run build`(타입체크+빌드)와 `npm test`를 강제한다. Claude Code의 자체 훅이 아니라 git 네이티브 pre-commit을 쓰는 이유는, Claude Code 훅은 Claude가 직접 실행하는 도구 호출에만 걸리고 사람이 터미널에서 직접 `git commit`을 치면 발동하지 않기 때문이다 — 이 레포는 여러 사람이 커밋하므로 누가 커밋하든 항상 강제되는 방식이 필요하다. husky는 npm 생태계 도구라 `npm install`에 올라타 신규 기여자에게 추가 설치 단계 없이 자동 적용된다(대안으로 검토한 Python 진영의 `pre-commit` 프레임워크는 이 100% TypeScript 레포에 불필요한 Python 의존성을 추가하고, 매 클론마다 별도 수동 활성화 단계가 필요해 채택하지 않음).

### 5. 알려진 함정 (루트 CLAUDE.md에 요약 포함)

| 함정 | 요약 |
|---|---|
| Phaser 그룹 속도 초기화 | `physics.add.group(...)`에 스프라이트를 추가하면 그룹의 기본 속도(0,0)가 기존 속도를 조용히 덮어씀. `Cannon.ts`/`Cannonball.ts`의 `reapplyVelocity()` 패턴으로 우회 중. |
| 발사체 생명주기 패턴 2종 공존 | `ProjectilePool`(고정 크기 재사용)과 대포알(무제한 그룹+수동 `destroy()`)이 통일되지 않음 — 새로 만들 때 유사한 기존 오브젝트를 참고해 판단. |
| 레벨 등록 패턴 | 새 스테이지는 `levels/index.ts`의 `levels` 배열에 추가만 하면 됨(별도 등록 로직 없음). |
| `level2`→`level6` 네이밍 드리프트 | `docs/superpowers/`의 옛 설계문서가 말하는 "level2"(대포·실드 스테이지)는 두 팀이 동시에 "level2"를 만들어 병합 시 `level6.ts`로 재번호됨. |
| 미정의 `G-번호` 표기 | 코드 주석의 `G3`/`G4`/`G6/G7`은 레포 내 어디에도 정의가 없는 미상의 참조 — 의미를 임의로 추정하지 말 것. |
| 레벨 타입 import 경로 혼재 | 일부 파일(`level2.ts`, `patrol.ts`)은 레거시 재수출 경로인 `./level1`에서, 나머지는 캐노니컬 경로인 `./types`에서 타입을 가져옴 — 새 코드는 `./types`를 쓴다. |

## 검토하지 않기로 한 것

- Claude Code 네이티브 훅(`dist/` 직접 수정 차단, `Stop` 훅의 CLAUDE.md 갱신 제안 등)은 아직 실제로 문제가 관측된 적이 없어 지금은 추가하지 않는다. 문제가 실제로 발생하면 그때 추가한다.
- 발사체 패턴 통일, `level1`/`types.ts` import 정리, 옛 설계문서 수정 등 코드·문서 자체의 수정은 이번 컨텍스트 설계와 별개의 작업으로 남겨둔다 — 지금은 "알려진 함정"으로만 문서화한다.

## 완료 조건

- `CLAUDE.md`, `.claude/rules/pure-logic-testing.md`, `.claude/rules/no-hardcoded-tuning.md`, `.claude/skills/add-hazard-type/SKILL.md`, `.husky/pre-commit`가 레포에 존재한다.
- `package.json`에 `husky` devDependency와 `prepare` 스크립트가 추가돼 있다.
- `npm run build && npm test`가 통과한다(설정 이후에도 기존 동작이 깨지지 않음을 확인).
