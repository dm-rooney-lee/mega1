import Phaser from "phaser";
import { cameraZoom } from "../display";

/**
 * The title, death and win screens are all the same shape: a column of centred
 * monospace lines, authored in the same 540-tall logical space as the levels.
 *
 * The canvas buffer is sized in physical pixels (see display.ts), so those
 * logical units get scaled up here. That also rasterises the glyphs at the
 * screen's real density rather than magnifying a small texture, which is what
 * made this text mushy before.
 */
export function centredTextScreen(scene: Phaser.Scene) {
  const rows: { text: Phaser.GameObjects.Text; y: number; size: number }[] = [];

  const layout = (): void => {
    const scale = cameraZoom(scene.scale.height);
    const cx = scene.scale.width / 2;
    for (const row of rows) {
      row.text.setFontSize(Math.round(row.size * scale)).setPosition(cx, row.y * scale);
    }
  };

  return {
    /** `y` and `size` are logical units. Position is applied by `start`. */
    add(
      y: number,
      size: number,
      content: string,
      color: string,
      bold = false,
    ): Phaser.GameObjects.Text {
      const text = scene.add
        .text(0, 0, content, {
          fontFamily: "monospace",
          color,
          ...(bold ? { fontStyle: "bold" } : {}),
        })
        .setOrigin(0.5);
      rows.push({ text, y, size });
      return text;
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
