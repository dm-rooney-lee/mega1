import Phaser from "phaser";
import { CANNON, COLORS, TEX } from "../config";
import { level2 } from "../levels/level2";
import type { LevelDef } from "../levels/types";
import { patrolBoundsFor } from "../levels/patrol";
import { isOffWorld } from "../objects/ballistics";
import { Player } from "../objects/Player";
import { Enemy } from "../objects/Enemy";
import { Goal } from "../objects/Goal";
import { Cannon } from "../objects/Cannon";
import { ShieldItem } from "../objects/ShieldItem";

/**
 * 플레이 씬. LevelDef를 읽어 월드(발판/적/가시/대포/방패/깃발)를 만들고
 * 물리 상호작용을 배선하며 승/패 전환을 처리한다.
 */
export class GameScene extends Phaser.Scene {
  private level!: LevelDef;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Enemy[];
  private cannons!: Cannon[];
  private cannonballs!: Phaser.Physics.Arcade.Group;
  private shieldText!: Phaser.GameObjects.Text;
  private ending = false;
  private hitCooldownUntil = 0;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.level = level2;
    this.ending = false;
    this.enemies = [];
    this.cannons = [];
    this.hitCooldownUntil = 0;

    this.physics.world.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);

    this.buildPlatforms();
    const spikes = this.buildSpikes();
    this.buildEnemies();

    this.player = new Player(this, this.level.playerSpawn.x, this.level.playerSpawn.y);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    const goal = new Goal(this, this.level.goal.x, this.level.goal.y);

    this.cannonballs = this.physics.add.group({ allowGravity: false });
    this.buildCannons();
    const shieldItems = this.buildShields();

    // --- Physics wiring ---
    this.physics.add.collider(this.player, this.platforms);
    for (const enemy of this.enemies) {
      this.physics.add.collider(enemy, this.platforms);
      this.physics.add.overlap(this.player, enemy, () => this.handlePlayerEnemy(enemy));
    }
    this.physics.add.overlap(this.player, spikes, () => this.handleDeath());
    this.physics.add.overlap(this.player, goal, () => this.handleWin());

    // 대포알은 발판에 닿으면 소멸. 대포 '본체'는 플레이어와 배선하지 않아 무해.
    this.physics.add.collider(this.cannonballs, this.platforms, (ball) => {
      (ball as Phaser.Physics.Arcade.Sprite).destroy();
    });
    this.physics.add.overlap(this.player, this.cannonballs, (_p, ball) => {
      this.handleCannonballHit(ball as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.overlap(this.player, shieldItems, (_p, item) => {
      (item as ShieldItem).collect(this.player);
    });

    this.drawHud();
  }

  update(time: number): void {
    this.player.update(time);
    for (const enemy of this.enemies) enemy.update();
    for (const cannon of this.cannons) cannon.update(time);

    // 월드를 벗어난 대포알 소멸(객체 누수 방지).
    // destroy()가 그룹 배열을 변형하므로 복사본을 순회한다.
    for (const ball of [...this.cannonballs.getChildren()]) {
      const b = ball as Phaser.Physics.Arcade.Sprite;
      if (isOffWorld(b.x, this.level.worldWidth)) b.destroy();
    }

    this.shieldText.setText(this.shieldLabel());

    if (!this.ending && this.player.y > this.level.worldHeight + 80) {
      this.handleDeath();
    }
  }

  // --- World construction ---

  private buildPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    for (const p of this.level.platforms) {
      const img = this.platforms.create(
        p.x + p.width / 2,
        p.y + p.height / 2,
        TEX.PLATFORM,
      ) as Phaser.Physics.Arcade.Sprite;
      img.setDisplaySize(p.width, p.height);
      img.refreshBody();
    }
  }

  private buildSpikes(): Phaser.Physics.Arcade.StaticGroup {
    const spikes = this.physics.add.staticGroup();
    for (const s of this.level.spikes) {
      for (let i = 0; i < s.tiles; i++) {
        const spike = spikes.create(
          s.x + i * 32 + 16,
          s.y + 16,
          TEX.SPIKE,
        ) as Phaser.Physics.Arcade.Sprite;
        const body = spike.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(28, 18).setOffset(2, 14);
      }
    }
    return spikes;
  }

  private buildEnemies(): void {
    for (const e of this.level.enemies) {
      const [left, right] = patrolBoundsFor(this.level.platforms, e.x, e.y);
      this.enemies.push(new Enemy(this, e.x, e.y, left, right));
    }
  }

  private buildCannons(): void {
    for (const def of this.level.cannons ?? []) {
      this.cannons.push(new Cannon(this, def, this.cannonballs));
    }
  }

  private buildShields(): Phaser.Physics.Arcade.Group {
    const shields = this.physics.add.group({ allowGravity: false, immovable: true });
    for (const s of this.level.shields ?? []) {
      shields.add(new ShieldItem(this, s.x, s.y));
    }
    return shields;
  }

  // --- Interactions / outcomes ---

  private handlePlayerEnemy(enemy: Enemy): void {
    if (this.ending || this.player.dead || enemy.dead) return;

    const stomping =
      this.player.body.velocity.y > 0 &&
      this.player.body.bottom <= enemy.body.top + 12;

    if (stomping) {
      enemy.squash();
      this.player.bounce();
    } else {
      this.handleDeath();
    }
  }

  /** 대포알 피격: 방패 있으면 흡수(충전 1), 없으면 사망. 프레임당 1회로 제한. */
  private handleCannonballHit(ball: Phaser.Physics.Arcade.Sprite): void {
    if (this.ending || this.player.dead || !ball.active) return;
    ball.destroy();
    if (this.time.now < this.hitCooldownUntil) return;
    this.hitCooldownUntil = this.time.now + CANNON.HIT_COOLDOWN_MS;
    if (this.player.shieldCharges > 0) {
      this.player.absorbHit();
      this.cameras.main.flash(120, 41, 173, 255);
    } else {
      this.handleDeath();
    }
  }

  private handleWin(): void {
    if (this.ending) return;
    this.ending = true;
    this.player.body.stop();
    this.cameras.main.flash(200, 255, 255, 255);
    this.time.delayedCall(500, () => this.scene.start("WinScene"));
  }

  private handleDeath(): void {
    if (this.ending) return;
    this.ending = true;
    this.player.die();
    this.cameras.main.stopFollow();
    this.cameras.main.shake(200, 0.01);
    this.time.delayedCall(800, () => this.scene.start("GameOverScene"));
  }

  private shieldLabel(): string {
    const n = this.player.shieldCharges;
    return n > 0 ? `Shield: ${"●".repeat(n)}` : "Shield: --";
  }

  private drawHud(): void {
    const hint = this.add
      .text(
        16,
        14,
        "Arrows / A,D move  •  Space / W / Up jump  •  방패로 대포알을 막고 깃발에 도달",
        {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#fff1e8",
        },
      )
      .setScrollFactor(0)
      .setDepth(1000);
    hint.setStroke("#1d2b53", 4);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 5000,
      duration: 1000,
    });

    this.shieldText = this.add
      .text(16, 40, this.shieldLabel(), {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#29adff",
      })
      .setScrollFactor(0)
      .setDepth(1000);
    this.shieldText.setStroke("#1d2b53", 4);

    this.add
      .rectangle(0, 0, this.level.worldWidth, this.level.worldHeight, COLORS.BACKGROUND)
      .setOrigin(0, 0)
      .setDepth(-10);
  }
}
