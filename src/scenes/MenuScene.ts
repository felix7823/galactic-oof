import * as Phaser from 'phaser';
import { getHighScore, getHighWave } from '../systems/HighScores';
import { SFX }       from '../systems/SoundManager';
import { IS_MOBILE } from '../utils/DeviceDetect';

export class MenuScene extends Phaser.Scene {
  private selectedPlayers: 1 | 2 = 1;
  private selectedMode: 'normal' | 'tutorial' = 'normal';

  private option1Text!:   Phaser.GameObjects.Text;
  private option2Text!:   Phaser.GameObjects.Text;
  private modeNormText!:  Phaser.GameObjects.Text;
  private modeTutText!:   Phaser.GameObjects.Text;

  private leftKey!:  Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private tabKey!:   Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.selectedPlayers = 1;
    this.selectedMode    = 'normal';

    // Title
    this.add.text(width / 2, height * 0.14, 'GALACTIC OOF', {
      fontSize: IS_MOBILE ? '40px' : '48px',
      color: '#00ffcc', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.24, 'Good aliens vs. Bad aliens', {
      fontSize: '18px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // High scores
    const hs = getHighScore();
    const hw = getHighWave();
    if (hs > 0 || hw > 0) {
      this.add.text(width / 2, height - 28,
        `Best score: ${hs}   |   Best wave: ${hw}`,
        { fontSize: '13px', color: '#666666' },
      ).setOrigin(0.5);
    }

    if (IS_MOBILE) {
      this.buildMobileMenu(width, height);
    } else {
      this.buildDesktopMenu(width, height);
    }
  }

  // ── Desktop layout ────────────────────────────────────────────────────────

  private buildDesktopMenu(width: number, height: number): void {
    const cy = height / 2;

    // ── Player count row ─────────────────────────────────────────────────────
    this.add.text(width / 2, cy - 14, 'Number of players:', {
      fontSize: '14px', color: '#666666',
    }).setOrigin(0.5);

    this.option1Text = this.add.text(width / 2 - 65, cy + 18, '1 PLAYER', {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.option2Text = this.add.text(width / 2 + 65, cy + 18, '2 PLAYERS', {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Mode row ──────────────────────────────────────────────────────────────
    this.add.text(width / 2, cy + 58, 'Mode:', {
      fontSize: '14px', color: '#666666',
    }).setOrigin(0.5);

    this.modeNormText = this.add.text(width / 2 - 70, cy + 84, 'NORMAL', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.modeTutText = this.add.text(width / 2 + 70, cy + 84, 'TUTORIAL', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.updatePlayerSelection();
    this.updateModeSelection();

    // ── Prompts ───────────────────────────────────────────────────────────────
    const startText = this.add.text(width / 2, cy + 130, 'Press SPACE to start', {
      fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);
    this.tweens.add({ targets: startText, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    this.add.text(width / 2, cy + 160, 'Press H for how to play', {
      fontSize: '14px', color: '#ff8800',
    }).setOrigin(0.5);

    this.add.text(width / 2, cy + 184,
      '← → switch players    TAB switch mode',
      { fontSize: '12px', color: '#444444' },
    ).setOrigin(0.5);

    // ── Keys ──────────────────────────────────────────────────────────────────
    const kb = this.input.keyboard!;
    this.leftKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.tabKey   = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    kb.once('keydown-ONE', () => { this.selectedPlayers = 1; this.updatePlayerSelection(); });
    kb.once('keydown-TWO', () => { this.selectedPlayers = 2; this.updatePlayerSelection(); });
    kb.once('keydown-H',   () => { this.scene.start('TutorialScene'); });
  }

  // ── Mobile layout ─────────────────────────────────────────────────────────

  private buildMobileMenu(width: number, height: number): void {
    // Normal play button
    const playBg = this.add
      .rectangle(width / 2, height * 0.46, 260, 68, 0x00ffcc, 0.15)
      .setStrokeStyle(2, 0x00ffcc, 0.8)
      .setInteractive();
    const playText = this.add.text(width / 2, height * 0.46, 'TAP TO PLAY', {
      fontSize: '26px', color: '#00ffcc', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.tweens.add({ targets: [playBg, playText], alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
    playBg.on('pointerdown', () => {
      SFX.startMusic(); SFX.menuConfirm();
      this.scene.start('ColorSelectScene', { players: 1, mode: 'normal' });
    });

    // Tutorial mode button
    const tutModeBg = this.add
      .rectangle(width / 2, height * 0.59, 260, 58, 0xffdd00, 0.12)
      .setStrokeStyle(2, 0xffdd00, 0.6)
      .setInteractive();
    this.add.text(width / 2, height * 0.59, 'TUTORIAL MODE', {
      fontSize: '20px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5);
    tutModeBg.on('pointerdown', () => {
      SFX.startMusic(); SFX.menuConfirm();
      this.scene.start('ColorSelectScene', { players: 1, mode: 'tutorial' });
    });

    // How to play button
    const howBg = this.add
      .rectangle(width / 2, height * 0.71, 200, 52, 0xff8800, 0.12)
      .setStrokeStyle(2, 0xff8800, 0.6)
      .setInteractive();
    this.add.text(width / 2, height * 0.71, 'HOW TO PLAY', {
      fontSize: '18px', color: '#ff8800', fontStyle: 'bold',
    }).setOrigin(0.5);
    howBg.on('pointerdown', () => { this.scene.start('TutorialScene'); });

    this.add.text(width / 2, height * 0.82, 'Play in portrait orientation', {
      fontSize: '12px', color: '#444444',
    }).setOrigin(0.5);
  }

  // ── Update (desktop only) ─────────────────────────────────────────────────

  update(): void {
    if (IS_MOBILE) return;

    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
      SFX.startMusic(); this.selectedPlayers = 1; this.updatePlayerSelection(); SFX.menuMove();
    }
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
      SFX.startMusic(); this.selectedPlayers = 2; this.updatePlayerSelection(); SFX.menuMove();
    }
    if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      SFX.startMusic();
      this.selectedMode = this.selectedMode === 'normal' ? 'tutorial' : 'normal';
      this.updateModeSelection();
      SFX.menuMove();
    }
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      SFX.startMusic(); SFX.menuConfirm();
      // Tutorial mode is always 1-player
      const players = this.selectedMode === 'tutorial' ? 1 : this.selectedPlayers;
      this.scene.start('ColorSelectScene', { players, mode: this.selectedMode });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private updatePlayerSelection(): void {
    const sel = '#ffdd00', unsel = '#444444';
    this.option1Text.setColor(this.selectedPlayers === 1 ? sel : unsel);
    this.option2Text.setColor(this.selectedPlayers === 2 ? sel : unsel);
    this.tweens.killTweensOf(this.option1Text);
    this.tweens.killTweensOf(this.option2Text);
    const active   = this.selectedPlayers === 1 ? this.option1Text : this.option2Text;
    const inactive = this.selectedPlayers === 1 ? this.option2Text : this.option1Text;
    inactive.setScale(1);
    this.tweens.add({ targets: active, scaleX: 1.08, scaleY: 1.08, duration: 350, yoyo: true, repeat: -1 });
  }

  private updateModeSelection(): void {
    const sel = '#ffdd00', unsel = '#444444';
    this.modeNormText.setColor(this.selectedMode === 'normal'   ? sel : unsel);
    this.modeTutText .setColor(this.selectedMode === 'tutorial' ? sel : unsel);
    this.tweens.killTweensOf(this.modeNormText);
    this.tweens.killTweensOf(this.modeTutText);
    const active   = this.selectedMode === 'normal' ? this.modeNormText : this.modeTutText;
    const inactive = this.selectedMode === 'normal' ? this.modeTutText  : this.modeNormText;
    inactive.setScale(1);
    this.tweens.add({ targets: active, scaleX: 1.08, scaleY: 1.08, duration: 350, yoyo: true, repeat: -1 });
  }
}
