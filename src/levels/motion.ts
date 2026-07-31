/**
 * Deterministic motion + state helpers for the time-based content (pendulums,
 * moving platforms, pop-up spikes). Pure functions of elapsed time — no Phaser,
 * no mutable state — so trajectories are reproducible and unit-testable, and a
 * scene restart at t=0 always yields the same starting configuration (G6/G7).
 */

const TAU = Math.PI * 2;

/**
 * Angle of a pendulum from vertical (radians), swinging as a sine wave. At the
 * extremes it slows to a stop (the natural "pass window"); it's fastest through
 * the middle.
 */
export function pendulumAngleRad(
  elapsedMs: number,
  periodMs: number,
  amplitudeRad: number,
  phase01 = 0,
): number {
  if (periodMs <= 0) return 0;
  return amplitudeRad * Math.sin(TAU * (elapsedMs / periodMs + phase01));
}

/**
 * World position of the pendulum head given the pivot, chain length, and current
 * angle from vertical. The chain hangs down (+y) and swings along x.
 */
export function pendulumHead(
  pivotX: number,
  pivotY: number,
  length: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: pivotX + length * Math.sin(angleRad),
    y: pivotY + length * Math.cos(angleRad),
  };
}

/**
 * Offset (0..range) of a moving platform along its path — a triangle wave that
 * dwells `waitMs` at each endpoint. `phase01` shifts the start along the full
 * cycle. Returns 0 for degenerate inputs so a mis-authored platform just sits still.
 */
export function oscillateOffset(
  elapsedMs: number,
  range: number,
  speed: number,
  phase01 = 0,
  waitMs = 0,
): number {
  if (range <= 0 || speed <= 0) return 0;

  const travelMs = (range / speed) * 1000;
  const cycleMs = 2 * travelMs + 2 * waitMs;
  const t = mod(elapsedMs + phase01 * cycleMs, cycleMs);

  if (t < travelMs) {
    // origin -> far end
    return (t / travelMs) * range;
  }
  if (t < travelMs + waitMs) {
    return range; // dwell at far end
  }
  if (t < 2 * travelMs + waitMs) {
    // far end -> origin
    return range - ((t - travelMs - waitMs) / travelMs) * range;
  }
  return 0; // dwell at origin
}

/**
 * Rotation angle (radians) for a spinning gear hazard. Purely a visual effect —
 * the gear's hitbox is circular, so rotating it never changes the hit shape.
 * Pure linear function of elapsed time, mirroring how `pendulumAngleRad` derives
 * its motion from `elapsedMs` alone (deterministic, restart-safe).
 */
export function gearRotationRad(
  elapsedMs: number,
  degPerSec: number,
  phase01 = 0,
): number {
  const deg = degPerSec * (elapsedMs / 1000) + phase01 * 360;
  return (deg * Math.PI) / 180;
}

export type PopupSpikePhase = "hidden" | "telegraph" | "active";

/**
 * Which phase a pop-up spike is in at a given time. The cycle runs
 * hidden → telegraph → active → (repeat); only "active" is deadly, and the
 * telegraph guarantees a fair warning before that.
 */
export function popupSpikePhase(
  elapsedMs: number,
  telegraphMs: number,
  activeMs: number,
  hiddenMs: number,
  phase01 = 0,
): PopupSpikePhase {
  const cycleMs = telegraphMs + activeMs + hiddenMs;
  if (cycleMs <= 0) return "hidden";
  const t = mod(elapsedMs + phase01 * cycleMs, cycleMs);
  if (t < hiddenMs) return "hidden";
  if (t < hiddenMs + telegraphMs) return "telegraph";
  return "active";
}

/** Positive modulo (JS `%` keeps the sign of the dividend). */
function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}
