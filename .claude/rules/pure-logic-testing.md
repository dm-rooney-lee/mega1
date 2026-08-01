---
paths:
  - "src/levels/**"
  - "src/objects/**"
---

# 순수 로직 분리 관례

시간·기하 기반 해저드/오브젝트 로직(패트롤 범위, 진자·팝업 스파이크 타이밍, 탄도, 실드 내구도 등)은 Phaser 의존성 없는 순수 함수로 작성하고, 짝을 이루는 `*.test.ts`로 단위테스트한다.

기존 예시: `motion.ts`/`motion.test.ts`, `patrol.ts`/`patrol.test.ts`, `ballistics.ts`/`ballistics.test.ts`, `shield.ts`/`shield.test.ts`.

새 시간/기하 기반 로직을 추가할 때도 이 패턴을 따른다 — Phaser 인스턴스나 브라우저 없이 빠르게 테스트하기 위함이다.
