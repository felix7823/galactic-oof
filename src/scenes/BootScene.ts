import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Real assets loaded here once we have them
  }

  create(): void {
    this.generatePlaceholderTextures();
    this.scene.start('MenuScene');
  }

  private generatePlaceholderTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    // ── Player 1 — teal triangle, friendly face ───────────────────────────────
    g.clear();
    g.fillStyle(0x00ffcc);
    g.fillTriangle(16, 0, 0, 32, 32, 32);
    // Eyes
    g.fillStyle(0xffffff); g.fillCircle(11, 20, 4);
    g.fillStyle(0xffffff); g.fillCircle(21, 20, 4);
    g.fillStyle(0x004433); g.fillCircle(11, 20, 2);
    g.fillStyle(0x004433); g.fillCircle(21, 20, 2);
    g.fillStyle(0xffffff); g.fillCircle(12, 19, 1);
    g.fillStyle(0xffffff); g.fillCircle(22, 19, 1);
    // Smile
    g.lineStyle(2, 0x004433, 1);
    g.beginPath(); g.arc(16, 26, 4, 0, Math.PI, false); g.strokePath();
    g.generateTexture('player1-ship', 32, 32);

    // ── Player 2 — orange triangle, determined face ───────────────────────────
    g.clear();
    g.fillStyle(0xff8800);
    g.fillTriangle(16, 0, 0, 32, 32, 32);
    // Eyes
    g.fillStyle(0xffffff); g.fillCircle(11, 20, 4);
    g.fillStyle(0xffffff); g.fillCircle(21, 20, 4);
    g.fillStyle(0x552200); g.fillCircle(11, 20, 2);
    g.fillStyle(0x552200); g.fillCircle(21, 20, 2);
    g.fillStyle(0xffffff); g.fillCircle(12, 19, 1);
    g.fillStyle(0xffffff); g.fillCircle(22, 19, 1);
    // Determined brows (angled lines)
    g.lineStyle(2, 0x552200, 1);
    g.beginPath(); g.moveTo(8, 14); g.lineTo(14, 16); g.strokePath();
    g.beginPath(); g.moveTo(24, 14); g.lineTo(18, 16); g.strokePath();
    // Flat firm mouth
    g.lineStyle(2, 0x552200, 1);
    g.beginPath(); g.moveTo(12, 26); g.lineTo(20, 26); g.strokePath();
    g.generateTexture('player2-ship', 32, 32);

    // ── Grok enemy — orange rectangle, angry face ─────────────────────────────
    g.clear();
    g.fillStyle(0xff4400);
    g.fillRect(0, 8, 28, 20);
    g.fillRect(8, 0, 12, 10);
    // Eyes
    g.fillStyle(0xffffff); g.fillCircle(8, 18, 3.5);
    g.fillStyle(0xffffff); g.fillCircle(20, 18, 3.5);
    g.fillStyle(0x330000); g.fillCircle(8, 19, 2);
    g.fillStyle(0x330000); g.fillCircle(20, 19, 2);
    // Angry eyebrows (V-shape inward)
    g.lineStyle(2, 0x330000, 1);
    g.beginPath(); g.moveTo(4, 12); g.lineTo(12, 14); g.strokePath();
    g.beginPath(); g.moveTo(24, 12); g.lineTo(16, 14); g.strokePath();
    // Frown
    g.lineStyle(2, 0x330000, 1);
    g.beginPath(); g.arc(14, 26, 4, 0, Math.PI, true); g.strokePath();
    g.generateTexture('enemy-grok', 28, 28);

    // ── Sketh enemy — magenta diamond, alien face ─────────────────────────────
    g.clear();
    g.fillStyle(0xff00aa);
    g.fillTriangle(12, 0, 0, 14, 24, 14);
    g.fillTriangle(12, 28, 0, 14, 24, 14);
    // Large alien eyes
    g.fillStyle(0xffffff); g.fillCircle(8, 11, 3.5);
    g.fillStyle(0xffffff); g.fillCircle(16, 11, 3.5);
    g.fillStyle(0x330022); g.fillCircle(8, 11, 2);
    g.fillStyle(0x330022); g.fillCircle(16, 11, 2);
    g.fillStyle(0xffffff); g.fillCircle(9, 10, 1);
    g.fillStyle(0xffffff); g.fillCircle(17, 10, 1);
    // Jagged alien mouth (zigzag dots)
    g.fillStyle(0x330022);
    g.fillRect(7,  17, 2, 2);
    g.fillRect(11, 19, 2, 2);
    g.fillRect(15, 17, 2, 2);
    g.generateTexture('enemy-sketh', 24, 28);

    // ── Zolt enemy — yellow square, straight face ────────────────────────────
    g.clear();
    g.fillStyle(0xffdd00);
    g.fillRect(0, 0, 28, 28);
    // Eyes
    g.fillStyle(0xffffff); g.fillCircle(9,  11, 4);
    g.fillStyle(0xffffff); g.fillCircle(19, 11, 4);
    g.fillStyle(0x332200); g.fillCircle(9,  12, 2);
    g.fillStyle(0x332200); g.fillCircle(19, 12, 2);
    g.fillStyle(0xffffff); g.fillCircle(10, 10, 1);
    g.fillStyle(0xffffff); g.fillCircle(20, 10, 1);
    // Straight mouth (no expression)
    g.lineStyle(2, 0x332200, 1);
    g.beginPath(); g.moveTo(8, 19); g.lineTo(20, 19); g.strokePath();
    // Lightning bolt symbol on body (small ⚡ hint)
    g.fillStyle(0x332200, 0.6);
    g.fillTriangle(14, 4, 10, 7, 14, 7);
    g.fillTriangle(14, 7, 18, 10, 14, 10);
    g.generateTexture('enemy-zolt', 28, 28);

    // ── Laser — white rectangle ───────────────────────────────────────────────
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 16);
    g.generateTexture('laser', 4, 16);

    g.destroy();
  }
}
