import * as Phaser from 'phaser';
import { SOLO_COLOR_ABILITY, ABILITY_LABEL } from '../abilities/AbilityTypes';
import { SFX } from '../systems/SoundManager';

// ── Palette (must match GameScene's SOLO_PALETTE) ────────────────────────────
export const PALETTE = [
  0xff0055, // crimson
  0x00ff88, // mint
  0xffdd00, // gold
  0x00aaff, // azure
  0xbb00ff, // violet
  0xff6666, // salmon
  0x55ff00, // lime
  0x00ffdd, // aqua
] as const;

const COLOR_NAMES: Record<number, string> = {
  0xff0055: 'CRIMSON',
  0x00ff88: 'MINT',
  0xffdd00: 'GOLD',
  0x00aaff: 'AZURE',
  0xbb00ff: 'VIOLET',
  0xff6666: 'SALMON',
  0x55ff00: 'LIME',
  0x00ffdd: 'AQUA',
};

// Layout
const SLOT_W  = 80;   // px per swatch slot
const SHIP_W  = 34;   // triangle base width
const SHIP_H  = 34;   // triangle height

export class ColorSelectScene extends Phaser.Scene {
  private playerCount: 1 | 2 = 1;
  private p1Index = 0;
  private p2Index = 2; // default: gold, so P1/P2 start with different colours

  // Selection-highlight graphics (redrawn on navigation)
  private p1Sel!: Phaser.GameObjects.Graphics;
  private p2Sel!: Phaser.GameObjects.Graphics;

  // Info labels updated on navigation
  private p1NameText!:    Phaser.GameObjects.Text;
  private p1AbilityText!: Phaser.GameObjects.Text;
  private p2NameText!:    Phaser.GameObjects.Text;
  private p2AbilityText!: Phaser.GameObjects.Text;

  // Stored layout values for refreshing
  private swatchStartX!: number;
  private p1RowY!:        number;
  private p2RowY!:        number;

  // Keys
  private leftKey!:  Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private aKey!:     Phaser.Input.Keyboard.Key;
  private dKey!:     Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'ColorSelectScene' });
  }

  init(data: { players?: 1 | 2 }): void {
    this.playerCount = data?.players ?? 1;
    // Reset to defaults each time
    this.p1Index = 0;
    this.p2Index = 2;
  }

  create(): void {
    const { width, height } = this.scale;
    const n = PALETTE.length;

    this.swatchStartX = (width - n * SLOT_W) / 2;

    // ── Background ────────────────────────────────────────────────────────────
    this.add.rectangle(0, 0, width, height, 0x000011, 1).setOrigin(0);

    // ── Starfield ─────────────────────────────────────────────────────────────
    for (let i = 0; i < 60; i++) {
      const sx = Phaser.Math.Between(0, width);
      const sy = Phaser.Math.Between(0, height);
      this.add.circle(sx, sy, Phaser.Math.FloatBetween(0.5, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.7));
    }

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add.text(width / 2, height * 0.07, 'CHOOSE YOUR SHIP', {
      fontSize: '34px', color: '#00ffcc', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (this.playerCount === 1) {
      // ── 1-player layout ────────────────────────────────────────────────────
      this.p1RowY = height * 0.40;

      this.add.text(width / 2, this.p1RowY - 54, '← / → to pick colour', {
        fontSize: '14px', color: '#888888',
      }).setOrigin(0.5);

      // Draw all swatches
      this.drawAllSwatches(this.p1RowY);

      // Selection highlight + labels
      this.p1Sel = this.add.graphics();
      this.p1NameText    = this.add.text(width / 2, this.p1RowY + 44, '', {
        fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.p1AbilityText = this.add.text(width / 2, this.p1RowY + 70, '', {
        fontSize: '14px', color: '#aaaaaa',
      }).setOrigin(0.5);
      this.p2Sel        = this.add.graphics(); // unused in 1P, just a dummy
      this.p2NameText    = this.add.text(-999, -999, '');
      this.p2AbilityText = this.add.text(-999, -999, '');

      this.refreshSelector(this.p1Sel, this.p1Index, this.p1RowY);
      this.refreshInfoLabels(this.p1NameText, this.p1AbilityText, this.p1Index);

      // Start prompt
      const prompt = this.add.text(width / 2, height * 0.70, 'Press SPACE to start', {
        fontSize: '20px', color: '#ffffff',
      }).setOrigin(0.5);
      this.tweens.add({ targets: prompt, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    } else {
      // ── 2-player layout ────────────────────────────────────────────────────
      this.p1RowY = height * 0.30;
      this.p2RowY = height * 0.63;

      // P1 section
      this.add.text(width / 2, this.p1RowY - 56, 'P1  —  A / D to pick', {
        fontSize: '14px', color: '#888888',
      }).setOrigin(0.5);
      this.drawAllSwatches(this.p1RowY);
      this.p1Sel = this.add.graphics();
      this.p1NameText    = this.add.text(width / 2, this.p1RowY + 44, '', {
        fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.p1AbilityText = this.add.text(width / 2, this.p1RowY + 66, '', {
        fontSize: '13px', color: '#aaaaaa',
      }).setOrigin(0.5);

      // P2 section
      this.add.text(width / 2, this.p2RowY - 56, 'P2  —  ← / → to pick', {
        fontSize: '14px', color: '#888888',
      }).setOrigin(0.5);
      this.drawAllSwatches(this.p2RowY);
      this.p2Sel = this.add.graphics();
      this.p2NameText    = this.add.text(width / 2, this.p2RowY + 44, '', {
        fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.p2AbilityText = this.add.text(width / 2, this.p2RowY + 66, '', {
        fontSize: '13px', color: '#aaaaaa',
      }).setOrigin(0.5);

      this.refreshSelector(this.p1Sel, this.p1Index, this.p1RowY);
      this.refreshInfoLabels(this.p1NameText, this.p1AbilityText, this.p1Index);
      this.refreshSelector(this.p2Sel, this.p2Index, this.p2RowY);
      this.refreshInfoLabels(this.p2NameText, this.p2AbilityText, this.p2Index);

      // Start prompt
      const prompt = this.add.text(width / 2, height * 0.88, 'Press SPACE to start', {
        fontSize: '20px', color: '#ffffff',
      }).setOrigin(0.5);
      this.tweens.add({ targets: prompt, alpha: 0, duration: 600, yoyo: true, repeat: -1 });
    }

    // ── Keys ──────────────────────────────────────────────────────────────────
    const kb = this.input.keyboard!;
    this.leftKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.aKey     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(): void {
    const n = PALETTE.length;

    if (this.playerCount === 1) {
      // 1P: ←→ controls the single colour picker
      if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
        this.p1Index = (this.p1Index - 1 + n) % n;
        this.refreshSelector(this.p1Sel, this.p1Index, this.p1RowY);
        this.refreshInfoLabels(this.p1NameText, this.p1AbilityText, this.p1Index);
        SFX.colorPick();
      }
      if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
        this.p1Index = (this.p1Index + 1) % n;
        this.refreshSelector(this.p1Sel, this.p1Index, this.p1RowY);
        this.refreshInfoLabels(this.p1NameText, this.p1AbilityText, this.p1Index);
        SFX.colorPick();
      }
    } else {
      // 2P: A/D for P1, ←→ for P2
      if (Phaser.Input.Keyboard.JustDown(this.aKey)) {
        this.p1Index = (this.p1Index - 1 + n) % n;
        this.refreshSelector(this.p1Sel, this.p1Index, this.p1RowY);
        this.refreshInfoLabels(this.p1NameText, this.p1AbilityText, this.p1Index);
        SFX.colorPick();
      }
      if (Phaser.Input.Keyboard.JustDown(this.dKey)) {
        this.p1Index = (this.p1Index + 1) % n;
        this.refreshSelector(this.p1Sel, this.p1Index, this.p1RowY);
        this.refreshInfoLabels(this.p1NameText, this.p1AbilityText, this.p1Index);
        SFX.colorPick();
      }
      if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
        this.p2Index = (this.p2Index - 1 + n) % n;
        this.refreshSelector(this.p2Sel, this.p2Index, this.p2RowY);
        this.refreshInfoLabels(this.p2NameText, this.p2AbilityText, this.p2Index);
        SFX.colorPick();
      }
      if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
        this.p2Index = (this.p2Index + 1) % n;
        this.refreshSelector(this.p2Sel, this.p2Index, this.p2RowY);
        this.refreshInfoLabels(this.p2NameText, this.p2AbilityText, this.p2Index);
        SFX.colorPick();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      SFX.menuConfirm();
      this.scene.start('GameScene', {
        players:  this.playerCount,
        p1Color:  PALETTE[this.p1Index],
        p2Color:  PALETTE[this.p2Index],
      });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private slotCX(index: number): number {
    return this.swatchStartX + index * SLOT_W + SLOT_W / 2;
  }

  /** Draw all 8 colour swatches as mini ships at the given row Y. */
  private drawAllSwatches(rowY: number): void {
    for (let i = 0; i < PALETTE.length; i++) {
      const g = this.add.graphics();
      this.drawOneSwatch(g, this.slotCX(i), rowY, PALETTE[i]);
    }
  }

  /** Draw a single mini ship triangle with tiny eyes at (cx, cy). */
  private drawOneSwatch(g: Phaser.GameObjects.Graphics, cx: number, cy: number, color: number): void {
    const hw = SHIP_W / 2;
    const hh = SHIP_H / 2;

    // Triangle body
    g.fillStyle(color, 1);
    g.fillTriangle(cx, cy - hh, cx - hw, cy + hh, cx + hw, cy + hh);

    // Tiny eyes
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 6,  cy + 4, 3.5);
    g.fillCircle(cx + 6,  cy + 4, 3.5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - 6,  cy + 5, 2);
    g.fillCircle(cx + 6,  cy + 5, 2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 5,  cy + 4, 1);
    g.fillCircle(cx + 7,  cy + 4, 1);
  }

  /** Redraw the selection highlight box around the chosen swatch. */
  private refreshSelector(
    sel:   Phaser.GameObjects.Graphics,
    index: number,
    rowY:  number,
  ): void {
    const cx    = this.slotCX(index);
    const color = PALETTE[index];
    const hw    = SLOT_W / 2 - 4;
    const hh    = SHIP_H / 2 + 8;

    sel.clear();
    // Glow backing
    sel.lineStyle(6, color, 0.25);
    sel.strokeRect(cx - hw - 2, rowY - hh - 2, (hw + 2) * 2, (hh + 2) * 2);
    // Main border
    sel.lineStyle(3, color, 1);
    sel.strokeRect(cx - hw, rowY - hh, hw * 2, hh * 2);
    // Corner dots for style
    sel.fillStyle(color, 1);
    sel.fillCircle(cx - hw, rowY - hh, 3);
    sel.fillCircle(cx + hw, rowY - hh, 3);
    sel.fillCircle(cx - hw, rowY + hh, 3);
    sel.fillCircle(cx + hw, rowY + hh, 3);
  }

  /** Update colour name and ability text for the chosen palette index. */
  private refreshInfoLabels(
    nameText:    Phaser.GameObjects.Text,
    abilityText: Phaser.GameObjects.Text,
    index:       number,
  ): void {
    const color      = PALETTE[index];
    const colorName  = COLOR_NAMES[color] ?? '???';
    const abilityKey = SOLO_COLOR_ABILITY[color];
    const ability    = abilityKey ? ABILITY_LABEL[abilityKey] : '???';
    const hexStr     = '#' + color.toString(16).padStart(6, '0');

    nameText.setText(colorName).setColor(hexStr);
    abilityText.setText(`Ability: ${ability}`);
  }
}
