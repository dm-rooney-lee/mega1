# 고퍼 자연 세계관 에셋 & 배경음악 설계

작성일: 2026-08-05

## 1. 개요 (무엇을 / 왜)

지금까지 만든 8개 스테이지는 전부 **절차적으로 그린 단색 도형**(둥근 사각형·원)이며, 배경은 단색 사각형 한 장이고 배경음악이 전혀 없다. 이번 작업은 이 게임의 핵심 컨셉 — **golang의 마스코트 "고퍼"가 등장하는 레트로 게임 재현** — 에 맞춰:

1. 모든 그림을 **픽셀 격자에 맞춘 각진 스타일**로 다시 그린다 (렌더러·좌표계는 무수정).
2. 세계관을 **낮의 초원 → 노을 숲 → 지하 굴**의 3단계 진행으로 구성하고, 배경에 2겹 시차 스크롤을 넣는다.
3. 발판(땅)에 늘어지지 않는 반복 무늬를 넣는다.
4. 플레이어(고퍼)와 기믹 16종의 실루엣·색을 세계관에 맞게 다시 디자인한다.
5. 배경음악(`Quarter_Muncher.mp3`)을 타이틀부터 끊김 없이 재생한다.

**게임 규칙·물리·난이도는 일절 변경하지 않는다.** 전부 그림과 소리 자산이다.

이 설계는 사용자와의 브레인스토밍 세션에서 브라우저 시각 도구로 여러 시안을 직접 비교하며 확정했다. 아래 각 절의 "확정" 표시는 그 세션에서 실제로 선택된 안이다.

---

## 2. 그리기 방식 (확정)

`src/scenes/BootScene.ts`의 모든 텍스처 생성 메서드가 `fillRoundedRect`/`fillCircle` 같은 곡선 도형을 쓰고 있는 것을, 2논리단위 격자에 맞춘 사각형(`fillRect`) 조합으로 다시 그린다.

- 렌더러 설정(`main.ts`의 `antialias: true`, `roundPixels: false`), `display.ts`의 `TEXTURE_SCALE`·`snapToDevicePixel` 등은 **일절 변경하지 않는다** — 최근 6개 커밋이 잡은 화면 일렁임 버그를 다시 불러오지 않기 위함이다.
- 텍스처 크기·히트박스 수치는 전부 유지한다. 바뀌는 것은 각 `beginTexture()`/`endTexture()` 블록 안의 그리기 명령뿐이다.

---

## 3. 세계관 & 스테이지 매핑 (확정)

| 세계 | 스테이지 | 분위기 |
|---|---|---|
| 낮의 초원 | 1(Warm Up) · 2 · 3(Machines) | 하늘색 하늘, 흰 구름, 먼 초록 언덕, 풀밭 |
| 노을 숲 | 4(Traps) · 5(Snipers) | 자주→분홍→주황 하늘, 검은 나무 실루엣, 낮은 해 |
| 지하 굴 | 6(Bombardment) · 7(Gauntlet) · 8(Cogs & Pitfalls) | 흙 천장, 늘어진 뿌리, 발광 버섯 |

세계는 `LevelDef`에 필드를 추가하지 않고, 새 모듈 `src/worlds.ts`가 스테이지 인덱스로부터 도출한다(레벨 데이터 스키마 변경 없음):

```ts
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

---

## 4. 배경 시차 스크롤 (확정: 2겹)

### 구조

- **배경 채우기(신규 아님, 색만 세계별로)**: `GameScene.drawBackground()`가 그리는 전체 월드 크기의 단색 사각형은 그대로 유지하되, 색을 `worldForStage()` 결과에 따라 고른다(초원=하늘색, 노을=자주, 지하=기존 남색). **평소에는 화면에 드러나지 않는 안전망**이다 — 아래 먼 배경 레이어가 뷰포트를 항상 완전히 덮으므로.
- **먼 배경 레이어(신규, 시차 적용)**: 세계마다 하나씩 `TileSprite`를 만든다(초원=하늘+구름+먼 언덕, 노을=하늘 그라데이션+나무 실루엣, 지하=천장+종유석 — 그림 자체가 화면 맨 아래까지 이어지도록 그려서, 실제 지형과 맞닿는 부분에 빈틈이 생기지 않게 한다). 크기는 **카메라 뷰포트와 정확히 같게** 잡고, `layoutHud()`가 쓰는 것과 같은 `cameraViewOrigin()`으로 매 프레임 카메라 앞에 다시 위치시킨다(그래서 항상 화면 전체를 덮고, 아래 안전망 사각형은 평소 보이지 않는다). 실제로 느리게 움직이는 것처럼 보이게 하는 것은 **`tilePositionX`**(TileSprite가 자체적으로 제공하는, 내부 무늬를 오브젝트 이동과 별개로 미끄러뜨리는 속성)이며, `cam.scrollX * PARALLAX.FAR_FACTOR`로 계산한다. `PARALLAX.FAR_FACTOR = 0.2`(5배 느림)를 `config.ts`에 추가한다.
- 먼 배경 레이어는 `config.ts`의 `DEPTH`에 새로 추가하는 `DEPTH.BACKGROUND_FAR: -5`(기존 `BACKGROUND: -10`과 `PLATFORM: 0` 사이)에 그린다. 실제 발판(땅)은 새 레이어가 아니라 **지금처럼 `GameScene`이 만드는 진짜 게임 오브젝트**이고, `DEPTH.PLATFORM`(0)에서 먼 배경 레이어보다 앞에 그려진다. 이미 카메라와 1:1로 움직이므로 손댈 게 없다.

### 일렁임 회귀 방지 (중요)

`tilePositionX`에 넣는 값도 `cam.scrollX`와 마찬가지로 소수점이 되면 그 레이어만 화면 일렁임이 재발한다. `setCameraScroll()`이 `layoutHud()`를 부르는 것과 같은 자리에서, 새 `layoutParallax()` 메서드가 **기존 `snapToDevicePixel`을 재사용**해 `tilePositionX`를 물리 픽셀 격자에 맞춰 스냅한다. 새 스냅 함수는 만들지 않는다.

```
farBg.tilePositionX = snapToDevicePixel(cam.scrollX * PARALLAX.FAR_FACTOR, cam.zoom);
```

### 검증한 사실

Phaser 4.2.1(이 프로젝트에 설치된 정확한 버전)의 타입 정의(`node_modules/phaser/types/phaser.d.ts`)에서 `TileSprite` 클래스와 `tilePositionX`/`tilePositionY`, `tileScaleX`/`tileScaleY` 속성의 존재를 직접 확인했다(추측 아님).

---

## 5. 지형(발판) 타일링 (확정: 반복해 채우기, 범위는 정적 발판으로 한정)

### 왜 범위를 좁혔는가

레벨 데이터의 발판 109개 중 대부분이 32의 배수가 아닌 임의 폭(예: 110, 640, 900)이라, 지금처럼 32×32 텍스처를 `setDisplaySize()`로 늘리면 무늬가 발판마다 다른 비율로 왜곡된다. 이걸 고치는 데 정석은 **TileSprite**(텍스처를 늘리지 않고 반복해서 채우는 오브젝트)이지만, 이동발판·컨베이어·점프대·위장발판·낙하함정·압사기 6종은 "땅"이 아니라 "기계 장치"라서:

- 이 6종은 자갈 무늬 없는 **단순 띠 색 블록**으로 다시 그리면(브레인스토밍에서 확인한 방식 "A") 늘려도 왜곡될 무늬 자체가 없다.
- `physics.add.existing<G>(gameObject, isStatic?)`는 임의의 `GameObject`(TileSprite 포함)에 바디를 붙일 수 있는 제네릭 메서드이므로(아래 정적 발판 구현이 이미 이 방식을 쓴다), 이 6종에 TileSprite를 못 붙이는 기술적 장벽은 없다. 다만 이들은 애초에 "땅"이 아니라 "기계 장치"라 자갈·질감 같은 반복 무늬가 필요 없으므로, 굳이 구조를 바꾸지 않고 기존 `Phaser.Physics.Arcade.Sprite` 그대로 단순 띠 색 블록만 새로 그린다.

따라서 **정적 발판(고정된 땅)만** 타일링 대상으로 삼는다.

### 정적 발판 구현

`GameScene.makeStaticPlatform()`을 다음으로 교체한다:

```ts
const vis = this.add.tileSprite(cx, cy, p.width, p.height, TEX.PLATFORM);
vis.setTileScale(1 / TEXTURE_SCALE, 1 / TEXTURE_SCALE);
vis.setDepth(DEPTH.PLATFORM);
this.physics.add.existing(vis, true); // 정적 바디로 등록
(vis.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
this.platforms.add(vis);
```

`physics.add.existing<G>(gameObject, isStatic?)`가 임의의 `GameObject`를 받는다는 것과, 정적 바디는 `updateFromGameObject()`로 트랜스폼을 다시 읽어야 한다는 기존 관례(`CLAUDE.md` 알려진 함정)를 그대로 따른다. **물리 판정·충돌 규칙은 변경 없음** — 겉모습만 바뀐다.

`TEX.PLATFORM` 텍스처 자체는 64×44 안팎의 작은 흙+풀 타일로 다시 그린다(정확한 크기·자갈 배치는 구현 단계에서 눈으로 조정).

### 6종 기계 발판

그림만 다시 그린다(코드 구조 변경 없음). 구체적인 디자인 방향은 §7의 기믹 매핑 표에 정리했다. 낙하함정(`TrapFloor`)은 지금도 위장발판(`CrumblingPlatform`)과 같은 `TEX.FAKE` 텍스처를 그대로 재사용하고 있으므로(기존 관례), 새 디자인도 위장발판과 동일한 텍스처를 그대로 물려받는다 — 별도로 그릴 것이 없다.

---

## 6. 플레이어(고퍼) 재설계 (확정)

- 텍스처 크기 28×40, 히트박스 24×38(`Player.ts:47`) **불변**.
- 지금의 둥근 몸통·원형 눈 실루엣을 각진 픽셀 격자(14×20 아트 픽셀)로 옮기고, **안쪽에 검정(`0x000000`) 테두리**를 두른다 — 텍스처 크기를 바꾸지 않으므로 히트박스에 영향 없음.
- 귀 2개, 코, 앞니 2개, 발(살구색) 추가 — 이 크기에서 "고퍼"로 알아볼 수 있게 하는 최소한의 실루엣 단서.
- 검정 테두리는 부수 효과로 **초원 세계의 하늘색 배경(플레이어 몸통과 같은 색 계열)에 캐릭터가 묻히는 문제**를 해결한다 — 세계관 브레인스토밍 중 발견했던 위험이 이 결정으로 자연히 없어진다.
- `config.ts`의 `COLORS`에 `OUTLINE: 0x000000` 한 항목만 추가한다.

---

## 7. 기믹 16종 재설계 매핑 (확정)

각 기믹이 실제로 몇 개 세계에 걸쳐 등장하는지 레벨 데이터에서 직접 집계했다(터렛·화살발사기·압사기·진자 4종이 실제로 세계 하나 이상에 걸쳐 있음을 확인 — 예: 터렛은 노을 세계의 5번과 지하 세계의 7번에 모두 등장). 대포·톱니·실드는 §3 기준 지하 세계(6, 7, 8) 하나에만 등장하지만, 세계 경계를 걸치는 다른 기믹들과 시각적 일관성을 맞추기 위해 이들도 같은 원칙을 적용한다. 이 때문에 **기믹마다 세계 무관 단일 디자인 하나**를 쓴다 — 세계별로 다른 그림을 그리면 같은 기믹이 스테이지마다 다르게 보이는 모순이 생긴다.

모든 등장 스테이지는 레벨 데이터(`src/levels/level*.ts`)를 직접 집계한 값이다(추정 아님).

| 기믹 | 지금 | 새 디자인 | 등장 스테이지 | 동작 변경 |
|---|---|---|---|---|
| 적 (Enemy) | 빨간 사각형 | 딱정벌레(작은 벌레, 화난 눈) | 1, 2, 3, 4, 5, 6, 7, 8 (전체) | 없음 |
| 가시 (Spike) | 크림색 삼각 이빨 | 가시덤불(갈색·진초록 톱니) | 1, 2, 3, 6, 7, 8 (4·5 제외 — 함정·터렛 위주 스테이지) | 없음 |
| 깃발/골 (Goal) | 흰 깃대 + 초록 삼각 깃발 | 깃대 유지, 깃발을 나뭇잎 모양으로 | 1, 2, 3, 4, 5, 6, 7, 8 (전체) | 없음 |
| 점프대 (Spring) | 코일 지그재그 | 버섯(갓 + 기둥) | 3, 7 | 없음 |
| 이동발판 (MovingPlatform) | 파란 사각형 | 나무 통나무(가로 나이테) | 3, 5, 7 | 없음 |
| 컨베이어 (Conveyor) | 어두운 벨트 + 화살촉 | 뿌리 벨트 (화살촉 형태 유지 — 방향 신호로 기능상 필수) | 3, 7 | 없음 |
| 위장발판·낙하함정 (Fake/Crumbling, TrapFloor — 텍스처 공유) | 갈색(발판과 유사) | 이끼 낀 땅(새 땅 무늬와 유사하게 유지) | 위장발판 3, 7 / 낙하함정 8 | 없음 |
| 진자 가시추 (Pendulum) | 8방향 스파이크 볼 + 사슬 | 솔방울/가시열매 + 덩굴 | 3, 7 | 없음 |
| 압사기 (Thwomp) | 자주색 얼굴 블록 | 바위(회색, 금 간 무늬 + 화난 눈) | 4, 7 | 없음 |
| 톱니 (Gear) | 회색 톱니바퀴 | 녹슨 기계 톱니(형태 유지, 녹빛 색) | 8 | 없음 |
| 발사체 (Projectile) | 노란 다트 | 나무 가시 | 4, 5, 7 (화살·터렛 공유 자원) | 없음 |
| 화살발사기 (Shooter) | 자주색 벽 상자 | 가시덤불 발사기 | 4, 7 | 없음 |
| 터렛 (Turret) | 적갈색 몸통 + 포신 | 녹슨 기계 포탑(형태 유지, 녹빛 색) | 5, 7 | 없음 |
| 대포 (Cannon) | 회색 몸통 | 녹슨 대포(형태 유지, 녹빛 색) | 6, 7, 8 | 없음 |
| 대포알 (Cannonball) | 주황 원 | 녹슨 쇠구슬(리벳 무늬 추가) | 6, 7, 8 | 없음 |
| 실드 아이템 (ShieldItem) | 노란 방패 + 십자 | 나뭇잎 방패(십자 표식은 가독성 위해 유지) | 6, 7, 8 | 없음 |

**"버려진 기계" 계열(터렛·대포·대포알·톱니)은 실루엣을 그대로 두고 색만 녹빛으로 통일한다** — 이미 톱니·포신 형태가 뚜렷해 다시 디자인할 필요가 없고, 이 계열이 실제로 등장하는 스테이지 8의 이름 자체가 "Cogs & Pitfalls"라 지금 모습이 컨셉과 맞기 때문이다(스테이지 3 "Machines"에는 이 계열 하자드가 등장하지 않는다 — 스테이지 3의 하자드는 진자·이동발판·컨베이어·위장발판·점프대뿐이다). 16종 전부 **물리·판정 동작은 변경 없음**.

---

## 8. 배경음악 (확정: 타이틀부터 끊김없이 지속 재생)

### 자산

`~/Downloads/Quarter_Muncher.mp3`(30.8초, 192kbps, 스테레오)를 `public/audio/bgm.mp3`로 복사한다. `public/` 폴더가 아직 없으므로 새로 만든다(Vite가 그대로 정적 서빙).

### 재생 구조

새 파일 `src/audio.ts` 하나만 추가한다. Phaser의 사운드 매니저(`scene.sound`)는 씬마다 새로 생기는 게 아니라 게임 인스턴스 전역에 하나뿐이고 씬 전환에 파괴되지 않는다(`Scene.sound`와 `Game.sound`가 정확히 같은 타입 — Phaser 4.2.1 타입 정의로 확인). 이 점을 이용해 모듈 스코프 변수 하나로 사운드 인스턴스를 한 번만 만들고 씬을 오가도 계속 재사용한다.

```ts
// src/audio.ts
let bgm: Phaser.Sound.BaseSound | undefined;

export function startBgmOnce(scene: Phaser.Scene): void {
  if (bgm?.isPlaying) return;
  bgm = scene.sound.add("bgm", { loop: true, volume: 0.5 });
  bgm.play();
}
```

- `BootScene`에 `preload()` 메서드를 새로 추가해(지금은 없음 — `create()`만 있고 절차적 생성뿐이라 로더를 쓸 일이 없었다) `this.load.audio("bgm", "audio/bgm.mp3")`로 미리 로드한다. Phaser의 씬 생명주기상 `preload()`의 로딩이 끝난 뒤에 `create()`가 실행되므로, 완료 이벤트를 따로 기다릴 필요는 없다.
- `MenuScene`은 이미 "아무 키나 눌러 시작"을 기다리고 있다(`this.input.keyboard!.once("keydown", start)`). 브라우저 자동재생 정책상 사용자 조작 전에는 소리가 나오지 않으므로, **바로 그 키/클릭 핸들러 안에서** `startBgmOnce(this)`를 부른다 — 별도 안내 문구나 새 UI가 필요 없다.
- 이후 `GameScene`·`GameOverScene`·`WinScene` 어디서도 `bgm`을 새로 만들거나 멈추지 않는다. 죽어서 재시도해도, 스테이지를 클리어해 다음 스테이지로 넘어가도 재생 중이던 지점에서 그대로 이어진다.
- 곡 길이가 30.8초로 짧아 반복 재생(`loop: true`)이 전제다.

---

## 9. 오류 처리 / 엣지 케이스

| 상황 | 처리 |
|---|---|
| `bgm.mp3` 로딩 실패(파일 누락 등) | 게임 진행은 막지 않는다. 콘솔에 경고만 남기고 무음으로 계속 진행 |
| 타일링된 발판 폭이 타일 하나보다 좁음 (예: 폭 40 발판에 64폭 타일) | TileSprite가 자동으로 잘라서 채움 — Phaser 자체 동작, 별도 처리 불필요 |
| 가장 긴 스테이지(7·8번, 폭 5200)에서 먼 배경 레이어가 화면 밖으로 벗어남 | 발생하지 않음 — 레이어가 뷰포트 크기로 카메라 앞에 고정되고 `tilePositionX`만 움직이므로 레벨 폭과 무관 |
| level7의 천장이 y=0에 붙어 있어 배경 여유 공간이 없음 | 먼 배경 레이어는 `DEPTH.BACKGROUND`(-10, 모든 발판·해저드보다 뒤)에 그려지므로 물리 충돌과 무관 — 시각적으로만 뒤에 깔림 |

---

## 10. 테스트 방침

이번 작업은 전부 그림·오디오 자산이라 `src/levels/motion.test.ts` 같은 순수 로직 테스트 대상이 아니다.

- **자동 검증**: `npm test`(기존 유닛 테스트, 로직 미변경이므로 그대로 통과해야 함), `npm run build`(타입체크 + 번들링 성공 확인).
- **수동 플레이테스트**(8개 스테이지 전체):
  1. 픽셀 일렁임 재발 여부(특히 먼 배경 레이어).
  2. 위험물 색이 배경에 묻히지 않는지(특히 초원 세계 하늘색 배경 vs 플레이어).
  3. 타일링된 정적 발판의 충돌 판정이 기존과 동일한지(발판 경계에서 밟기·옆 충돌 확인).
  4. 배경음악이 재시도·스테이지 전환·게임오버·승리 화면 전환에도 끊기지 않는지.

---

## 11. 변경 파일 요약

| 파일 | 변경 |
|---|---|
| `src/config.ts` | `COLORS`에 `OUTLINE` 등 신규 항목 추가, `PARALLAX` 상수 블록 추가, `DEPTH.BACKGROUND_FAR` 추가, 배경/타일용 `TEX` 키 추가 |
| `src/scenes/BootScene.ts` | 전체 텍스처 생성 메서드를 픽셀 격자 스타일로 재작성, 세계별 배경 레이어 텍스처·정적 발판 타일 텍스처 추가, 새 `preload()` 메서드 추가(`bgm` 오디오 로드 — 지금은 `preload()` 자체가 없음) |
| `src/scenes/GameScene.ts` | `drawBackground()`를 세계별 색 + 시차 레이어로 확장, `makeStaticPlatform()`을 TileSprite 기반으로 교체, `setCameraScroll()`에서 `layoutParallax()` 호출 추가 |
| `src/scenes/MenuScene.ts` | 시작 키/클릭 핸들러에서 `startBgmOnce()` 호출 |
| `src/worlds.ts` (신규) | 스테이지 인덱스 → 세계 매핑 |
| `src/audio.ts` (신규) | 지속 재생 BGM 관리 |
| `public/audio/bgm.mp3` (신규) | 배경음악 자산 |
| `src/objects/MovingPlatform.ts` 등 6종 | 텍스처만 재작성(코드 구조 변경 없음) |

---

## 12. 범위 밖 (Out of scope)

- 레벨 데이터(발판 좌표·크기, 난이도, 점프 수치)는 일절 변경하지 않는다.
- 사운드 이펙트(점프·사망·스테이지 클리어 효과음 등)는 이번 범위에 없다 — 배경음악 1곡만.
- 볼륨 조절 UI·음소거 키는 넣지 않는다(요청 범위 밖, YAGNI).
- 스테이지 2의 이름 누락(`level2.ts`에 `name` 필드 없음)은 발견했지만 이번 작업과 무관해 손대지 않는다.
