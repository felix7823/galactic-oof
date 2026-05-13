import * as Phaser from 'phaser';
import type { EnemyShip } from '../entities/EnemyShip';
import { LightningEffect } from '../entities/LightningEffect';
import type { PlayerShip } from '../entities/PlayerShip';

const ZAP_INTERVAL  = 500;
const ZAP_RADIUS    = 128;
const INITIAL_WAVES = 2;

export class LightningStorm {
  private readonly scene:      Phaser.Scene;
  private readonly playerRef:  PlayerShip;
  private readonly gfx:        Phaser.GameObjects.Graphics;
  private readonly effects:    LightningEffect[] = [];

  private zapTimer  = ZAP_INTERVAL; // fire immediately on first update
  private elapsed   = 0;
  private wavesLeft = INITIAL_WAVES;

  isExpired = false;

  constructor(scene: Phaser.Scene, playerRef: PlayerShip) {
    this.scene     = scene;
    this.playerRef = playerRef;
    this.gfx       = scene.add.graphics();
    this.gfx.setDepth(20);
  }

  /** Returns enemies that were zapped this tick (caller should call hit() on each). */
  update(delta: number, enemies: Phaser.GameObjects.Group): EnemyShip[] {
    if (this.isExpired) return [];

    this.elapsed   += delta;
    this.zapTimer  += delta;

    // Tick + cull finished lightning effects
    for (let i = this.effects.length - 1; i >= 0; i--) {
      this.effects[i].update(delta);
      if (this.effects[i].isDone) this.effects.splice(i, 1);
    }

    // Draw faint gold aura around player
    this.gfx.clear();
    const pulse = 0.18 + 0.1 * Math.sin(this.elapsed * 0.008);
    this.gfx.lineStyle(3, 0xffdd00, pulse * 2);
    this.gfx.strokeCircle(this.playerRef.x, this.playerRef.y, ZAP_RADIUS);
    this.gfx.fillStyle(0xffdd00, pulse * 0.3);
    this.gfx.fillCircle(this.playerRef.x, this.playerRef.y, ZAP_RADIUS);

    if (this.zapTimer < ZAP_INTERVAL) return [];
    this.zapTimer = 0;

    const hit: EnemyShip[] = [];
    const px = this.playerRef.x;
    const py = this.playerRef.y;

    for (const obj of enemies.getChildren()) {
      const enemy = obj as EnemyShip;
      if (!enemy.active) continue;
      const dx   = enemy.x - px;
      const dy   = enemy.y - py;
      if (dx * dx + dy * dy <= ZAP_RADIUS * ZAP_RADIUS) {
        hit.push(enemy);
        this.effects.push(new LightningEffect(this.scene, px, py, enemy.x, enemy.y));
      }
    }

    return hit;
  }

  onWaveComplete(): void {
    this.wavesLeft--;
    if (this.wavesLeft <= 0) this.destroy();
  }

  destroy(): void {
    if (!this.isExpired) {
      this.isExpired = true;
      this.gfx.destroy();
      this.effects.forEach(e => e.destroy());
    }
  }
}
