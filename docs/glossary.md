# 게임 용어집 (Glossary)

이 문서는 게임 내 캐릭터·스테이지·몹·기믹의 한글 명칭, 실제 코드 식별자(클래스명·파일 경로), 그리고 각 몹·기믹이 어떻게 동작하는지를 함께 정리합니다. 목적은 프롬프트나 대화에서 "차저", "감지 돌진적" 같은 이름만으로도 어떤 파일을 가리키고 어떻게 동작하는지 바로 찾을 수 있게 하는 것입니다. 게임을 처음 소개하는 내용(장르, 스테이지 구성, 조작법, 실행 방법)은 [`README.md`](../README.md)에 있으므로 여기서는 반복하지 않습니다.

## 캐릭터

| 한글 명칭 | 코드 식별자 | 파일 |
|---|---|---|
| 고퍼(비공식 별칭) | `Player` | `src/objects/Player.ts` |

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

## 밟아서 처치 가능한 몹

공통 규칙: 위에서 밟으면 처치, 옆/아래로 부딪히면 사망.

| 한글 명칭 | 코드 식별자 | 파일 | 동작 |
|---|---|---|---|
| 기본 패트롤 적 | `Enemy` | `src/objects/Enemy.ts` | 정해진 구간을 왕복 |
| 망치 투척몹 | `HammerThrower` | `src/objects/HammerThrower.ts` | 걸어다니다 멈춰서 망치를 포물선으로 던짐(망치 자체는 실드로 막을 수 없음) |
| 공중 패트롤몹 | `Flyer` | `src/objects/Flyer.ts` | 정해진 공중 경로를 왕복 |
| 감지 돌진적 | `Charger` | `src/objects/Charger.ts` | 평소엔 느리게 왕복하다 플레이어가 가까워지면 빠르게 돌진(돌진 중에도 밟으면 처치됨) |
| 수직 낙하몹 | `Dropper` | `src/objects/Dropper.ts` | 발판 위에 가만히 있다가 그 아래를 지나가면 예고 후 바위를 떨어뜨림(바위도 실드로 막을 수 없음) |

## 고정 위험 요소 (즉사, 밟기 불가)

공통 규칙: 접촉하면 즉시 사망, 밟아서 처치할 수 없음.

| 한글 명칭 | 코드 식별자 | 파일 | 동작 |
|---|---|---|---|
| 고정 가시 | 없음 (레벨 데이터 `SpikeDef`) | `src/levels/types.ts` | 바닥에 고정된 가시 |
| 팝업 가시 | `PopupSpike` | `src/objects/PopupSpike.ts` | 바닥에 숨어 있다 주기적으로 튀어나옴(튀어나오기 전에 깜빡이며 예고) |
| 진자 | `Pendulum` | `src/objects/Pendulum.ts` | 고정된 지점에서 좌우로 흔들리는 가시 달린 구 |
| 회전 기어 | `Gear` | `src/objects/Gear.ts` | 정해진 경로를 오가며 회전하는 톱니바퀴 |
| 쓰웜프 | `Thwomp` | `src/objects/Thwomp.ts` | 위에서 대기하다 플레이어가 지나가면 예고 후 빠르게 내려찍고, 다시 천천히 올라감(내려찍는 순간만 위험) |

## 발판·지형 기믹

공통 규칙: 밟고 지나가는 지형이지만 평범하지 않게 움직이거나 무너짐.

| 한글 명칭 | 코드 식별자 | 파일 | 동작 |
|---|---|---|---|
| 이동 발판 | `MovingPlatform` | `src/objects/MovingPlatform.ts` | 정해진 경로를 오가며 플레이어를 태우고 이동 |
| 컨베이어 | `Conveyor` | `src/objects/Conveyor.ts` | 발판 위에서 플레이어가 한쪽으로 밀려남 |
| 스프링 | `Spring` | `src/objects/Spring.ts` | 밟으면 위로 튕겨 오름 |
| 크럼블 바닥 / 위장 발판 | `CrumblingPlatform` | `src/objects/CrumblingPlatform.ts` | 밟으면 무너져 사라짐 |
| 위장 발판(자동 순환형) | `TrapFloor` | `src/objects/TrapFloor.ts` | 밟으면 무너져 사라짐(자동으로 순환 반복) |

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
