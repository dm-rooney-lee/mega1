import type Phaser from "phaser";
import { playEnemyKill } from "../audio";

/** Only what this helper touches — every caller narrows `body` to non-null via its own `declare`. */
type Squashable = {
  body: Phaser.Physics.Arcade.Body;
  y: number;
  destroy(): void;
};

/**
 * Shared "squash and fade" death tween — stop the body, disable it, shrink and
 * fade the sprite, then destroy it. Used by every stomp-killable stages 9-10
 * enemy (HammerThrower, Charger, Flyer, Dropper) so the animation can't drift
 * between them the way it would if each copied its own tween block.
 */
export function squashAndDestroy(
  scene: Phaser.Scene,
  sprite: Squashable,
  opts: { knockback?: boolean } = {},
): void {
  playEnemyKill(scene);
  sprite.body.stop();
  sprite.body.enable = false;
  scene.tweens.add({
    targets: sprite,
    scaleY: 0.2,
    y: opts.knockback ? sprite.y + 10 : sprite.y,
    alpha: 0,
    duration: 160,
    onComplete: () => sprite.destroy(),
  });
}
