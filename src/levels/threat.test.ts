import { describe, expect, it } from "vitest";
import { levels } from "./index";
import {
  bandsOverlap,
  hazardThreat,
  laneEnd,
  mountSurfaceOf,
  mountedOn,
  standingBand,
  surfacesOf,
  threatensStandingPlayer,
} from "./threat";
import type { HazardDef, LevelDef, PlatformDef } from "./types";

/** The ordinary ground line every stage is built on. */
const GROUND = 496;

/** A minimal level with one ground segment, enough to judge a single hazard. */
function levelWith(hazards: HazardDef[], platforms: PlatformDef[] = []): LevelDef {
  return {
    worldWidth: 3000,
    worldHeight: 540,
    playerSpawn: { x: 0, y: 0 },
    platforms: [{ x: 0, y: GROUND, width: 3000, height: 44 }, ...platforms],
    enemies: [],
    spikes: [],
    hazards,
    goal: { x: 2900, y: GROUND },
  };
}

describe("standingBand", () => {
  it("[Happy] 표면 위로 몸통 높이만큼 올라간 구간이다", () => {
    expect(standingBand({ top: GROUND, low: GROUND, left: 0, right: 100 })).toEqual({
      top: 458,
      bottom: 496,
    });
  });

  it("[Boundary] 위아래로 움직이는 발판은 탑승자가 있을 수 있는 전 구간을 덮는다", () => {
    expect(standingBand({ top: 300, low: 440, left: 0, right: 100 })).toEqual({
      top: 262,
      bottom: 440,
    });
  });
});

describe("bandsOverlap", () => {
  it("[Happy] 겹치면 참", () => {
    expect(bandsOverlap({ top: 473, bottom: 489 }, { top: 458, bottom: 496 })).toBe(true);
  });

  it("[Boundary] 1px만 겹쳐도 참", () => {
    expect(bandsOverlap({ top: 447, bottom: 459 }, { top: 458, bottom: 496 })).toBe(true);
  });

  it("[Boundary] 딱 맞닿기만 하면 거짓 — 실제 판정도 접촉만으로는 안 죽는다", () => {
    expect(bandsOverlap({ top: 447, bottom: 458 }, { top: 458, bottom: 496 })).toBe(false);
  });
});

describe("surfacesOf", () => {
  it("[Happy] 고정 발판은 위아래 폭이 없는 표면 하나다", () => {
    expect(surfacesOf([{ x: 100, y: 400, width: 120, height: 24 }])).toEqual([
      { top: 400, low: 400, left: 100, right: 220 },
    ]);
  });

  it("[Boundary] 좌우로 움직이는 발판은 왕복 범위만큼 넓다", () => {
    expect(
      surfacesOf([
        { x: 3740, y: 452, width: 120, height: 22, type: "moving", range: 160 },
      ]),
    ).toEqual([{ top: 452, low: 452, left: 3740, right: 4020 }]);
  });

  it("[Boundary] 위아래로 움직이는 발판은 표면 높이가 범위만큼 달라진다", () => {
    expect(
      surfacesOf([
        { x: 0, y: 300, width: 100, height: 20, type: "moving", axis: "vertical", range: 140 },
      ]),
    ).toEqual([{ top: 300, low: 440, left: 0, right: 100 }]);
  });
});

describe("mountedOn", () => {
  const platforms: PlatformDef[] = [{ x: 1980, y: GROUND, width: 620, height: 44 }];

  it("[Happy] 발판 윗면에 놓이면 참", () => {
    expect(mountedOn(platforms, 2360, GROUND)).toBe(true);
  });

  it("[Error] 발판이 없는 높이에 놓이면 거짓 — 공중에 뜬 설치물", () => {
    expect(mountedOn(platforms, 2360, 452)).toBe(false);
  });

  it("[Error] 발판 바깥 x에 놓이면 거짓", () => {
    expect(mountedOn(platforms, 100, GROUND)).toBe(false);
  });
});

describe("laneEnd", () => {
  const level = levelWith([], [{ x: 1000, y: 400, width: 40, height: 96 }]);

  it("[Happy] 왼쪽으로 쏜 탄은 앞을 막는 기둥의 오른쪽 면에서 멈춘다", () => {
    expect(laneEnd(level, 2000, -1, { top: 473, bottom: 489 })).toBe(1040);
  });

  it("[Boundary] 막는 지형이 없으면 월드 끝까지 간다", () => {
    expect(laneEnd(level, 2000, -1, { top: 100, bottom: 110 })).toBe(0);
    expect(laneEnd(level, 2000, 1, { top: 100, bottom: 110 })).toBe(3000);
  });

  it("[Boundary] 이동 발판은 발사체를 막지 않는다", () => {
    const withMover = levelWith(
      [],
      [{ x: 1000, y: 400, width: 120, height: 96, type: "moving", range: 100 }],
    );
    expect(laneEnd(withMover, 2000, -1, { top: 473, bottom: 489 })).toBe(0);
  });
});

describe("hazardThreat", () => {
  it("[Happy] 지면에 세운 대포는 포탄이 가슴 높이를 지난다", () => {
    const threat = hazardThreat(levelWith([]), {
      kind: "cannon",
      x: 2360,
      y: GROUND,
      direction: "left",
    })!;
    expect(threat.band).toEqual({ top: 473, bottom: 489 });
    expect(bandsOverlap(threat.band, { top: 458, bottom: 496 })).toBe(true);
  });

  it("[Happy] 지면에 세운 화살 발사기도 가슴 높이를 지난다", () => {
    const threat = hazardThreat(levelWith([]), {
      kind: "arrowShooter",
      x: 1770,
      y: GROUND,
      direction: -1,
    })!;
    expect(threat.band).toEqual({ top: 474, bottom: 484 });
  });

  it("[Happy] 진자의 위험 밴드는 호의 최고점부터 최저점까지다", () => {
    const threat = hazardThreat(levelWith([]), {
      kind: "pendulum",
      x: 1260,
      y: 280,
      length: 170,
      amplitudeDeg: 58,
    })!;
    expect(threat.band.bottom).toBe(466); // 280 + 170 + 머리 반지름 16
  });

  it("[Boundary] 왕복 범위가 0인 톱니는 제자리 원이다", () => {
    const threat = hazardThreat(levelWith([]), { kind: "gear", x: 500, y: 300 })!;
    expect(threat.band).toEqual({ top: 280, bottom: 320 });
    expect([threat.left, threat.right]).toEqual([480, 520]);
  });

  it("[Boundary] 조준형 터렛은 고정된 위험 구간이 없어 판정 대상이 아니다", () => {
    expect(
      hazardThreat(levelWith([]), { kind: "turret", x: 1520, y: GROUND, aimMode: "aim" }),
    ).toBeNull();
  });

  it("[Error] 알 수 없는 종류는 예외 없이 null을 돌려준다", () => {
    const unknown = { kind: "trapdoor", x: 0, y: 0 } as unknown as HazardDef;
    expect(hazardThreat(levelWith([]), unknown)).toBeNull();
  });
});

describe("mountSurfaceOf", () => {
  it("[Happy] 바닥 설치물은 자기 표면을 돌려준다", () => {
    expect(mountSurfaceOf({ kind: "cannon", x: 0, y: GROUND, direction: "left" })).toBe(GROUND);
  });

  it("[Boundary] 공중에 매달리는 해저드는 표면이 없다", () => {
    expect(mountSurfaceOf({ kind: "pendulum", x: 0, y: 250 })).toBeNull();
    expect(mountSurfaceOf({ kind: "gear", x: 0, y: 300 })).toBeNull();
    expect(mountSurfaceOf({ kind: "thwomp", x: 0, y: 110 })).toBeNull();
  });
});

describe("threatensStandingPlayer", () => {
  it("[Happy] 지면 대포는 서 있는 주인공을 맞힌다", () => {
    const level = levelWith([{ kind: "cannon", x: 2360, y: GROUND, direction: "left" }]);
    expect(threatensStandingPlayer(level, level.hazards![0])).toBe(true);
  });

  it("[Error] 발판 끝을 스치기만 하는 탄도는 위협이 아니다", () => {
    // 정상 발판 왼쪽 끝에 세워 허공으로 쏘는 대포 — 발판을 10px만 훑어
    // 주인공이 설 수 있는 자리가 없고, 그 높이에 다른 발판도 없다.
    const level: LevelDef = {
      worldWidth: 3000,
      worldHeight: 540,
      playerSpawn: { x: 0, y: 0 },
      platforms: [
        { x: 0, y: GROUND, width: 1000, height: 44 },
        { x: 1260, y: 220, width: 100, height: 24 },
      ],
      enemies: [],
      spikes: [],
      hazards: [{ kind: "cannon", x: 1270, y: 220, direction: "left" }],
      goal: { x: 900, y: GROUND },
    };
    expect(threatensStandingPlayer(level, level.hazards![0])).toBe(false);
  });

  it("[Boundary] 같은 대포도 발판 반대쪽 끝에 서면 발판 위를 쓸어 위협이 된다", () => {
    const level: LevelDef = {
      worldWidth: 3000,
      worldHeight: 540,
      playerSpawn: { x: 0, y: 0 },
      platforms: [
        { x: 0, y: GROUND, width: 1000, height: 44 },
        { x: 1260, y: 220, width: 100, height: 24 },
      ],
      enemies: [],
      spikes: [],
      hazards: [{ kind: "cannon", x: 1340, y: 220, direction: "left" }],
      goal: { x: 900, y: GROUND },
    };
    expect(threatensStandingPlayer(level, level.hazards![0])).toBe(true);
  });

  it("[Boundary] 몸 폭만큼 덮으면 위협, 한 픽셀 모자라면 아니다", () => {
    const crestCannonAt = (x: number): LevelDef => ({
      worldWidth: 3000,
      worldHeight: 540,
      playerSpawn: { x: 0, y: 0 },
      platforms: [
        { x: 0, y: GROUND, width: 1000, height: 44 },
        { x: 1260, y: 220, width: 100, height: 24 },
      ],
      enemies: [],
      spikes: [],
      hazards: [{ kind: "cannon", x, y: 220, direction: "left" }],
      goal: { x: 900, y: GROUND },
    });
    // 몸 폭 24 기준: 1284면 24px을 덮고, 1283이면 23px이라 설 자리가 없다.
    const covers24 = crestCannonAt(1284);
    const covers23 = crestCannonAt(1283);
    expect(threatensStandingPlayer(covers24, covers24.hazards![0])).toBe(true);
    expect(threatensStandingPlayer(covers23, covers23.hazards![0])).toBe(false);
  });

  it("[Boundary] 조준형 터렛은 언제나 통과한다", () => {
    const level = levelWith([{ kind: "turret", x: 1520, y: GROUND, aimMode: "aim" }]);
    expect(threatensStandingPlayer(level, level.hazards![0])).toBe(true);
  });

  it("[Error] 등록되지 않은 종류는 통과가 아니라 실패다 — 조용히 빠지면 의미가 없다", () => {
    const unknown = { kind: "trapdoor", x: 500, y: GROUND } as unknown as HazardDef;
    expect(threatensStandingPlayer(levelWith([]), unknown)).toBe(false);
  });
});

/**
 * The stage sweep. Everything above proves the geometry; this applies it to the
 * real levels, so a hazard that cannot reach anyone fails here rather than going
 * unnoticed in play — a shot that misses by a pixel just reads as "it missed".
 *
 * It walks the `levels` registry, so a new stage is covered the moment it is
 * added to that array.
 */
describe("모든 스테이지", () => {
  levels.forEach((level, index) => {
    const stage = `${index + 1}스테이지`;

    it(`[Happy] ${stage} 깃발이 지면에 꽂혀 있다`, () => {
      expect(mountedOn(level.platforms, level.goal.x, level.goal.y)).toBe(true);
    });

    (level.hazards ?? []).forEach((hazard) => {
      const where = `${hazard.kind}@${hazard.x}`;

      const surface = mountSurfaceOf(hazard);
      if (surface !== null) {
        it(`[Happy] ${stage} ${where}가 발판 위에 서 있다`, () => {
          expect(mountedOn(level.platforms, hazard.x, surface)).toBe(true);
        });
      }

      it(`[Happy] ${stage} ${where}가 서 있는 주인공을 맞힐 수 있다`, () => {
        expect(threatensStandingPlayer(level, hazard)).toBe(true);
      });
    });
  });
});
