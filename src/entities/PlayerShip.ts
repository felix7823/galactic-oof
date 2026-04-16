import * as Phaser from 'phaser';
import { LaserBeam } from './LaserBeam';

const MOVE_SPEED = 300;

export class PlayerShip extends Phaser.Physics.Arcade.Image {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly fireKey: Phaser.Input.Keyboard.Key;
  readonly beam: LaserBeam;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-ship');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.fireKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.beam = new LaserBeam(scene);
  }

  update(_delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    if (this.cursors.left.isDown)  body.setVelocityX(-MOVE_SPEED);
    else if (this.cursors.right.isDown) body.setVelocityX(MOVE_SPEED);

    if (this.cursors.up.isDown)    body.setVelocityY(-MOVE_SPEED);
    else if (this.cursors.down.isDown)  body.setVelocityY(MOVE_SPEED);

    // Fire on press (not hold) — beam manages the 3s / 2s cycle internally
    if (Phaser.Input.Keyboard.JustDown(this.fireKey)) {
      this.beam.tryFire();
    }
  }
}
