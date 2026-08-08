/**
 * "STAGE 7/8" — the progress line, shown both in the play HUD and on the death
 * screen. Pure (no Phaser, no DOM) so it can be unit-tested like the other
 * level helpers.
 *
 * `levelIndex` is 0-based (an index into the `levels` registry) while the label
 * counts from 1, matching how stages are numbered everywhere else in the UI.
 *
 * Out-of-range numbers are clamped into `1..levelCount` rather than rejected.
 * The death screen already falls back to stage 0 when it is handed nothing,
 * and a wrong-but-plausible number reads better there than a blank line.
 */
export function stageLabel(levelIndex: number, levelCount: number): string {
  const last = Math.max(1, levelCount);
  const shown = Math.min(Math.max(Math.floor(levelIndex) + 1, 1), last);
  return `STAGE ${shown}/${last}`;
}
