/** Pure proximity checks shared by Charger (detect-and-dash) and Dropper (detect-and-drop). */

/** Whether an offset (dx, dy) from a mob falls inside its rectangular detection box. */
export function withinRange(dx: number, dy: number, rangeX: number, rangeY: number): boolean {
  return Math.abs(dx) <= rangeX && Math.abs(dy) <= rangeY;
}

/**
 * Whether a point at horizontal offset `dx` is directly beneath a mount whose
 * bottom edge sits at `mountBottomY` — same idea as Thwomp's "underneath" check,
 * shared here so Dropper doesn't duplicate it.
 */
export function isBeneath(
  dx: number,
  pointY: number,
  mountBottomY: number,
  rangeX: number,
): boolean {
  return Math.abs(dx) <= rangeX && pointY > mountBottomY;
}
