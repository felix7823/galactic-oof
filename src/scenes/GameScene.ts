import * as Phaser from 'phaser';
import { PlayerShip } from '../entities/PlayerShip';
import { EnemyShip } from '../entities/EnemyShip';
import { Laser } from '../entities/Laser';
import { WaveManager } from '../systems/WaveManager';

const PLAYER_LIVES = 3;

export class GameScene extends Phaser.Scene {
  private player!: PlayerShip;
  private waveManager!: WaveManager;
  private score = 0;
  private lives = PLAYER_LIVES;

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score = 0;
    this.lives = PLAYER_LIVES;

    const { width, height } = this.scale;

    // Starfield background
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      this.add.circle(x, y, size, 0xffffff, alpha);
    }

    // Player
    this.player = new PlayerShip(this, width / 2, height - 60);

    // Wave manager
    this.waveManager = new WaveManager(this);
    this.waveManager.startNextWave();

    // HUD
    this.scoreText = this.add.text(12, 12, 'Score: 0', { fontSize: '18px', color: '#ffffff' });
    this.livesText = this.add.text(12, 36, `Lives: ${this.lives}`, { fontSize: '18px', color: '#00ffcc' });
    this.waveText  = this.add.text(width - 12, 12, 'Wave: 1', { fontSize: '18px', color: '#ffaa00' }).setOrigin(1, 0);
  }

  update(time: number): void {
    this.player.update(time);
    this.waveManager.cullOffscreen();

    // Laser ↔ Enemy collisions
    this.physics.overlap(
      this.player.lasers,
      this.waveManager.enemies,
      (laserObj, enemyObj) => {
        const laser = laserObj as Laser;
        const enemy = enemyObj as EnemyShip;
        laser.destroy();

        const destroyed = enemy.hit();
        if (destroyed) {
          this.onEnemyDestroyed(enemy);
        }
      }
    );

    // Enemy ↔ Player collisions
    this.physics.overlap(
      this.player,
      this.waveManager.enemies,
      (_playerObj, enemyObj) => {
        const enemy = enemyObj as EnemyShip;
        enemy.destroy();
        this.onPlayerHit();
      }
    );

    // Advance to next wave when the current one is clear (ignore frame-0 before enemies spawn)
    if (this.waveManager.currentWave > 0 && this.waveManager.isWaveClear) {
      this.waveManager.startNextWave();
      this.waveText.setText(`Wave: ${this.waveManager.currentWave}`);
    }
  }

  private onEnemyDestroyed(enemy: EnemyShip): void {
    this.score += enemy.points;
    this.scoreText.setText(`Score: ${this.score}`);
    this.showOof(enemy.x, enemy.y);
    enemy.destroy();
  }

  private onPlayerHit(): void {
    this.lives -= 1;
    this.livesText.setText(`Lives: ${this.lives}`);

    if (this.lives <= 0) {
      this.scene.start('GameOverScene', { score: this.score });
      return;
    }

    // Flash the player to signal the hit
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 4,
    });
  }

  private showOof(x: number, y: number): void {
    const oof = this.add.text(x, y, 'Oooof!', {
      fontSize: '20px',
      color: '#ffff00',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: oof,
      y: y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => oof.destroy(),
    });
  }
}
