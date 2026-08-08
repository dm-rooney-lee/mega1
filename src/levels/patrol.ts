import type { PlatformDef, SpikeDef } from "./level1";

/**
 * Given the platforms in a level and an enemy's spawn point, find the platform the
 * enemy is standing on and return its `[left, right]` edges — the span it should
 * patrol between. Pure function (no Phaser), so it's easy to unit-test.
 *
 * If no platform is found beneath the spawn point, falls back to a fixed span
 * centered on the spawn x.
 */
export function patrolBoundsFor(
  platforms: PlatformDef[],
  x: number,
  y: number,
): [number, number] {
  let best: { left: number; right: number; top: number } | null = null;
  for (const p of platforms) {
    const onTopBand = y <= p.y && y >= p.y - 60;
    const withinX = x >= p.x && x <= p.x + p.width;
    if (onTopBand && withinX) {
      // Prefer the highest matching surface (smallest y).
      if (!best || p.y < best.top) {
        best = { left: p.x, right: p.x + p.width, top: p.y };
      }
    }
  }
  if (best) return [best.left, best.right];
  // Fallback: patrol a fixed span around the spawn point.
  return [x - 120, x + 120];
}

/**
 * Narrows an enemy's patrol span so it turns around at spike fields instead of
 * walking through them. Only spikes on the enemy's own surface are considered
 * (matched by vertical proximity, since a surface's enemies and spikes rest at
 * roughly the same height). A spike field entirely to one side of the enemy
 * pulls that side's bound in to the spike's near edge. Pure function, so it's
 * easy to unit-test.
 */
export function narrowBoundsForSpikes(
  spikes: SpikeDef[],
  x: number,
  y: number,
  [left, right]: [number, number],
): [number, number] {
  for (const s of spikes) {
    // Skip spikes that aren't on the same surface as the enemy.
    if (Math.abs(y - s.y) > 48) continue;

    const spikeLeft = s.x;
    const spikeRight = s.x + s.tiles * 32;
    if (spikeRight <= x) {
      // Obstacle to the left: don't walk left past its right edge.
      left = Math.max(left, spikeRight);
    } else if (spikeLeft >= x) {
      // Obstacle to the right: don't walk right past its left edge.
      right = Math.min(right, spikeLeft);
    }
    // If the enemy spawns inside a spike span, leave the bounds alone — that's a
    // level-authoring problem, not something to silently clamp.
  }
  return [left, right];
}

/**
 * Which way a ground-patrol enemy should be moving this frame: reverse at its
 * patrol bounds, or on a wall bump (e.g. running into another platform).
 * Pure function of the current state, shared by every enemy that patrols this
 * way (Enemy, HammerThrower, Charger) instead of each re-deriving it.
 */
export function reverseAtBounds(
  x: number,
  halfWidth: number,
  leftBound: number,
  rightBound: number,
  blockedLeft: boolean,
  blockedRight: boolean,
  dir: 1 | -1,
): 1 | -1 {
  if (x - halfWidth <= leftBound) dir = 1;
  else if (x + halfWidth >= rightBound) dir = -1;
  if (blockedLeft) dir = 1;
  else if (blockedRight) dir = -1;
  return dir;
}
