import * as Phaser from 'phaser';

export class Laser extends Phaser.Physics.Arcade.Image {
  private readonly speed = -500; // negative = upward

  constructor(scene: Phaser.Scene, x: number, y: number, tint = 0x00ffff) {
    super(scene, x, y, 'laser');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setTint(tint);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(this.speed);
  }

  update(): void {
    if (this.y < -20) this.destroy();
  }
}
