import * as Phaser from 'phaser';
import { PlayerShip } from './PlayerShip';
import { EnemyShip } from './EnemyShip';

const SHIP_SIZE       = 32;
const PULL_RADIUS     = SHIP_SIZE * 3.5;   // ~112 px — gravitational influence
const EVENT_HORIZON_R = SHIP_SIZE * 0.55;  // ~18 px  — consumed here
const PULL_SPEED_MAX  = 180;               // px/s at the event horizon edge
const DURATION_MS     = 10_000;
const SHRINK_MS       = 900;

export class BlackHole {
  private readonly gfx: Phaser.GameObjects.Graphics;

  readonly x: number;
  readonly y: number;

  private angle    = 0;
  private elapsed  = 0;
  private shrinking = false;
  private shrinkT   = 0;   // 0→1 during shrink

  isExpired = false;

  /** Players consumed by THIS instance — immune for its lifetime. */
  private readonly immunePlayers = new Set<PlayerShip>();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;

    this.gfx = scene.add.graphics();
    this.gfx.setDepth(18);
    this.gfx.setAlpha(0);

    // Pop-in tween
    scene.tweens.add({ targets: this.gfx, alpha: 1, duration: 350, ease: 'Power2' });
  }

  /**
   * Call every frame.
   * Returns the list of players consumed this tick — GameScene handles life loss.
   */
  update(delta: number, players: PlayerShip[], enemies: Phaser.GameObjects.Group): PlayerShip[] {
    if (this.isExpired) return [];

    this.elapsed += delta;
    this.angle   += delta * 0.003;

    if (!this.shrinking && this.elapsed >= DURATION_MS) {
      this.shrinking = true;
    }

    let scale = 1;
    if (this.shrinking) {
      this.shrinkT = Math.min((this.elapsed - DURATION_MS) / SHRINK_MS, 1);
      scale = 1 - this.shrinkT;
      this.gfx.setAlpha(scale);
      if (this.shrinkT >= 1) {
        this.isExpired = true;
        this.gfx.destroy();
        return [];
      }
    }

    this.draw(scale);
    this.pullEnemies(enemies, scale);
    return this.pullPlayers(players, scale);
  }

  // ── Visuals ────────────────────────────────────────────────────────────────

  private draw(scale: number): void {
    if (scale <= 0.02) return;

    const g = this.gfx;
    g.clear();

    const { x, y } = this;
    const outerR   = PULL_RADIUS * scale;
    const diskR    = outerR * 0.68;
    const horizonR = EVENT_HORIZON_R * scale;
    const coreR    = horizonR * 0.52;

    // Gravitational haze
    g.fillStyle(0x5500aa, 0.07);
    g.fillCircle(x, y, outerR);

    // Three spinning spiral arms
    for (let arm = 0; arm < 3; arm++) {
      const base = this.angle + (arm * Math.PI * 2) / 3;
      for (let s = 0; s < 34; s++) {
        const t  = s / 34;
        const r  = horizonR + (diskR - horizonR) * t;
        const a  = base + t * Math.PI * 0.9; // spiral twist
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;

        // colour gradient: cyan → purple → dark purple
        const col = t < 0.3 ? 0x00ddff : t < 0.6 ? 0xcc00ff : 0x660099;
        g.fillStyle(col, (1 - t) * 0.9 * scale);
        g.fillCircle(px, py, (1 - t * 0.5) * 3.5 * scale);
      }
    }

    // Pulsing outer ring
    const pulse = 0.4 + 0.25 * Math.sin(this.elapsed * 0.006);
    g.lineStyle(2 * scale, 0xaa00ff, pulse);
    g.strokeCircle(x, y, diskR * 0.9);

    // Event horizon bright ring
    g.lineStyle(3 * scale, 0xff00ff, 0.95);
    g.strokeCircle(x, y, horizonR);

    // Inner glow
    g.fillStyle(0xcc00ff, 0.38);
    g.fillCircle(x, y, horizonR);

    // Singularity — pure black
    g.fillStyle(0x000000, 1);
    g.fillCircle(x, y, coreR);

    // Bright pinpoint
    g.fillStyle(0xffffff, 0.9 * scale);
    g.fillCircle(x, y, 2.2 * scale);
  }

  // ── Physics ────────────────────────────────────────────────────────────────

  private pullEnemies(enemies: Phaser.GameObjects.Group, scale: number): void {
    const outerR   = PULL_RADIUS * scale;
    const horizonR = EVENT_HORIZON_R * scale;

    for (const obj of enemies.getChildren()) {
      const enemy = obj as EnemyShip;
      if (!enemy.active) continue;

      const dx   = this.x - enemy.x;
      const dy   = this.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > outerR) continue;

      if (dist < horizonR) {
        enemy.destroy();
        continue;
      }

      // Blend current velocity toward the black hole
      const t    = 1 - dist / outerR;
      const spd  = PULL_SPEED_MAX * t;
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        body.velocity.x * 0.82 + (dx / dist) * spd,
        body.velocity.y * 0.82 + (dy / dist) * spd,
      );
    }
  }

  private pullPlayers(players: PlayerShip[], scale: number): PlayerShip[] {
    const outerR   = PULL_RADIUS * scale;
    const horizonR = EVENT_HORIZON_R * scale;
    const consumed: PlayerShip[] = [];

    for (const player of players) {
      if (player.isGhost)                 continue;
      if (this.immunePlayers.has(player)) continue;

      const dx   = this.x - player.x;
      const dy   = this.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > outerR) continue;

      if (dist < horizonR) {
        // Consumed — immune from now on, knock downward to escape
        this.immunePlayers.add(player);
        consumed.push(player);
        const body = player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 250); // push away so they don't re-trigger immediately
        continue;
      }

      // Add pull on top of whatever velocity player.update() already set
      const t    = 1 - dist / outerR;
      const spd  = PULL_SPEED_MAX * t * 0.45; // softer on friendly ships
      const body = player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        body.velocity.x + (dx / dist) * spd,
        body.velocity.y + (dy / dist) * spd,
      );
    }

    return consumed;
  }

  destroy(): void {
    if (!this.isExpired) {
      this.isExpired = true;
      this.gfx.destroy();
    }
  }
}
