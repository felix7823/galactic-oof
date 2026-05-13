import * as Phaser from 'phaser';
import type { EnemyShip } from '../entities/EnemyShip';

const DURATION = 600;

export class FireCharge {
  private readonly gfx:   Phaser.GameObjects.Graphics;
  private readonly cx:    number;
  private readonly cy:    number;
  private elapsed = 0;
  private firstTick = true;

  isExpired = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.cx = x;
    // Top-left of the 32×64 zone: cx-16, cy-64
    this.cy = y;

    this.gfx = scene.add.graphics();
    this.gfx.setDepth(22);
  }

  /** Returns instant-killed enemies on the first tick only. */
  update(delta: number, enemies: Phaser.GameObjects.Group): EnemyShip[] {
    if (this.isExpired) return [];

    this.elapsed += delta;

    const t     = Math.min(this.elapsed / DURATION, 1);
    const alpha = 1 - t;

    this.gfx.clear();

    // Orange outer rect — full height from player to top of screen
    this.gfx.fillStyle(0xff6600, alpha * 0.6);
    this.gfx.fillRect(this.cx - 32, 0, 64, this.cy);

    // Yellow inner core
    this.gfx.fillStyle(0xffee00, alpha * 0.85);
    this.gfx.fillRect(this.cx - 16, 0, 32, this.cy);

    // White hot centre
    this.gfx.fillStyle(0xffffff, alpha * 0.5);
    this.gfx.fillRect(this.cx - 6, 0, 12, this.cy);

    if (t >= 1) {
      this.isExpired = true;
      this.gfx.destroy();
      return [];
    }

    if (this.firstTick) {
      this.firstTick = false;
      const hits: EnemyShip[] = [];
      const left   = this.cx - 32;
      const top    = 0;
      const right  = this.cx + 32;
      const bottom = this.cy;

      for (const obj of enemies.getChildren()) {
        const enemy = obj as EnemyShip;
        if (!enemy.active) continue;
        if (enemy.x >= left && enemy.x <= right && enemy.y >= top && enemy.y <= bottom) {
          hits.push(enemy);
        }
      }
      return hits;
    }

    return [];
  }

  destroy(): void {
    if (!this.isExpired) {
      this.isExpired = true;
      this.gfx.destroy();
    }
  }
}
