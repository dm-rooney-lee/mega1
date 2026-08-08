/**
 * Whether a hazard can actually reach the player — pure geometry over level data,
 * no Phaser, so `threat.test.ts` can sweep every stage without a browser.
 *
 * A hazard that cannot touch a player who is standing still is decoration: you
 * walk up, wait as long as you like, and nothing happens. Several were exactly
 * that (arrows passing 1px over the player's head, a turret hanging in mid-air, a
 * crest cannon whose lane crossed nothing but sky), and none of it is noticeable
 * in play — a shot that misses by a pixel just reads as "it missed".
 *
 * Two rules come out of that, and `threat.test.ts` applies both to every stage:
 *
 *   mounting — anything that stands on the ground must actually stand on a
 *              platform, so it cannot drift into the air unnoticed
 *   threat   — the space a hazard sweeps must overlap the body of a player
 *              standing on some surface that hazard covers
 *
 * Sizes come from `config.ts` so this agrees with what the game draws and
 * collides; a private copy here would let the audit pass while the real shot
 * sails overhead.
 */

import {
  CANNON,
  DROPPER,
  FLYER,
  GEAR,
  PENDULUM,
  PLAYER,
  PROJECTILE,
  SHOOTER,
  SPIKE,
  THWOMP,
  TILE,
  TURRET,
} from "../config";
import { narrowBoundsForSpikes, patrolBoundsFor } from "./patrol";
import type { HazardDef, LevelDef, PlatformDef } from "./types";

/** A vertical span in logical units. `top` is the smaller number (screen y grows downward). */
export type Band = { top: number; bottom: number };

/**
 * A standable surface. `top` is its highest position and `low` its lowest — they
 * differ only for a vertically moving platform, whose rider can be anywhere
 * between the two.
 */
export type Surface = { top: number; low: number; left: number; right: number };

/** Where a hazard is dangerous: the band it sweeps, and the x span it sweeps it over. */
export type Threat = { band: Band; left: number; right: number };

/** The body of a player standing on `surface`. */
export function standingBand(surface: Surface): Band {
  return { top: surface.top - PLAYER.BODY_HEIGHT, bottom: surface.low };
}

/** Overlap in the Arcade sense: merely touching edges is not a hit. */
export function bandsOverlap(a: Band, b: Band): boolean {
  return a.top < b.bottom && b.top < a.bottom;
}

/** How much of two x spans is shared; zero when they miss each other. */
function overlapWidth(aLeft: number, aRight: number, bLeft: number, bRight: number): number {
  return Math.max(0, Math.min(aRight, bRight) - Math.max(aLeft, bLeft));
}

/** Whether a platform is one of the solid, unmoving ones that block projectiles. */
function isStatic(p: PlatformDef): boolean {
  const type = p.type ?? "static";
  return type === "static";
}

/**
 * Whether a player can stand on a platform long enough to be hit. Crumbling and
 * trap floors drop away on their own timers and a spring launches its rider the
 * moment they land, so a hazard that only reaches those has nobody to reach.
 */
function isStandable(p: PlatformDef): boolean {
  const type = p.type ?? "static";
  return type === "static" || type === "moving" || type === "conveyor";
}

/**
 * Every surface a player can stand on. A moving platform is widened by its travel
 * — a rider is carried across all of it, so the whole span is standable.
 */
export function surfacesOf(platforms: PlatformDef[]): Surface[] {
  return platforms.filter(isStandable).map((p) => {
    const range = p.type === "moving" ? (p.range ?? 0) : 0;
    const horizontal = (p.axis ?? "horizontal") === "horizontal";
    return {
      top: p.y,
      low: p.y + (horizontal ? 0 : range),
      left: p.x,
      right: p.x + p.width + (horizontal ? range : 0),
    };
  });
}

/**
 * Whether a solid, unmoving platform's top edge sits exactly at `surfaceY` under
 * `x` — the check that keeps ground-mounted hazards on the ground.
 *
 * Only static platforms count. A hazard is placed once and never re-parented, so
 * a moving platform slides out from under it and a crumbling or trap floor
 * vanishes, leaving exactly the hanging-in-mid-air hazard this rule exists to
 * catch.
 */
export function mountedOn(platforms: PlatformDef[], x: number, surfaceY: number): boolean {
  return platforms.some(
    (p) => isStatic(p) && p.y === surfaceY && x >= p.x && x <= p.x + p.width,
  );
}

/**
 * Where a shot fired from `fromX` along `dir` at height `band` stops: the facing
 * edge of the first solid platform it meets, or the edge of the world. Only static
 * platforms block — moving, crumbling, trap, conveyor and spring platforms are not
 * in the collider group the projectiles are wired to.
 */
export function laneEnd(level: LevelDef, fromX: number, dir: -1 | 1, band: Band): number {
  let end = dir < 0 ? 0 : level.worldWidth;
  for (const p of level.platforms) {
    if (!isStatic(p)) continue;
    if (!bandsOverlap(band, { top: p.y, bottom: p.y + p.height })) continue;
    if (dir < 0) {
      const face = p.x + p.width;
      if (face <= fromX && face > end) end = face;
    } else {
      const face = p.x;
      if (face >= fromX && face < end) end = face;
    }
  }
  return end;
}

/** Half a projectile's height — how far a shot reaches either side of its line. */
const PROJECTILE_REACH = PROJECTILE.HEIGHT / 2;

/** The band a shot travelling along `centreY` occupies. */
function shotBand(centreY: number, reach: number): Band {
  return { top: centreY - reach, bottom: centreY + reach };
}

/**
 * The lane a shot sweeps, from its muzzle to whatever stops it first. `range`
 * caps it where the projectile culls itself: pooled projectiles die after
 * `PROJECTILE.RANGE`, so without the cap a turret is credited with a surface its
 * arrows expire well short of. Cannonballs have no such cull.
 */
function lane(
  level: LevelDef,
  muzzleX: number,
  dir: -1 | 1,
  band: Band,
  range = Infinity,
): Threat {
  const terrain = laneEnd(level, muzzleX, dir, band);
  const end =
    dir < 0 ? Math.max(terrain, muzzleX - range) : Math.min(terrain, muzzleX + range);
  return { band, left: Math.min(muzzleX, end), right: Math.max(muzzleX, end) };
}

/**
 * The surface a hazard is mounted on, or null when it hangs in the air by design
 * (pendulums, gears, crushers).
 */
export function mountSurfaceOf(hazard: HazardDef): number | null {
  switch (hazard.kind) {
    case "arrowShooter":
    case "turret":
    case "cannon":
    case "popupSpike":
    case "hammerThrower":
    case "charger":
    case "dropper":
      return hazard.y;
    case "pendulum":
    case "gear":
    case "thwomp":
    case "flyer":
      return null;
    default:
      return unregistered(hazard);
  }
}

/**
 * Reached only by a hazard kind nobody taught this module about. Typing the
 * parameter as `never` turns that into a compile error, so a new kind cannot be
 * added to `HazardDef` without deciding how it is judged — otherwise it would
 * quietly sit outside the sweep while every stage still reported green.
 */
function unregistered(hazard: never): null {
  void hazard;
  return null;
}

/**
 * Where a hazard is dangerous, or null when it has no fixed danger space to check
 * — an aiming turret leads the player wherever they stand, so there is no band to
 * compare against.
 */
export function hazardThreat(level: LevelDef, hazard: HazardDef): Threat | null {
  switch (hazard.kind) {
    case "pendulum": {
      const length = hazard.length ?? PENDULUM.LENGTH;
      const amplitude = ((hazard.amplitudeDeg ?? PENDULUM.AMPLITUDE_DEG) * Math.PI) / 180;
      const reach = PENDULUM.HEAD_RADIUS;
      const swing = length * Math.sin(amplitude) + reach;
      return {
        band: { top: hazard.y + length * Math.cos(amplitude) - reach, bottom: hazard.y + length + reach },
        left: hazard.x - swing,
        right: hazard.x + swing,
      };
    }
    case "gear": {
      const range = hazard.range ?? 0;
      const vertical = (hazard.axis ?? "horizontal") === "vertical";
      const reach = GEAR.RADIUS;
      return {
        band: { top: hazard.y - reach, bottom: hazard.y + (vertical ? range : 0) + reach },
        left: hazard.x - reach,
        right: hazard.x + (vertical ? 0 : range) + reach,
      };
    }
    case "thwomp": {
      const height = hazard.height ?? THWOMP.HEIGHT;
      const drop = hazard.dropDistance ?? THWOMP.DROP_DISTANCE;
      return {
        band: { top: hazard.y + drop, bottom: hazard.y + drop + height },
        left: hazard.x,
        right: hazard.x + (hazard.width ?? THWOMP.WIDTH),
      };
    }
    case "popupSpike": {
      // Raised, the tile's top edge sits a full tile above the surface, and only
      // the spike body inside it is solid — on both axes, so the last tile's
      // solid part stops short of the art's right edge.
      const spriteTop = hazard.y - TILE;
      const tiles = hazard.tiles ?? 1;
      return {
        band: {
          top: spriteTop + SPIKE.BODY_OFFSET_Y,
          bottom: spriteTop + SPIKE.BODY_OFFSET_Y + SPIKE.BODY_HEIGHT,
        },
        left: hazard.x + SPIKE.BODY_OFFSET_X,
        right: hazard.x + (tiles - 1) * TILE + SPIKE.BODY_OFFSET_X + SPIKE.BODY_WIDTH,
      };
    }
    case "arrowShooter": {
      const muzzleY = hazard.y - SHOOTER.HEIGHT / 2;
      const muzzleX = hazard.x + hazard.direction * (SHOOTER.WIDTH / 2 + SHOOTER.MUZZLE_GAP);
      return lane(
        level,
        muzzleX,
        hazard.direction,
        shotBand(muzzleY, PROJECTILE_REACH),
        PROJECTILE.RANGE,
      );
    }
    case "turret": {
      if ((hazard.aimMode ?? "fixed") === "aim") return null;
      // The barrel is drawn on the sprite's top edge, so a mounted turret fires a
      // full body height above its surface.
      const muzzleY = hazard.y - TURRET.HEIGHT;
      const direction = hazard.direction ?? -1;
      return lane(
        level,
        hazard.x,
        direction,
        shotBand(muzzleY, PROJECTILE_REACH),
        PROJECTILE.RANGE,
      );
    }
    case "cannon": {
      const muzzleY = hazard.y - CANNON.HEIGHT / 2;
      const direction = hazard.direction === "left" ? -1 : 1;
      const muzzleX =
        hazard.x +
        direction * (CANNON.WIDTH / 2 + CANNON.BALL_DIAMETER / 2 + CANNON.MUZZLE_GAP);
      // Cannonballs never cull themselves, so their lane runs until terrain.
      return lane(level, muzzleX, direction, shotBand(muzzleY, CANNON.BALL_DIAMETER / 2));
    }
    case "hammerThrower":
    case "charger": {
      // Both patrol like an Enemy — same bounds (narrowed by nearby spikes,
      // same as GameScene.buildHazard does) — and their body is lethal on
      // contact for the whole patrol, so the danger zone is simply "wherever
      // it walks" at the height it stands. The thrown hammer is an extra
      // threat layered on top, not required to satisfy this check.
      const [left, right] = narrowBoundsForSpikes(
        level.spikes,
        hazard.x,
        hazard.y,
        patrolBoundsFor(level.platforms, hazard.x, hazard.y),
      );
      return { band: { top: hazard.y - PLAYER.BODY_HEIGHT, bottom: hazard.y }, left, right };
    }
    case "dropper": {
      // Fixed in place (like a Turret); the mounted body itself is lethal on contact.
      const halfW = DROPPER.WIDTH / 2;
      return {
        band: { top: hazard.y - DROPPER.HEIGHT, bottom: hazard.y },
        left: hazard.x - halfW,
        right: hazard.x + halfW,
      };
    }
    case "flyer": {
      // Same rail-sweep geometry as `gear` — it flies a straight path and is lethal
      // on contact anywhere along it.
      const range = hazard.range ?? 0;
      const vertical = (hazard.axis ?? "horizontal") === "vertical";
      const reach = FLYER.RADIUS;
      return {
        band: { top: hazard.y - reach, bottom: hazard.y + (vertical ? range : 0) + reach },
        left: hazard.x - reach,
        right: hazard.x + (vertical ? 0 : range) + reach,
      };
    }
    default:
      return unregistered(hazard);
  }
}

/** An aiming turret leads the player wherever they stand, so it has no fixed danger space. */
function aimsAtPlayer(hazard: HazardDef): boolean {
  return hazard.kind === "turret" && (hazard.aimMode ?? "fixed") === "aim";
}

/**
 * Whether a hazard can kill a player who is standing still: its danger space has
 * to overlap the body of someone standing on a surface it covers. Hazards with no
 * fixed danger space (aiming turrets) are not judged here.
 *
 * Both axes use plain overlap, matching Arcade. The horizontal test widens the
 * surface by half a body on each side rather than demanding a body's width of
 * coverage: a player standing at a platform's lip is still supported, and a shot
 * clipping the last pixel of that platform still passes through them. Requiring
 * full coverage instead reports genuinely lethal hazards as decoration.
 *
 * Only an aiming turret is excused. Anything else without a danger band is a kind
 * this module has not been taught, and calling that safe would hide it.
 */
export function threatensStandingPlayer(level: LevelDef, hazard: HazardDef): boolean {
  if (aimsAtPlayer(hazard)) return true;
  const threat = hazardThreat(level, hazard);
  if (!threat) return false;
  const reach = PLAYER.BODY_WIDTH / 2;
  return surfacesOf(level.platforms).some(
    (surface) =>
      overlapWidth(threat.left, threat.right, surface.left - reach, surface.right + reach) >
        0 && bandsOverlap(threat.band, standingBand(surface)),
  );
}
