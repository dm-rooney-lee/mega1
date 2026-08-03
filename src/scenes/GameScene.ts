import Phaser from "phaser";
import { CANNON, COLORS, DEPTH, TEX } from "../config";
import { cameraZoom } from "../display";
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
import { TrapFloor } from "../objects/TrapFloor";
import { Pendulum } from "../objects/Pendulum";
import { PopupSpike } from "../objects/PopupSpike";
import { Thwomp } from "../objects/Thwomp";
import { Shooter } from "../objects/Shooter";
import { Turret } from "../objects/Turret";
import { Cannon } from "../objects/Cannon";
import { Gear } from "../objects/Gear";
import { ShieldItem } from "../objects/ShieldItem";
import { isOffWorld } from "../objects/ballistics";
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
  /** Dev-only spawn-x override (see `init`); undefined = use the level's own. */
  private spawnX?: number;
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
  private trapFloors: TrapFloor[] = [];
  private pendulums: Pendulum[] = [];
  private popupSpikes: PopupSpike[] = [];
  private thwomps: Thwomp[] = [];
  private shooters: Shooter[] = [];
  private turrets: Turret[] = [];
  private cannons: Cannon[] = [];
  private gears: Gear[] = [];
  private cannonballs!: Phaser.Physics.Arcade.Group;
  private pool!: ProjectilePool;

  // HUD. Held so `layoutHud` can re-anchor them to the camera's view; see there
  // for why they are not simply pinned with a zero scroll factor.
  private hudHint!: Phaser.GameObjects.Text;
  private shieldText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private levelBanner?: Phaser.GameObjects.Text;

  /** ms until the player can take another cannonball hit (debounces one volley). */
  private hitCooldownUntil = 0;

  constructor() {
    super("GameScene");
  }

  /**
   * `level` is an index into the `levels` registry; defaults to the first.
   * `spawnX` overrides the level's own spawn x — only ever set by the dev-only
   * `?stage=N&x=…` route in `MenuScene`, and carried through death/retry.
   */
  init(data: { level?: number; spawnX?: number }): void {
    this.levelIndex = data.level ?? 0;
    this.spawnX = data.spawnX;
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
    this.cannons = [];
    this.gears = [];
    this.hitCooldownUntil = 0;

    // World + camera bounds. Leave the bottom edge open so the player can fall
    // into pits (that's a death), while walls/ceiling still contain them.
    this.physics.world.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.cameras.main.setBounds(0, 0, this.level.worldWidth, this.level.worldHeight);
    // Recover the logical coordinate space: the canvas buffer is sized in physical
    // pixels, so the camera zooms 540 logical units up to fill its height.
    this.cameras.main.setZoom(cameraZoom(this.scale.height));

    this.drawBackground();
    this.buildPlatforms();
    const spikes = this.buildSpikes();
    this.buildEnemies();

    this.pool = new ProjectilePool(this);
    this.cannonballs = this.physics.add.group({ allowGravity: false });
    const popupGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.buildHazards(popupGroup);
    const shieldItems = this.buildShields();

    this.player = new Player(
      this,
      this.spawnX ?? this.level.playerSpawn.x,
      this.level.playerSpawn.y,
    );
    this.player.setDepth(DEPTH.PLAYER);
    this.followPlayer();

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
    this.physics.add.collider(this.player, this.trapFloors);

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
    for (const g of this.gears) {
      this.physics.add.overlap(this.player, g, () => this.handleDeath());
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

    // Cannonballs: destroyed by terrain; a hit is absorbed by a shield charge
    // if the player has one, otherwise it's lethal like any other projectile.
    this.physics.add.collider(this.cannonballs, this.platforms, (ball) => {
      (ball as Phaser.Physics.Arcade.Sprite).destroy();
    });
    this.physics.add.overlap(this.player, this.cannonballs, (_pl, ball) =>
      this.handleCannonballHit(ball as Phaser.Physics.Arcade.Sprite),
    );

    // Shield pickups.
    this.physics.add.overlap(this.player, shieldItems, (_pl, item) =>
      (item as ShieldItem).collect(this.player),
    );

    // Goal.
    this.physics.add.overlap(this.player, goal, () => this.handleWin());

    this.drawHud();
    this.layoutHud();

    // The Scale Manager is global, so drop the listener when the scene ends —
    // otherwise every restart leaves another one attached.
    this.scale.on(Phaser.Scale.Events.RESIZE, this.onDisplayResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.onDisplayResize, this);
    });
  }

  /**
   * Soft follow, so the camera trails the player rather than snapping to them.
   *
   * Pixel rounding is off: it only ever applies at whole-number camera zooms
   * anyway, so leaving it on would snap the world on some window sizes and not
   * others. Fractional scroll is what we want now that filtering is smooth.
   */
  private followPlayer(): void {
    this.cameras.main.startFollow(this.player, false, 0.1, 0.1);
  }

  /** Window resized: the buffer changed, so the camera zoom has to follow it. */
  private onDisplayResize(): void {
    const zoom = cameraZoom(this.scale.height);
    this.cameras.main.setZoom(zoom);
    // Re-following snaps the scroll to the new zoom. Without it the camera spends
    // half a second lerping back into place, dragging the HUD along with it.
    if (!this.ending) this.followPlayer();
    for (const text of this.hudTexts()) text.setResolution(zoom);
    this.layoutHud();
  }

  update(_time: number, delta: number): void {
    this.layoutHud();

    // Death/win arc keeps playing under physics, but the world freezes (G6).
    this.player.update(this.time.now);
    if (this.ending) return;

    this.elapsedMs += delta;

    for (const enemy of this.enemies) enemy.update();
    for (const p of this.pendulums) p.update(this.elapsedMs);
    for (const s of this.popupSpikes) s.update(this.elapsedMs);
    for (const tf of this.trapFloors) tf.update(this.elapsedMs);
    for (const mp of this.movingPlatforms) mp.update(this.elapsedMs, delta);
    for (const t of this.thwomps) t.update(delta, this.player);
    for (const sh of this.shooters) sh.update(delta);
    for (const tu of this.turrets) tu.update(delta, this.player);
    for (const c of this.cannons) c.update(this.elapsedMs);
    for (const g of this.gears) g.update(this.elapsedMs, delta);

    // Cannonballs that fly off the world are destroyed (avoid leaking objects).
    // destroy() mutates the group's array, so iterate over a copy.
    for (const ball of [...this.cannonballs.getChildren()]) {
      const b = ball as Phaser.Physics.Arcade.Sprite;
      if (isOffWorld(b.x, this.level.worldWidth)) b.destroy();
    }

    this.shieldText.setText(this.shieldLabel());

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
    this.trapFloors = [];

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
        case "trapfloor":
          this.trapFloors.push(
            new TrapFloor(this, p.x, p.y, p.width, p.height, {
              telegraphMs: p.telegraphMs,
              safeMs: p.safeMs,
              openMs: p.openMs,
              phase: p.phase,
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
      case "cannon":
        this.cannons.push(new Cannon(this, h, this.cannonballs));
        break;
      case "gear":
        this.gears.push(
          new Gear(this, h.x, h.y, {
            axis: h.axis,
            range: h.range,
            speed: h.speed,
            phase: h.phase,
            waitMs: h.waitMs,
            rotateDegPerSec: h.rotateDegPerSec,
          }),
        );
        break;
    }
  }

  private buildShields(): ShieldItem[] {
    return (this.level.shieldPickups ?? []).map((p) => new ShieldItem(this, p.x, p.y));
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

  /** A cannonball hit: absorbed by a shield charge if the player has one, else lethal. */
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
    // Retry should restart the stage the player died on — including a dev-only
    // spawn-x override, so debugging a late hazard doesn't replay the run-up.
    this.time.delayedCall(800, () =>
      this.scene.start("GameOverScene", { level: this.levelIndex, spawnX: this.spawnX }),
    );
  }

  // --- Presentation ---

  private drawBackground(): void {
    this.add
      .rectangle(0, 0, this.level.worldWidth, this.level.worldHeight, COLORS.BACKGROUND)
      .setOrigin(0, 0)
      .setDepth(DEPTH.BACKGROUND);
  }

  /** "Shield: ●●●" while charges remain, "Shield: --" once depleted (or never picked up). */
  private shieldLabel(): string {
    const n = this.player.shieldCharges;
    return n > 0 ? `Shield: ${"●".repeat(n)}` : "Shield: --";
  }

  /**
   * Builds the HUD. Positions are placeholders — `layoutHud` owns them.
   *
   * Font sizes and stroke widths stay in logical units: the camera zoom scales
   * them up, so they keep the size they always had. `setResolution` rasterises
   * the glyphs at that zoom instead of letting the camera magnify a small
   * texture, which is what made the text mushy before.
   */
  private drawHud(): void {
    const zoom = cameraZoom(this.scale.height);
    this.levelBanner = undefined;

    this.hudHint = this.add
      .text(
        0,
        0,
        "Arrows / A,D to move  •  Space / W / Up to jump  •  stomp enemies, reach the flag",
        { fontFamily: "monospace", fontSize: "15px", color: "#fff1e8" },
      )
      .setDepth(DEPTH.HUD);
    this.hudHint.setStroke("#1d2b53", 4);
    this.tweens.add({ targets: this.hudHint, alpha: 0, delay: 5000, duration: 1000 });

    // Shield charge counter, just under the hint — always on, like the stage indicator.
    this.shieldText = this.add
      .text(0, 0, this.shieldLabel(), {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#29adff",
      })
      .setDepth(DEPTH.HUD);
    this.shieldText.setStroke("#1d2b53", 4);

    // Stage indicator, top-right — always on, so progress is readable mid-play.
    this.stageText = this.add
      .text(0, 0, `STAGE ${this.levelIndex + 1}/${levels.length}`, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#00e436",
      })
      .setOrigin(1, 0)
      .setDepth(DEPTH.HUD);
    this.stageText.setStroke("#1d2b53", 4);

    // Brief level-name banner.
    if (this.level.name) {
      this.levelBanner = this.add
        .text(0, 0, this.level.name, {
          fontFamily: "monospace",
          fontSize: "28px",
          color: "#ffec27",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(DEPTH.HUD);
      this.levelBanner.setStroke("#1d2b53", 5);
      this.tweens.add({ targets: this.levelBanner, alpha: 0, delay: 1800, duration: 800 });
    }

    for (const text of this.hudTexts()) text.setResolution(zoom);
  }

  private hudTexts(): Phaser.GameObjects.Text[] {
    const texts = [this.hudHint, this.shieldText, this.stageText];
    return this.levelBanner ? [...texts, this.levelBanner] : texts;
  }

  /**
   * Re-anchors the HUD to the camera's current view, in logical units from its
   * edges. A zoomed camera scales everything it draws — including objects with a
   * zero scroll factor — so pinning to `worldView` keeps the arithmetic obvious
   * where compensating for the zoom by hand would not.
   *
   * `worldView` reflects the previous frame's scroll, since the camera updates it
   * during render. With the camera's 0.1 lerp that trails by well under a logical
   * pixel, which is invisible.
   */
  private layoutHud(): void {
    const view = this.cameras.main.worldView;
    this.hudHint.setPosition(view.x + 16, view.y + 14);
    this.shieldText.setPosition(view.x + 16, view.y + 40);
    this.stageText.setPosition(view.right - 16, view.y + 14);
    this.levelBanner?.setPosition(view.centerX, view.y + 80);
  }
}
