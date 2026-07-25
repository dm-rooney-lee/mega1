import Phaser from "phaser";
import { CONVEYOR, DEPTH, TEX } from "../config";

/**
 * A-3 — a solid platform that pushes whatever is grounded on it sideways. The
 * push (belt speed × direction) is added to the rider's horizontal velocity by
 * the scene each frame, and only while grounded — in the air the belt does
 * nothing. Standing still means being carried toward the belt's end.
 */
export class Conveyor extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.StaticBody;

  /** Signed belt push in px/s (negative = left). */
  readonly push: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    direction: -1 | 1 = 1,
    beltSpeed: number = CONVEYOR.SPEED,
  ) {
    super(scene, x + width / 2, y + height / 2, TEX.CONVEYOR);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body
    this.setDepth(DEPTH.PLATFORM);

    this.push = beltSpeed * direction;
    this.setFlipX(direction < 0); // chevrons point the way it pushes
    this.setDisplaySize(width, height);
    this.body.setSize(width, height);
    this.body.updateFromGameObject();
  }

  /** Whether `player` is currently standing on top of this belt. */
  carries(player: Phaser.Physics.Arcade.Sprite): boolean {
    const pb = player.body as Phaser.Physics.Arcade.Body;
    const onTop = pb.bottom <= this.body.top + 8 && pb.bottom >= this.body.top - 8;
    const withinX = pb.right > this.body.left + 2 && pb.left < this.body.right - 2;
    return onTop && withinX && (pb.blocked.down || pb.touching.down);
  }
}
