import { describe, expect, it } from "vitest";
import type { PlatformDef } from "./level1";
import { patrolBoundsFor } from "./patrol";

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
