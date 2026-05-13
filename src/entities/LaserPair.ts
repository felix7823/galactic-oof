import * as Phaser from 'phaser';
import { LaserNode } from './LaserNode';

/** How close a player centre must be to the beam segment to count as touching it (px). */
const BEAM_TOUCH_DIST = 20;

/**
 * LaserPair — manages two LaserNodes and the glowing beam between them.
 *
 * - Both nodes drift downward together.
 * - While BOTH nodes are alive, the beam is drawn and is deadly to touch.
 * - When ONE node dies, the beam disappears; the surviving node is still
 *   dangerous to collide with (handled by normal physics overlap in GameScene).
 * - When BOTH are gone, isExpired becomes true and GameScene destroys the pair.
 */
export class LaserPair {
  readonly nodeA: LaserNode;
  readonly nodeB: LaserNode;

  private readonly beam: Phaser.GameObjects.Graphics;
  private elapsed = 0;

  constructor(scene: Phaser.Scene, x1: number, x2: number, y: number) {
    this.nodeA = new LaserNode(scene, x1, y);
    this.nodeB = new LaserNode(scene, x2, y);
    this.nodeA.partner = this.nodeB;
    this.nodeB.partner = this.nodeA;

    this.beam = scene.add.graphics();
    this.beam.setDepth(3);
  }

  /** Call once per frame from GameScene.update(). Redraws the beam and returns
   *  whether any given point is within lethal range of the beam segment. */
  update(delta: number): void {
    this.elapsed += delta;
    this.beam.clear();

    // Only draw if both nodes are still alive
    if (!this.nodeA.active || !this.nodeB.active) return;

    const ax = this.nodeA.x, ay = this.nodeA.y;
    const bx = this.nodeB.x, by = this.nodeB.y;

    // Pulsing alpha for the flicker effect
    const pulse = 0.70 + Math.sin(this.elapsed * 0.015) * 0.30;

    // Wide outer glow
    this.beam.lineStyle(10, 0xff0000, pulse * 0.22);
    this.beam.beginPath();
    this.beam.moveTo(ax, ay);
    this.beam.lineTo(bx, by);
    this.beam.strokePath();

    // Mid glow
    this.beam.lineStyle(5, 0xff3344, pulse * 0.55);
    this.beam.beginPath();
    this.beam.moveTo(ax, ay);
    this.beam.lineTo(bx, by);
    this.beam.strokePath();

    // Bright core
    this.beam.lineStyle(2, 0xff88aa, pulse);
    this.beam.beginPath();
    this.beam.moveTo(ax, ay);
    this.beam.lineTo(bx, by);
    this.beam.strokePath();

    // White hot centre line
    this.beam.lineStyle(1, 0xffffff, pulse * 0.9);
    this.beam.beginPath();
    this.beam.moveTo(ax, ay);
    this.beam.lineTo(bx, by);
    this.beam.strokePath();
  }

  /**
   * Returns the shortest distance from point (px, py) to the active beam segment.
   * Returns Infinity when the beam is inactive (one or both nodes dead).
   */
  distanceToBeam(px: number, py: number): number {
    if (!this.nodeA.active || !this.nodeB.active) return Infinity;

    const ax = this.nodeA.x, ay = this.nodeA.y;
    const bx = this.nodeB.x, by = this.nodeB.y;
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);

    const t  = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    const nx = ax + t * dx;
    const ny = ay + t * dy;
    return Math.hypot(px - nx, py - ny);
  }

  /** Minimum touch distance; used by GameScene for player proximity checks. */
  static readonly TOUCH_DIST = BEAM_TOUCH_DIST;

  /** True once both nodes have been destroyed. */
  get isExpired(): boolean {
    return !this.nodeA.active && !this.nodeB.active;
  }

  /** Clean up the beam graphics (nodes are destroyed separately via the enemies group). */
  destroy(): void {
    this.beam.destroy();
    if (this.nodeA.active) this.nodeA.destroy();
    if (this.nodeB.active) this.nodeB.destroy();
  }
}
