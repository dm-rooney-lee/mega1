/**
 * Resolves the dev-only "boot straight into stage N" request (the `?stage=`
 * query param) into an index for the `levels` registry. Pure (no Phaser, no DOM)
 * so it can be unit-tested like the other level helpers.
 *
 * `raw` is 1-based, matching how stages are numbered in the UI ("STAGE 7/7"), so
 * `?stage=7` means the 7th stage, not index 7.
 */
export function resolveStartLevel(
  raw: string | undefined,
  levelCount: number,
): number | null {
  // Not requested at all — the caller shows the menu as usual.
  if (raw === undefined || raw.trim() === "") return null;

  const n = Number(raw);
  // Reject anything that isn't a whole stage number in range (e.g. "7.5", "abc",
  // "0", "99") — the caller reports it rather than silently starting elsewhere.
  if (!Number.isInteger(n) || n < 1 || n > levelCount) return null;

  return n - 1;
}

/**
 * Resolves the dev-only "start partway into the stage" request (the `?x=` query
 * param) into a world-pixel x coordinate, replacing the level's own spawn point.
 * Pure, like `resolveStartLevel`.
 *
 * Long stages put their interesting hazards far from spawn, so replaying the
 * run-up on every retry dominates the debugging loop; `?stage=7&x=3600` starts
 * you at the hazard instead. Out-of-world values are rejected rather than
 * clamped, so a typo can't silently drop the player somewhere unexpected.
 */
export function resolveSpawnX(
  raw: string | null | undefined,
  worldWidth: number,
): number | null {
  if (raw === null || raw === undefined || raw.trim() === "") return null;

  const x = Number(raw);
  if (!Number.isFinite(x) || x < 0 || x > worldWidth) return null;

  return x;
}
