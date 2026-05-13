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

    // ── Laser Node — red circle, cool sunglasses face ─────────────────────────
    g.clear();
    // Dark outer ring (charging glow)
    g.fillStyle(0x770000, 1);
    g.fillCircle(16, 16, 15);
    // Main red body
    g.fillStyle(0xff1122, 1);
    g.fillCircle(16, 16, 13);
    // Lighter centre tint
    g.fillStyle(0xff3344, 0.5);
    g.fillCircle(16, 14, 8);

    // White eye whites
    g.fillStyle(0xffffff, 1);
    g.fillCircle(11, 14, 4.5);
    g.fillCircle(21, 14, 4.5);
    // Pupils
    g.fillStyle(0x330000, 1);
    g.fillCircle(11, 15, 2.5);
    g.fillCircle(21, 15, 2.5);
    // Eye highlights
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 13, 1);
    g.fillCircle(22, 13, 1);

    // Sunglasses — dark lenses over eyes
    g.fillStyle(0x111111, 0.92);
    g.fillRect(6,  10, 9, 7);   // left lens
    g.fillRect(17, 10, 9, 7);   // right lens
    // Glasses bridge connecting lenses
    g.fillStyle(0x222222, 1);
    g.fillRect(15, 12, 2, 3);
    // Glasses side arm (left)
    g.fillRect(3, 11, 3, 2);
    // Glasses side arm (right)
    g.fillRect(26, 11, 3, 2);
    // Lens outlines for style
    g.lineStyle(1, 0x000000, 1);
    g.strokeRect(6,  10, 9, 7);
    g.strokeRect(17, 10, 9, 7);
    // Lens shine
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(7, 11, 3, 2);
    g.fillRect(18, 11, 3, 2);

    // Cool one-sided smirk
    g.lineStyle(2, 0x550000, 1);
    g.beginPath();
    g.moveTo(10, 22);
    g.lineTo(16, 21);
    g.lineTo(20, 23);
    g.strokePath();

    g.generateTexture('laser-node', 32, 32);

    // ── Super Apple — blue, larger, gold star ─────────────────────────────────
    g.clear();
    // Outer glow ring
    g.fillStyle(0x0055ff, 0.35);
    g.fillCircle(16, 19, 15);
    // Body
    g.fillStyle(0x1188ff, 1);
    g.fillCircle(16, 19, 13);
    // Shine highlight
    g.fillStyle(0xaaddff, 1);
    g.fillCircle(11, 13, 5);
    // Lightning bolt (⚡) — two parallelograms forming a Z-shape
    g.fillStyle(0xffdd00, 1);
    // Upper stroke: top-right → bottom-left diagonal
    g.fillTriangle(20, 12, 15, 12, 10, 21);
    g.fillTriangle(20, 12, 10, 21, 15, 21);
    // Lower stroke: shifted 3 px right → creates the ⚡ notch
    g.fillTriangle(18, 21, 13, 21, 11, 29);
    g.fillTriangle(18, 21, 11, 29, 16, 29);
    // White inner highlight — makes it look electric
    g.fillStyle(0xffffff, 0.75);
    g.fillTriangle(19, 13, 17, 13, 12, 20);
    // Stem
    g.fillStyle(0x885522, 1);
    g.fillRect(15, 4, 3, 7);
    // Leaf
    g.fillStyle(0x44cc00, 1);
    g.fillTriangle(15, 9, 24, 3, 19, 11);
    g.generateTexture('super-apple', 32, 32);

    // ── Apple — red circle with stem and leaf ─────────────────────────────────
    g.clear();
    // Body
    g.fillStyle(0xee2222, 1);
    g.fillCircle(14, 17, 12);
    // Shine highlight
    g.fillStyle(0xff9999, 1);
    g.fillCircle(10, 12, 4);
    // Leaf
    g.fillStyle(0x44cc00, 1);
    g.fillTriangle(14, 9, 22, 3, 18, 10);
    // Stem
    g.fillStyle(0x885522, 1);
    g.fillRect(13, 3, 3, 7);

    g.generateTexture('apple', 28, 28);

    g.destroy();
  }
}
