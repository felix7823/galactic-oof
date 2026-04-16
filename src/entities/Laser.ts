import * as Phaser from 'phaser';

export class Laser extends Phaser.Physics.Arcade.Image {
  private readonly speed = -500; // negative = upward

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'laser');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // tint/size baked into the 'laser' texture generated in BootScene
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(this.speed);
  }

  update(): void {
    // Destroy when it leaves the top of the screen
    if (this.y < -20) {
      this.destroy();
    }
  }
}
