# 플랫포머 POC

**Phaser 4**, **TypeScript**, **Vite**로 만든 작은 2D 플랫포머 개념증명(PoC, Proof of Concept)입니다.
방향키(또는 `A`/`D`)로 이동하고, `Space`/`W`/`Up`으로 점프하고, 적을 밟아 처치하고, 깃발에 도달하세요.

## 사전 준비

- **Node.js** — v20.19+ 또는 v22.12+ (Vite 8이 요구). 더 최신 LTS 버전도 동작합니다.
- **npm** — Node에 기본 포함(v10+).

버전 확인:

```bash
node -v
npm -v
```

의존성 설치(최초 1회):

```bash
npm install
```

## 게임 실행

Vite 개발 서버를 실행합니다(브라우저에서 자동으로 [http://localhost:5173](http://localhost:5173)이 열리며, 핫 리로드를 지원합니다):

```bash
npm run dev
```

## 테스트

**1. 유닛 테스트 ([Vitest](https://vitest.dev)).** 자동화된 테스트 스위트를 한 번 실행합니다:

```bash
npm test
```

또는 코드를 수정할 때마다 자동으로 재실행합니다:

```bash
npm run test:watch
```

테스트는 대상 코드 옆에 `*.test.ts` 파일로 존재합니다(예: `src/levels/patrol.test.ts`). 이 스위트는 Phaser 의존성 없는 순수 로직만 다루므로 브라우저나 게임 인스턴스 없이 빠르게 실행됩니다.

**2. 타입체크 + 프로덕션 빌드.** 빌드 스크립트는 TypeScript 컴파일러를 no-emit 모드(`tsc --noEmit`)로 실행한 뒤 Vite로 번들링합니다. 타입이 잘못됐거나 번들링이 실패하면 여기서 잡힙니다:

```bash
npm run build
```

결과물은 `dist/`에 생성됩니다.

**3. 프로덕션 빌드 미리보기.** 빌드된 `dist/` 결과물을 로컬에서 서빙해, 개발 서버와 동일하게 동작하는지 확인합니다:

```bash
npm run preview
```

**4. 수동 플레이테스트.** `npm run dev`를 실행하고 핵심 동작을 직접 확인합니다:

- 이동, 점프, 가변 높이 점프(짧게 누름 vs 길게 누름)가 자연스러운지.
- 적을 밟으면 짓눌리며 플레이어가 튕겨 오르는지.
- 적 옆면에 닿거나, 가시에 닿거나, 구덩이에 빠지면 게임 오버로 이어지는지.
- 깃발에 도달하면 승리 화면이 뜨는지.
