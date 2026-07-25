import Phaser from "phaser";
import { COLORS, DEPTH, GAME, TEX } from "../config";
import { levels, levelAt, hasLevel } from "../levels/index";
import type { LevelDef, PlatformDef, HazardDef } from "../levels/types";
import { patrolBoundsFor, narrowBoundsForSpikes } from "../levels/patrol";
import { Player } from "../objects/Player";
import { Enemy } from "../objects/Enemy";
import { Goal } from "../objects/Goal";
import { MovingPlatform } from "../objects/MovingPlatform";
import { Conveyor } from "../objects/Conveyor";
import { Spring } from "../objects/Spring";
import { CrumblingPlatform } from "../objects/CrumblingPlatform";
import { Pendulum } from "../objects/Pendulum";
import { PopupSpike } from "../objects/PopupSpike";
import { Thwomp } from "../objects/Thwomp";
import { Shooter } from "../objects/Shooter";
import { Turret } from "../objects/Turret";
import { Projectile } from "../objects/Projectile";
import { ProjectilePool } from "../objects/ProjectilePool";

/**
 * The playable level. Reads a LevelDef (selected by the `level` index the scene
 * is started with), builds the world, wires up every physics interaction, and
 * drives the win / lose / next-level transitions.
 */
export class GameScene extends Phaser.Scene {
  private level!: LevelDef;
  private levelIndex = 0;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Enemy[] = [];
  private ending = false;

  /** Scene time since create(); drives all deterministic (time-based) content. */
  private elapsedMs = 0;

  // Dynamic content that needs a per-frame update.
  private movingPlatforms: MovingPlatform[] = [];
  private conveyors: Conveyor[] = [];
  private springs: Spring[] = [];
  private crumbles: CrumblingPlatform[] = [];
  private pendulums: Pendulum[] = [];
  private popupSpikes: PopupSpike[] = [];
  private thwomps: Thwomp[] = [];
  private shooters: Shooter[] = [];
  private turrets: Turret[] = [];
  private pool!: ProjectilePool;

  constructor() {
    super("GameScene");
  }

  /** `level` is an index into the `levels` registry; defaults to the first. */
  init(data: { level?: number }): void {
    this.levelIndex = data.level ?? 0;
  }

  create(): void {
    this.level = levelAt(this.levelIndex);

    // Reset all per-run state (G6 — a restart always starts from a clean slate).
    this.ending = false;
    this.elapsedMs = 0;
    this.enemies = [];
    this.movingPlatforms = [];
    this.conveyors = [];
    this.pendulums = [];
    this.popupSpikes = [];
    this.thwomps = [];
    this.shooters = [];
    this.turrets = [];

    // World + camera bounds. Leave the bottom edge open so the player can fall
    // into pits (that's a death), while walls/ceiling still contain them.
    this.physics.world.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);

    this.drawBackground();
    this.buildPlatforms();
    const spikes = this.buildSpikes();
    this.buildEnemies();

    this.pool = new ProjectilePool(this);
    const popupGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.buildHazards(popupGroup);

    this.player = new Player(this, this.level.playerSpawn.x, this.level.playerSpawn.y);
    this.player.setDepth(DEPTH.PLAYER);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    const goal = new Goal(this, this.level.goal.x, this.level.goal.y);
    goal.setDepth(DEPTH.HAZARD);

    // --- Physics wiring ---
    // Solid terrain.
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.movingPlatforms);
    this.physics.add.collider(this.player, this.conveyors);
    this.physics.add.collider(this.player, this.shooters);
    this.physics.add.collider(this.player, this.springs, (_pl, spr) =>
      (spr as Spring).tryLaunch(this.player),
    );
    this.physics.add.collider(this.player, this.crumbles, (_pl, plat) => {
      const cp = plat as CrumblingPlatform;
      if (this.player.body.touching.down && this.player.body.bottom <= cp.body.top + 8) {
        cp.trigger();
      }
    });

    // Enemies.
    for (const enemy of this.enemies) {
      this.physics.add.collider(enemy, this.platforms);
      this.physics.add.overlap(this.player, enemy, () => this.handlePlayerEnemy(enemy));
    }

    // Instant-death hazards (the generalized spike rule).
    this.physics.add.overlap(this.player, spikes, () => this.handleDeath());
    this.physics.add.overlap(this.player, popupGroup, () => this.handleDeath());
    for (const p of this.pendulums) {
      this.physics.add.overlap(this.player, p.head, () => this.handleDeath());
    }
    for (const t of this.thwomps) {
      this.physics.add.overlap(this.player, t, () => {
        if (t.deadly) this.handleDeath();
      });
    }

    // Turrets: stomp the body, die to the projectiles.
    for (const turret of this.turrets) {
      this.physics.add.overlap(this.player, turret, () => this.handlePlayerTurret(turret));
    }

    // Projectiles: kill the player, get blocked by terrain (cover works).
    this.physics.add.overlap(this.player, this.pool.group, (_pl, proj) => {
      (proj as Projectile).deactivate();
      this.handleDeath();
    });
    this.physics.add.collider(this.pool.group, this.platforms, (proj) =>
      (proj as Projectile).deactivate(),
    );

    // Goal.
    this.physics.add.overlap(this.player, goal, () => this.handleWin());

    this.drawHud();
  }

  update(_time: number, delta: number): void {
    // Death/win arc keeps playing under physics, but the world freezes (G6).
    this.player.update(this.time.now);
    if (this.ending) return;

    this.elapsedMs += delta;

    for (const enemy of this.enemies) enemy.update();
    for (const p of this.pendulums) p.update(this.elapsedMs);
    for (const s of this.popupSpikes) s.update(this.elapsedMs);
    for (const mp of this.movingPlatforms) mp.update(this.elapsedMs, delta);
    for (const t of this.thwomps) t.update(delta, this.player);
    for (const sh of this.shooters) sh.update(delta);
    for (const tu of this.turrets) tu.update(delta, this.player);

    this.applyCarries(delta);
    this.applyConveyors();

    // Fell into a pit / off the bottom of the world.
    if (this.player.y > this.level.worldHeight + 80) this.handleDeath();
  }

  // --- World construction ---

  private buildPlatforms(): void {
    this.platforms = this.physics.add.staticGroup();
    this.springs = [];
    this.crumbles = [];

    for (const p of this.level.platforms) {
      switch (p.type ?? "static") {
        case "moving":
          this.movingPlatforms.push(this.makeMovingPlatform(p));
          break;
        case "conveyor":
          this.conveyors.push(
            new Conveyor(this, p.x, p.y, p.width, p.height, p.direction ?? 1, p.beltSpeed),
          );
          break;
        case "spring":
          this.springs.push(new Spring(this, p.x, p.y, p.width, p.height, p.power));
          break;
        case "fake":
          this.crumbles.push(
            new CrumblingPlatform(this, p.x, p.y, p.width, p.height, {
              collapseMs: p.collapseMs,
              respawn: p.respawn,
            }),
          );
          break;
        default:
          this.makeStaticPlatform(p);
      }
    }
  }

  private makeStaticPlatform(p: PlatformDef): void {
    const img = this.platforms.create(
      p.x + p.width / 2,
      p.y + p.height / 2,
      TEX.PLATFORM,
    ) as Phaser.Physics.Arcade.Sprite;
    img.setDisplaySize(p.width, p.height);
    img.setDepth(DEPTH.PLATFORM);
    img.refreshBody(); // resize the static body to match the display size
  }

  private makeMovingPlatform(p: PlatformDef): MovingPlatform {
    return new MovingPlatform(this, p.x, p.y, p.width, p.height, {
      axis: p.axis,
      range: p.range,
      speed: p.speed,
      phase: p.phase,
      waitMs: p.waitMs,
    });
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
        spike.setDepth(DEPTH.HAZARD);
        // Only the pointy upper portion should hurt.
        const body = spike.body as Phaser.Physics.Arcade.StaticBody;
        body.setSize(28, 18).setOffset(2, 14);
      }
    }
    return spikes;
  }

  private buildEnemies(): void {
    for (const e of this.level.enemies) {
      let bounds = patrolBoundsFor(this.level.platforms, e.x, e.y);
      // Thorns act as patrol boundaries too, so enemies turn around at them.
      bounds = narrowBoundsForSpikes(this.level.spikes, e.x, e.y, bounds);
      const enemy = new Enemy(this, e.x, e.y, bounds[0], bounds[1]);
      enemy.setDepth(DEPTH.ENEMY);
      this.enemies.push(enemy);
    }
  }

  private buildHazards(popupGroup: Phaser.Physics.Arcade.Group): void {
    for (const h of this.level.hazards ?? []) this.buildHazard(h, popupGroup);
  }

  private buildHazard(h: HazardDef, popupGroup: Phaser.Physics.Arcade.Group): void {
    switch (h.kind) {
      case "pendulum":
        this.pendulums.push(
          new Pendulum(this, h.x, h.y, {
            length: h.length,
            amplitudeDeg: h.amplitudeDeg,
            periodMs: h.periodMs,
            phase: h.phase,
          }),
        );
        break;
      case "popupSpike":
        this.popupSpikes.push(
          new PopupSpike(this, popupGroup, h.x, h.y, {
            tiles: h.tiles,
            telegraphMs: h.telegraphMs,
            activeMs: h.activeMs,
            hiddenMs: h.hiddenMs,
            phase: h.phase,
          }),
        );
        break;
      case "thwomp":
        this.thwomps.push(
          new Thwomp(this, h.x, h.y, h.width ?? 60, h.height ?? 60, {
            dropDistance: h.dropDistance,
            detectWidth: h.detectWidth,
            dropSpeed: h.dropSpeed,
            returnSpeed: h.returnSpeed,
            bottomWaitMs: h.bottomWaitMs,
          }),
        );
        break;
      case "arrowShooter":
        this.shooters.push(
          new Shooter(this, h.x, h.y, this.pool, {
            direction: h.direction,
            projectileSpeed: h.projectileSpeed,
            intervalMs: h.intervalMs,
          }),
        );
        break;
      case "turret":
        this.turrets.push(
          new Turret(this, h.x, h.y, this.pool, {
            aimMode: h.aimMode,
            direction: h.direction,
            projectileSpeed: h.projectileSpeed,
            intervalMs: h.intervalMs,
          }),
        );
        break;
    }
  }

  // --- Carry physics (moving platforms + conveyors) ---

  private applyCarries(delta: number): void {
    const dtSec = delta / 1000;
    for (const mp of this.movingPlatforms) {
      if (!this.isRiding(mp)) continue;
      // Horizontal: Arcade won't carry a rider sideways — do it ourselves.
      this.player.x += mp.carryDX(dtSec);
      // Vertical: glue the player to a descending platform so they don't float.
      // (Upward carry is handled by the collider's separation.)
      const dy = mp.carryDY(dtSec);
      if (dy > 0 && this.player.body.velocity.y >= -20) this.player.y += dy;
    }
  }

  private isRiding(mp: MovingPlatform): boolean {
    const pb = this.player.body;
    const mb = mp.body;
    const onTop = pb.bottom <= mb.top + 6 && pb.bottom >= mb.top - 10;
    const withinX = pb.right > mb.left + 2 && pb.left < mb.right - 2;
    return onTop && withinX && (pb.blocked.down || pb.touching.down);
  }

  private applyConveyors(): void {
    for (const c of this.conveyors) {
      if (c.carries(this.player)) this.player.body.velocity.x += c.push;
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

  private handlePlayerTurret(turret: Turret): void {
    if (this.ending || this.player.dead || turret.dead) return;

    const stomping =
      this.player.body.velocity.y > 0 &&
      this.player.body.bottom <= turret.body.top + 12;

    if (stomping) {
      turret.kill();
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

    const next = this.levelIndex + 1;
    this.time.delayedCall(500, () => {
      if (hasLevel(next)) {
        // Advance to the next stage.
        this.scene.start("GameScene", { level: next });
      } else {
        // Cleared the final stage.
        this.scene.start("WinScene");
      }
    });
  }

  private handleDeath(): void {
    if (this.ending) return;
    this.ending = true;
    this.player.die();
    this.cameras.main.stopFollow();
    this.cameras.main.shake(200, 0.01);
    // Retry should restart the stage the player died on.
    this.time.delayedCall(800, () =>
      this.scene.start("GameOverScene", { level: this.levelIndex }),
    );
  }

  // --- Presentation ---

  private drawBackground(): void {
    this.add
      .rectangle(0, 0, this.level.worldWidth, this.level.worldHeight, COLORS.BACKGROUND)
      .setOrigin(0, 0)
      .setDepth(DEPTH.BACKGROUND);
  }

  private drawHud(): void {
    const hint = this.add
      .text(
        16,
        14,
        "Arrows / A,D to move  •  Space / W / Up to jump  •  stomp enemies, reach the flag",
        { fontFamily: "monospace", fontSize: "15px", color: "#fff1e8" },
      )
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD);
    hint.setStroke("#1d2b53", 4);
    this.tweens.add({ targets: hint, alpha: 0, delay: 5000, duration: 1000 });

    // Stage indicator, top-right — always on, so progress is readable mid-play.
    const stage = this.add
      .text(GAME.WIDTH - 16, 14, `STAGE ${this.levelIndex + 1}/${levels.length}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#00e436",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.HUD);
    stage.setStroke("#1d2b53", 4);

    // Brief level-name banner.
    if (this.level.name) {
      const banner = this.add
        .text(this.scale.width / 2, 80, this.level.name, {
          fontFamily: "monospace",
          fontSize: "28px",
          color: "#ffec27",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH.HUD);
      banner.setStroke("#1d2b53", 5);
      this.tweens.add({ targets: banner, alpha: 0, delay: 1800, duration: 800 });
    }
  }
}
