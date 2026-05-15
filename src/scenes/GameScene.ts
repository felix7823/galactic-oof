import * as Phaser from 'phaser';
import { PlayerShip, PLAYER1_CONFIG, PLAYER2_CONFIG } from '../entities/PlayerShip';
import type { PlayerConfig } from '../entities/PlayerShip';
import { EnemyShip } from '../entities/EnemyShip';
import { ZoltShip } from '../entities/ZoltShip';
import { BlackHole } from '../entities/BlackHole';
import { LightningEffect } from '../entities/LightningEffect';
import { WaveManager } from '../systems/WaveManager';
import { type AbilityType, SOLO_COLOR_ABILITY, ABILITY_LABEL, ABILITY_CHARGES } from '../abilities/AbilityTypes';
import { SonicWave } from '../abilities/SonicWave';
import { FireCharge } from '../abilities/FireCharge';
import { LightningStorm } from '../abilities/LightningStorm';
import { WaterTornado } from '../abilities/WaterTornado';
import { SalmonSalvo } from '../abilities/SalmonSalvo';
import { LimeInfection } from '../abilities/LimeInfection';
import { Missile } from '../abilities/Missile';
import { Tsunami } from '../abilities/Tsunami';
import { Apple } from '../entities/Apple';
import { SuperApple } from '../entities/SuperApple';
import { LaserPair } from '../entities/LaserPair';
import { SFX }            from '../systems/SoundManager';
import { IS_MOBILE }      from '../utils/DeviceDetect';
import { MobileControls } from '../ui/MobileControls';

const PLAYER_LIVES   = 5;
const SHIP_SIZE      = 32;
const BH_DEPLOY_DIST = SHIP_SIZE * 3;

// Beam bar layout
const BAR_W = 140;
const BAR_H = 12;
const BAR_Y = 60;


export class GameScene extends Phaser.Scene {
  private playerCount:    1 | 2  = 2;
  private p1SelectedColor: number = 0xff0055;
  private p2SelectedColor: number = 0x00aaff;
  private p1HudColor:      number = 0x00ffcc;
  private p2HudColor:      number = 0xff8800;
  private gameMode: 'normal' | 'tutorial' = 'normal';

  private player1!: PlayerShip;
  private player2?: PlayerShip;          // undefined in 1-player mode
  private activePlayers: PlayerShip[] = [];

  private waveManager!: WaveManager;
  private readonly blackHoles:       BlackHole[]       = [];
  private readonly lightningEffects: LightningEffect[] = [];

  // Per-color abilities
  private p1AbilityType: AbilityType = 'blackhole';
  private p2AbilityType: AbilityType = 'blackhole';

  private readonly fireCharges:     FireCharge[]     = [];
  private readonly lightningStorms: LightningStorm[] = [];
  private readonly tornadoes:       WaterTornado[]   = [];
  private readonly salmonSalvos:    SalmonSalvo[]    = [];
  private readonly limeInfections:  LimeInfection[]  = [];
  private readonly missiles:        Missile[]        = [];
  private readonly tsunamis:        Tsunami[]        = [];
  private readonly sonicWaves:      SonicWave[]      = [];

  // Apple power-ups
  private appleGroup!:       Phaser.GameObjects.Group;
  private appleCountdown     = 0; // waves until next regular apple drop
  private superAppleGroup!:  Phaser.GameObjects.Group;
  private superAppleCountdown = 0; // waves until next super apple drop

  // Beam-damage cooldown (prevents frame-rate-dependent multi-hits)
  private p1BeamDmgCooldown = 0;
  private p2BeamDmgCooldown = 0;

  // Mobile controls (created only on touch devices)
  private mob?: MobileControls;

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

  init(data: { players?: 1 | 2; p1Color?: number; p2Color?: number; mode?: 'normal' | 'tutorial' }): void {
    this.playerCount      = data?.players  ?? 2;
    this.p1SelectedColor  = data?.p1Color  ?? 0xff0055;
    this.p2SelectedColor  = data?.p2Color  ?? 0x00aaff;
    this.gameMode         = data?.mode     ?? 'normal';
  }

  create(): void {
    this.score       = 0;
    this.p1Lives     = PLAYER_LIVES;
    this.p2Lives     = PLAYER_LIVES;
    this.p1BhCharges = 0;
    this.p2BhCharges = 0;
    this.blackHoles.length       = 0;
    this.lightningEffects.length = 0;
    this.fireCharges.length      = 0;
    this.lightningStorms.length  = 0;
    this.tornadoes.length        = 0;
    this.salmonSalvos.length     = 0;
    this.limeInfections.length   = 0;
    this.missiles.length         = 0;
    this.tsunamis.length         = 0;
    this.sonicWaves.length       = 0;
    this.player2 = undefined;
    this.p1BeamDmgCooldown = 0;
    this.p2BeamDmgCooldown = 0;

    // Apple groups — recreate each run so destroyed items from last game don't linger
    if (this.appleGroup)      this.appleGroup.destroy(true);
    if (this.superAppleGroup) this.superAppleGroup.destroy(true);
    this.appleGroup          = this.add.group();
    this.superAppleGroup     = this.add.group();
    this.appleCountdown      = Phaser.Math.Between(1, 5);
    this.superAppleCountdown = Phaser.Math.Between(6, 10);
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
      this.p1HudColor    = this.p1SelectedColor;
      const soloConfig   = this.buildPlayerConfig(this.p1SelectedColor, 'player-p1-custom', 'smile', PLAYER1_CONFIG);
      this.player1       = new PlayerShip(this, width * 0.5, height - 60, soloConfig);
      this.p1AbilityType = SOLO_COLOR_ABILITY[this.p1SelectedColor] ?? 'blackhole';
    } else {
      this.p1HudColor    = this.p1SelectedColor;
      this.p2HudColor    = this.p2SelectedColor;
      const p1Config     = this.buildPlayerConfig(this.p1SelectedColor, 'player-p1-custom', 'smile', PLAYER1_CONFIG);
      const p2Config     = this.buildPlayerConfig(this.p2SelectedColor, 'player-p2-custom', 'stern', PLAYER2_CONFIG);
      this.player1       = new PlayerShip(this, width * 0.35, height - 60, p1Config);
      this.player2       = new PlayerShip(this, width * 0.65, height - 60, p2Config);
      this.p1AbilityType = SOLO_COLOR_ABILITY[this.p1SelectedColor] ?? 'blackhole';
      this.p2AbilityType = SOLO_COLOR_ABILITY[this.p2SelectedColor] ?? 'blackhole';
    }

    this.activePlayers = this.player2
      ? [this.player1, this.player2]
      : [this.player1];

    this.waveManager = new WaveManager(this, this.gameMode === 'tutorial');
    this.waveManager.startNextWave();

    // Show first tutorial hint slightly after scene loads
    if (this.gameMode === 'tutorial') {
      this.time.delayedCall(800, () => this.showTutorialHint(1));
    }

    // ── HUD ──────────────────────────────────────────────────────────────────
    this.scoreText = this.add.text(width / 2, 12, 'Score: 0', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5, 0);
    this.waveText  = this.add.text(width / 2, 34, `Wave: ${this.waveManager.currentWave}`, { fontSize: '14px', color: '#ffaa00' }).setOrigin(0.5, 0);

    // P1 (always shown, left side)
    const p1css = this.numToHex(this.p1HudColor);
    this.add.text(12, 12, 'P1', { fontSize: '13px', color: p1css });
    this.p1LivesText = this.add.text(12, 28, `Lives: ${this.p1Lives}`, { fontSize: '14px', color: p1css });
    this.p1BeamLabel = this.add.text(12, BAR_Y - 2, 'BEAM  READY', { fontSize: '10px', color: '#aaaaaa' });
    this.add.rectangle(12, BAR_Y + 12, BAR_W, BAR_H, 0x222222).setOrigin(0);
    this.p1BeamFill  = this.add.rectangle(13, BAR_Y + 13, BAR_W - 2, BAR_H - 2, this.p1HudColor).setOrigin(0);
    this.p1BhText    = this.add.text(12, BAR_Y + 30, `${ABILITY_LABEL[this.p1AbilityType]}: 0`, { fontSize: '11px', color: p1css });

    // P2 (right side, 2-player only)
    if (this.playerCount === 2) {
      const p2css = this.numToHex(this.p2HudColor);
      this.add.text(width - 12, 12, 'P2', { fontSize: '13px', color: p2css }).setOrigin(1, 0);
      this.p2LivesText = this.add.text(width - 12, 28, `Lives: ${this.p2Lives}`, { fontSize: '14px', color: p2css }).setOrigin(1, 0);
      this.p2BeamLabel = this.add.text(width - 12, BAR_Y - 2, 'BEAM  READY', { fontSize: '10px', color: '#aaaaaa' }).setOrigin(1, 0);
      this.add.rectangle(width - 12 - BAR_W, BAR_Y + 12, BAR_W, BAR_H, 0x222222).setOrigin(0);
      this.p2BeamFill  = this.add.rectangle(width - 12 - BAR_W + 1, BAR_Y + 13, BAR_W - 2, BAR_H - 2, this.p2HudColor).setOrigin(0);
      this.p2BhText    = this.add.text(width - 12, BAR_Y + 30, `${ABILITY_LABEL[this.p2AbilityType]}: 0`, { fontSize: '11px', color: p2css }).setOrigin(1, 0);
    }

    // Mobile controls — only in 1P mode (2P is desktop-only)
    if (IS_MOBILE) {
      this.mob = new MobileControls(this);
      // Clean up when scene shuts down
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.mob?.destroy();
        this.mob = undefined;
      });
    }
  }

  update(time: number, delta: number): void {
    this.player1.update(time, delta);
    this.player2?.update(time, delta);

    // ── Mobile joystick + buttons ─────────────────────────────────────────────
    if (this.mob && !this.player1.isGhost) {
      const body = this.player1.body as Phaser.Physics.Arcade.Body;
      if (this.mob.joyX !== 0 || this.mob.joyY !== 0) {
        body.setVelocityX(this.mob.joyX * 300);
        body.setVelocityY(this.mob.joyY * 300);
      }
      if (this.mob.shootDown)      this.player1.mobileFire(time);
      if (this.mob.laserJustDown)  this.player1.mobileBeam();
      if (this.mob.specialJustDown) this.player1.mobileSpecial();
    }

    this.waveManager.cullOffscreen();

    const enemies = this.waveManager.enemies;

    // ── Ability deployment ────────────────────────────────────────────────────
    this.handleAbilityDeployment();

    // ── Black holes ───────────────────────────────────────────────────────────
    for (let i = this.blackHoles.length - 1; i >= 0; i--) {
      const bh = this.blackHoles[i];
      const consumed = bh.update(delta, this.activePlayers, enemies);

      for (const player of consumed) {
        if (player === this.player1) this.onPlayerHit(1);
        else                         this.onPlayerHit(2);
      }

      if (bh.isExpired) this.blackHoles.splice(i, 1);
    }

    // ── Fire charges ──────────────────────────────────────────────────────────
    for (let i = this.fireCharges.length - 1; i >= 0; i--) {
      const fc   = this.fireCharges[i];
      const hits = fc.update(delta, enemies);
      for (const e of hits) this.onEnemyDestroyed(e);
      if (fc.isExpired) this.fireCharges.splice(i, 1);
    }

    // ── Lightning storms ──────────────────────────────────────────────────────
    for (let i = this.lightningStorms.length - 1; i >= 0; i--) {
      const ls   = this.lightningStorms[i];
      const hits = ls.update(delta, enemies);
      for (const e of hits) { if (e.hit()) this.onEnemyDestroyed(e); }
      if (ls.isExpired) this.lightningStorms.splice(i, 1);
    }

    // ── Tornadoes ─────────────────────────────────────────────────────────────
    for (let i = this.tornadoes.length - 1; i >= 0; i--) {
      const t        = this.tornadoes[i];
      const consumed = t.update(delta, this.activePlayers, enemies);
      for (const player of consumed) {
        if (player === this.player1) this.onPlayerHit(1);
        else                         this.onPlayerHit(2);
      }
      if (t.isExpired) this.tornadoes.splice(i, 1);
    }

    // ── Salmon salvos ─────────────────────────────────────────────────────────
    for (let i = this.salmonSalvos.length - 1; i >= 0; i--) {
      const ss   = this.salmonSalvos[i];
      const hits = ss.update(delta, enemies);
      for (const e of hits) this.onEnemyDestroyed(e);
      if (ss.isExpired) this.salmonSalvos.splice(i, 1);
    }

    // ── Lime infections ───────────────────────────────────────────────────────
    for (let i = this.limeInfections.length - 1; i >= 0; i--) {
      const li   = this.limeInfections[i];
      const dead = li.update(delta, enemies);
      for (const e of dead) this.onEnemyDestroyed(e);
      if (li.isExpired) this.limeInfections.splice(i, 1);
    }

    // ── Missiles ──────────────────────────────────────────────────────────────
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m    = this.missiles[i];
      const hits = m.update(delta, enemies);
      for (const e of hits) this.onEnemyDestroyed(e);
      if (m.isExpired) this.missiles.splice(i, 1);
    }

    // ── Tsunamis (1 damage each, not instant kill) ────────────────────────────
    for (let i = this.tsunamis.length - 1; i >= 0; i--) {
      const ts   = this.tsunamis[i];
      const hits = ts.update(delta);
      for (const e of hits) { if (e.hit()) this.onEnemyDestroyed(e); }
      if (ts.isExpired) this.tsunamis.splice(i, 1);
    }

    // ── Sonic waves ───────────────────────────────────────────────────────────
    for (let i = this.sonicWaves.length - 1; i >= 0; i--) {
      const sw   = this.sonicWaves[i];
      const hits = sw.update(delta, enemies);
      for (const e of hits) { if (e.hit()) this.onEnemyDestroyed(e); }
      if (sw.isExpired) this.sonicWaves.splice(i, 1);
    }

    // ── Laser pair beam updates + proximity damage ────────────────────────────
    const now = this.time.now;
    for (let i = this.waveManager.laserPairs.length - 1; i >= 0; i--) {
      const pair = this.waveManager.laserPairs[i];
      pair.update(delta);

      // Check if any active player is touching the beam
      for (const player of this.activePlayers) {
        if (player.isGhost) continue;
        if (pair.distanceToBeam(player.x, player.y) < LaserPair.TOUCH_DIST) {
          const isP1 = player === this.player1;
          const cd   = isP1 ? this.p1BeamDmgCooldown : this.p2BeamDmgCooldown;
          if (now > cd) {
            if (isP1) this.p1BeamDmgCooldown = now + 850;
            else       this.p2BeamDmgCooldown = now + 850;
            this.onPlayerHit(isP1 ? 1 : 2);
          }
        }
      }

      // Clean up fully-dead pairs
      if (pair.isExpired) {
        pair.destroy();
        this.waveManager.laserPairs.splice(i, 1);
      }
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

    // ── Apple pickups ─────────────────────────────────────────────────────────
    for (const player of this.activePlayers) {
      if (player.isGhost) continue;
      this.physics.overlap(player, this.appleGroup, (_p, appleObj) => {
        const apple = appleObj as Apple;
        if (!apple.active) return;
        apple.destroy();
        const isP1 = player === this.player1;
        if (isP1) {
          this.p1Lives = Math.min(this.p1Lives + 1, PLAYER_LIVES);
          this.p1LivesText.setText(`Lives: ${this.p1Lives}`);
        } else {
          this.p2Lives = Math.min(this.p2Lives + 1, PLAYER_LIVES);
          this.p2LivesText?.setText(`Lives: ${this.p2Lives}`);
        }
        SFX.pickupApple();
        this.showCentreMessage('🍎  +1 LIFE!', '#ff4444');
      });
    }

    // ── Super apple pickups (ghosts CAN collect these) ────────────────────────
    for (const player of this.activePlayers) {
      this.physics.overlap(player, this.superAppleGroup, (_p, saObj) => {
        const sa = saObj as SuperApple;
        if (!sa.active) return;
        sa.destroy();
        const isP1    = player === this.player1;
        const wasGhost = player.isGhost;
        if (wasGhost) player.revive();
        if (isP1) {
          this.p1Lives = PLAYER_LIVES;
          this.p1LivesText.setText(`Lives: ${this.p1Lives}`);
        } else {
          this.p2Lives = PLAYER_LIVES;
          this.p2LivesText?.setText(`Lives: ${this.p2Lives}`);
        }
        SFX.pickupSuperApple();
        const msg = wasGhost ? '⭐  REVIVED!  FULL LIVES!' : '⭐  FULL LIVES!';
        this.showCentreMessage(msg, '#44aaff');
      });
    }

    // Cull apples that have scrolled off the bottom
    const { height: sh } = this.scale;
    this.appleGroup.getChildren().forEach(obj => {
      const a = obj as Apple;
      if (a.active && a.y > sh + 40) a.destroy();
    });
    this.superAppleGroup.getChildren().forEach(obj => {
      const sa = obj as SuperApple;
      if (sa.active && sa.y > sh + 40) sa.destroy();
    });

    // ── Wave advancement ──────────────────────────────────────────────────────
    if (this.waveManager.currentWave > 0 && this.waveManager.isWaveClear) {
      // Tutorial complete check (must come before startNextWave)
      if (this.waveManager.isTutorialComplete) {
        this.showTutorialComplete();
        return;
      }

      const completedWave = this.waveManager.currentWave;
      this.waveManager.startNextWave();
      this.waveText.setText(`Wave: ${this.waveManager.currentWave}`);
      SFX.nextWave();

      // Tutorial: show a teaching hint when a new enemy type first appears
      if (this.gameMode === 'tutorial') {
        this.showTutorialHint(this.waveManager.currentWave);
      }

      // Notify multi-wave abilities
      this.lightningStorms.forEach(s => s.onWaveComplete());
      this.tornadoes.forEach(t => t.onWaveComplete());
      this.limeInfections.forEach(l => l.onWaveComplete());

      // Regular apple countdown (every 1–5 waves)
      this.appleCountdown--;
      if (this.appleCountdown <= 0) {
        this.spawnApple();
        this.appleCountdown = Phaser.Math.Between(1, 5);
      }

      // Super apple countdown (every 6–10 waves)
      this.superAppleCountdown--;
      if (this.superAppleCountdown <= 0) {
        this.spawnSuperApple();
        this.superAppleCountdown = Phaser.Math.Between(6, 10);
      }

      if (completedWave % 4 === 0) {
        this.p1BhCharges += ABILITY_CHARGES[this.p1AbilityType] ?? 1;
        if (this.playerCount === 2) this.p2BhCharges += ABILITY_CHARGES[this.p2AbilityType] ?? 1;
        this.updateBhHud();
        this.showCentreMessage(`⚡  ${ABILITY_LABEL[this.p1AbilityType]} charged!`, '#cc00ff');
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
      this.updateBeamBar(this.player2.beam, this.p2BeamFill, this.p2BeamLabel, this.p2HudColor, this.p2HudColor);
  }

  // ── Player config / texture builder ─────────────────────────────────────

  /**
   * Generates a coloured ship texture and returns a PlayerConfig that uses it.
   * @param color      Ship body colour (hex)
   * @param textureKey Unique texture cache key (e.g. 'player-p1-custom')
   * @param face       'smile' for P1 look, 'stern' for P2 look
   * @param base       The base config whose controls/keys are inherited
   */
  private buildPlayerConfig(
    color:      number,
    textureKey: string,
    face:       'smile' | 'stern',
    base:       PlayerConfig,
  ): PlayerConfig {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Triangle body
    g.fillStyle(color, 1);
    g.fillTriangle(16, 0, 0, 32, 32, 32);

    // Eyes — white sclera, black pupil, white highlight
    g.fillStyle(0xffffff, 1); g.fillCircle(11, 20, 4);
    g.fillStyle(0xffffff, 1); g.fillCircle(21, 20, 4);
    g.fillStyle(0x000000, 1); g.fillCircle(11, 20, 2);
    g.fillStyle(0x000000, 1); g.fillCircle(21, 20, 2);
    g.fillStyle(0xffffff, 1); g.fillCircle(12, 19, 1);
    g.fillStyle(0xffffff, 1); g.fillCircle(22, 19, 1);

    if (face === 'smile') {
      // Happy curve
      g.lineStyle(2, 0x000000, 1);
      g.beginPath(); g.arc(16, 26, 4, 0, Math.PI, false); g.strokePath();
    } else {
      // Stern brows + flat mouth
      g.lineStyle(2, 0x000000, 1);
      g.beginPath(); g.moveTo(8, 14);  g.lineTo(14, 16); g.strokePath();
      g.beginPath(); g.moveTo(24, 14); g.lineTo(18, 16); g.strokePath();
      g.beginPath(); g.moveTo(12, 26); g.lineTo(20, 26); g.strokePath();
    }

    g.generateTexture(textureKey, 32, 32);
    g.destroy();

    return {
      ...base,
      textureKey,
      shipTint:  0xffffff,
      peltTint:  color,
      beamColor: color,
    };
  }

  // ── Apple spawning ────────────────────────────────────────────────────────

  private spawnApple(): void {
    const { width } = this.scale;
    const x     = Phaser.Math.Between(60, width - 60);
    const apple = new Apple(this, x, -30);
    this.appleGroup.add(apple);
    this.showCentreMessage('🍎  Apple incoming!', '#ff6666');
  }

  private spawnSuperApple(): void {
    const { width } = this.scale;
    const x          = Phaser.Math.Between(60, width - 60);
    const superApple = new SuperApple(this, x, -30);
    this.superAppleGroup.add(superApple);
    this.showCentreMessage('⭐  SUPER APPLE!', '#44aaff');
  }

  // ── Zolt lightning ────────────────────────────────────────────────────────

  private fireZoltBolt(zolt: ZoltShip, target: PlayerShip): void {
    this.lightningEffects.push(
      new LightningEffect(this, zolt.x, zolt.y, target.x, target.y),
    );
    SFX.zoltBolt();
    const num = target === this.player1 ? 1 : 2;
    this.onPlayerHit(num as 1 | 2);
  }

  // ── Ability deployment ────────────────────────────────────────────────────

  private handleAbilityDeployment(): void {
    if (this.player1.wantsBlackHole && this.p1BhCharges > 0 && !this.player1.isGhost) {
      this.p1BhCharges--;
      this.updateBhHud();
      this.deployAbility(this.player1, this.p1AbilityType);
    }
    if (this.player2?.wantsBlackHole && this.p2BhCharges > 0 && !this.player2.isGhost) {
      this.p2BhCharges--;
      this.updateBhHud();
      this.deployAbility(this.player2, this.p2AbilityType);
    }
  }

  private deployAbility(player: PlayerShip, type: AbilityType): void {
    switch (type) {
      case 'blackhole':
        this.blackHoles.push(new BlackHole(this, player.x, Math.max(player.y - BH_DEPLOY_DIST, 60)));
        SFX.abilityBlackHole();
        break;
      case 'fire':
        this.fireCharges.push(new FireCharge(this, player.x, player.y));
        SFX.abilityMeteor();
        break;
      case 'lightning-storm':
        this.lightningStorms.push(new LightningStorm(this, player));
        SFX.abilityLightningStorm();
        break;
      case 'tornado':
        this.tornadoes.push(new WaterTornado(this, player.x, Math.max(player.y - BH_DEPLOY_DIST, 60)));
        SFX.abilityTornado();
        break;
      case 'salmon':
        this.salmonSalvos.push(new SalmonSalvo(this, player.x, player.y));
        SFX.abilitySalmon();
        break;
      case 'infection':
        this.limeInfections.push(new LimeInfection(this, this.waveManager.enemies));
        SFX.abilityInfection();
        break;
      case 'missile':
        this.missiles.push(new Missile(this, player.x, player.y - 20));
        SFX.abilityMissile();
        break;
      case 'tsunami':
        this.tsunamis.push(new Tsunami(this, this.waveManager.enemies));
        SFX.abilityTsunami();
        break;
      case 'sonic-wave':
        this.sonicWaves.push(new SonicWave(this, player.x, player.y, this.waveManager.enemies));
        SFX.abilitySonicWave();
        break;
    }
  }

  // ── HUD helpers ───────────────────────────────────────────────────────────

  private updateBhHud(): void {
    this.p1BhText.setText(`${ABILITY_LABEL[this.p1AbilityType]}: ${this.p1BhCharges}`);
    this.p2BhText?.setText(`${ABILITY_LABEL[this.p2AbilityType]}: ${this.p2BhCharges}`);
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
    if (!enemy.active) return;
    this.score += enemy.points;
    this.scoreText.setText(`Score: ${this.score}`);
    this.showOof(enemy.x, enemy.y);
    SFX.enemyPop();
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
      SFX.gameOver();
      this.blackHoles.forEach(bh => bh.destroy());
      this.lightningEffects.forEach(le => le.destroy());
      this.fireCharges.forEach(fc => fc.destroy());
      this.lightningStorms.forEach(ls => ls.destroy());
      this.tornadoes.forEach(t => t.destroy());
      this.salmonSalvos.forEach(ss => ss.destroy());
      this.limeInfections.forEach(li => li.destroy());
      this.missiles.forEach(m => m.destroy());
      this.tsunamis.forEach(ts => ts.destroy());
      this.sonicWaves.forEach(sw => sw.destroy());
      this.waveManager.laserPairs.forEach(p => p.destroy());
      this.waveManager.laserPairs.length = 0;
      this.player1.beam.destroy();
      this.player2?.beam.destroy();
      this.scene.start('GameOverScene', { score: this.score, wave: this.waveManager.currentWave });
      return;
    }

    const justDied = playerNum === 1 ? this.p1Lives <= 0 : this.p2Lives <= 0;
    if (justDied) {
      player.setGhost();
      this.showGhostMessage(playerNum);
      return;
    }

    // Still has lives — brief red tint flash, no transparency
    SFX.playerHurt();
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

  // ── Tutorial helpers ──────────────────────────────────────────────────────

  private readonly TUTORIAL_HINTS: Record<number, { lines: string[]; color: string }> = {
    1: {
      color: '#ff8844',
      lines: [
        'WAVE 1 — GROK',
        'Dodge enemies  •  Shoot to destroy',
      ],
    },
    3: {
      color: '#ff44aa',
      lines: [
        'WAVE 3 — SKETH',
        'Faster! In tutorial they still die in one hit.',
      ],
    },
    6: {
      color: '#ffdd00',
      lines: [
        'WAVE 6 — ZOLT',
        'Stay away! It fires lightning if you get close.',
      ],
    },
    8: {
      color: '#ff4444',
      lines: [
        'WAVE 8 — LASER BARRIER',
        "Don't touch the beam!  Shoot the red nodes.",
      ],
    },
  };

  private showTutorialHint(wave: number): void {
    const hint = this.TUTORIAL_HINTS[wave];
    if (!hint) return;

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Panel background
    const panel = this.add.rectangle(cx, cy, width * 0.78, 80, 0x000000, 0.75)
      .setDepth(50).setAlpha(0);

    const title = this.add.text(cx, cy - 14, hint.lines[0], {
      fontSize: '18px', color: hint.color, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(51).setAlpha(0);

    const body = this.add.text(cx, cy + 14, hint.lines[1], {
      fontSize: '13px', color: '#cccccc',
      wordWrap: { width: width * 0.72 }, align: 'center',
    }).setOrigin(0.5).setDepth(51).setAlpha(0);

    const targets = [panel, title, body];
    this.tweens.add({
      targets,
      alpha: 1,
      duration: 300,
      hold: 2800,
      yoyo: true,
      onComplete: () => targets.forEach(t => t.destroy()),
    });
  }

  private showTutorialComplete(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Freeze further updates by stopping wave checks — mark wave as done
    SFX.nextWave();

    this.add.rectangle(cx, height / 2, width, height, 0x000000, 0.65).setDepth(60);

    this.add.text(cx, height * 0.28, 'TUTORIAL', {
      fontSize: '20px', color: '#ffdd00', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(61);

    this.add.text(cx, height * 0.38, 'COMPLETE!', {
      fontSize: '48px', color: '#00ffcc', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(61);

    this.add.text(cx, height * 0.52, `Score: ${this.score}`, {
      fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(61);

    this.add.text(cx, height * 0.62,
      "You've learned the basics!\nReady for the real thing?",
      { fontSize: '16px', color: '#aaaaaa', align: 'center' },
    ).setOrigin(0.5).setDepth(61);

    // Normal mode button
    const btnY = height * 0.76;
    const btn = this.add.rectangle(cx, btnY, 260, 56, 0x00ffcc, 0.15)
      .setStrokeStyle(2, 0x00ffcc, 0.8)
      .setDepth(61)
      .setInteractive();
    const btnTxt = this.add.text(cx, btnY, 'PLAY NORMAL MODE', {
      fontSize: '18px', color: '#00ffcc', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(62);
    this.tweens.add({ targets: [btn, btnTxt], alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });
    btn.on('pointerdown', () => {
      this.scene.start('ColorSelectScene', { players: 1, mode: 'normal' });
    });

    // Also SPACE / tap
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('ColorSelectScene', { players: 1, mode: 'normal' });
    });

    // Disable further game logic by stopping player movement
    this.player1.setGhost();
    this.player2?.setGhost();
  }
}
