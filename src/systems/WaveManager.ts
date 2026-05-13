import * as Phaser from 'phaser';
import { EnemyShip, ENEMY_PRESETS } from '../entities/EnemyShip';
import { ZoltShip } from '../entities/ZoltShip';
import { LaserPair } from '../entities/LaserPair';

export class WaveManager {
  private readonly scene: Phaser.Scene;
  readonly enemies:    Phaser.GameObjects.Group;
  readonly zolts:      ZoltShip[]   = [];
  readonly laserPairs: LaserPair[]  = [];
  private wave = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enemies = scene.add.group({ runChildUpdate: false });
  }

  get currentWave(): number {
    return this.wave;
  }

  startNextWave(): void {
    this.wave += 1;
    const count  = 5 + this.wave * 2;
    const preset = this.wave <= 2 ? ENEMY_PRESETS.grok : ENEMY_PRESETS.sketh;
    const { width } = this.scene.scale;

    // ── Zolts: uncapped, scale up from wave 10 ───────────────────────────────
    // wave 10 → 1, wave 12 → 2, … wave 18 → 5, wave 20 → 6, no hard ceiling
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

    // ── Laser pairs (wave 15+) ────────────────────────────────────────────────
    // Beam width grows from ~50 % of screen at wave 15 toward ~88 % at wave 30+.
    // That leaves a shrinking gap on each side the player must squeeze through.
    // Number of pairs also increases every 2 waves (no hard cap).
    if (this.wave >= 15) {
      const pairCount = Math.floor((this.wave - 12) / 2); // 1 at w15, 2 at w17, 3 at w19 …

      // Fraction of screen width the beam covers:  50 % → 88 % (capped)
      const fraction  = Math.min(0.50 + (this.wave - 15) * 0.026, 0.88);
      const beamSpan  = Math.round(width * fraction);

      for (let i = 0; i < pairCount; i++) {
        // Keep nodes at least 20 px from each wall; the usable half-offset shrinks as beam grows
        const halfSpan  = beamSpan / 2;
        const maxShift  = Math.max(0, width / 2 - halfSpan - 20);
        const cx        = width / 2 + Phaser.Math.Between(-maxShift, maxShift);
        const y         = Phaser.Math.Between(-140, -50) - i * 80; // stagger vertically so pairs don't overlap

        const pair = new LaserPair(this.scene, cx - halfSpan, cx + halfSpan, y);
        this.enemies.add(pair.nodeA);
        this.enemies.add(pair.nodeB);
        this.laserPairs.push(pair);
      }
    }
  }

  get isWaveClear(): boolean {
    return this.enemies.countActive(true) === 0;
  }

  /** Remove enemies that have left the play area (bottom or top). */
  cullOffscreen(): void {
    const { height } = this.scene.scale;
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as EnemyShip;
      if (!enemy.active) return;

      // Bottom: scrolled past the floor
      if (enemy.y > height + 40) { enemy.destroy(); return; }

      // Top: repelled upward by sonic wave.
      // Normal enemies only ever move downward (vy > 0), so checking vy < 0
      // perfectly identifies repelled enemies. Cull them as soon as they are in
      // the upper 60 % of the screen moving upward — no need to wait for them
      // to float all the way off the top.
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      if (body.velocity.y < 0 && enemy.y < height * 0.6) { enemy.destroy(); }
    });
  }
}
