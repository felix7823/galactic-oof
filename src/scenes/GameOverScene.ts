import * as Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number }): void {
    this.registry.set('finalScore', data.score ?? 0);
  }

  create(): void {
    const { width, height } = this.scale;
    const score = this.registry.get('finalScore') as number;

    this.add.text(width / 2, height / 2 - 60, 'GAME OVER', {
      fontSize: '48px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, `Score: ${score}`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const restartText = this.add.text(width / 2, height / 2 + 70, 'Press SPACE to play again', {
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
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
