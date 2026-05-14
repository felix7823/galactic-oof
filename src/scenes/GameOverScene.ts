import * as Phaser from 'phaser';
import { submitRun, getHighScore, getHighWave } from '../systems/HighScores';
import { IS_MOBILE } from '../utils/DeviceDetect';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score?: number; wave?: number }): void {
    this.registry.set('finalScore', data.score ?? 0);
    this.registry.set('finalWave',  data.wave  ?? 1);
  }

  create(): void {
    const { width, height } = this.scale;
    const score = this.registry.get('finalScore') as number;
    const wave  = this.registry.get('finalWave')  as number;

    const { newHighScore, newHighWave } = submitRun(score, wave);
    const highScore = getHighScore();
    const highWave  = getHighWave();

    // ── Title ─────────────────────────────────────────────────────────────────
    this.add.text(width / 2, height * 0.15, 'GAME OVER', {
      fontSize: '48px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── This run ──────────────────────────────────────────────────────────────
    this.add.text(width / 2, height * 0.32, `Score: ${score}`, {
      fontSize: '26px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, `Wave reached: ${wave}`, {
      fontSize: '20px', color: '#ffaa00',
    }).setOrigin(0.5);

    // ── Records ───────────────────────────────────────────────────────────────
    const dividerY = height * 0.52;
    this.add.rectangle(width / 2, dividerY, width * 0.6, 1, 0x444444).setOrigin(0.5);

    const scoreLabel = newHighScore ? 'NEW BEST SCORE!' : 'Best score';
    const scoreColor = newHighScore ? '#ffdd00'         : '#888888';
    this.add.text(width / 2, dividerY + 18, scoreLabel, {
      fontSize: '12px', color: scoreColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(width / 2, dividerY + 34, String(highScore), {
      fontSize: '22px', color: scoreColor,
    }).setOrigin(0.5);

    const waveLabel = newHighWave ? 'NEW BEST WAVE!' : 'Best wave';
    const waveColor = newHighWave ? '#00ffcc'        : '#888888';
    this.add.text(width / 2, dividerY + 64, waveLabel, {
      fontSize: '12px', color: waveColor, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(width / 2, dividerY + 80, String(highWave), {
      fontSize: '22px', color: waveColor,
    }).setOrigin(0.5);

    // ── Prompt ────────────────────────────────────────────────────────────────
    const restartLabel = IS_MOBILE ? 'Tap to play again' : 'Press SPACE to play again';
    const restartText = this.add.text(width / 2, height * 0.88, restartLabel, {
      fontSize: '20px', color: '#aaaaaa',
    }).setOrigin(0.5);

    this.tweens.add({ targets: restartText, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    if (IS_MOBILE) {
      // Slight delay so the last-frame tap that caused game over doesn't instantly restart
      this.time.delayedCall(600, () => {
        this.input.once('pointerdown', () => this.scene.start('MenuScene'));
      });
    } else {
      this.input.keyboard!.once('keydown-SPACE', () => {
        this.scene.start('MenuScene');
      });
    }
  }
}
