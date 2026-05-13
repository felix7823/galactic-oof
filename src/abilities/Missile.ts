import * as Phaser from 'phaser';
import type { EnemyShip } from '../entities/EnemyShip';

const MISSILE_SPEED   = 350;
const HIT_RADIUS      = 20;
const EXPLODE_RADIUS  = 64;
const EXPLODE_DURATION = 600;

export class Missile {
  private readonly gfx:    Phaser.GameObjects.Graphics;

  private x:       number;
  private y:       number;
  private exploding      = false;
  private explodeElapsed = 0;
  private explodeX       = 0;
  private explodeY       = 0;
  private flickerTimer   = 0;
  private flameLarge     = true;

  isExpired = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x     = x;
    this.y     = y;
    this.gfx   = scene.add.graphics();
    this.gfx.setDepth(22);
  }

  update(delta: number, enemies: Phaser.GameObjects.Group): EnemyShip[] {
    if (this.isExpired) return [];

    if (this.exploding) {
      return this.tickExplosion(delta);
    }

    const dt = delta / 1000;
    this.y -= MISSILE_SPEED * dt;

    // Off-screen check
    if (this.y < -40) {
      this.isExpired = true;
      this.gfx.destroy();
      return [];
    }

    // Enemy hit check
    for (const obj of enemies.getChildren()) {
      const enemy = obj as EnemyShip;
      if (!enemy.active) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
        return this.detonate(enemies);
      }
    }

    this.drawMissile(delta);
    return [];
  }

  private detonate(enemies: Phaser.GameObjects.Group): EnemyShip[] {
    this.exploding  = true;
    this.explodeX   = this.x;
    this.explodeY   = this.y;

    const killed: EnemyShip[] = [];
    for (const obj of enemies.getChildren()) {
      const enemy = obj as EnemyShip;
      if (!enemy.active) continue;
      const dx = enemy.x - this.explodeX;
      const dy = enemy.y - this.explodeY;
      if (dx * dx + dy * dy <= EXPLODE_RADIUS * EXPLODE_RADIUS) {
        killed.push(enemy);
      }
    }
    return killed;
  }

  private tickExplosion(delta: number): EnemyShip[] {
    this.explodeElapsed += delta;
    const t     = Math.min(this.explodeElapsed / EXPLODE_DURATION, 1);
    const alpha = 1 - t;
    const r     = EXPLODE_RADIUS * t;

    this.gfx.clear();

    // Expanding outer ring
    this.gfx.lineStyle(4, 0xffaa00, alpha * 0.8);
    this.gfx.strokeCircle(this.explodeX, this.explodeY, r);

    // Inner flash
    this.gfx.fillStyle(0xffffff, alpha * 0.5 * (1 - t));
    this.gfx.fillCircle(this.explodeX, this.explodeY, r * 0.5);

    if (t >= 1) {
      this.isExpired = true;
      this.gfx.destroy();
    }

    return [];
  }

  private drawMissile(delta: number): void {
    this.flickerTimer += delta;
    if (this.flickerTimer > 60) {
      this.flickerTimer = 0;
      this.flameLarge = !this.flameLarge;
    }

    const g = this.gfx;
    g.clear();

    // Body — grey rectangle
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(this.x - 4, this.y - 12, 8, 18);

    // Nose — red triangle pointing up
    g.fillStyle(0xff2200, 1);
    g.fillTriangle(
      this.x,      this.y - 18,
      this.x - 5,  this.y - 10,
      this.x + 5,  this.y - 10,
    );

    // Fin left
    g.fillStyle(0x888888, 1);
    g.fillTriangle(
      this.x - 4, this.y + 6,
      this.x - 9, this.y + 12,
      this.x - 4, this.y + 12,
    );

    // Fin right
    g.fillTriangle(
      this.x + 4, this.y + 6,
      this.x + 9, this.y + 12,
      this.x + 4, this.y + 12,
    );

    // Flame — orange flickering triangle below engine
    const flameH = this.flameLarge ? 14 : 9;
    g.fillStyle(0xff6600, 0.9);
    g.fillTriangle(
      this.x,      this.y + 6 + flameH,
      this.x - 5,  this.y + 6,
      this.x + 5,  this.y + 6,
    );
    g.fillStyle(0xffee00, 0.8);
    g.fillTriangle(
      this.x,      this.y + 6 + flameH * 0.6,
      this.x - 3,  this.y + 6,
      this.x + 3,  this.y + 6,
    );
  }

  destroy(): void {
    if (!this.isExpired) {
      this.isExpired = true;
      this.gfx.destroy();
    }
  }
}
