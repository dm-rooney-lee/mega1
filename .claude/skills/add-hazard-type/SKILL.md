---
name: add-hazard-type
description: Add a new hazard or interactive object type to the platformer (trap, enemy, pickup, etc). Use when creating a new gameplay object that needs to appear in levels.
---

# 새 해저드·오브젝트 타입 추가 절차

새 해저드/오브젝트는 자동으로 등록되지 않는다. 아래 파일들을 순서대로 고친다:

1. **`src/levels/types.ts`**: 새 타입을 `HazardDef`(또는 관련 유니온 타입)에 추가한다. 필드는 항상 optional + 기본값으로 설계해 기존 레벨 파일(`level1.ts` 등)을 건드리지 않아도 되게 한다.
2. **`src/scenes/BootScene.ts`**: 새 텍스처를 생성하고 `TEX`/`COLORS` 키를 추가한다. 다른 코드는 이 키를 통해서만 텍스처를 참조한다 — 문자열 리터럴을 직접 쓰지 않는다.
3. **`src/config.ts`**: 새 오브젝트의 튜닝 수치(속도, 쿨다운, 내구도 등)를 상수로 추가한다. 매직넘버를 오브젝트 클래스에 직접 쓰지 않는다.
4. **`src/objects/`**: 새 오브젝트 클래스를 만든다. 시간/기하 기반 로직(패트롤, 발사 타이밍 등)이 있다면 Phaser 의존성 없는 순수 함수로 분리하고 `*.test.ts`를 짝지어 작성한다. `physics.add.group(...)`에 추가하는 오브젝트라면 속도 재적용(`reapplyVelocity` 패턴)이 필요한지 확인한다.
5. **`src/scenes/GameScene.ts`**: 인스턴스 배열 추가, 해저드 빌드 switch에 케이스 추가, `update()` 루프에 갱신 로직 추가, 콜라이더/오버랩 와이어링을 명시적으로 연결한다.
6. **개별 레벨 파일(`src/levels/levelN.ts`)**: 새 해저드를 실제로 배치할 레벨 데이터에 등록한다.
7. 완료 후 `npm run build`(타입체크)와 `npm test`로 검증한다.
