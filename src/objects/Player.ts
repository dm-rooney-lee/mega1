import Phaser from "phaser";
import { COLORS, PLAYER, SHIELD, TEX } from "../config";
import { absorbHit as absorbShieldHit } from "./shield";

type Keys = {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
};

/**
 * The player character. Encapsulates movement, jumping, and the little bits of
 * "game feel" that separate a stiff prototype from something that plays well:
 *   - coyote time: a short grace period to still jump just after walking off a ledge
 *   - jump buffering: a jump pressed slightly before landing still fires on touchdown
 *   - variable jump height: releasing early cuts the jump short (tap = hop, hold = full)
 * Also tracks shield state (absorbing charges that block a cannonball hit).
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private keys: Keys;
  private lastGroundedAt = 0;
  private jumpPressedAt = -Infinity;
  private jumpHeld = false;
  private isDead = false;
  /**
   * True while rising from a spring launch. Suppresses the variable-jump-cut so a
   * bounce isn't halved the instant the (unheld) jump button check runs — the
   * required "spring is an exception to jump-cut" rule.
   */
  private springLaunched = false;
  private shieldChargesValue = 0;
  private shieldRing?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.PLAYER);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);
    // Slightly smaller hitbox than the sprite feels fairer on tight jumps.
    this.body.setSize(24, 38);

    const kb = scene.input.keyboard!;
    this.keys = {
      left: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      ],
      right: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      ],
      jump: [
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      ],
    };
  }

  private anyDown(list: Phaser.Input.Keyboard.Key[]): boolean {
    return list.some((k) => k.isDown);
  }

  /** Call from GameScene.update(). `time` is the scene time in ms. */
  update(time: number): void {
    // The shield ring follows the player whether alive or dead.
    if (this.shieldRing) this.shieldRing.setPosition(this.x, this.y);
    if (this.isDead) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) this.lastGroundedAt = time;

    // A spring launch ends once we stop rising (or land again).
    if (this.springLaunched && (this.body.velocity.y >= 0 || onGround)) {
      this.springLaunched = false;
    }

    // Horizontal movement.
    const left = this.anyDown(this.keys.left);
    const right = this.anyDown(this.keys.right);
    if (left && !right) {
      this.setVelocityX(-PLAYER.MOVE_SPEED);
      this.setFlipX(true);
    } else if (right && !left) {
      this.setVelocityX(PLAYER.MOVE_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Track jump press edge for buffering.
    const jumpDown = this.anyDown(this.keys.jump);
    if (jumpDown && !this.jumpHeld) {
      this.jumpPressedAt = time;
    }

    const withinCoyote = time - this.lastGroundedAt <= PLAYER.COYOTE_MS;
    const bufferedJump = time - this.jumpPressedAt <= PLAYER.JUMP_BUFFER_MS;
    if (bufferedJump && withinCoyote) {
      this.jump();
      // Consume both so we don't double-fire.
      this.jumpPressedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
    }

    // Variable jump height: cut upward velocity when jump released mid-rise.
    // A spring launch is exempt (otherwise an unheld button halves it instantly).
    if (
      !jumpDown &&
      this.jumpHeld &&
      this.body.velocity.y < 0 &&
      !this.springLaunched
    ) {
      this.setVelocityY(this.body.velocity.y * PLAYER.JUMP_CUT_MULTIPLIER);
    }
    this.jumpHeld = jumpDown;
  }

  private jump(): void {
    this.setVelocityY(PLAYER.JUMP_VELOCITY);
  }

  /** Bounce after stomping an enemy. */
  bounce(): void {
    this.setVelocityY(PLAYER.STOMP_BOUNCE);
  }

  /**
   * Launched by a jump pad. Applies a strong upward velocity that ignores the
   * jump-cut (see `springLaunched`), so the full bounce lands even with no button held.
   */
  launch(power: number): void {
    if (this.isDead) return;
    this.setVelocityY(power);
    this.springLaunched = true;
  }

  get dead(): boolean {
    return this.isDead;
  }

  get shieldCharges(): number {
    return this.shieldChargesValue;
  }

  /** Grants a full shield (charges reset to max) and shows the aura ring. */
  giveShield(): void {
    this.shieldChargesValue = SHIELD.MAX_CHARGES;
    if (!this.shieldRing) {
      this.shieldRing = this.scene.add
        .circle(this.x, this.y, 26)
        .setStrokeStyle(3, COLORS.SHIELD, 0.9)
        .setDepth(this.depth - 1);
    }
  }

  /** Absorbs one cannonball hit. Returns whether it was blocked; removes the ring at 0 charges. */
  absorbHit(): boolean {
    const result = absorbShieldHit(this.shieldChargesValue);
    this.shieldChargesValue = result.charges;
    if (this.shieldChargesValue === 0 && this.shieldRing) {
      this.shieldRing.destroy();
      this.shieldRing = undefined;
    }
    return result.blocked;
  }

  /** Play a short death reaction and disable control. */
  die(): void {
    if (this.isDead) return;
    this.isDead = true;
    if (this.shieldRing) {
      this.shieldRing.destroy();
      this.shieldRing = undefined;
    }
    this.setTint(0xff004d);
    this.body.setVelocity(0, -300);
    this.body.checkCollision.none = true; // fall through the world
  }
}
