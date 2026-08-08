import { describe, expect, it } from "vitest";
import type { PlatformDef, SpikeDef } from "./level1";
import { patrolBoundsFor, narrowBoundsForSpikes, reverseAtBounds } from "./patrol";

describe("patrolBoundsFor", () => {
  const ground: PlatformDef = { x: 0, y: 496, width: 640, height: 44 };
  const floating: PlatformDef = { x: 360, y: 380, width: 160, height: 24 };

  it("returns the edges of the platform the enemy stands on", () => {
    // Enemy just above the ground surface, within its x-span.
    expect(patrolBoundsFor([ground], 300, 456)).toEqual([0, 640]);
  });

  it("uses the highest surface when platforms overlap in x", () => {
    // Spawn point sits above the floating platform, which is higher (smaller y)
    // than the ground below it — the floating one should win.
    expect(patrolBoundsFor([ground, floating], 400, 340)).toEqual([360, 520]);
  });

  it("ignores platforms whose x-span doesn't contain the spawn point", () => {
    // x=700 is off the right edge of `ground` (0..640), so no match → fallback.
    expect(patrolBoundsFor([ground], 700, 456)).toEqual([580, 820]);
  });

  it("ignores platforms too far below the spawn point (>60px band)", () => {
    // Enemy spawned well above the ground surface → outside the 60px top band.
    expect(patrolBoundsFor([ground], 300, 400)).toEqual([180, 420]);
  });

  it("falls back to a fixed span around x when no platform matches", () => {
    expect(patrolBoundsFor([], 1000, 456)).toEqual([880, 1120]);
  });
});

describe("narrowBoundsForSpikes", () => {
  // A ground-level spike field spanning x = 1120..1216 (3 tiles of 32px).
  const groundSpikes: SpikeDef = { x: 1120, y: 472, tiles: 3 };
  const groundY = 456;

  it("clamps the right bound when the spikes are to the enemy's right", () => {
    // Enemy at x=1000, spikes start at 1120 → can't walk right past 1120.
    expect(
      narrowBoundsForSpikes([groundSpikes], 1000, groundY, [760, 1660]),
    ).toEqual([760, 1120]);
  });

  it("clamps the left bound when the spikes are to the enemy's left", () => {
    // Enemy at x=1420, spikes end at 1216 → can't walk left past 1216.
    expect(
      narrowBoundsForSpikes([groundSpikes], 1420, groundY, [760, 1660]),
    ).toEqual([1216, 1660]);
  });

  it("ignores spikes on a different surface (far vertically)", () => {
    // Enemy up on a platform (y=332) vs ground spikes (y=472) → not clamped.
    expect(
      narrowBoundsForSpikes([groundSpikes], 1000, 332, [900, 1300]),
    ).toEqual([900, 1300]);
  });

  it("leaves bounds unchanged when there are no spikes", () => {
    expect(narrowBoundsForSpikes([], 1000, groundY, [760, 1660])).toEqual([
      760, 1660,
    ]);
  });

  it("leaves bounds alone when the enemy spawns inside a spike span", () => {
    // x=1150 is within 1120..1216 — an authoring bug we don't paper over.
    expect(
      narrowBoundsForSpikes([groundSpikes], 1150, groundY, [760, 1660]),
    ).toEqual([760, 1660]);
  });
});

describe("reverseAtBounds", () => {
  it("keeps the current direction when nothing is triggered", () => {
    expect(reverseAtBounds(500, 10, 400, 600, false, false, 1)).toBe(1);
    expect(reverseAtBounds(500, 10, 400, 600, false, false, -1)).toBe(-1);
  });

  it("reverses to rightward at the left bound", () => {
    expect(reverseAtBounds(405, 10, 400, 600, false, false, -1)).toBe(1);
  });

  it("reverses to leftward at the right bound", () => {
    expect(reverseAtBounds(595, 10, 400, 600, false, false, 1)).toBe(-1);
  });

  it("reverses to rightward on a left wall bump, even mid-span", () => {
    expect(reverseAtBounds(500, 10, 400, 600, true, false, -1)).toBe(1);
  });

  it("reverses to leftward on a right wall bump, even mid-span", () => {
    expect(reverseAtBounds(500, 10, 400, 600, false, true, 1)).toBe(-1);
  });

  it("a wall bump wins over an opposite bound check on the same frame", () => {
    // At the left bound (would reverse to 1) but also blocked on the right —
    // the wall-bump checks run after the bound checks, so they have the final say.
    expect(reverseAtBounds(405, 10, 400, 600, false, true, -1)).toBe(-1);
  });
});
