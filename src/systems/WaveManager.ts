import * as Phaser from 'phaser';
import { EnemyShip, ENEMY_PRESETS } from '../entities/EnemyShip';

export class WaveManager {
  private readonly scene: Phaser.Scene;
  readonly enemies: Phaser.GameObjects.Group;
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
    const count = 5 + this.wave * 2;
    const preset = this.wave <= 2 ? ENEMY_PRESETS.grok : ENEMY_PRESETS.sketh;
    const { width } = this.scene.scale;

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(40, width - 40);
      const y = Phaser.Math.Between(-200, -40);
      const enemy = new EnemyShip(this.scene, x, y, preset);
      this.enemies.add(enemy);
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
