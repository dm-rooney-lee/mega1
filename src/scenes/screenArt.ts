import { TEX } from "../config";

export type ScreenArt = { key: string; url: string };

/** The three screen pictures, and where they sit under `public/`. */
export const SCREEN_ART: readonly ScreenArt[] = [
  { key: TEX.UI_TITLE, url: "ui/title-scene.svg" },
  { key: TEX.UI_DEATH, url: "ui/death-scene.svg" },
  { key: TEX.UI_WIN, url: "ui/win-gopher.svg" },
];

/**
 * Whether a response body is really an SVG document.
 *
 * A successful response is not proof that the file exists. Asked for a missing
 * file under `public/`, both the dev server and `vite preview` answer with the
 * app's own HTML page and a 200 — measured, not assumed. Phaser's SVG loader
 * then pulls the `<svg>` element out of whatever it was handed without checking
 * it found one, and the resulting throw stops the load queue dead: no scene
 * ever reaches `create`, so the game is a blank page rather than a screen
 * missing its picture.
 */
export function looksLikeSvg(body: string): boolean {
  return /^\s*(?:<\?xml[^>]*\?>\s*)?<svg[\s>]/i.test(body);
}

/**
 * Narrows the artwork list to the entries that really are pictures.
 *
 * `fetchText` is injected so this stays testable without a network. Anything
 * that fails to fetch is dropped rather than thrown: one unreachable picture
 * must not cost the player the whole game.
 */
export async function pickUsableArt(
  entries: readonly ScreenArt[],
  fetchText: (url: string) => Promise<string>,
): Promise<ScreenArt[]> {
  const checked = await Promise.all(
    entries.map(async (entry) => {
      try {
        return looksLikeSvg(await fetchText(entry.url)) ? entry : null;
      } catch {
        return null;
      }
    }),
  );
  return checked.filter((entry): entry is ScreenArt => entry !== null);
}

/**
 * Decided once in `main.ts` before the game exists, read by `BootScene` when it
 * queues its loads. A module-level value rather than scene data because the
 * check has to finish before Phaser starts, and `BootScene` is the first thing
 * Phaser runs.
 */
let usable: readonly ScreenArt[] = [];

export function setUsableScreenArt(art: readonly ScreenArt[]): void {
  usable = art;
}

export function usableScreenArt(): readonly ScreenArt[] {
  return usable;
}
