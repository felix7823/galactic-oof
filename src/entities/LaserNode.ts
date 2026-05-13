import * as Phaser from 'phaser';

/**
 * LaserNode — one half of a LaserPair.
 * Two nodes face each other and emit a deadly beam between them.
 * Takes 3 hits to destroy; 40 points each.
 */
export class LaserNode extends Phaser.Physics.Arcade.Image {
  hp     = 3;
  readonly points = 40;

  /** The other node in the pair. Nulled out when partner dies. */
  partner: LaserNode | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'laser-node');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(50);
    this.setDepth(4);
  }

  /** Called when struck by a player weapon. Returns true if destroyed. */
  hit(): boolean {
    this.hp -= 1;
    this.setAlpha(0.35);
    this.scene.time.delayedCall(90, () => { if (this.active) this.setAlpha(1); });
    if (this.hp <= 0) {
      // Sever the partnership so the survivor knows it's alone
      if (this.partner) {
        this.partner.partner = null;
      }
      return true;
    }
    return false;
  }
}
