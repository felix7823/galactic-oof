import * as Phaser from 'phaser';
import { SOLO_COLOR_ABILITY, ABILITY_LABEL } from '../abilities/AbilityTypes';
import { SFX }       from '../systems/SoundManager';
import { IS_MOBILE } from '../utils/DeviceDetect';

// ── Palette ──────────────────────────────────────────────────────────────────
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

export class ColorSelectScene extends Phaser.Scene {
  private playerCount: 1 | 2 = 1;
  private p1Index = 0;
  private p2Index = 2;

  // Swatch sizing — computed in create() based on screen width
  private slotW = 80;
  private shipW = 34;
  private shipH = 34;

  private p1Sel!:        Phaser.GameObjects.Graphics;
  private p2Sel!:        Phaser.GameObjects.Graphics;
  private p1NameText!:   Phaser.GameObjects.Text;
  private p1AbilityText!:Phaser.GameObjects.Text;
  private p2NameText!:   Phaser.GameObjects.Text;
  private p2AbilityText!:Phaser.GameObjects.Text;

  private swatchStartX!: number;
  private p1RowY!: number;
  private p2RowY!: number;

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
    this.p1Index = 0;
    this.p2Index = 2;
  }

  create(): void {
    const { width, height } = this.scale;
    const n = PALETTE.length;

    // ── Swatch dimensions: shrink on narrow mobile screens ───────────────────
    const maxSlotW = Math.floor((width - 20) / n);
    this.slotW = Math.min(80, maxSlotW);
    this.shipW = Math.round(this.slotW * 0.52);
    this.shipH = this.shipW;

    this.swatchStartX = (width - n * this.slotW) / 2;

    // Background + starfield
    this.add.rectangle(0, 0, width, height, 0x000011, 1).setOrigin(0);
    for (let i = 0; i < 60; i++) {
      this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(0.5, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.7),
      );
    }

    // Title
    this.add.text(width / 2, height * 0.07, 'CHOOSE YOUR SHIP', {
      fontSize: IS_MOBILE ? '28px' : '34px',
      color: '#00ffcc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (this.playerCount === 1) {
      this.build1P(width, height);
    } else {
      this.build2P(width, height);
    }

    // ── Keyboard (desktop) ────────────────────────────────────────────────────
    if (!IS_MOBILE) {
      const kb = this.input.keyboard!;
      this.leftKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      this.aKey     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.dKey     = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      // ESC → back to menu
      kb.once('keydown-ESC', () => {
        SFX.menuMove();
        this.scene.start('MenuScene');
      });
    }
  }

  // ── 1-Player layout ───────────────────────────────────────────────────────

  private build1P(width: number, height: number): void {
    this.p1RowY = height * (IS_MOBILE ? 0.36 : 0.40);

    const hintY = this.p1RowY - (IS_MOBILE ? 46 : 54);
    this.add.text(width / 2, hintY, IS_MOBILE ? 'Tap to pick colour' : '← / → to pick colour', {
      fontSize: '14px', color: '#888888',
    }).setOrigin(0.5);

    this.drawAllSwatches(this.p1RowY);

    this.p1Sel = this.add.graphics();
    this.p1NameText = this.add.text(width / 2, this.p1RowY + this.shipH / 2 + 12, '', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.p1AbilityText = this.add.text(width / 2, this.p1RowY + this.shipH / 2 + 36, '', {
      fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Dummy P2 objects (unused)
    this.p2Sel        = this.add.graphics();
    this.p2NameText   = this.add.text(-999, -999, '');
    this.p2AbilityText = this.add.text(-999, -999, '');

    this.refreshSelector(this.p1Sel, this.p1Index, this.p1RowY);
    this.refreshInfoLabels(this.p1NameText, this.p1AbilityText, this.p1Index);

    // Start prompt
    const startY = IS_MOBILE ? height * 0.62 : height * 0.70;
    if (IS_MOBILE) {
      // Large tappable START button
      const startBg = this.add
        .rectangle(width / 2, startY, 220, 58, 0x00ffcc, 0.15)
        .setStrokeStyle(2, 0x00ffcc, 0.7)
        .setInteractive();
      const startTxt = this.add.text(width / 2, startY, 'PLAY', {
        fontSize: '24px', color: '#00ffcc', fontStyle: 'bold',
      }).setOrigin(0.5);
      this.tweens.add({ targets: [startBg, startTxt], alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });
      startBg.on('pointerdown', () => this.startGame());

      // Back button
      const backBg = this.add
        .rectangle(width / 2, startY + 72, 160, 46, 0x888888, 0.10)
        .setStrokeStyle(1, 0x888888, 0.5)
        .setInteractive();
      this.add.text(width / 2, startY + 72, '← BACK', {
        fontSize: '16px', color: '#888888',
      }).setOrigin(0.5);
      backBg.on('pointerdown', () => { SFX.menuMove(); this.scene.start('MenuScene'); });

      // Mobile swatch tap zones
      this.addSwatchTapZones(this.p1RowY, (i) => {
        this.p1Index = i;
        this.refreshSelector(this.p1Sel, this.p1Index, this.p1RowY);
        this.refreshInfoLabels(this.p1NameText, this.p1AbilityText, this.p1Index);
        SFX.colorPick();
      });
    } else {
      const prompt = this.add.text(width / 2, startY, 'Press SPACE to start', {
        fontSize: '20px', color: '#ffffff',
      }).setOrigin(0.5);
      this.tweens.add({ targets: prompt, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

      this.add.text(width / 2, height - 18, 'ESC — back to menu', {
        fontSize: '12px', color: '#444444',
      }).setOrigin(0.5);
    }
  }

  // ── 2-Player layout ───────────────────────────────────────────────────────

  private build2P(width: number, height: number): void {
    this.p1RowY = height * 0.30;
    this.p2RowY = height * 0.63;

    // P1
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

    // P2
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

    const prompt = this.add.text(width / 2, height * 0.88, 'Press SPACE to start', {
      fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height - 18, 'ESC — back to menu', {
      fontSize: '12px', color: '#444444',
    }).setOrigin(0.5);
  }

  // ── Tap zones for mobile swatches ─────────────────────────────────────────

  private addSwatchTapZones(rowY: number, onPick: (index: number) => void): void {
    for (let i = 0; i < PALETTE.length; i++) {
      this.add
        .rectangle(this.slotCX(i), rowY, this.slotW - 2, this.shipH + 22, 0x000000, 0)
        .setInteractive()
        .on('pointerdown', () => onPick(i));
    }
  }

  // ── Update (desktop keyboard) ─────────────────────────────────────────────

  update(): void {
    if (IS_MOBILE) return;

    const n = PALETTE.length;

    if (this.playerCount === 1) {
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
      this.startGame();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private startGame(): void {
    SFX.menuConfirm();
    this.scene.start('GameScene', {
      players: this.playerCount,
      p1Color: PALETTE[this.p1Index],
      p2Color: PALETTE[this.p2Index],
    });
  }

  private slotCX(index: number): number {
    return this.swatchStartX + index * this.slotW + this.slotW / 2;
  }

  private drawAllSwatches(rowY: number): void {
    for (let i = 0; i < PALETTE.length; i++) {
      const g = this.add.graphics();
      this.drawOneSwatch(g, this.slotCX(i), rowY, PALETTE[i]);
    }
  }

  private drawOneSwatch(
    g: Phaser.GameObjects.Graphics,
    cx: number, cy: number, color: number,
  ): void {
    const hw = this.shipW / 2;
    const hh = this.shipH / 2;
    const eyeR  = Math.max(2, hh * 0.35);
    const pupR  = Math.max(1, eyeR * 0.55);
    const eyeOX = hw * 0.45;
    const eyeOY = hh * 0.25;

    g.fillStyle(color, 1);
    g.fillTriangle(cx, cy - hh, cx - hw, cy + hh, cx + hw, cy + hh);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - eyeOX, cy + eyeOY, eyeR);
    g.fillCircle(cx + eyeOX, cy + eyeOY, eyeR);
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - eyeOX, cy + eyeOY + 0.5, pupR);
    g.fillCircle(cx + eyeOX, cy + eyeOY + 0.5, pupR);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - eyeOX + 1, cy + eyeOY - 0.5, Math.max(0.5, pupR * 0.5));
    g.fillCircle(cx + eyeOX + 1, cy + eyeOY - 0.5, Math.max(0.5, pupR * 0.5));
  }

  private refreshSelector(
    sel: Phaser.GameObjects.Graphics,
    index: number, rowY: number,
  ): void {
    const cx    = this.slotCX(index);
    const color = PALETTE[index];
    const hw    = this.slotW / 2 - 4;
    const hh    = this.shipH / 2 + 8;

    sel.clear();
    sel.lineStyle(6, color, 0.25);
    sel.strokeRect(cx - hw - 2, rowY - hh - 2, (hw + 2) * 2, (hh + 2) * 2);
    sel.lineStyle(3, color, 1);
    sel.strokeRect(cx - hw, rowY - hh, hw * 2, hh * 2);
    sel.fillStyle(color, 1);
    sel.fillCircle(cx - hw, rowY - hh, 3);
    sel.fillCircle(cx + hw, rowY - hh, 3);
    sel.fillCircle(cx - hw, rowY + hh, 3);
    sel.fillCircle(cx + hw, rowY + hh, 3);
  }

  private refreshInfoLabels(
    nameText: Phaser.GameObjects.Text,
    abilityText: Phaser.GameObjects.Text,
    index: number,
  ): void {
    const color     = PALETTE[index];
    const colorName = COLOR_NAMES[color] ?? '???';
    const abilityKey = SOLO_COLOR_ABILITY[color];
    const ability   = abilityKey ? ABILITY_LABEL[abilityKey] : '???';
    const hexStr    = '#' + color.toString(16).padStart(6, '0');
    nameText.setText(colorName).setColor(hexStr);
    abilityText.setText(`Ability: ${ability}`);
  }
}
