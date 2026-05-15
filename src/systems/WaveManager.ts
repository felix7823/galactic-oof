import * as Phaser from 'phaser';
import { EnemyShip, ENEMY_PRESETS } from '../entities/EnemyShip';
import { ZoltShip } from '../entities/ZoltShip';
import { LaserPair } from '../entities/LaserPair';

// ── Tutorial wave table ───────────────────────────────────────────────────────
// All enemies have 1 HP in tutorial mode (set after spawning).
// Laser pairs always use a 50 % screen-width beam so there is a large gap.

interface TutorialWaveSpec {
  groks:      number;
  skeths:     number;
  zolts:      number;
  laserPairs: number;
}

const TUTORIAL_WAVES: TutorialWaveSpec[] = [
  { groks:  5, skeths:  0, zolts: 0, laserPairs: 0 }, // wave 1
  { groks:  7, skeths:  0, zolts: 0, laserPairs: 0 }, // wave 2
  { groks:  0, skeths:  5, zolts: 0, laserPairs: 0 }, // wave 3
  { groks:  0, skeths: 10, zolts: 0, laserPairs: 0 }, // wave 4
  { groks:  0, skeths: 15, zolts: 0, laserPairs: 0 }, // wave 5
  { groks:  0, skeths: 15, zolts: 1, laserPairs: 0 }, // wave 6
  { groks:  0, skeths: 15, zolts: 2, laserPairs: 0 }, // wave 7
  { groks:  0, skeths: 15, zolts: 3, laserPairs: 1 }, // wave 8
  { groks:  0, skeths: 15, zolts: 3, laserPairs: 2 }, // wave 9
  { groks:  0, skeths: 15, zolts: 3, laserPairs: 2 }, // wave 10 (final)
];

export class WaveManager {
  private readonly scene:    Phaser.Scene;
  private readonly tutorial: boolean;

  readonly enemies:    Phaser.GameObjects.Group;
  readonly zolts:      ZoltShip[]  = [];
  readonly laserPairs: LaserPair[] = [];

  private wave = 0;

  constructor(scene: Phaser.Scene, tutorialMode = false) {
    this.scene    = scene;
    this.tutorial = tutorialMode;
    this.enemies  = scene.add.group({ runChildUpdate: false });
  }

  get currentWave(): number { return this.wave; }

  /** Returns true in tutorial mode when all 10 waves have been completed. */
  get isTutorialComplete(): boolean {
    return this.tutorial && this.wave >= TUTORIAL_WAVES.length;
  }

  startNextWave(): void {
    this.wave += 1;
    if (this.tutorial) {
      this.spawnTutorialWave();
    } else {
      this.spawnNormalWave();
    }
  }

  // ── Normal mode spawning ──────────────────────────────────────────────────

  private spawnNormalWave(): void {
    const count  = 5 + this.wave * 2;
    const preset = this.wave <= 2 ? ENEMY_PRESETS.grok : ENEMY_PRESETS.sketh;
    const { width } = this.scene.scale;

    // Zolts: uncapped, scale up from wave 10
    const zoltCount    = this.wave >= 10 ? Math.floor((this.wave - 8) / 2) : 0;
    const regularCount = Math.max(count - zoltCount, 3);

    for (let i = 0; i < regularCount; i++) {
      const x = Phaser.Math.Between(40, width - 40);
      const y = Phaser.Math.Between(-80, -10);
      this.enemies.add(new EnemyShip(this.scene, x, y, preset));
    }

    for (let i = 0; i < zoltCount; i++) {
      const x    = Phaser.Math.Between(60, width - 60);
      const y    = Phaser.Math.Between(-120, -40);
      const zolt = new ZoltShip(this.scene, x, y);
      this.enemies.add(zolt);
      this.zolts.push(zolt);
    }

    // Laser pairs (wave 15+): beam grows from 50 % → 88 % of screen width
    if (this.wave >= 15) {
      const pairCount = Math.floor((this.wave - 12) / 2);
      const fraction  = Math.min(0.50 + (this.wave - 15) * 0.026, 0.88);
      const beamSpan  = Math.round(width * fraction);

      for (let i = 0; i < pairCount; i++) {
        const halfSpan = beamSpan / 2;
        const maxShift = Math.max(0, width / 2 - halfSpan - 20);
        const cx       = width / 2 + Phaser.Math.Between(-maxShift, maxShift);
        const y        = Phaser.Math.Between(-140, -50) - i * 80;
        const pair     = new LaserPair(this.scene, cx - halfSpan, cx + halfSpan, y);
        this.enemies.add(pair.nodeA);
        this.enemies.add(pair.nodeB);
        this.laserPairs.push(pair);
      }
    }
  }

  // ── Tutorial mode spawning ────────────────────────────────────────────────

  private spawnTutorialWave(): void {
    const idx = this.wave - 1;
    if (idx >= TUTORIAL_WAVES.length) return; // shouldn't happen

    const spec = TUTORIAL_WAVES[idx];
    const { width } = this.scene.scale;

    // Groks
    for (let i = 0; i < spec.groks; i++) {
      const e = new EnemyShip(
        this.scene,
        Phaser.Math.Between(40, width - 40),
        Phaser.Math.Between(-80, -10),
        ENEMY_PRESETS.grok,
      );
      e.hp = 1;  // override to 1 HP in tutorial
      this.enemies.add(e);
    }

    // Skeths (1 HP in tutorial)
    for (let i = 0; i < spec.skeths; i++) {
      const e = new EnemyShip(
        this.scene,
        Phaser.Math.Between(40, width - 40),
        Phaser.Math.Between(-80, -10),
        ENEMY_PRESETS.sketh,
      );
      e.hp = 1;
      this.enemies.add(e);
    }

    // Zolts (1 HP in tutorial)
    for (let i = 0; i < spec.zolts; i++) {
      const zolt = new ZoltShip(
        this.scene,
        Phaser.Math.Between(60, width - 60),
        Phaser.Math.Between(-120, -40),
      );
      zolt.hp = 1;
      this.enemies.add(zolt);
      this.zolts.push(zolt);
    }

    // Laser pairs — always 50 % of screen width, centred with a random small shift
    for (let i = 0; i < spec.laserPairs; i++) {
      const beamSpan = Math.round(width * 0.50);
      const halfSpan = beamSpan / 2;
      const maxShift = width / 2 - halfSpan - 20;  // keeps nodes 20 px from wall
      const cx       = width / 2 + Phaser.Math.Between(-Math.max(0, maxShift), Math.max(0, maxShift));
      const y        = Phaser.Math.Between(-140, -50) - i * 90;
      const pair     = new LaserPair(this.scene, cx - halfSpan, cx + halfSpan, y);
      // Laser nodes always take 3 hits in tutorial (beam barrier is the challenge, not the node)
      this.enemies.add(pair.nodeA);
      this.enemies.add(pair.nodeB);
      this.laserPairs.push(pair);
    }
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  get isWaveClear(): boolean {
    return this.enemies.countActive(true) === 0;
  }

  cullOffscreen(): void {
    const { height } = this.scene.scale;
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as EnemyShip;
      if (!enemy.active) return;
      if (enemy.y > height + 40) { enemy.destroy(); return; }
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y < 0 && enemy.y < height * 0.6) { enemy.destroy(); }
    });
  }
}
