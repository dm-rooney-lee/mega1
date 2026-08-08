/**
 * Placement for things that stand on a surface.
 *
 * Textures are generated `TEXTURE_SCALE` times larger than their logical size and
 * the sprites are scaled back down (see `src/display.ts`), so a sprite's `height`
 * is in texture pixels while `displayHeight` is the logical height it occupies.
 * Mixing the two puts the object in the air by an amount that follows the
 * display's pixel ratio — the turret hung 45px up on a retina screen and 15px on
 * a plain one, from exactly that mistake.
 *
 * A level's `y` for these is the surface they stand on, so placement goes through
 * here rather than being re-derived at each call site.
 */

/** Only what this module touches, so it needs no Phaser import and takes both body kinds. */
type Standable = {
  displayHeight: number;
  setPosition(x: number, y: number): unknown;
};

/** Stands `sprite` so its bottom edge rests on `surfaceY` (origin-centred sprites). */
export function standOnSurface(sprite: Standable, x: number, surfaceY: number): void {
  sprite.setPosition(x, surfaceY - sprite.displayHeight / 2);
}
