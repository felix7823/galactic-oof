import * as Phaser from 'phaser';
import { EnemyShip } from './EnemyShip';

export type BeamState = 'idle' | 'firing' | 'recharging';

const FIRE_DURATION     = 3000;
const RECHARGE_DURATION = 2000;
const DAMAGE_TICK_MS    = 300;
const HIT_HALF_WIDTH    = 14;

export class LaserBeam {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly glowColor: number;

  state: BeamState = 'idle';
  private elapsed    = 0;
  private damageTick = 0;

  get readiness(): number {
    if (this.state === 'idle')       return 1;
    if (this.state === 'firing')     return 1 - this.elapsed / FIRE_DURATION;
    if (this.state === 'recharging') return this.elapsed / RECHARGE_DURATION;
    return 1;
  }

  /**
   * @param scene      Phaser scene
   * @param glowColor  Primary glow colour (e.g. 0x00ccff for cyan, 0xff8800 for orange)
   */
  constructor(scene: Phaser.Scene, glowColor = 0x00ccff) {
    this.glowColor = glowColor;
    this.graphics  = scene.add.graphics();
    this.graphics.setDepth(20);
  }

  tryFire(): void {
    if (this.state === 'idle') {
      this.state      = 'firing';
      this.elapsed    = 0;
      this.damageTick = 0;
    }
  }

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

    if (this.elapsed >= FIRE_DURATION) {
      this.state   = 'recharging';
      this.elapsed = 0;
      return [];
    }

    this.drawBeam(originX, originY);

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

  private drawBeam(x: number, y: number): void {
    const flicker = 0.75 + Math.random() * 0.25;
    const beamH   = y;
    const c       = this.glowColor;

    // Wide outer glow
    this.graphics.fillStyle(c, 0.07 * flicker);
    this.graphics.fillRect(x - 12, 0, 24, beamH);

    // Medium glow
    this.graphics.fillStyle(c, 0.20 * flicker);
    this.graphics.fillRect(x - 6, 0, 12, beamH);

    // Inner glow
    this.graphics.fillStyle(c, 0.50 * flicker);
    this.graphics.fillRect(x - 3, 0, 6, beamH);

    // Bright white core
    this.graphics.fillStyle(0xffffff, flicker);
    this.graphics.fillRect(x - 1, 0, 2, beamH);

    // Muzzle flash
    const flashR = 5 + Math.random() * 5;
    this.graphics.fillStyle(c, 0.55 * flicker);
    this.graphics.fillCircle(x, y, flashR * 2);
    this.graphics.fillStyle(0xffffff, 0.9 * flicker);
    this.graphics.fillCircle(x, y, flashR);
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
