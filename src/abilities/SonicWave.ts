import * as Phaser from 'phaser';
import type { EnemyShip } from '../entities/EnemyShip';

const RING_SPEED  = 300;   // px / s
const RING_GAP    = 160;   // ms between each of the 3 rings
const RING_COUNT  = 3;
const RING_THICK  = 20;    // px
const REPEL_SPEED = 200;   // px / s push away
const MAX_RADIUS  = 520;   // ring dies at this radius
const COLOR       = 0x00ff88; // mint

interface Ring {
  radius:     number;
  startDelay: number;
  started:    boolean;
  hit:        Set<EnemyShip>;
}

export class SonicWave {
  private readonly gfx:          Phaser.GameObjects.Graphics;
  private readonly cx:           number;
  private readonly cy:           number;
  private readonly rings:        Ring[];
  private readonly validTargets: Set<EnemyShip>;
  private elapsed = 0;
  isExpired = false;

  constructor(scene: Phaser.Scene, x: number, y: number, enemies: Phaser.GameObjects.Group) {
    this.cx  = x;
    this.cy  = y;
    this.gfx = scene.add.graphics().setDepth(23);

    // Snapshot which enemies exist right now — rings will only ever hit these.
    // Enemies spawned in the next wave are immune, so we don't need to block
    // wave advancement while a sonic wave is still active.
    this.validTargets = new Set(enemies.getChildren() as EnemyShip[]);

    this.rings = Array.from({ length: RING_COUNT }, (_, i) => ({
      radius:     0,
      startDelay: i * RING_GAP,
      started:    false,
      hit:        new Set<EnemyShip>(),
    }));
  }

  /** Returns enemies hit this frame — GameScene calls hit() and onEnemyDestroyed(). */
  update(delta: number, enemies: Phaser.GameObjects.Group): EnemyShip[] {
    if (this.isExpired) return [];

    this.elapsed += delta;
    const dt    = delta / 1000;
    const hits: EnemyShip[] = [];
    let   allDone = true;

    for (const ring of this.rings) {
      if (this.elapsed < ring.startDelay) { allDone = false; continue; }

      if (!ring.started) ring.started = true;
      ring.radius += RING_SPEED * dt;

      if (ring.radius < MAX_RADIUS) allDone = false;

      // Hit detection — inner edge to outer edge of ring, only pre-wave enemies
      for (const obj of enemies.getChildren()) {
        const e = obj as EnemyShip;
        if (!e.active || !this.validTargets.has(e) || ring.hit.has(e)) continue;

        const d = Phaser.Math.Distance.Between(this.cx, this.cy, e.x, e.y);
        if (d >= ring.radius - RING_THICK && d <= ring.radius + 4) {
          ring.hit.add(e);
          hits.push(e);

          // Repel away from centre
          const dx   = e.x - this.cx;
          const dy   = e.y - this.cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const body = e.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(
            (dx / dist) * REPEL_SPEED,
            (dy / dist) * REPEL_SPEED,
          );
        }
      }
    }

    this.draw();

    if (allDone) {
      this.isExpired = true;
      this.gfx.destroy();
    }

    return hits;
  }

  private draw(): void {
    const g = this.gfx;
    g.clear();

    for (const ring of this.rings) {
      if (!ring.started || ring.radius >= MAX_RADIUS) continue;

      const alpha = 1 - ring.radius / MAX_RADIUS;

      // Outer haze
      g.lineStyle(RING_THICK + 14, COLOR, alpha * 0.15);
      g.strokeCircle(this.cx, this.cy, ring.radius);

      // Main ring
      g.lineStyle(RING_THICK, COLOR, alpha * 0.75);
      g.strokeCircle(this.cx, this.cy, ring.radius);

      // Bright inner edge
      g.lineStyle(5, 0xffffff, alpha * 0.9);
      g.strokeCircle(this.cx, this.cy, ring.radius - RING_THICK / 2);
    }
  }

  destroy(): void {
    if (!this.isExpired) {
      this.isExpired = true;
      this.gfx.destroy();
    }
  }
}
