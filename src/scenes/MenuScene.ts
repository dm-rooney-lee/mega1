import Phaser from "phaser";
import { GAME } from "../config";

/** Title screen. Press any key (or click/tap) to start the level. */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    const cx = GAME.WIDTH / 2;

    this.add
      .text(cx, 180, "PLATFORMER POC", {
        fontFamily: "monospace",
        fontSize: "56px",
        color: "#29adff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 250, "a tiny Phaser 4 platformer", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#fff1e8",
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(cx, 360, "press any key to start", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#00e436",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const start = () => this.scene.start("GameScene");
    this.input.keyboard!.once("keydown", start);
    this.input.once("pointerdown", start);
  }
}
