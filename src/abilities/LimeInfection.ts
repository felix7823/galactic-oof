import * as Phaser from 'phaser';
import { EnemyShip } from '../entities/EnemyShip';

const DAMAGE_PER_TICK = 0.5;   // hp per tick
const TICK_INTERVAL   = 200;   // ms between damage ticks
const SPREAD_INTERVAL = 500;
const SPREAD_RADIUS   = 32;
const INITIAL_WAVES   = 2;

export class LimeInfection {
  private readonly gfx:         Phaser.GameObjects.Graphics;
  private readonly infectedMap: Map<EnemyShip, number> = new Map(); // accumulated fractional damage

  private spreadTimer = SPREAD_INTERVAL; // fire spread check immediately
  private tickTimer   = TICK_INTERVAL;   // fire damage tick immediately
  private elapsed     = 0;
  private wavesLeft   = INITIAL_WAVES;

  isExpired = false;

  constructor(scene: Phaser.Scene, enemies: Phaser.GameObjects.Group) {
    this.gfx   = scene.add.graphics();
    this.gfx.setDepth(21);

    // Infect one random active enemy
    const active = enemies.getChildren().filter(o => (o as EnemyShip).active) as EnemyShip[];
    if (active.length > 0) {
      const target = active[Phaser.Math.Between(0, active.length - 1)];
      this.infectedMap.set(target, 0);
    }
  }

  /** Returns enemies that have died this tick (hit() already called internally). */
  update(delta: number, enemies: Phaser.GameObjects.Group): EnemyShip[] {
    if (this.isExpired) return [];

    this.elapsed     += delta;
    this.spreadTimer += delta;
    this.tickTimer   += delta;

    const dead: EnemyShip[] = [];

    // Damage tick every 200 ms — apply 0.5 hp to each infected enemy
    if (this.tickTimer >= TICK_INTERVAL) {
      this.tickTimer = 0;

      for (const [enemy, accum] of this.infectedMap) {
        if (!enemy.active) { this.infectedMap.delete(enemy); continue; }

        const newAccum = accum + DAMAGE_PER_TICK;
        if (newAccum >= 1) {
          this.infectedMap.set(enemy, newAccum - 1);
          if (enemy.hit()) {
            dead.push(enemy);
            this.infectedMap.delete(enemy);
          }
        } else {
          this.infectedMap.set(enemy, newAccum);
        }
      }
    }

    // Spread check every 500ms
    if (this.spreadTimer >= SPREAD_INTERVAL) {
      this.spreadTimer = 0;
      const currentlyInfected = Array.from(this.infectedMap.keys()).filter(e => e.active);
      for (const infected of currentlyInfected) {
        for (const obj of enemies.getChildren()) {
          const neighbor = obj as EnemyShip;
          if (!neighbor.active) continue;
          if (this.infectedMap.has(neighbor)) continue;
          if (dead.includes(neighbor)) continue;
          const dx = neighbor.x - infected.x;
          const dy = neighbor.y - infected.y;
          if (dx * dx + dy * dy < SPREAD_RADIUS * SPREAD_RADIUS) {
            this.infectedMap.set(neighbor, 0);
          }
        }
      }
    }

    // Draw green pulsing ring on each infected enemy
    this.gfx.clear();
    const pulse = 0.5 + 0.5 * Math.sin(this.elapsed * 0.01);
    for (const [enemy] of this.infectedMap) {
      if (!enemy.active) continue;
      this.gfx.lineStyle(2.5, 0x44ff44, pulse);
      this.gfx.strokeCircle(enemy.x, enemy.y, 18);
      this.gfx.fillStyle(0x22bb22, pulse * 0.15);
      this.gfx.fillCircle(enemy.x, enemy.y, 18);
    }

    if (this.infectedMap.size === 0 && enemies.countActive(true) === 0) {
      // Nothing left to infect
    }

    return dead;
  }

  onWaveComplete(): void {
    this.wavesLeft--;
    if (this.wavesLeft <= 0) this.destroy();
  }

  destroy(): void {
    if (!this.isExpired) {
      this.isExpired = true;
      this.gfx.destroy();
      this.infectedMap.clear();
    }
  }
}
