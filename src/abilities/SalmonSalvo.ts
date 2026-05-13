import * as Phaser from 'phaser';
import type { EnemyShip } from '../entities/EnemyShip';

const FISH_SPEED   = 280;
const HIT_RADIUS   = 18;
const FISH_COUNT   = 8;
const FISH_COLOR   = 0xff9988;

interface Fish {
  x:    number;
  y:    number;
  vx:   number;
  vy:   number;
  dead: boolean;
}

export class SalmonSalvo {
  private readonly scene: Phaser.Scene;
  private readonly gfx:   Phaser.GameObjects.Graphics;
  private readonly fish:  Fish[] = [];

  isExpired = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.gfx   = scene.add.graphics();
    this.gfx.setDepth(20);

    for (let i = 0; i < FISH_COUNT; i++) {
      const angle = (i / FISH_COUNT) * Math.PI * 2;
      this.fish.push({
        x,
        y,
        vx:   Math.cos(angle) * FISH_SPEED,
        vy:   Math.sin(angle) * FISH_SPEED,
        dead: false,
      });
    }
  }

  update(delta: number, enemies: Phaser.GameObjects.Group): EnemyShip[] {
    if (this.isExpired) return [];

    const dt   = delta / 1000;
    const hits: EnemyShip[] = [];
    const { width, height } = this.scene.scale;

    this.gfx.clear();

    for (const fish of this.fish) {
      if (fish.dead) continue;

      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;

      // Off-screen check
      if (fish.x < -60 || fish.x > width + 60 || fish.y < -60 || fish.y > height + 60) {
        fish.dead = true;
        continue;
      }

      // Enemy collision
      for (const obj of enemies.getChildren()) {
        const enemy = obj as EnemyShip;
        if (!enemy.active) continue;
        const dx   = enemy.x - fish.x;
        const dy   = enemy.y - fish.y;
        if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
          fish.dead = true;
          if (!hits.includes(enemy)) hits.push(enemy);
          break;
        }
      }

      if (fish.dead) continue;

      // Draw fish: body circle + tail triangle
      const angle = Math.atan2(fish.vy, fish.vx);
      const cos   = Math.cos(angle);
      const sin   = Math.sin(angle);

      // Body
      this.gfx.fillStyle(FISH_COLOR, 1);
      this.gfx.fillCircle(fish.x, fish.y, 5);

      // Tail — triangle pointing backward
      const tx = fish.x - cos * 10;
      const ty = fish.y - sin * 10;
      const lx = fish.x - cos * 6 + sin * 5;
      const ly = fish.y - sin * 6 - cos * 5;
      const rx = fish.x - cos * 6 - sin * 5;
      const ry = fish.y - sin * 6 + cos * 5;

      this.gfx.fillStyle(0xff7755, 1);
      this.gfx.fillTriangle(tx, ty, lx, ly, rx, ry);

      // Eye dot
      this.gfx.fillStyle(0x000000, 1);
      this.gfx.fillCircle(fish.x + cos * 3 - sin * 2, fish.y + sin * 3 + cos * 2, 1.2);
    }

    if (this.fish.every(f => f.dead)) {
      this.isExpired = true;
      this.gfx.destroy();
    }

    return hits;
  }

  destroy(): void {
    if (!this.isExpired) {
      this.isExpired = true;
      this.gfx.destroy();
    }
  }
}
