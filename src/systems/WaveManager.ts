import * as Phaser from 'phaser';
import { EnemyShip, ENEMY_PRESETS } from '../entities/EnemyShip';
import { ZoltShip } from '../entities/ZoltShip';

export class WaveManager {
  private readonly scene: Phaser.Scene;
  readonly enemies: Phaser.GameObjects.Group;
  readonly zolts:   ZoltShip[] = [];
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

    // Regular enemies (fewer slots if zolts are also spawning)
    const zoltCount    = this.wave >= 10 ? Math.min(Math.floor((this.wave - 8) / 2), 3) : 0;
    const regularCount = Math.max(count - zoltCount, 3);

    for (let i = 0; i < regularCount; i++) {
      const x = Phaser.Math.Between(40, width - 40);
      const y = Phaser.Math.Between(-200, -40);
      this.enemies.add(new EnemyShip(this.scene, x, y, preset));
    }

    for (let i = 0; i < zoltCount; i++) {
      const x    = Phaser.Math.Between(60, width - 60);
      const y    = Phaser.Math.Between(-300, -80);
      const zolt = new ZoltShip(this.scene, x, y);
      this.enemies.add(zolt);
      this.zolts.push(zolt);
    }
  }

  get isWaveClear(): boolean {
    return this.enemies.countActive(true) === 0;
  }

  /** Remove enemies that have scrolled off the bottom of the screen. */
  cullOffscreen(): void {
    const { height } = this.scene.scale;
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as EnemyShip;
      if (enemy.active && enemy.y > height + 40) {
        enemy.destroy();
      }
    });
  }
}
