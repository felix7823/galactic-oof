import * as Phaser from 'phaser';

const FALL_SPEED = 65; // px/s — slightly slower than enemies so players can catch it

export class Apple extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'apple');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(FALL_SPEED);
    this.setDepth(5);
  }
}
