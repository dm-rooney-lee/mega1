import Phaser from "phaser";
import { cameraZoom, TEXTURE_SCALE } from "../display";
import { DEPTH, TEX } from "../config";

/**
 * The title, death and win screens are all the same shape: a stack of centred
 * rows — colour bands, pictures and text — authored in the same 540-tall
 * logical space as the levels.
 *
 * The canvas buffer is sized in physical pixels (see display.ts), so those
 * logical units get scaled up here. For text that also rasterises the glyphs at
 * the screen's real density rather than magnifying a small texture, which is
 * what made this text mushy before.
 *
 * Rows are drawn in the order they are added, so a screen adds its full-width
 * colour bands first, then its picture, then the text that sits on top of
 * both.
 */

/**
 * Pixel typeface for every screen, with the old font left behind it: if the
 * font file never arrives the screens still read, just in the previous face.
 * `main.ts` waits for it before the game starts.
 */
export const SCREEN_FONT = '"Press Start 2P", monospace';

type Row =
  | { kind: "text"; text: Phaser.GameObjects.Text; y: number; size: number; edge: number }
  | { kind: "image"; image: Phaser.GameObjects.Image; y: number; w: number; h: number }
  | { kind: "band"; rect: Phaser.GameObjects.Rectangle; yTop: number; yBottom: number };

export function centredScreen(scene: Phaser.Scene) {
  const rows: Row[] = [];

  const layout = (): void => {
    const scale = cameraZoom(scene.scale.height);
    const cx = scene.scale.width / 2;
    for (const row of rows) {
      if (row.kind === "text") {
        row.text.setFontSize(Math.round(row.size * scale)).setPosition(cx, row.y * scale);
        // The outline is a pixel width like the glyphs, so it has to grow with them.
        if (row.edge > 0) row.text.setStroke(row.text.style.stroke, row.edge * scale);
      } else if (row.kind === "image") {
        row.image.setDisplaySize(row.w * scale, row.h * scale).setPosition(cx, row.y * scale);
      } else {
        // Bands span the whole canvas, however wide the window happens to be.
        row.rect
          .setSize(scene.scale.width, (row.yBottom - row.yTop) * scale)
          .setPosition(cx, row.yTop * scale);
      }
    }
  };

  return {
    /** `y` and `size` are logical units. Position is applied by `start`. */
    add(y: number, size: number, content: string, color: string): Phaser.GameObjects.Text {
      const text = scene.add
        .text(0, 0, content, { fontFamily: SCREEN_FONT, color })
        .setOrigin(0.5);
      rows.push({ kind: "text", text, y, size, edge: 0 });
      return text;
    },

    /**
     * A headline with an outline around it — the mockup draws all three screen
     * titles that way, and against a busy picture the outline is what keeps the
     * letters readable. `edgeWidth` is a logical width, scaled like the glyphs.
     */
    addTitle(
      y: number,
      size: number,
      content: string,
      color: string,
      edgeColor: string,
      edgeWidth: number,
    ): Phaser.GameObjects.Text {
      const text = scene.add
        .text(0, 0, content, { fontFamily: SCREEN_FONT, color })
        .setOrigin(0.5);
      text.setStroke(edgeColor, edgeWidth);
      rows.push({ kind: "text", text, y, size, edge: edgeWidth });
      return text;
    },

    /**
     * A picture centred on the column. `w`/`h` are its logical size — the
     * texture is TEXTURE_SCALE times larger (see display.ts) and this shrinks it
     * back down.
     *
     * Returns null when the texture is missing, which is what happens if the
     * SVG failed to load. These screens still read without their picture, so a
     * missing one is skipped rather than drawn as Phaser's placeholder box.
     */
    addImage(y: number, w: number, h: number, key: string): Phaser.GameObjects.Image | null {
      if (!scene.textures.exists(key)) return null;
      const image = scene.add.image(0, 0, key).setOrigin(0.5);
      rows.push({ kind: "image", image, y, w, h });
      return image;
    },

    /**
     * A full-width horizontal band between two logical heights.
     *
     * `add.rectangle` wants a packed integer while the screen palette is CSS
     * strings (both the camera background and Text want those), so the string
     * is converted here rather than storing each colour twice.
     */
    addBand(yTop: number, yBottom: number, color: string): Phaser.GameObjects.Rectangle {
      const rect = scene.add
        .rectangle(0, 0, 1, 1, Phaser.Display.Color.HexStringToColor(color).color)
        .setOrigin(0.5, 0);
      rows.push({ kind: "band", rect, yTop, yBottom });
      return rect;
    },

    /** Lays the rows out and keeps them right as the window changes. */
    start(): void {
      layout();
      // The Scale Manager outlives the scene, so the listener has to be dropped.
      scene.scale.on(Phaser.Scale.Events.RESIZE, layout);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        scene.scale.off(Phaser.Scale.Events.RESIZE, layout);
      });
    },
  };
}

/**
 * Settings 톱니바퀴 버튼, 화면 우측 상단에 고정. `MenuScene`/`GameOverScene`/
 * `WinScene`이 공유한다 — 이 화면들은 카메라 배율이 1이라 `centredScreen`의
 * row들과 마찬가지로 논리 좌표를 `cameraZoom()`으로 직접 환산해야 한다
 * (`GameScene`은 카메라가 스크롤·줌되므로 `layoutHud()` 안에서 따로 배치한다).
 *
 * 누르면 이 화면을 멈추고 `SettingsScene`을 그 위에 띈다. 이 화면들은 화면
 * 전체에 `this.input.once("pointerdown", ...)`로 "아무 데나 클릭하면
 * 시작/재시도"를 걸어 두므로, 톱니바퀴 클릭이 그 리스너까지 함께 발동시키지
 * 않도록 `event.stopPropagation()`으로 전파를 끊는다.
 */
export function addSettingsGear(scene: Phaser.Scene): void {
  const gear = scene.add
    .image(0, 0, TEX.UI_GEAR)
    .setDepth(DEPTH.HUD)
    .setInteractive({ useHandCursor: true });

  const layout = (): void => {
    const scale = cameraZoom(scene.scale.height);
    gear.setScale(scale / TEXTURE_SCALE).setPosition(scene.scale.width - 28 * scale, 28 * scale);
  };
  layout();
  scene.scale.on(Phaser.Scale.Events.RESIZE, layout);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, layout);
  });

  gear.on(
    "pointerdown",
    (
      _pointer: Phaser.Input.Pointer,
      _localX: number,
      _localY: number,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      scene.scene.pause();
      scene.scene.run("SettingsScene", { returnKey: scene.scene.key });
    },
  );
}
