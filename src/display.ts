/**
 * Display sizing — the one place that knows about physical pixels.
 *
 * Phaser 4 has no notion of device pixel ratio: the canvas backing buffer always
 * equals the game size, and `scale.zoom` only ever changes the CSS size. So the
 * buffer is driven from here, and the logical coordinate space the levels are
 * authored in is handed back to the scenes as a camera zoom:
 *
 *   logical (level data) --[camera zoom]--> buffer (physical px) --[1/dpr]--> CSS
 *
 * Keeping the logical space intact is the point: gravity, speeds, tile size and
 * every level coordinate stay exactly as authored.
 */

/**
 * Logical height every level is authored against. Never varies — all eight
 * stages are 540 tall and level7 hangs its thwomp ceiling at y=0, so showing
 * more than 540 would reveal the outside of the world.
 */
export const LOGICAL_HEIGHT = 540;

/**
 * The logical width the levels were originally designed at. The clamp below
 * brackets it: the view may breathe either way with the window's aspect, but
 * not far.
 */
export const DESIGN_WIDTH = 960;

/** How narrow the view may get before a jump stops being readable. */
export const LOGICAL_WIDTH_MIN = 854;

/**
 * How wide the view may get before a projectile's despawn lands on screen.
 * Projectiles die after `PROJECTILE.RANGE` (900) units, so level7's arrow
 * gauntlet — firing left from x=3070 — drops its arrows at x=2170. With the
 * player on the x=2700 cover pillar that point stays off screen up to about
 * 1100 units of width.
 */
export const LOGICAL_WIDTH_MAX = 1100;

/** Past this the bigger buffer costs more than the extra sharpness is worth. */
export const MAX_PIXEL_RATIO = 3;

/**
 * How many texture pixels to draw per logical pixel.
 *
 * The camera magnifies every sprite by its zoom — roughly the pixel ratio times
 * 1.7 at a typical window — so a texture drawn at logical size arrives on screen
 * blurred no matter how good the buffer is. Drawing it larger and shrinking the
 * sprite back down cancels that.
 *
 * This follows the pixel ratio rather than the window, so it never changes while
 * the page lives; regenerating every texture on a resize is not worth it. The
 * overshoot is deliberately mild — far above the zoom and the minified texture
 * starts to shimmer instead.
 */
export const textureScale = (pixelRatio: number): number =>
  clamp(Math.round(positive(pixelRatio, 1)) * 2, 2, 6);

export type Display = {
  /** Canvas backing buffer, in physical pixels. This is the Phaser game size. */
  bufferWidth: number;
  bufferHeight: number;
  /** Canvas CSS size. Phaser derives the same values from `zoom = 1 / pixelRatio`. */
  cssWidth: number;
  cssHeight: number;
  /** Device pixel ratio actually used, after the cap. */
  pixelRatio: number;
  /** Camera zoom that maps `LOGICAL_HEIGHT` onto `bufferHeight`. */
  zoom: number;
  /** Logical units visible horizontally, after clamping. */
  logicalWidth: number;
  /** Letterbox per side, in CSS pixels. Both are 0 unless the clamp bit. */
  barWidth: number;
  barHeight: number;
};

const clamp = (value: number, lo: number, hi: number): number =>
  Math.min(Math.max(value, lo), hi);

/** Guards against NaN / 0 / negative inputs producing nonsense canvas sizes. */
const positive = (value: number, fallback: number): number =>
  Number.isFinite(value) && value > 0 ? value : fallback;

/**
 * Camera zoom for a given buffer height. Scenes call this with `scale.height`
 * so there is a single definition of the logical-to-buffer mapping.
 */
export const cameraZoom = (bufferHeight: number): number =>
  positive(bufferHeight, LOGICAL_HEIGHT) / LOGICAL_HEIGHT;

/**
 * Resolved once at load — a display's pixel ratio does not change while the page
 * lives, and both the texture generation and every sprite that shrinks back down
 * have to agree on one number.
 */
export const TEXTURE_SCALE = textureScale(
  typeof window === "undefined" ? 1 : window.devicePixelRatio,
);

/** Just enough of a camera to shake it, so this module stays Phaser-free. */
type ShakeableCamera = {
  zoom: number;
  shake(duration: number, intensity: number): unknown;
};

/**
 * Shakes the camera, with `intensity` read as a fraction of the visible area.
 *
 * Phaser scales the shake offset by the camera's pixel width *and* its zoom. Both
 * grew when the buffer moved to physical pixels, so passing a raw intensity now
 * throws the screen `zoom` times further than the gameplay asked for — a crusher
 * landing went from an 18px nudge to a 60px lurch. Dividing the zoom back out
 * restores the authored amount at any window size.
 */
export function shakeCamera(
  camera: ShakeableCamera,
  duration: number,
  intensity: number,
): void {
  camera.shake(duration, intensity / positive(camera.zoom, 1));
}

/**
 * Works out every size the renderer needs from the window and its pixel ratio.
 *
 * The logical width follows the window's aspect ratio so the canvas fills the
 * window with no letterbox. When the clamp bites — very wide or very tall
 * windows — the canvas keeps its clamped aspect and thin bars appear instead.
 */
export function computeDisplay(
  windowWidth: number,
  windowHeight: number,
  pixelRatio: number,
): Display {
  const winW = positive(windowWidth, 1);
  const winH = positive(windowHeight, 1);
  const dpr = clamp(positive(pixelRatio, 1), 1, MAX_PIXEL_RATIO);

  const logicalWidth = clamp(
    (LOGICAL_HEIGHT * winW) / winH,
    LOGICAL_WIDTH_MIN,
    LOGICAL_WIDTH_MAX,
  );

  // CSS pixels per logical unit. Both ratios are equal whenever the clamp did
  // not bite, which is exactly what makes the canvas fill the window.
  const scale = Math.min(winW / logicalWidth, winH / LOGICAL_HEIGHT);

  const bufferWidth = Math.round(logicalWidth * scale * dpr);
  const bufferHeight = Math.round(LOGICAL_HEIGHT * scale * dpr);

  // Derive CSS from the rounded buffer so the two never disagree by a fraction
  // of a pixel — a mismatch there is what reintroduces blurry scaling.
  const cssWidth = bufferWidth / dpr;
  const cssHeight = bufferHeight / dpr;

  return {
    bufferWidth,
    bufferHeight,
    cssWidth,
    cssHeight,
    pixelRatio: dpr,
    zoom: cameraZoom(bufferHeight),
    logicalWidth,
    barWidth: Math.max(0, (winW - cssWidth) / 2),
    barHeight: Math.max(0, (winH - cssHeight) / 2),
  };
}
