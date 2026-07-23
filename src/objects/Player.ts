import Phaser from "phaser";
import { COLORS, PLAYER, SHIELD, TEX } from "../config";
import { absorbHit as absorbShieldHit } from "./shield";

type Keys = {
  left: Phaser.Input.Keyboard.Key[];
  right: Phaser.Input.Keyboard.Key[];
  jump: Phaser.Input.Keyboard.Key[];
};

/**
 * 플레이어. 이동/점프 + game feel(coyote time, jump buffer, 가변 점프 높이)에
 * 더해 방패 상태(대포알을 자동으로 막는 충전)를 관리한다.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private keys: Keys;
  private lastGroundedAt = 0;
  private jumpPressedAt = -Infinity;
  private jumpHeld = false;
  private isDead = false;
  private shieldChargesValue = 0;
  private shieldRing?: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.PLAYER);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 0.5);
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

  update(time: number): void {
    // 방패 링은 죽었든 살았든 플레이어를 따라다닌다.
    if (this.shieldRing) this.shieldRing.setPosition(this.x, this.y);
    if (this.isDead) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) this.lastGroundedAt = time;

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

    const jumpDown = this.anyDown(this.keys.jump);
    if (jumpDown && !this.jumpHeld) {
      this.jumpPressedAt = time;
    }

    const withinCoyote = time - this.lastGroundedAt <= PLAYER.COYOTE_MS;
    const bufferedJump = time - this.jumpPressedAt <= PLAYER.JUMP_BUFFER_MS;
    if (bufferedJump && withinCoyote) {
      this.jump();
      this.jumpPressedAt = -Infinity;
      this.lastGroundedAt = -Infinity;
    }

    if (!jumpDown && this.jumpHeld && this.body.velocity.y < 0) {
      this.setVelocityY(this.body.velocity.y * PLAYER.JUMP_CUT_MULTIPLIER);
    }
    this.jumpHeld = jumpDown;
  }

  private jump(): void {
    this.setVelocityY(PLAYER.JUMP_VELOCITY);
  }

  bounce(): void {
    this.setVelocityY(PLAYER.STOMP_BOUNCE);
  }

  get dead(): boolean {
    return this.isDead;
  }

  get shieldCharges(): number {
    return this.shieldChargesValue;
  }

  /** 방패 획득: 충전을 최대치로 채우고 아우라 링을 표시. */
  giveShield(): void {
    this.shieldChargesValue = SHIELD.MAX_CHARGES;
    if (!this.shieldRing) {
      this.shieldRing = this.scene.add
        .circle(this.x, this.y, 26)
        .setStrokeStyle(3, COLORS.SHIELD, 0.9)
        .setDepth(this.depth - 1);
    }
  }

  /** 대포알 1발 흡수. 막았으면 true 반환. 충전 0이 되면 링 제거. */
  absorbHit(): boolean {
    const result = absorbShieldHit(this.shieldChargesValue);
    this.shieldChargesValue = result.charges;
    if (this.shieldChargesValue === 0 && this.shieldRing) {
      this.shieldRing.destroy();
      this.shieldRing = undefined;
    }
    return result.blocked;
  }

  die(): void {
    if (this.isDead) return;
    this.isDead = true;
    if (this.shieldRing) {
      this.shieldRing.destroy();
      this.shieldRing = undefined;
    }
    this.setTint(0xff004d);
    this.body.setVelocity(0, -300);
    this.body.checkCollision.none = true;
  }
}
