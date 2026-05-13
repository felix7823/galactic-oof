import * as Phaser from 'phaser';
import { LaserBeam } from './LaserBeam';
import { Laser } from './Laser';
import { SFX } from '../systems/SoundManager';

const MOVE_SPEED       = 300;
const FIRE_COOLDOWN_MS = 200;

export interface PlayerConfig {
  textureKey:   string;   // sprite texture to use
  shipTint:     number;   // 0xffffff = no tint
  peltTint:     number;
  beamColor:    number;
  peltKey:      number;
  beamKey:      number;
  blackHoleKey: number;
  leftKey:      number;
  rightKey:     number;
  upKey:        number | null;
  downKey:      number | null;
}

// ── Preset configs ────────────────────────────────────────────────────────────

// P1 — WASD move | Q pelts | E beam | R black hole
export const PLAYER1_CONFIG: PlayerConfig = {
  textureKey:   'player1-ship',
  shipTint:     0xffffff,       // colour baked into texture, no tint needed
  peltTint:     0x00ffff,
  beamColor:    0x00ccff,
  peltKey:      Phaser.Input.Keyboard.KeyCodes.Q,
  beamKey:      Phaser.Input.Keyboard.KeyCodes.E,
  blackHoleKey: Phaser.Input.Keyboard.KeyCodes.R,
  leftKey:      Phaser.Input.Keyboard.KeyCodes.A,
  rightKey:     Phaser.Input.Keyboard.KeyCodes.D,
  upKey:        Phaser.Input.Keyboard.KeyCodes.W,
  downKey:      Phaser.Input.Keyboard.KeyCodes.S,
};

// P2 — Arrow keys move | . pelts | / beam | , black hole
export const PLAYER2_CONFIG: PlayerConfig = {
  textureKey:   'player2-ship',
  shipTint:     0xffffff,      // colour baked into texture, no tint needed
  peltTint:     0xff8800,
  beamColor:    0xff6600,
  peltKey:      Phaser.Input.Keyboard.KeyCodes.PERIOD,
  beamKey:      Phaser.Input.Keyboard.KeyCodes.FORWARD_SLASH,
  blackHoleKey: Phaser.Input.Keyboard.KeyCodes.COMMA,
  leftKey:      Phaser.Input.Keyboard.KeyCodes.LEFT,
  rightKey:     Phaser.Input.Keyboard.KeyCodes.RIGHT,
  upKey:        Phaser.Input.Keyboard.KeyCodes.UP,
  downKey:      Phaser.Input.Keyboard.KeyCodes.DOWN,
};

// ── PlayerShip ────────────────────────────────────────────────────────────────

export class PlayerShip extends Phaser.Physics.Arcade.Image {
  private readonly cfg:          PlayerConfig;
  private readonly peltKey:      Phaser.Input.Keyboard.Key;
  private readonly beamKey:      Phaser.Input.Keyboard.Key;
  private readonly blackHoleKey: Phaser.Input.Keyboard.Key;
  private readonly leftKey:      Phaser.Input.Keyboard.Key;
  private readonly rightKey:     Phaser.Input.Keyboard.Key;
  private readonly upKey:        Phaser.Input.Keyboard.Key | null;
  private readonly downKey:      Phaser.Input.Keyboard.Key | null;

  beam:   LaserBeam;
  readonly lasers: Phaser.GameObjects.Group;

  private lastFiredAt = 0;
  isGhost = false;

  /** Set to true by update() when the black hole key is just pressed. GameScene reads & resets it. */
  wantsBlackHole = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlayerConfig) {
    super(scene, x, y, config.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setDisplaySize(32, 32); // normalise all ships to the same size
    this.setTint(config.shipTint);

    this.cfg = config;
    const kb = scene.input.keyboard!;

    this.peltKey      = kb.addKey(config.peltKey);
    this.beamKey      = kb.addKey(config.beamKey);
    this.blackHoleKey = kb.addKey(config.blackHoleKey);
    this.leftKey      = kb.addKey(config.leftKey);
    this.rightKey     = kb.addKey(config.rightKey);
    this.upKey        = config.upKey   !== null ? kb.addKey(config.upKey)   : null;
    this.downKey      = config.downKey !== null ? kb.addKey(config.downKey) : null;

    this.beam   = new LaserBeam(scene, config.beamColor);
    this.lasers = scene.add.group({ classType: Laser, runChildUpdate: true });
  }

  update(time: number, _delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    if (this.leftKey.isDown)       body.setVelocityX(-MOVE_SPEED);
    else if (this.rightKey.isDown) body.setVelocityX(MOVE_SPEED);

    if (this.upKey?.isDown)        body.setVelocityY(-MOVE_SPEED);
    else if (this.downKey?.isDown) body.setVelocityY(MOVE_SPEED);

    this.wantsBlackHole = false;

    if (!this.isGhost) {
      // Pelts
      if (Phaser.Input.Keyboard.JustDown(this.peltKey) && time > this.lastFiredAt + FIRE_COOLDOWN_MS) {
        this.lastFiredAt = time;
        this.lasers.add(new Laser(this.scene, this.x, this.y - 20, this.cfg.peltTint));
        SFX.laser();
      }

      // Beam
      if (Phaser.Input.Keyboard.JustDown(this.beamKey)) {
        if (this.beam.state === 'idle') SFX.beamFire();
        this.beam.tryFire();
      }

      // Black hole — set flag, GameScene handles charge logic
      if (Phaser.Input.Keyboard.JustDown(this.blackHoleKey)) {
        this.wantsBlackHole = true;
      }
    }
  }

  setGhost(): void {
    this.isGhost = true;
    this.setAlpha(0.25);
    this.beam.destroy();
  }

  /** Undo ghost state — rebuilds the beam so the player can shoot again. */
  revive(): void {
    this.isGhost = false;
    this.setAlpha(1);
    this.beam = new LaserBeam(this.scene, this.cfg.beamColor);
  }
}
