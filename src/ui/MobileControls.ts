import * as Phaser from 'phaser';

const JOY_RADIUS   = 58;   // outer ring radius (px in game coords)
const THUMB_RADIUS = 22;   // movable thumb radius
const BTN_RADIUS   = 40;   // action-button radius
const BTN_HIT      = 14;   // extra hit-area padding around each button
const DEPTH        = 200;  // always on top of game objects

// ── MobileControls ──────────────────────────────────────────────────────────
// Creates a virtual joystick (left side) + three action buttons (right side).
// Usage in GameScene.update():
//   this.mob.preUpdate();                       // call FIRST every frame
//   body.setVelocityX(this.mob.joyX * SPEED);
//   body.setVelocityY(this.mob.joyY * SPEED);
//   if (this.mob.shootDown)      player.mobileFire(time);
//   if (this.mob.laserJustDown)  player.mobileBeam();
//   if (this.mob.specialJustDown) player.mobileSpecial();

export class MobileControls {
  // ── Public state ──────────────────────────────────────────────────────────
  /** Normalised joystick axes, -1 … +1 */
  joyX = 0;
  joyY = 0;

  /** True every frame the SHOOT button is held (continuous fire). */
  get shootDown(): boolean { return this._shoot; }

  /**
   * True only on the first read after the LASER button is pressed.
   * Auto-clears on read so it can never be double-fired.
   */
  get laserJustDown(): boolean {
    const v = this._laserFired;
    this._laserFired = false;
    return v;
  }

  /**
   * True only on the first read after the POWER button is pressed.
   * Auto-clears on read so it can never be double-fired.
   */
  get specialJustDown(): boolean {
    const v = this._specFired;
    this._specFired = false;
    return v;
  }

  // ── Private state ─────────────────────────────────────────────────────────
  private _shoot      = false;
  private _laserFired = false;   // one-shot: set on press, cleared on read
  private _specFired  = false;   // one-shot: set on press, cleared on read

  private readonly scene: Phaser.Scene;

  // Joystick visuals
  private joyBase!:  Phaser.GameObjects.Arc;
  private joyThumb!: Phaser.GameObjects.Arc;
  private joyPtrId = -1;
  private joyOriX  = 0;
  private joyOriY  = 0;

  // Buttons
  private shootBtn!: Phaser.GameObjects.Arc;
  private laserBtn!: Phaser.GameObjects.Arc;
  private specBtn!:  Phaser.GameObjects.Arc;
  private shootPtrId = -1;
  private laserPtrId = -1;
  private specPtrId  = -1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.build();
  }

  // ── Build UI ──────────────────────────────────────────────────────────────
  private build(): void {
    const { width, height } = this.scene.scale;

    // Joystick — hidden until first touch in the left zone
    this.joyBase = this.scene.add
      .circle(0, 0, JOY_RADIUS, 0x6699ff, 0.18)
      .setDepth(DEPTH)
      .setVisible(false);

    this.joyThumb = this.scene.add
      .circle(0, 0, THUMB_RADIUS, 0x99bbff, 0.60)
      .setDepth(DEPTH)
      .setVisible(false);

    // Action buttons — fixed in the bottom-right corner
    const bx     = width  - BTN_RADIUS - 18;
    const shootY = height - BTN_RADIUS - 20;
    const laserY = shootY - BTN_RADIUS * 2 - 12;
    const specY  = laserY - BTN_RADIUS * 2 - 12;

    this.shootBtn = this.makeBtn(bx, shootY, 0x00dd66, 'SHOOT', DEPTH);
    this.laserBtn = this.makeBtn(bx, laserY, 0x22aaff, 'LASER', DEPTH);
    this.specBtn  = this.makeBtn(bx, specY,  0xff44ee, 'POWER', DEPTH);

    // ── Pointer events ────────────────────────────────────────────────────
    this.scene.input.addPointer(4);   // support up to 5 simultaneous touches
    this.scene.input.on('pointerdown',   this.onDown, this);
    this.scene.input.on('pointermove',   this.onMove, this);
    this.scene.input.on('pointerup',     this.onUp,   this);
    this.scene.input.on('pointercancel', this.onUp,   this);
  }

  private makeBtn(
    x: number, y: number,
    color: number, label: string, depth: number,
  ): Phaser.GameObjects.Arc {
    const btn = this.scene.add
      .circle(x, y, BTN_RADIUS, color, 0.25)
      .setDepth(depth);

    // Outline ring drawn as a thin concentric circle (slightly bigger, alpha only)
    this.scene.add
      .circle(x, y, BTN_RADIUS + 2, color, 0.50)
      .setDepth(depth - 1);
    this.scene.add
      .circle(x, y, BTN_RADIUS, 0x000000, 0.01)  // opaque centre helps hit-test
      .setDepth(depth - 1);

    this.scene.add.text(x, y, label, {
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(depth + 1);

    return btn;
  }

  // ── Pointer handlers ──────────────────────────────────────────────────────
  private onDown(p: Phaser.Input.Pointer): void {
    const { width } = this.scene.scale;

    // Left 58 % of screen → joystick zone
    if (p.x < width * 0.58 && this.joyPtrId === -1) {
      this.joyPtrId = p.id;
      this.joyOriX  = p.x;
      this.joyOriY  = p.y;
      this.joyBase.setPosition(p.x, p.y).setVisible(true);
      this.joyThumb.setPosition(p.x, p.y).setVisible(true);
    } else {
      this.tryClaimBtn(p);
    }
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (p.id !== this.joyPtrId) return;

    const dx  = p.x - this.joyOriX;
    const dy  = p.y - this.joyOriY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(len, JOY_RADIUS);

    this.joyX = len > 0 ? (dx / len) * (clamped / JOY_RADIUS) : 0;
    this.joyY = len > 0 ? (dy / len) * (clamped / JOY_RADIUS) : 0;

    const nx = len > 0 ? dx / len : 0;
    const ny = len > 0 ? dy / len : 0;
    this.joyThumb.setPosition(
      this.joyOriX + nx * clamped,
      this.joyOriY + ny * clamped,
    );
  }

  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id === this.joyPtrId) {
      this.joyPtrId = -1;
      this.joyX = 0;
      this.joyY = 0;
      this.joyBase.setVisible(false);
      this.joyThumb.setVisible(false);
    }
    if (p.id === this.shootPtrId) {
      this.shootPtrId = -1;
      this._shoot = false;
      this.shootBtn.setFillStyle(0x00dd66, 0.25);
    }
    if (p.id === this.laserPtrId) {
      this.laserPtrId = -1;
      this.laserBtn.setFillStyle(0x22aaff, 0.25);
    }
    if (p.id === this.specPtrId) {
      this.specPtrId = -1;
      this.specBtn.setFillStyle(0xff44ee, 0.25);
    }
  }

  private tryClaimBtn(p: Phaser.Input.Pointer): void {
    const d = (b: Phaser.GameObjects.Arc) =>
      Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y);

    if (this.shootPtrId === -1 && d(this.shootBtn) < BTN_RADIUS + BTN_HIT) {
      this.shootPtrId = p.id;
      this._shoot = true;
      this.shootBtn.setFillStyle(0x00dd66, 0.60);
    } else if (this.laserPtrId === -1 && d(this.laserBtn) < BTN_RADIUS + BTN_HIT) {
      this.laserPtrId  = p.id;
      this._laserFired = true;   // one-shot: read once by laserJustDown getter
      this.laserBtn.setFillStyle(0x22aaff, 0.60);
    } else if (this.specPtrId === -1 && d(this.specBtn) < BTN_RADIUS + BTN_HIT) {
      this.specPtrId  = p.id;
      this._specFired = true;    // one-shot: read once by specialJustDown getter
      this.specBtn.setFillStyle(0xff44ee, 0.60);
    }
  }

  destroy(): void {
    this.scene.input.off('pointerdown',   this.onDown, this);
    this.scene.input.off('pointermove',   this.onMove, this);
    this.scene.input.off('pointerup',     this.onUp,   this);
    this.scene.input.off('pointercancel', this.onUp,   this);
  }
}
