import * as Phaser from 'phaser';

export interface EnemyConfig {
  textureKey: string;
  tint: number;
  speed: number;
  hp: number;
  points: number;
}

export const ENEMY_PRESETS: Record<string, EnemyConfig> = {
  grok:  { textureKey: 'enemy-grok',  tint: 0xff4400, speed: 80,  hp: 1, points: 10 },
  sketh: { textureKey: 'enemy-sketh', tint: 0xff00aa, speed: 140, hp: 2, points: 25 },
};

export class EnemyShip extends Phaser.Physics.Arcade.Image {
  hp: number;
  readonly points: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
    super(scene, x, y, config.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.hp = config.hp;
    this.points = config.points;

    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(config.speed);
  }

  hit(): boolean {
    this.hp -= 1;
    this.setAlpha(0.4);
    this.scene.time.delayedCall(80, () => { if (this.active) this.setAlpha(1); });
    return this.hp <= 0;
  }
}
