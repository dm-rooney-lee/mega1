import type { PlatformDef } from "./types";

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
