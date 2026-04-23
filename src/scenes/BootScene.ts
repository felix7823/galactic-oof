import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Real sprite/audio assets will be loaded here once we have them.
    // e.g. this.load.image('player-ship', 'assets/sprites/player-ship.png');
    //      this.load.audio('oof', 'assets/audio/oof.mp3');
  }

  create(): void {
    this.generatePlaceholderTextures();
    this.scene.start('MenuScene');
  }

  private generatePlaceholderTextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Player ship — white triangle so setTint() shows the correct colour
    g.clear();
    g.fillStyle(0xffffff);
    g.fillTriangle(16, 0, 0, 32, 32, 32);
    g.generateTexture('player-ship', 32, 32);

    // Grok enemy — dull orange square with a notch
    g.clear();
    g.fillStyle(0xff4400);
    g.fillRect(0, 8, 28, 20);
    g.fillRect(8, 0, 12, 10);
    g.generateTexture('enemy-grok', 28, 28);

    // Sketh enemy — magenta diamond
    g.clear();
    g.fillStyle(0xff00aa);
    g.fillTriangle(12, 0, 0, 14, 24, 14);
    g.fillTriangle(12, 28, 0, 14, 24, 14);
    g.generateTexture('enemy-sketh', 24, 28);

    // Laser — white rectangle so setTint() shows the correct colour per player
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 16);
    g.generateTexture('laser', 4, 16);

    g.destroy();
  }
}
