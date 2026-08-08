import { describe, expect, it } from "vitest";
import {
  clampAbs,
  oscillateOffset,
  pendulumAngleRad,
  pendulumCrossedBottom,
  pendulumHead,
  popupSpikePhase,
  gearRotationRad,
  trapFloorPhase,
} from "./motion";

describe("pendulumAngleRad", () => {
  it("is zero at t=0 (hanging straight down) with no phase", () => {
    expect(pendulumAngleRad(0, 2000, 1)).toBeCloseTo(0);
  });

  it("reaches +amplitude at a quarter period", () => {
    expect(pendulumAngleRad(500, 2000, 1)).toBeCloseTo(1); // sin(pi/2) = 1
  });

  it("returns to zero at half period", () => {
    expect(pendulumAngleRad(1000, 2000, 1)).toBeCloseTo(0);
  });

  it("is deterministic across whole periods", () => {
    expect(pendulumAngleRad(3000, 2000, 0.7)).toBeCloseTo(
      pendulumAngleRad(1000, 2000, 0.7),
    );
  });

  it("guards a non-positive period", () => {
    expect(pendulumAngleRad(123, 0, 1)).toBe(0);
  });
});

describe("pendulumHead", () => {
  it("hangs straight below the pivot at angle 0", () => {
    expect(pendulumHead(100, 50, 150, 0)).toEqual({ x: 100, y: 200 });
  });

  it("swings out horizontally toward +x at +90deg", () => {
    const head = pendulumHead(100, 50, 150, Math.PI / 2);
    expect(head.x).toBeCloseTo(250);
    expect(head.y).toBeCloseTo(50);
  });
});

describe("pendulumCrossedBottom", () => {
  // period 2000ms -> bottom (angle=0) crossings at t=0, 1000, 2000, ... (every half period).
  it("[Happy] detects a crossing when the boundary falls inside the frame", () => {
    expect(pendulumCrossedBottom(900, 1100, 2000)).toBe(true);
  });

  it("[Happy] does not fire when both times land in the same half-period", () => {
    expect(pendulumCrossedBottom(100, 400, 2000)).toBe(false);
  });

  it("[Boundary] does not fire on the very first frame (prev and current both near t=0)", () => {
    expect(pendulumCrossedBottom(0, 16, 2000)).toBe(false);
  });

  it("[Boundary] shifts the crossing point with a phase offset", () => {
    // phase 0.25 of a 2000ms period shifts crossings to t=500, 1500, 2500...
    expect(pendulumCrossedBottom(400, 600, 2000, 0.25)).toBe(true);
    expect(pendulumCrossedBottom(900, 1100, 2000, 0.25)).toBe(false);
  });

  it("[Boundary] guards a non-positive period", () => {
    expect(pendulumCrossedBottom(900, 1100, 0)).toBe(false);
  });

  it("[Boundary] fires exactly once even when a large delta spans multiple half-periods (e.g. tab refocus)", () => {
    expect(pendulumCrossedBottom(100, 5000, 2000)).toBe(true);
  });
});

describe("oscillateOffset", () => {
  // range 100, speed 100 px/s -> travel = 1000ms each way, no dwell.
  it("starts at the origin", () => {
    expect(oscillateOffset(0, 100, 100)).toBeCloseTo(0);
  });

  it("reaches the far end after one travel leg", () => {
    expect(oscillateOffset(1000, 100, 100)).toBeCloseTo(100);
  });

  it("is back at the origin after a full cycle", () => {
    expect(oscillateOffset(2000, 100, 100)).toBeCloseTo(0);
  });

  it("dwells at the far end during waitMs", () => {
    // travel 1000ms, then dwell 500ms at the far end.
    expect(oscillateOffset(1200, 100, 100, 0, 500)).toBeCloseTo(100);
  });

  it("phase 0.5 starts at the far end (half a no-dwell cycle in)", () => {
    expect(oscillateOffset(0, 100, 100, 0.5)).toBeCloseTo(100);
  });

  it("returns 0 for degenerate inputs", () => {
    expect(oscillateOffset(500, 0, 100)).toBe(0);
    expect(oscillateOffset(500, 100, 0)).toBe(0);
  });
});

describe("popupSpikePhase", () => {
  // hidden 1000 -> telegraph 400 -> active 900  (cycle 2300)
  it("is hidden at the start of the cycle", () => {
    expect(popupSpikePhase(0, 400, 900, 1000)).toBe("hidden");
  });

  it("enters telegraph after the hidden window", () => {
    expect(popupSpikePhase(1100, 400, 900, 1000)).toBe("telegraph");
  });

  it("is active after the telegraph", () => {
    expect(popupSpikePhase(1600, 400, 900, 1000)).toBe("active");
  });

  it("wraps deterministically", () => {
    expect(popupSpikePhase(2300, 400, 900, 1000)).toBe("hidden");
  });

  it("phase offset shifts the cycle", () => {
    // Advancing phase by hidden/cycle lands us at the telegraph boundary.
    expect(popupSpikePhase(0, 400, 900, 1000, 1000 / 2300)).toBe("telegraph");
  });

  it("guards an empty cycle", () => {
    expect(popupSpikePhase(50, 0, 0, 0)).toBe("hidden");
  });
});

describe("gearRotationRad", () => {
  it("is zero at t=0 with no phase", () => {
    expect(gearRotationRad(0, 180)).toBe(0);
  });

  it("advances proportionally to degPerSec and elapsed time", () => {
    // 180 deg/s for 1000ms = 180 degrees = PI radians.
    expect(gearRotationRad(1000, 180)).toBeCloseTo(Math.PI);
  });

  it("applies a phase offset even at elapsedMs=0", () => {
    // phase 0.5 of a full turn = 180 degrees = PI radians.
    expect(gearRotationRad(0, 180, 0.5)).toBeCloseTo(Math.PI);
  });

  it("returns a constant (phase-only) angle when degPerSec is 0", () => {
    expect(gearRotationRad(5000, 0, 0.25)).toBeCloseTo(Math.PI / 2);
  });
});

describe("trapFloorPhase", () => {
  // telegraph 400, safe 600, open 1000 -> cycle = 600+400+600+400+1000 = 3000.
  it("is solid at the start of the cycle", () => {
    expect(trapFloorPhase(0, 400, 600, 1000)).toBe("solid");
  });

  it("enters the first telegraph after the first safe window", () => {
    expect(trapFloorPhase(700, 400, 600, 1000)).toBe("telegraph");
  });

  it("returns to solid between the two telegraphs", () => {
    expect(trapFloorPhase(1100, 400, 600, 1000)).toBe("solid");
  });

  it("enters the second telegraph after the second safe window", () => {
    expect(trapFloorPhase(1800, 400, 600, 1000)).toBe("telegraph");
  });

  it("opens after both telegraphs", () => {
    expect(trapFloorPhase(2500, 400, 600, 1000)).toBe("open");
  });

  it("wraps deterministically back to solid after a full cycle", () => {
    expect(trapFloorPhase(3000, 400, 600, 1000)).toBe("solid");
  });

  it("phase offset shifts the cycle", () => {
    // 0.8 of the 3000ms cycle = offset 2400, which falls in the "open" window (2000..3000).
    expect(trapFloorPhase(0, 400, 600, 1000, 0.8)).toBe("open");
  });

  it("guards a degenerate (all-zero) cycle by staying solid", () => {
    expect(trapFloorPhase(1234, 0, 0, 0)).toBe("solid");
  });
});

describe("clampAbs", () => {
  it("passes values already within range through unchanged", () => {
    expect(clampAbs(50, 100)).toBe(50);
    expect(clampAbs(-50, 100)).toBe(-50);
  });

  it("clamps a value above max down to max", () => {
    expect(clampAbs(150, 100)).toBe(100);
  });

  it("clamps a value below -max up to -max", () => {
    expect(clampAbs(-150, 100)).toBe(-100);
  });

  it("leaves a value exactly at the boundary unchanged", () => {
    expect(clampAbs(100, 100)).toBe(100);
    expect(clampAbs(-100, 100)).toBe(-100);
  });
});
