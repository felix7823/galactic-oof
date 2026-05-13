import * as Phaser from 'phaser';

const FALL_SPEED = 55; // slightly slower than a regular apple — give players time to react

export class SuperApple extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'super-apple');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(FALL_SPEED);
    this.setDepth(6);

    // Gentle pulse so it stands out on screen
    scene.tweens.add({
      targets: this,
      scaleX: 1.18,
      scaleY: 1.18,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
