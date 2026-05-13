import * as Phaser from 'phaser';
import type { EnemyShip } from '../entities/EnemyShip';
import { PlayerShip } from '../entities/PlayerShip';

const PULL_RADIUS    = 340;
const CAPTURE_RADIUS = 52;
const PULL_SPEED_MAX = 160;
const SPIN_DURATION  = 500;
const INITIAL_WAVES  = 2;

export class WaterTornado {
  private readonly gfx:   Phaser.GameObjects.Graphics;

  readonly x: number;
  readonly y: number;

  private angle    = 0;
  private elapsed  = 0;
  private wavesLeft = INITIAL_WAVES;

  /** Captured entities and how long they have been spinning (ms). */
  private readonly spinningEnemies = new Map<EnemyShip, number>();
  private readonly spinningPlayers = new Map<PlayerShip, number>();

  isExpired = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(18);
  }

  /**
   * Returns players consumed this tick (caller handles life loss).
   * Enemies are destroyed internally once spin completes.
   */
  update(delta: number, players: PlayerShip[], enemies: Phaser.GameObjects.Group): PlayerShip[] {
    if (this.isExpired) return [];

    this.elapsed += delta;
    this.angle   += delta * 0.004;

    this.draw();
    this.pullEnemies(delta, enemies);
    return this.pullPlayers(delta, players);
  }

  private pullEnemies(delta: number, enemies: Phaser.GameObjects.Group): void {
    for (const obj of enemies.getChildren()) {
      const enemy = obj as EnemyShip;
      if (!enemy.active) continue;

      // Already captured — advance spin timer
      if (this.spinningEnemies.has(enemy)) {
        const spinElapsed = this.spinningEnemies.get(enemy)! + delta;
        this.spinningEnemies.set(enemy, spinElapsed);

        // Give circular velocity
        const dx   = enemy.x - this.x;
        const dy   = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(-dy / dist * 120, dx / dist * 120);

        if (spinElapsed >= SPIN_DURATION) {
          this.spinningEnemies.delete(enemy);
          enemy.destroy();
        }
        continue;
      }

      const dx   = this.x - enemy.x;
      const dy   = this.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > PULL_RADIUS) continue;

      if (dist < CAPTURE_RADIUS) {
        this.spinningEnemies.set(enemy, 0);
        continue;
      }

      const t    = 1 - dist / PULL_RADIUS;
      const spd  = PULL_SPEED_MAX * t;
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        body.velocity.x * 0.82 + (dx / dist) * spd,
        body.velocity.y * 0.82 + (dy / dist) * spd,
      );
    }
  }

  private pullPlayers(delta: number, players: PlayerShip[]): PlayerShip[] {
    const consumed: PlayerShip[] = [];

    for (const player of players) {
      if (player.isGhost) continue;

      // Already captured — advance spin timer
      if (this.spinningPlayers.has(player)) {
        const spinElapsed = this.spinningPlayers.get(player)! + delta;
        this.spinningPlayers.set(player, spinElapsed);

        const dx   = player.x - this.x;
        const dy   = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const body = player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(-dy / dist * 100, dx / dist * 100);

        if (spinElapsed >= SPIN_DURATION) {
          this.spinningPlayers.delete(player);
          // Kick player downward so they escape
          (player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 250);
          consumed.push(player);
        }
        continue;
      }

      const dx   = this.x - player.x;
      const dy   = this.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > PULL_RADIUS) continue;

      if (dist < CAPTURE_RADIUS) {
        this.spinningPlayers.set(player, 0);
        continue;
      }

      const t    = 1 - dist / PULL_RADIUS;
      const spd  = PULL_SPEED_MAX * t * 0.45;
      const body = player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        body.velocity.x + (dx / dist) * spd,
        body.velocity.y + (dy / dist) * spd,
      );
    }

    return consumed;
  }

  private draw(): void {
    const g = this.gfx;
    g.clear();

    const { x, y } = this;
    const outerR   = PULL_RADIUS;
    const diskR    = outerR * 0.55;
    const coreR    = CAPTURE_RADIUS;

    // Haze
    g.fillStyle(0x0033aa, 0.07);
    g.fillCircle(x, y, outerR);

    // 4 spinning spiral arms (blue/cyan)
    for (let arm = 0; arm < 4; arm++) {
      const base = this.angle + (arm * Math.PI * 2) / 4;
      for (let s = 0; s < 28; s++) {
        const t  = s / 28;
        const r  = coreR + (diskR - coreR) * t;
        const a  = base + t * Math.PI * 0.8;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        const col = t < 0.4 ? 0x00ffff : t < 0.7 ? 0x0088ff : 0x004488;
        g.fillStyle(col, (1 - t) * 0.9);
        g.fillCircle(px, py, (1 - t * 0.5) * 3 * 1);
      }
    }

    // Outer ring
    const pulse = 0.4 + 0.25 * Math.sin(this.elapsed * 0.006);
    g.lineStyle(2, 0x00aaff, pulse);
    g.strokeCircle(x, y, diskR * 0.9);

    // Event horizon ring
    g.lineStyle(3, 0x00ffff, 0.9);
    g.strokeCircle(x, y, coreR);

    // Inner glow
    g.fillStyle(0x0088ff, 0.35);
    g.fillCircle(x, y, coreR);

    // Core
    g.fillStyle(0x000033, 1);
    g.fillCircle(x, y, coreR * 0.5);

    // Bright centre
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(x, y, 2);
  }

  onWaveComplete(): void {
    this.wavesLeft--;
    if (this.wavesLeft <= 0) this.destroy();
  }

  destroy(): void {
    if (!this.isExpired) {
      this.isExpired = true;
      this.gfx.destroy();
    }
  }
}
