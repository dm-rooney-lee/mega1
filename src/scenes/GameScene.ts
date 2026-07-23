import Phaser from "phaser";
import { COLORS, TEX } from "../config";
import { level1 } from "../levels/level1";
import type { LevelDef } from "../levels/types";
import { patrolBoundsFor } from "../levels/patrol";
import { Player } from "../objects/Player";
import { Enemy } from "../objects/Enemy";
import { Goal } from "../objects/Goal";

/**
 * The playable level. Reads a LevelDef, builds the world (platforms / enemies /
 * spikes / goal), wires up all the physics interactions, and drives the
 * win / lose transitions.
 */
export class GameScene extends Phaser.Scene {
  private level!: LevelDef;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Enemy[];
  private ending = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.level = level1;
    this.ending = false;
    this.enemies = [];

    // World + camera bounds. Leave the bottom edge open so the player can fall
    // into pits (that's a death), while walls/ceiling still contain them.
    this.physics.world.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);

    this.buildPlatforms();
    const spikes = this.buildSpikes();
    this.buildEnemies();

    this.player = new Player(this, this.level.playerSpawn.x, this.level.playerSpawn.y);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    const goal = new Goal(this, this.level.goal.x, this.level.goal.y);

    // --- Physics wiring ---
    this.physics.add.collider(this.player, this.platforms);
    for (const enemy of this.enemies) {
      this.physics.add.collider(enemy, this.platforms);
      this.physics.add.overlap(this.player, enemy, () =>
        this.handlePlayerEnemy(enemy),
      );
    }
    this.physics.add.overlap(this.player, spikes, () => this.handleDeath());
    this.physics.add.overlap(this.player, goal, () => this.handleWin());

    this.drawHud();
  }

  update(time: number): void {
    if (this.ending && this.player.dead) {
      // Let the death arc play; nothing else to do.
    }
    this.player.update(time);
    for (const enemy of this.enemies) enemy.update();

    // Fell into a pit / off the bottom of the world.
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
      img.refreshBody(); // resize the static body to match the display size
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
        // Only the pointy upper portion should hurt.
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

  private drawHud(): void {
    const hint = this.add
      .text(
        16,
        14,
        "Arrows / A,D to move  •  Space / W / Up to jump  •  stomp enemies, reach the flag",
        {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#fff1e8",
        },
      )
      .setScrollFactor(0)
      .setDepth(1000);
    hint.setStroke("#1d2b53", 4);

    // Fade the hint out after a few seconds so it doesn't clutter play.
    this.tweens.add({
      targets: hint,
      alpha: 0,
      delay: 5000,
      duration: 1000,
    });

    // Faint background band so the level reads against the sky color.
    this.add
      .rectangle(0, 0, this.level.worldWidth, this.level.worldHeight, COLORS.BACKGROUND)
      .setOrigin(0, 0)
      .setDepth(-10);
  }
}
