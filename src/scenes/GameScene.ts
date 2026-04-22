import * as Phaser from 'phaser';
import { PlayerShip, PLAYER1_CONFIG, PLAYER2_CONFIG } from '../entities/PlayerShip';
import { EnemyShip } from '../entities/EnemyShip';
import { WaveManager } from '../systems/WaveManager';

const PLAYER_LIVES = 3;

// Beam bar layout
const BAR_W = 140;
const BAR_H = 12;

export class GameScene extends Phaser.Scene {
  private player1!: PlayerShip;
  private player2!: PlayerShip;
  private waveManager!: WaveManager;

  private score = 0;
  private p1Lives = PLAYER_LIVES;
  private p2Lives = PLAYER_LIVES;

  // HUD — Player 1 (left side, cyan)
  private scoreText!:   Phaser.GameObjects.Text;
  private p1LivesText!: Phaser.GameObjects.Text;
  private p1BeamLabel!: Phaser.GameObjects.Text;
  private p1BeamFill!:  Phaser.GameObjects.Rectangle;

  // HUD — Player 2 (right side, orange)
  private p2LivesText!: Phaser.GameObjects.Text;
  private waveText!:    Phaser.GameObjects.Text;
  private p2BeamLabel!: Phaser.GameObjects.Text;
  private p2BeamFill!:  Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score    = 0;
    this.p1Lives  = PLAYER_LIVES;
    this.p2Lives  = PLAYER_LIVES;

    const { width, height } = this.scale;

    // Starfield
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      this.add.circle(x, y, Phaser.Math.FloatBetween(1, 2.5), 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
    }

    // Players — spread across the bottom
    this.player1 = new PlayerShip(this, width * 0.35, height - 60, PLAYER1_CONFIG);
    this.player2 = new PlayerShip(this, width * 0.65, height - 60, PLAYER2_CONFIG);

    // Enemies
    this.waveManager = new WaveManager(this);
    this.waveManager.startNextWave();

    // ── HUD ──────────────────────────────────────────────────────────────────
    const BAR_Y = 60;

    // Shared score + wave
    this.scoreText = this.add.text(width / 2, 12, 'Score: 0', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5, 0);
    this.waveText  = this.add.text(width / 2, 36, 'Wave: 1',  { fontSize: '14px', color: '#ffaa00' }).setOrigin(0.5, 0);

    // P1 lives + beam bar (left)
    this.add.text(12, 12, 'P1', { fontSize: '13px', color: '#00ffcc' });
    this.p1LivesText = this.add.text(12, 28, `Lives: ${this.p1Lives}`, { fontSize: '14px', color: '#00ffcc' });
    this.p1BeamLabel = this.add.text(12, BAR_Y - 2, 'BEAM  READY', { fontSize: '10px', color: '#aaaaaa' });
    this.add.rectangle(12, BAR_Y + 12, BAR_W, BAR_H, 0x222222).setOrigin(0);
    this.p1BeamFill = this.add.rectangle(13, BAR_Y + 13, BAR_W - 2, BAR_H - 2, 0x00ffcc).setOrigin(0);

    // P2 lives + beam bar (right)
    this.add.text(width - 12, 12, 'P2', { fontSize: '13px', color: '#ff8800' }).setOrigin(1, 0);
    this.p2LivesText = this.add.text(width - 12, 28, `Lives: ${this.p2Lives}`, { fontSize: '14px', color: '#ff8800' }).setOrigin(1, 0);
    this.p2BeamLabel = this.add.text(width - 12, BAR_Y - 2, 'BEAM  READY', { fontSize: '10px', color: '#aaaaaa' }).setOrigin(1, 0);
    this.add.rectangle(width - 12 - BAR_W, BAR_Y + 12, BAR_W, BAR_H, 0x222222).setOrigin(0);
    this.p2BeamFill = this.add.rectangle(width - 12 - BAR_W + 1, BAR_Y + 13, BAR_W - 2, BAR_H - 2, 0xff8800).setOrigin(0);
  }

  update(time: number, delta: number): void {
    this.player1.update(time, delta);
    this.player2.update(time, delta);
    this.waveManager.cullOffscreen();

    const enemies = this.waveManager.enemies;

    // ── Beam hits ────────────────────────────────────────────────────────────
    for (const player of [this.player1, this.player2]) {
      const originY = player.y - player.displayHeight / 2;
      const hits    = player.beam.update(delta, player.x, originY, enemies);
      for (const enemy of hits) {
        if (enemy.hit()) this.onEnemyDestroyed(enemy);
      }
    }

    // ── Laser pelt hits ───────────────────────────────────────────────────────
    for (const player of [this.player1, this.player2]) {
      this.physics.overlap(player.lasers, enemies, (laserObj, enemyObj) => {
        (laserObj as Phaser.Physics.Arcade.Image).destroy();
        const enemy = enemyObj as EnemyShip;
        if (enemy.hit()) this.onEnemyDestroyed(enemy);
      });
    }

    // ── Enemy body hits ───────────────────────────────────────────────────────
    this.physics.overlap(this.player1, enemies, (_p, enemyObj) => {
      if (this.player1.isGhost) return; // already dead, ignore
      (enemyObj as EnemyShip).destroy();
      this.onPlayerHit(1);
    });
    this.physics.overlap(this.player2, enemies, (_p, enemyObj) => {
      if (this.player2.isGhost) return; // already dead, ignore
      (enemyObj as EnemyShip).destroy();
      this.onPlayerHit(2);
    });

    // ── Wave advancement ──────────────────────────────────────────────────────
    if (this.waveManager.currentWave > 0 && this.waveManager.isWaveClear) {
      this.waveManager.startNextWave();
      this.waveText.setText(`Wave: ${this.waveManager.currentWave}`);
    }

    // ── HUD beam bars ─────────────────────────────────────────────────────────
    if (!this.player1.isGhost) this.updateBeamBar(this.player1.beam, this.p1BeamFill, this.p1BeamLabel, 0x00ffcc, 0x00ffff);
    if (!this.player2.isGhost) this.updateBeamBar(this.player2.beam, this.p2BeamFill, this.p2BeamLabel, 0xff8800, 0xff6600);
  }

  private updateBeamBar(
    beam:       PlayerShip['beam'],
    fill:       Phaser.GameObjects.Rectangle,
    label:      Phaser.GameObjects.Text,
    readyColor: number,
    firingColor: number,
  ): void {
    const fillW = Math.max(0, (140 - 2) * beam.readiness);
    fill.setSize(fillW, 10);

    if (beam.state === 'recharging') {
      fill.setFillStyle(0x884400);
      label.setText('BEAM  RECHARGING');
    } else if (beam.state === 'firing') {
      fill.setFillStyle(firingColor);
      label.setText('BEAM  ▶ FIRING');
    } else {
      fill.setFillStyle(readyColor);
      label.setText('BEAM  READY');
    }
  }

  private onEnemyDestroyed(enemy: EnemyShip): void {
    this.score += enemy.points;
    this.scoreText.setText(`Score: ${this.score}`);
    this.showOof(enemy.x, enemy.y);
    enemy.destroy();
  }

  private onPlayerHit(playerNum: 1 | 2): void {
    const player = playerNum === 1 ? this.player1 : this.player2;

    if (playerNum === 1) {
      this.p1Lives = Math.max(0, this.p1Lives - 1);
      this.p1LivesText.setText(`Lives: ${this.p1Lives}`);
    } else {
      this.p2Lives = Math.max(0, this.p2Lives - 1);
      this.p2LivesText.setText(`Lives: ${this.p2Lives}`);
    }

    // Both ghosts → game over
    if (this.p1Lives <= 0 && this.p2Lives <= 0) {
      this.player1.beam.destroy();
      this.player2.beam.destroy();
      this.scene.start('GameOverScene', { score: this.score });
      return;
    }

    // This player just ran out of lives — become a ghost
    const justDied = playerNum === 1 ? this.p1Lives <= 0 : this.p2Lives <= 0;
    if (justDied) {
      player.setGhost();
      this.showGhostMessage(playerNum);
      return;
    }

    // Still has lives — flash to show the hit
    this.tweens.add({
      targets: player,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: 4,
    });
  }

  private showGhostMessage(playerNum: 1 | 2): void {
    const { width, height } = this.scale;
    const color = playerNum === 1 ? '#00ffcc' : '#ff8800';
    const msg   = this.add.text(width / 2, height / 2 - 20, `P${playerNum} is a ghost!`, {
      fontSize: '22px',
      color,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: msg,
      alpha: 1,
      duration: 300,
      yoyo: true,
      hold: 1200,
      onComplete: () => msg.destroy(),
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
