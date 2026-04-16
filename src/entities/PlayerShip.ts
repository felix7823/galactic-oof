import * as Phaser from 'phaser';
import { Laser } from './Laser';

const MOVE_SPEED = 300;
const FIRE_COOLDOWN_MS = 250;

export class PlayerShip extends Phaser.Physics.Arcade.Image {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly fireKey: Phaser.Input.Keyboard.Key;
  readonly lasers: Phaser.GameObjects.Group;

  private lastFiredAt = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-ship');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.fireKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.lasers = scene.add.group({
      classType: Laser,
      runChildUpdate: true,
    });
  }

  update(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    if (this.cursors.left.isDown) {
      body.setVelocityX(-MOVE_SPEED);
    } else if (this.cursors.right.isDown) {
      body.setVelocityX(MOVE_SPEED);
    }

    if (this.cursors.up.isDown) {
      body.setVelocityY(-MOVE_SPEED);
    } else if (this.cursors.down.isDown) {
      body.setVelocityY(MOVE_SPEED);
    }

    if (this.fireKey.isDown && time > this.lastFiredAt + FIRE_COOLDOWN_MS) {
      this.fire(time);
    }
  }

  private fire(time: number): void {
    this.lastFiredAt = time;
    const laser = new Laser(this.scene, this.x, this.y - 20);
    this.lasers.add(laser);
  }
}
