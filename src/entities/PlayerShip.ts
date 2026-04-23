import * as Phaser from 'phaser';
import { LaserBeam } from './LaserBeam';
import { Laser } from './Laser';

const MOVE_SPEED       = 300;
const FIRE_COOLDOWN_MS = 500;

export interface PlayerConfig {
  /** Tint on the ship sprite. 0xffffff = use texture colour as-is. */
  shipTint:  number;
  /** Tint applied to laser pelts. */
  peltTint:  number;
  /** Primary glow colour of the energy beam. */
  beamColor: number;
  /** Key that fires laser pelts. */
  peltKey:   number;
  /** Key that activates the energy beam. */
  beamKey:   number;
  leftKey:   number;
  rightKey:  number;
  upKey:     number | null;
  downKey:   number | null;
}

// ── Preset configs ────────────────────────────────────────────────────────────

// P1 — left hand on WASD, Q/E for weapons
export const PLAYER1_CONFIG: PlayerConfig = {
  shipTint:  0x00ffcc,
  peltTint:  0x00ffff,
  beamColor: 0x00ccff,
  peltKey:   Phaser.Input.Keyboard.KeyCodes.Q,
  beamKey:   Phaser.Input.Keyboard.KeyCodes.E,
  leftKey:   Phaser.Input.Keyboard.KeyCodes.A,
  rightKey:  Phaser.Input.Keyboard.KeyCodes.D,
  upKey:     Phaser.Input.Keyboard.KeyCodes.W,
  downKey:   Phaser.Input.Keyboard.KeyCodes.S,
};

// P2 — right hand on arrow keys, . / for weapons
export const PLAYER2_CONFIG: PlayerConfig = {
  shipTint:  0xff8800,
  peltTint:  0xff8800,
  beamColor: 0xff6600,
  peltKey:   Phaser.Input.Keyboard.KeyCodes.PERIOD,
  beamKey:   Phaser.Input.Keyboard.KeyCodes.FORWARD_SLASH,
  leftKey:   Phaser.Input.Keyboard.KeyCodes.LEFT,
  rightKey:  Phaser.Input.Keyboard.KeyCodes.RIGHT,
  upKey:     Phaser.Input.Keyboard.KeyCodes.UP,
  downKey:   Phaser.Input.Keyboard.KeyCodes.DOWN,
};

// ── PlayerShip ────────────────────────────────────────────────────────────────

export class PlayerShip extends Phaser.Physics.Arcade.Image {
  private readonly cfg:      PlayerConfig;
  private readonly peltKey:  Phaser.Input.Keyboard.Key;
  private readonly beamKey:  Phaser.Input.Keyboard.Key;
  private readonly leftKey:  Phaser.Input.Keyboard.Key;
  private readonly rightKey: Phaser.Input.Keyboard.Key;
  private readonly upKey:    Phaser.Input.Keyboard.Key | null;
  private readonly downKey:  Phaser.Input.Keyboard.Key | null;

  readonly beam:   LaserBeam;
  readonly lasers: Phaser.GameObjects.Group;

  private lastFiredAt = 0;
  isGhost = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlayerConfig) {
    super(scene, x, y, 'player-ship');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setTint(config.shipTint);

    this.cfg = config;
    const kb = scene.input.keyboard!;

    this.peltKey  = kb.addKey(config.peltKey);
    this.beamKey  = kb.addKey(config.beamKey);
    this.leftKey  = kb.addKey(config.leftKey);
    this.rightKey = kb.addKey(config.rightKey);
    this.upKey    = config.upKey   !== null ? kb.addKey(config.upKey)   : null;
    this.downKey  = config.downKey !== null ? kb.addKey(config.downKey) : null;

    this.beam   = new LaserBeam(scene, config.beamColor);
    this.lasers = scene.add.group({ classType: Laser, runChildUpdate: true });
  }

  update(time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    if (this.leftKey.isDown)        body.setVelocityX(-MOVE_SPEED);
    else if (this.rightKey.isDown)  body.setVelocityX(MOVE_SPEED);

    if (this.upKey?.isDown)         body.setVelocityY(-MOVE_SPEED);
    else if (this.downKey?.isDown)  body.setVelocityY(MOVE_SPEED);

    // Ghosts can't shoot
    if (!this.isGhost) {
      // Pelts
      if (Phaser.Input.Keyboard.JustDown(this.peltKey) && time > this.lastFiredAt + FIRE_COOLDOWN_MS) {
        this.lastFiredAt = time;
        const laser = new Laser(this.scene, this.x, this.y - 20, this.cfg.peltTint);
        this.lasers.add(laser);
      }

      // Beam
      if (Phaser.Input.Keyboard.JustDown(this.beamKey)) {
        this.beam.tryFire();
      }
    }
  }

  /** Turn this player into a ghost — faded, can't shoot, beam clears. */
  setGhost(): void {
    this.isGhost = true;
    this.setAlpha(0.25);
    this.beam.destroy(); // clear any active beam immediately
  }
}
