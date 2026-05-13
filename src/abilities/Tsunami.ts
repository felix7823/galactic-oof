import * as Phaser from 'phaser';
import type { EnemyShip } from '../entities/EnemyShip';

const WAVE_SPEED = 600;

export class Tsunami {
  private readonly scene:    Phaser.Scene;
  private readonly gfx:      Phaser.GameObjects.Graphics;
  private readonly killList: EnemyShip[];
  private readonly screenW:  number;

  private waveX      = -20;
  private elapsed    = 0;
  private firstFrame = true;

  isExpired = false;

  constructor(scene: Phaser.Scene, enemies: Phaser.GameObjects.Group) {
    this.scene   = scene;
    this.screenW = scene.scale.width;
    this.gfx     = scene.add.graphics();
    this.gfx.setDepth(24);

    // Collect all active enemies immediately
    this.killList = enemies.getChildren()
      .filter(o => (o as EnemyShip).active)
      .map(o => o as EnemyShip);
  }

  update(delta: number): EnemyShip[] {
    if (this.isExpired) return [];

    this.elapsed += delta;
    this.waveX   += WAVE_SPEED * (delta / 1000);

    // Draw the sweeping wave
    this.drawWave();

    if (this.waveX > this.screenW + 100) {
      this.isExpired = true;
      this.gfx.destroy();
      return [];
    }

    // On first frame, return the kill list
    if (this.firstFrame) {
      this.firstFrame = false;
      return [...this.killList];
    }

    return [];
  }

  private drawWave(): void {
    const { gfx, screenW } = this;
    const height = this.scene.scale.height;
    gfx.clear();

    const x = this.waveX;

    // Wide blue wave body
    gfx.fillStyle(0x0066cc, 0.35);
    gfx.fillRect(x - 30, 0, 60, height);

    // Main wave line with sin wobble
    gfx.lineStyle(4, 0x00ccff, 0.9);
    gfx.beginPath();
    gfx.moveTo(x, 0);
    for (let py = 0; py <= height; py += 4) {
      const wobble = Math.sin(py * 0.04 + this.elapsed * 0.008) * 12;
      gfx.lineTo(x + wobble, py);
    }
    gfx.strokePath();

    // Secondary trailing wave
    gfx.lineStyle(2, 0xaaddff, 0.5);
    gfx.beginPath();
    gfx.moveTo(x - 18, 0);
    for (let py = 0; py <= height; py += 4) {
      const wobble = Math.sin(py * 0.04 + this.elapsed * 0.008 + 0.8) * 10;
      gfx.lineTo(x - 18 + wobble, py);
    }
    gfx.strokePath();

    // White crest highlight
    gfx.lineStyle(3, 0xffffff, 0.6);
    gfx.beginPath();
    gfx.moveTo(x + 4, 0);
    for (let py = 0; py <= height; py += 4) {
      const wobble = Math.sin(py * 0.04 + this.elapsed * 0.008) * 12;
      gfx.lineTo(x + wobble + 4, py);
    }
    gfx.strokePath();

    void screenW; // suppress unused warning
  }

  destroy(): void {
    if (!this.isExpired) {
      this.isExpired = true;
      this.gfx.destroy();
    }
  }
}
