import type Phaser from "phaser";
import type { Player } from "./Player";

/**
 * Whether `player` is landing on `target` from above — the same tolerance
 * Enemy/Turret's stomp checks use, shared here so the four stages 9-10 enemies
 * (HammerThrower, Flyer, Charger, Dropper) don't each repeat it.
 */
export function isStompHit(
  player: Player,
  target: { body: Phaser.Physics.Arcade.Body },
): boolean {
  return player.body.velocity.y > 0 && player.body.bottom <= target.body.top + 12;
}
