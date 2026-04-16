import * as Phaser from 'phaser';
import { EnemyShip } from './EnemyShip';

export type BeamState = 'idle' | 'firing' | 'recharging';

const FIRE_DURATION     = 3000; // ms beam stays on
const RECHARGE_DURATION = 2000; // ms before can fire again
const DAMAGE_TICK_MS    = 300;  // how often beam damages enemies in its path
const HIT_HALF_WIDTH    = 14;   // px either side of beam centre counted as a hit

export class LaserBeam {
  private readonly graphics: Phaser.GameObjects.Graphics;

  state: BeamState = 'idle';
  private elapsed    = 0;
  private damageTick = 0;

  /** 0–1: 1 = fully ready, 0 = just fired / empty. Used for HUD bar. */
  get readiness(): number {
    if (this.state === 'idle')       return 1;
    if (this.state === 'firing')     return 1 - this.elapsed / FIRE_DURATION;
    if (this.state === 'recharging') return this.elapsed / RECHARGE_DURATION;
    return 1;
  }

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(20); // always above ships and enemies
  }

  /** Call when the player presses fire. Only activates from idle state. */
  tryFire(): void {
    if (this.state === 'idle') {
      this.state      = 'firing';
      this.elapsed    = 0;
      this.damageTick = 0;
    }
  }

  /**
   * Call every frame. Returns enemies that should receive a damage hit this tick.
   * @param delta     ms since last frame
   * @param originX   x centre of player ship
   * @param originY   top edge of player ship (beam starts here)
   * @param enemies   active enemy group
   */
  update(
    delta: number,
    originX: number,
    originY: number,
    enemies: Phaser.GameObjects.Group,
  ): EnemyShip[] {
    this.graphics.clear();

    if (this.state === 'idle') return [];

    this.elapsed += delta;

    if (this.state === 'recharging') {
      if (this.elapsed >= RECHARGE_DURATION) {
        this.state   = 'idle';
        this.elapsed = 0;
      }
      return [];
    }

    // ── Firing state ─────────────────────────────────────────────────────────
    if (this.elapsed >= FIRE_DURATION) {
      this.state   = 'recharging';
      this.elapsed = 0;
      return [];
    }

    this.drawBeam(originX, originY);

    // Damage tick — only hit enemies every DAMAGE_TICK_MS, not every frame
    this.damageTick += delta;
    if (this.damageTick < DAMAGE_TICK_MS) return [];
    this.damageTick = 0;

    const hits: EnemyShip[] = [];
    for (const obj of enemies.getChildren()) {
      const enemy = obj as EnemyShip;
      if (enemy.active && enemy.y < originY && Math.abs(enemy.x - originX) < HIT_HALF_WIDTH) {
        hits.push(enemy);
      }
    }
    return hits;
  }

  /**
   * Draw the beam as layered filled rectangles — reliable across WebGL renderers.
   * Wide soft outer glow → medium glow → thin inner glow → 2px bright white core.
   */
  private drawBeam(x: number, y: number): void {
    const flicker  = 0.75 + Math.random() * 0.25;
    const beamH    = y; // from screen top (0) down to origin (y)

    // Layer 1: wide outer glow
    this.graphics.fillStyle(0x0099cc, 0.07 * flicker);
    this.graphics.fillRect(x - 12, 0, 24, beamH);

    // Layer 2: medium glow
    this.graphics.fillStyle(0x00ccff, 0.20 * flicker);
    this.graphics.fillRect(x - 6, 0, 12, beamH);

    // Layer 3: inner glow
    this.graphics.fillStyle(0x66ffff, 0.50 * flicker);
    this.graphics.fillRect(x - 3, 0, 6, beamH);

    // Layer 4: bright white core
    this.graphics.fillStyle(0xffffff, flicker);
    this.graphics.fillRect(x - 1, 0, 2, beamH);

    // Muzzle flash at origin
    const flashR = 5 + Math.random() * 5;
    this.graphics.fillStyle(0x00ffff, 0.55 * flicker);
    this.graphics.fillCircle(x, y, flashR * 2);
    this.graphics.fillStyle(0xffffff, 0.9 * flicker);
    this.graphics.fillCircle(x, y, flashR);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
