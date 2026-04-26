import * as Phaser from 'phaser';
import { PlayerShip, PLAYER1_CONFIG, PLAYER2_CONFIG } from '../entities/PlayerShip';
import type { PlayerConfig } from '../entities/PlayerShip';
import { EnemyShip } from '../entities/EnemyShip';
import { ZoltShip } from '../entities/ZoltShip';
import { BlackHole } from '../entities/BlackHole';
import { LightningEffect } from '../entities/LightningEffect';
import { WaveManager } from '../systems/WaveManager';

const PLAYER_LIVES   = 5;
const SHIP_SIZE      = 32;
const BH_DEPLOY_DIST = SHIP_SIZE * 3;

// Beam bar layout
const BAR_W = 140;
const BAR_H = 12;
const BAR_Y = 60;

// Palette for solo-mode random ship colour
const SOLO_PALETTE = [
  0xff0055, // crimson
  0x00ff88, // mint
  0xffdd00, // gold
  0x00aaff, // azure
  0xbb00ff, // violet
  0xff6666, // salmon
  0x55ff00, // lime
  0x00ffdd, // aqua
];

export class GameScene extends Phaser.Scene {
  private playerCount:  1 | 2  = 2;
  private p1HudColor:   number = 0x00ffcc; // teal in 2P; random ship colour in 1P

  private player1!: PlayerShip;
  private player2?: PlayerShip;          // undefined in 1-player mode
  private activePlayers: PlayerShip[] = [];

  private waveManager!: WaveManager;
  private readonly blackHoles:      BlackHole[]      = [];
  private readonly lightningEffects: LightningEffect[] = [];

  private score    = 0;
  private p1Lives  = PLAYER_LIVES;
  private p2Lives  = PLAYER_LIVES;
  private p1BhCharges = 0;
  private p2BhCharges = 0;

  // HUD
  private scoreText!:   Phaser.GameObjects.Text;
  private waveText!:    Phaser.GameObjects.Text;
  private p1LivesText!: Phaser.GameObjects.Text;
  private p2LivesText?: Phaser.GameObjects.Text;
  private p1BeamLabel!: Phaser.GameObjects.Text;
  private p1BeamFill!:  Phaser.GameObjects.Rectangle;
  private p2BeamLabel?: Phaser.GameObjects.Text;
  private p2BeamFill?:  Phaser.GameObjects.Rectangle;
  private p1BhText!:    Phaser.GameObjects.Text;
  private p2BhText?:    Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { players?: 1 | 2 }): void {
    this.playerCount = data?.players ?? 2;
  }

  create(): void {
    this.score       = 0;
    this.p1Lives     = PLAYER_LIVES;
    this.p2Lives     = PLAYER_LIVES;
    this.p1BhCharges = 0;
    this.p2BhCharges = 0;
    this.blackHoles.length       = 0;
    this.lightningEffects.length = 0;
    this.player2 = undefined;
    this.activePlayers = [];

    const { width, height } = this.scale;

    // Starfield
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      this.add.circle(x, y, Phaser.Math.FloatBetween(1, 2.5), 0xffffff, Phaser.Math.FloatBetween(0.3, 1));
    }

    // ── Create players ────────────────────────────────────────────────────────
    if (this.playerCount === 1) {
      const soloColor  = Phaser.Utils.Array.GetRandom(SOLO_PALETTE) as number;
      this.p1HudColor  = soloColor;
      const soloConfig = this.buildSoloConfig(soloColor);
      this.player1 = new PlayerShip(this, width * 0.5, height - 60, soloConfig);
    } else {
      this.p1HudColor = 0x00ffcc;
      this.player1 = new PlayerShip(this, width * 0.35, height - 60, PLAYER1_CONFIG);
      this.player2 = new PlayerShip(this, width * 0.65, height - 60, PLAYER2_CONFIG);
    }

    this.activePlayers = this.player2
      ? [this.player1, this.player2]
      : [this.player1];

    this.waveManager = new WaveManager(this);
    this.waveManager.startNextWave();

    // ── HUD ──────────────────────────────────────────────────────────────────
    this.scoreText = this.add.text(width / 2, 12, 'Score: 0', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5, 0);
    this.waveText  = this.add.text(width / 2, 34, 'Wave: 1',  { fontSize: '14px', color: '#ffaa00' }).setOrigin(0.5, 0);

    // P1 (always shown, left side)
    const p1css = this.numToHex(this.p1HudColor);
    this.add.text(12, 12, 'P1', { fontSize: '13px', color: p1css });
    this.p1LivesText = this.add.text(12, 28, `Lives: ${this.p1Lives}`, { fontSize: '14px', color: p1css });
    this.p1BeamLabel = this.add.text(12, BAR_Y - 2, 'BEAM  READY', { fontSize: '10px', color: '#aaaaaa' });
    this.add.rectangle(12, BAR_Y + 12, BAR_W, BAR_H, 0x222222).setOrigin(0);
    this.p1BeamFill  = this.add.rectangle(13, BAR_Y + 13, BAR_W - 2, BAR_H - 2, this.p1HudColor).setOrigin(0);
    this.p1BhText    = this.add.text(12, BAR_Y + 30, '⚫ BH: 0', { fontSize: '11px', color: p1css });

    // P2 (right side, 2-player only)
    if (this.playerCount === 2) {
      this.add.text(width - 12, 12, 'P2', { fontSize: '13px', color: '#ff8800' }).setOrigin(1, 0);
      this.p2LivesText = this.add.text(width - 12, 28, `Lives: ${this.p2Lives}`, { fontSize: '14px', color: '#ff8800' }).setOrigin(1, 0);
      this.p2BeamLabel = this.add.text(width - 12, BAR_Y - 2, 'BEAM  READY', { fontSize: '10px', color: '#aaaaaa' }).setOrigin(1, 0);
      this.add.rectangle(width - 12 - BAR_W, BAR_Y + 12, BAR_W, BAR_H, 0x222222).setOrigin(0);
      this.p2BeamFill  = this.add.rectangle(width - 12 - BAR_W + 1, BAR_Y + 13, BAR_W - 2, BAR_H - 2, 0xff8800).setOrigin(0);
      this.p2BhText    = this.add.text(width - 12, BAR_Y + 30, 'BH: 0 ⚫', { fontSize: '11px', color: '#cc00ff' }).setOrigin(1, 0);
    }
  }

  update(time: number, delta: number): void {
    this.player1.update(time, delta);
    this.player2?.update(time, delta);
    this.waveManager.cullOffscreen();

    const enemies = this.waveManager.enemies;

    // ── Black holes ───────────────────────────────────────────────────────────
    this.handleBlackHoleDeployment();

    for (let i = this.blackHoles.length - 1; i >= 0; i--) {
      const bh = this.blackHoles[i];
      const consumed = bh.update(delta, this.activePlayers, enemies);

      for (const player of consumed) {
        if (player === this.player1) this.onPlayerHit(1);
        else                         this.onPlayerHit(2);
      }

      if (bh.isExpired) this.blackHoles.splice(i, 1);
    }

    // ── Beam hits ────────────────────────────────────────────────────────────
    for (const player of this.activePlayers) {
      const originY = player.y - player.displayHeight / 2;
      const hits    = player.beam.update(delta, player.x, originY, enemies);
      for (const enemy of hits) {
        if (enemy.hit()) this.onEnemyDestroyed(enemy);
      }
    }

    // ── Laser pelt hits ───────────────────────────────────────────────────────
    for (const player of this.activePlayers) {
      this.physics.overlap(player.lasers, enemies, (laserObj, enemyObj) => {
        (laserObj as Phaser.Physics.Arcade.Image).destroy();
        const enemy = enemyObj as EnemyShip;
        if (enemy.hit()) this.onEnemyDestroyed(enemy);
      });
    }

    // ── Enemy body hits ───────────────────────────────────────────────────────
    this.physics.overlap(this.player1, enemies, (_p, enemyObj) => {
      if (this.player1.isGhost) return;
      (enemyObj as EnemyShip).destroy();
      this.onPlayerHit(1);
    });
    if (this.player2) {
      this.physics.overlap(this.player2, enemies, (_p, enemyObj) => {
        if (this.player2!.isGhost) return;
        (enemyObj as EnemyShip).destroy();
        this.onPlayerHit(2);
      });
    }

    // ── Wave advancement ──────────────────────────────────────────────────────
    if (this.waveManager.currentWave > 0 && this.waveManager.isWaveClear) {
      const completedWave = this.waveManager.currentWave;
      this.waveManager.startNextWave();
      this.waveText.setText(`Wave: ${this.waveManager.currentWave}`);

      if (completedWave % 4 === 0) {
        this.p1BhCharges++;
        if (this.playerCount === 2) this.p2BhCharges++;
        this.updateBhHud();
        this.showCentreMessage('⚫  Black Hole charged!', '#cc00ff');
      }
    }

    // ── Zolt lightning bolts ──────────────────────────────────────────────────
    for (const zolt of this.waveManager.zolts) {
      if (!zolt.active) continue;
      const target = zolt.tickBolt(this.activePlayers);
      if (target) this.fireZoltBolt(zolt, target);
    }

    // Tick & cull finished lightning effects
    for (let i = this.lightningEffects.length - 1; i >= 0; i--) {
      this.lightningEffects[i].update(delta);
      if (this.lightningEffects[i].isDone) this.lightningEffects.splice(i, 1);
    }

    // ── HUD beam bars ─────────────────────────────────────────────────────────
    if (!this.player1.isGhost)
      this.updateBeamBar(this.player1.beam, this.p1BeamFill, this.p1BeamLabel, this.p1HudColor, this.p1HudColor);
    if (this.player2 && !this.player2.isGhost && this.p2BeamFill && this.p2BeamLabel)
      this.updateBeamBar(this.player2.beam, this.p2BeamFill, this.p2BeamLabel, 0xff8800, 0xff6600);
  }

  // ── Solo config builder ───────────────────────────────────────────────────

  private buildSoloConfig(color: number): PlayerConfig {
    // Generate a uniquely-coloured ship texture for this run
    const g = this.make.graphics({ x: 0, y: 0 });

    g.fillStyle(color);
    g.fillTriangle(16, 0, 0, 32, 32, 32);

    // Eyes (white sclera, black pupil, white highlight)
    g.fillStyle(0xffffff); g.fillCircle(11, 20, 4);
    g.fillStyle(0xffffff); g.fillCircle(21, 20, 4);
    g.fillStyle(0x000000); g.fillCircle(11, 20, 2);
    g.fillStyle(0x000000); g.fillCircle(21, 20, 2);
    g.fillStyle(0xffffff); g.fillCircle(12, 19, 1);
    g.fillStyle(0xffffff); g.fillCircle(22, 19, 1);

    // Smile
    g.lineStyle(2, 0x000000, 1);
    g.beginPath(); g.arc(16, 26, 4, 0, Math.PI, false); g.strokePath();

    g.generateTexture('player-solo-ship', 32, 32);
    g.destroy();

    return {
      ...PLAYER1_CONFIG,
      textureKey:   'player-solo-ship',
      shipTint:     0xffffff,
      peltTint:     color,
      beamColor:    color,
    };
  }

  // ── Zolt lightning ────────────────────────────────────────────────────────

  private fireZoltBolt(zolt: ZoltShip, target: PlayerShip): void {
    this.lightningEffects.push(
      new LightningEffect(this, zolt.x, zolt.y, target.x, target.y),
    );
    const num = target === this.player1 ? 1 : 2;
    this.onPlayerHit(num as 1 | 2);
  }

  // ── Black hole deployment ─────────────────────────────────────────────────

  private handleBlackHoleDeployment(): void {
    if (this.player1.wantsBlackHole && this.p1BhCharges > 0 && !this.player1.isGhost) {
      this.p1BhCharges--;
      this.updateBhHud();
      this.deployBlackHole(this.player1);
    }
    if (this.player2?.wantsBlackHole && this.p2BhCharges > 0 && !this.player2.isGhost) {
      this.p2BhCharges--;
      this.updateBhHud();
      this.deployBlackHole(this.player2);
    }
  }

  private deployBlackHole(player: PlayerShip): void {
    const bx = player.x;
    const by = Math.max(player.y - BH_DEPLOY_DIST, 60);
    this.blackHoles.push(new BlackHole(this, bx, by));
  }

  // ── HUD helpers ───────────────────────────────────────────────────────────

  private updateBhHud(): void {
    this.p1BhText.setText(`⚫ BH: ${this.p1BhCharges}`);
    this.p2BhText?.setText(`BH: ${this.p2BhCharges} ⚫`);
  }

  private updateBeamBar(
    beam:        PlayerShip['beam'],
    fill:        Phaser.GameObjects.Rectangle,
    label:       Phaser.GameObjects.Text,
    readyColor:  number,
    firingColor: number,
  ): void {
    fill.setSize(Math.max(0, (BAR_W - 2) * beam.readiness), BAR_H - 2);
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

  // ── Combat events ─────────────────────────────────────────────────────────

  private onEnemyDestroyed(enemy: EnemyShip): void {
    this.score += enemy.points;
    this.scoreText.setText(`Score: ${this.score}`);
    this.showOof(enemy.x, enemy.y);
    enemy.destroy();
  }

  private onPlayerHit(playerNum: 1 | 2): void {
    const player = playerNum === 1 ? this.player1 : this.player2!;

    if (playerNum === 1) {
      this.p1Lives = Math.max(0, this.p1Lives - 1);
      this.p1LivesText.setText(`Lives: ${this.p1Lives}`);
    } else {
      this.p2Lives = Math.max(0, this.p2Lives - 1);
      this.p2LivesText?.setText(`Lives: ${this.p2Lives}`);
    }

    // Game over condition
    const bothDead = this.playerCount === 2
      ? this.p1Lives <= 0 && this.p2Lives <= 0
      : this.p1Lives <= 0;

    if (bothDead) {
      this.blackHoles.forEach(bh => bh.destroy());
      this.lightningEffects.forEach(le => le.destroy());
      this.player1.beam.destroy();
      this.player2?.beam.destroy();
      this.scene.start('GameOverScene', { score: this.score });
      return;
    }

    const justDied = playerNum === 1 ? this.p1Lives <= 0 : this.p2Lives <= 0;
    if (justDied) {
      player.setGhost();
      this.showGhostMessage(playerNum);
      return;
    }

    // Still has lives — brief red tint flash, no transparency
    player.setTint(0xff4444);
    this.time.delayedCall(250, () => { if (player.active) player.clearTint(); });
  }

  // ── Text popups ───────────────────────────────────────────────────────────

  private numToHex(color: number): string {
    return '#' + color.toString(16).padStart(6, '0');
  }

  private showOof(x: number, y: number): void {
    const t = this.add.text(x, y, 'Oooof!', { fontSize: '20px', color: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  private showGhostMessage(playerNum: 1 | 2): void {
    const { width, height } = this.scale;
    const color = playerNum === 1 ? '#00ffcc' : '#ff8800';
    const t = this.add.text(width / 2, height / 2 - 20, `P${playerNum} is a ghost!`, {
      fontSize: '22px', color, fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 300, yoyo: true, hold: 1200, onComplete: () => t.destroy() });
  }

  private showCentreMessage(msg: string, color: string): void {
    const { width } = this.scale;
    const t = this.add.text(width / 2, 200, msg, { fontSize: '20px', color, fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 300, yoyo: true, hold: 1400, onComplete: () => t.destroy() });
  }
}
