import * as Phaser from 'phaser';

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
    this.add.text(width / 2, height / 2 - 90, 'GALACTIC OOF', {
      fontSize: '48px',
      color: '#00ffcc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 38, 'Good aliens vs. Bad aliens', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // ── Player count selector ─────────────────────────────────────────────────
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

    // ── Start / tutorial prompts ──────────────────────────────────────────────
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

    // Blink the start prompt
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // ── Keys ──────────────────────────────────────────────────────────────────
    const kb = this.input.keyboard!;
    this.leftKey  = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.spaceKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    kb.once('keydown-ONE', () => { this.selectedPlayers = 1; this.updateSelection(); });
    kb.once('keydown-TWO', () => { this.selectedPlayers = 2; this.updateSelection(); });
    kb.once('keydown-T',   () => { this.scene.start('TutorialScene'); });
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.leftKey)) {
      this.selectedPlayers = 1;
      this.updateSelection();
    }
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) {
      this.selectedPlayers = 2;
      this.updateSelection();
    }
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.scene.start('GameScene', { players: this.selectedPlayers });
    }
  }

  private updateSelection(): void {
    const sel   = '#ffdd00';
    const unsel = '#444444';
    this.option1Text.setColor(this.selectedPlayers === 1 ? sel : unsel);
    this.option2Text.setColor(this.selectedPlayers === 2 ? sel : unsel);

    // Underline the selected option via scale pulse
    this.tweens.killTweensOf(this.option1Text);
    this.tweens.killTweensOf(this.option2Text);
    const active   = this.selectedPlayers === 1 ? this.option1Text : this.option2Text;
    const inactive = this.selectedPlayers === 1 ? this.option2Text : this.option1Text;
    inactive.setScale(1);
    this.tweens.add({ targets: active, scaleX: 1.08, scaleY: 1.08, duration: 350, yoyo: true, repeat: -1 });
  }
}
