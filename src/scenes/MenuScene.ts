import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 60, 'GALACTIC OOF', {
      fontSize: '48px',
      color: '#00ffcc',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, 'Good aliens vs. Bad aliens', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    const startText = this.add.text(width / 2, height / 2 + 80, 'Press SPACE to start', {
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Blink the prompt
    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
