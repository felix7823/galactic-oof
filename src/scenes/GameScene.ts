import * as Phaser from 'phaser';
import { PlayerShip } from '../entities/PlayerShip';
import { EnemyShip } from '../entities/EnemyShip';
import { WaveManager } from '../systems/WaveManager';

const PLAYER_LIVES = 3;

// HUD beam bar dimensions
const BAR_W = 160;
const BAR_H = 14;
const BAR_X = 12;
const BAR_Y = 60;

export class GameScene extends Phaser.Scene {
  private player!: PlayerShip;
  private waveManager!: WaveManager;
  private score = 0;
  private lives = PLAYER_LIVES;

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private beamLabel!: Phaser.GameObjects.Text;
  private beamBarFill!: Phaser.GameObjects.Rectangle;

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
      const r = Phaser.Math.FloatBetween(1, 2.5);
      const a = Phaser.Math.FloatBetween(0.3, 1);
      this.add.circle(x, y, r, 0xffffff, a);
    }

    // Player
    this.player = new PlayerShip(this, width / 2, height - 60);

    // Wave manager
    this.waveManager = new WaveManager(this);
    this.waveManager.startNextWave();

    // ── HUD ──────────────────────────────────────────────────────────────────
    this.scoreText = this.add.text(12, 12, 'Score: 0',       { fontSize: '18px', color: '#ffffff' });
    this.livesText = this.add.text(12, 36, `Lives: ${this.lives}`, { fontSize: '18px', color: '#00ffcc' });
    this.waveText  = this.add.text(width - 12, 12, 'Wave: 1', { fontSize: '18px', color: '#ffaa00' }).setOrigin(1, 0);

    // Beam charge bar
    this.beamLabel = this.add.text(BAR_X, BAR_Y - 2, 'BEAM', { fontSize: '11px', color: '#aaaaaa' });
    this.add.rectangle(BAR_X, BAR_Y + 14, BAR_W, BAR_H, 0x222222).setOrigin(0); // bar background
    this.beamBarFill = this.add.rectangle(BAR_X + 1, BAR_Y + 15, BAR_W - 2, BAR_H - 2, 0x00ffcc).setOrigin(0);
  }

  update(_time: number, delta: number): void {
    this.player.update(delta);
    this.waveManager.cullOffscreen();

    // ── Beam hit detection ───────────────────────────────────────────────────
    // Beam origin is top-centre of player sprite
    const beamOriginY = this.player.y - this.player.displayHeight / 2;
    const hits = this.player.beam.update(delta, this.player.x, beamOriginY, this.waveManager.enemies);
    for (const enemy of hits) {
      const destroyed = enemy.hit();
      if (destroyed) this.onEnemyDestroyed(enemy);
    }

    // ── Enemy ↔ Player body collisions ───────────────────────────────────────
    this.physics.overlap(
      this.player,
      this.waveManager.enemies,
      (_p, enemyObj) => {
        const enemy = enemyObj as EnemyShip;
        enemy.destroy();
        this.onPlayerHit();
      },
    );

    // ── Wave advancement ─────────────────────────────────────────────────────
    if (this.waveManager.currentWave > 0 && this.waveManager.isWaveClear) {
      this.waveManager.startNextWave();
      this.waveText.setText(`Wave: ${this.waveManager.currentWave}`);
    }

    // ── Update beam bar ───────────────────────────────────────────────────────
    this.updateBeamBar();
  }

  private updateBeamBar(): void {
    const r = this.player.beam.readiness;
    const state = this.player.beam.state;

    // Width tracks readiness 0-1
    const fillW = Math.max(0, (BAR_W - 2) * r);
    this.beamBarFill.setSize(fillW, BAR_H - 2);

    // Colour: cyan when firing/ready, orange while recharging
    if (state === 'recharging') {
      this.beamBarFill.setFillStyle(0xff8800);
      this.beamLabel.setText('BEAM  RECHARGING');
    } else if (state === 'firing') {
      this.beamBarFill.setFillStyle(0x00ffff);
      this.beamLabel.setText('BEAM  ▶ FIRING');
    } else {
      this.beamBarFill.setFillStyle(0x00ffcc);
      this.beamLabel.setText('BEAM  READY');
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
      this.player.beam.destroy();
      this.scene.start('GameOverScene', { score: this.score });
      return;
    }

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
