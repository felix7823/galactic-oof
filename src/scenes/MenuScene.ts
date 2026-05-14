import * as Phaser from 'phaser';
import { getHighScore, getHighWave } from '../systems/HighScores';
import { SFX }       from '../systems/SoundManager';
import { IS_MOBILE } from '../utils/DeviceDetect';

export class MenuScene extends Phaser.Scene {
  private selectedPlayers: 1 | 2 = 1;
  private option1Text!: Phaser.GameObjects.Text;
  private option2Text!: Phaser.GameObjects.Text;
  private leftKey!:  Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.selectedPlayers = 1;

    // Title
    this.add.text(width / 2, height * 0.18, 'GALACTIC OOF', {
      fontSize: IS_MOBILE ? '40px' : '48px',
      color: '#00ffcc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.28, 'Good aliens vs. Bad aliens', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // High scores
    const hs = getHighScore();
    const hw = getHighWave();
    if (hs > 0 || hw > 0) {
      this.add.text(width / 2, height - 28, `Best score: ${hs}   |   Best wave: ${hw}`, {
        fontSize: '13px',
        color: '#666666',
      }).setOrigin(0.5);
    }

    if (IS_MOBILE) {
      this.buildMobileMenu(width, height);
    } else {
      this.buildDesktopMenu(width, height);
    }
  }

  // ── Desktop layout ────────────────────────────────────────────────────────

  private buildDesktopMenu(width: number, height: number): void {
    this.add.text(width / 2, height / 2 + 18, 'Number of players:', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    this.option1Text = this.add.text(width / 2 - 60, height / 2 + 50, '1 PLAYER', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.option2Text = this.add.text(width / 2 + 60, height / 2 + 50, '2 PLAYERS', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.updateSelection();

    const startText = this.add.text(width / 2, height / 2 + 110, 'Press SPACE to start', {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 148, 'Press T for tutorial', {
      fontSize: '15px',
      color: '#ff8800',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 180, '← → to change players', {
      fontSize: '13px',
      color: '#555555',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    const kb = this.input.keyboard!;
    this.leftKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    kb.once('keydown-ONE', () => { this.selectedPlayers = 1; this.updateSelection(); });
    kb.once('keydown-TWO', () => { this.selectedPlayers = 2; this.updateSelection(); });
    kb.once('keydown-T',   () => { this.scene.start('TutorialScene'); });
  }

  // ── Mobile layout ─────────────────────────────────────────────────────────

  private buildMobileMenu(width: number, height: number): void {
    // Large PLAY button
    const playBg = this.add
      .rectangle(width / 2, height * 0.50, 260, 68, 0x00ffcc, 0.15)
      .setStrokeStyle(2, 0x00ffcc, 0.8)
      .setInteractive();

    const playText = this.add.text(width / 2, height * 0.50, 'TAP TO PLAY', {
      fontSize: '26px',
      color: '#00ffcc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [playBg, playText],
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    playBg.on('pointerdown', () => {
      SFX.startMusic();
      SFX.menuConfirm();
      this.scene.start('ColorSelectScene', { players: 1 });
    });

    // Tutorial button
    const tutBg = this.add
      .rectangle(width / 2, height * 0.65, 200, 54, 0xff8800, 0.12)
      .setStrokeStyle(2, 0xff8800, 0.6)
      .setInteractive();

    this.add.text(width / 2, height * 0.65, 'TUTORIAL', {
      fontSize: '20px',
      color: '#ff8800',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    tutBg.on('pointerdown', () => {
      this.scene.start('TutorialScene');
    });

    this.add.text(width / 2, height * 0.78, 'Play in portrait orientation', {
      fontSize: '12px',
      color: '#444444',
    }).setOrigin(0.5);
  }

  // ── Update (desktop only) ─────────────────────────────────────────────────

  update(): void {
    if (IS_MOBILE) return;

    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
      SFX.startMusic();
      this.selectedPlayers = 1;
      this.updateSelection();
      SFX.menuMove();
    }
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
      SFX.startMusic();
      this.selectedPlayers = 2;
      this.updateSelection();
      SFX.menuMove();
    }
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      SFX.startMusic();
      SFX.menuConfirm();
      this.scene.start('ColorSelectScene', { players: this.selectedPlayers });
    }
  }

  private updateSelection(): void {
    const sel   = '#ffdd00';
    const unsel = '#444444';
    this.option1Text.setColor(this.selectedPlayers === 1 ? sel : unsel);
    this.option2Text.setColor(this.selectedPlayers === 2 ? sel : unsel);

    this.tweens.killTweensOf(this.option1Text);
    this.tweens.killTweensOf(this.option2Text);
    const active   = this.selectedPlayers === 1 ? this.option1Text : this.option2Text;
    const inactive = this.selectedPlayers === 1 ? this.option2Text : this.option1Text;
    inactive.setScale(1);
    this.tweens.add({ targets: active, scaleX: 1.08, scaleY: 1.08, duration: 350, yoyo: true, repeat: -1 });
  }
}
