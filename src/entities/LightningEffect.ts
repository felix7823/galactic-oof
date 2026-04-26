import * as Phaser from 'phaser';

const DURATION = 380;
const STEPS    = 9;

export class LightningEffect {
  private readonly gfx:      Phaser.GameObjects.Graphics;
  private readonly segments: { x: number; y: number }[];
  private elapsed = 0;
  isDone = false;

  constructor(scene: Phaser.Scene, x1: number, y1: number, x2: number, y2: number) {
    this.gfx = scene.add.graphics();
    this.gfx.setDepth(25);

    // Pre-bake the zigzag so it holds its shape while it fades
    this.segments = [{ x: x1, y: y1 }];
    for (let i = 1; i < STEPS; i++) {
      const t = i / STEPS;
      this.segments.push({
        x: x1 + (x2 - x1) * t + Phaser.Math.Between(-18, 18),
        y: y1 + (y2 - y1) * t + Phaser.Math.Between(-18, 18),
      });
    }
    this.segments.push({ x: x2, y: y2 });
  }

  update(delta: number): void {
    if (this.isDone) return;

    this.elapsed += delta;
    if (this.elapsed >= DURATION) {
      this.isDone = true;
      this.gfx.destroy();
      return;
    }

    const alpha = 1 - this.elapsed / DURATION;
    this.gfx.clear();

    // Wide outer halo
    this.gfx.lineStyle(10, 0xffff00, alpha * 0.12);
    this.stroke();

    // Mid glow
    this.gfx.lineStyle(5, 0xffff88, alpha * 0.45);
    this.stroke();

    // Main bolt
    this.gfx.lineStyle(2, 0xffff00, alpha * 0.95);
    this.stroke();

    // White core
    this.gfx.lineStyle(1, 0xffffff, alpha);
    this.stroke();
  }

  private stroke(): void {
    this.gfx.beginPath();
    this.gfx.moveTo(this.segments[0].x, this.segments[0].y);
    for (let i = 1; i < this.segments.length; i++) {
      this.gfx.lineTo(this.segments[i].x, this.segments[i].y);
    }
    this.gfx.strokePath();
  }

  destroy(): void {
    if (!this.isDone) {
      this.isDone = true;
      this.gfx.destroy();
    }
  }
}
