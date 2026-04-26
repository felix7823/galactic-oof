import * as Phaser from 'phaser';
import { EnemyShip } from './EnemyShip';
import type { EnemyConfig } from './EnemyShip';
import type { PlayerShip } from './PlayerShip';

const ZOLT_CONFIG: EnemyConfig = {
  textureKey: 'enemy-zolt',
  tint:       0xffdd00,
  speed:      45,
  hp:         3,
  points:     75,
};

const BOLT_RANGE = 32 * 3; // 3 ship-lengths = 96 px

export class ZoltShip extends EnemyShip {
  private hasFired = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, ZOLT_CONFIG);
  }

  /**
   * Call every frame with the active (non-ghost) players.
   * Returns the player to zap the moment one steps within range,
   * then never fires again.
   */
  tickBolt(players: PlayerShip[]): PlayerShip | null {
    if (this.hasFired) return null;

    for (const player of players) {
      if (player.isGhost) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      if (d <= BOLT_RANGE) {
        this.hasFired = true;
        return player;
      }
    }
    return null;
  }
}
