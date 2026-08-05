/**
 * Hitbox sizing for sprites drawn from oversized textures.
 *
 * Textures are generated `TEXTURE_SCALE` times larger than their logical size and
 * the sprites are scaled back down (see `src/display.ts`). Arcade sizes a *dynamic*
 * body in the texture's own pixels — it multiplies whatever you pass by the
 * sprite's scale — so a raw logical number would come out that much too small.
 * Dividing the scale out first lands the body exactly where the gameplay meant it.
 *
 * Static bodies take absolute sizes and need none of this.
 */

/**
 * Only the parts each helper touches, so this module needs no Phaser import and
 * accepts both body kinds. `body` is nullable to match Phaser's own typing; every
 * caller has already enabled physics, so the assertions below are safe.
 */
type Scaled<TBody> = {
  scaleX: number;
  scaleY: number;
  body: TBody | null;
};

type SizedBody = { setSize(width: number, height: number, center?: boolean): unknown };
type CircleBody = { setCircle(radius: number, offsetX?: number, offsetY?: number): unknown };
type OffsetBody = { setOffset(x: number, y: number): unknown };

/** Guards a zero or missing scale so the division cannot produce Infinity. */
const scaleOf = (value: number): number =>
  Number.isFinite(value) && value !== 0 ? value : 1;

/** Sizes a dynamic body in logical units. */
export function setLogicalBodySize(
  sprite: Scaled<SizedBody>,
  width: number,
  height: number,
): void {
  sprite.body!.setSize(width / scaleOf(sprite.scaleX), height / scaleOf(sprite.scaleY));
}

/** Sizes a dynamic circular body in logical units. */
export function setLogicalBodyCircle(
  sprite: Scaled<CircleBody>,
  radius: number,
  offsetX: number,
  offsetY: number,
): void {
  sprite.body!.setCircle(
    radius / scaleOf(sprite.scaleX),
    offsetX / scaleOf(sprite.scaleX),
    offsetY / scaleOf(sprite.scaleY),
  );
}

/** Offsets a dynamic body in logical units. */
export function setLogicalBodyOffset(
  sprite: Scaled<OffsetBody>,
  x: number,
  y: number,
): void {
  sprite.body!.setOffset(x / scaleOf(sprite.scaleX), y / scaleOf(sprite.scaleY));
}
