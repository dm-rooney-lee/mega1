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
