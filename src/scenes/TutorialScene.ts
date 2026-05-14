import * as Phaser from 'phaser';
import { IS_MOBILE } from '../utils/DeviceDetect';

interface Slide {
  title: string;
  lines: string[];
}

const SLIDES: Slide[] = [
  {
    title: 'MOVING & SHOOTING',
    lines: [
      'For P1  —  WASD to move,  Q to fire laser,  E to beam',
      'For P2  —  Arrows to move,  . to fire laser,  / to beam',
      '',
      'The energy beam fires for 3 seconds, then',
      'recharges for 2 seconds — watch the bar!',
    ],
  },
  {
    title: 'SPECIAL ABILITY',
    lines: [
      'Every 4 waves you earn a special ability charge.',
      'Your ability depends on your ship colour:',
      '',
      'Crimson=Meteor  Mint=Sonic Wave  Gold=Storm',
      'Azure=Tornado   Violet=Black Hole  Salmon=Salmon',
      'Lime=Infect     Aqua=Tsunami',
      '',
      'For P1  —  R to use       For P2  —  , (comma) to use',
    ],
  },
  {
    title: 'ENEMIES',
    lines: [
      'GROK  (orange)  —  1 hit to destroy',
      'SKETH (pink)    —  2 hits to destroy, moves faster',
      '',
      'ZOLT  (yellow square)  —  appears from wave 10',
      '3 hits to destroy. Fires a lightning bolt if you',
      'get within 3 ship-lengths!',
    ],
  },
  {
    title: 'SURVIVE!',
    lines: [
      'Each player has 5 lives.',
      'Losing all lives turns you into a ghost —',
      'you can still move but can no longer shoot.',
      '',
      'In 2-player mode the game ends when',
      'both players are out of lives.',
      '',
      'Good luck — Galactic Oof awaits!',
    ],
  },
];

const ORANGE   = '#ff8800';
const WHITE    = '#ffffff';
const DIM_GREY = '#888888';

export class TutorialScene extends Phaser.Scene {
  private currentSlide = 0;
  private container!: Phaser.GameObjects.Container;
  private enterKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'TutorialScene' });
  }

  create(): void {
    this.currentSlide = 0;
    const { width, height } = this.scale;

    // Solid black background
    this.add.rectangle(0, 0, width, height, 0x000000, 1).setOrigin(0);

    // Slide number indicator (top-right)
    // We'll manage it in showSlide

    this.container = this.add.container(0, 0);

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Mobile: tap anywhere on screen to advance
    if (IS_MOBILE) {
      this.input.on('pointerdown', this.advanceSlide, this);
    }

    this.showSlide();
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.advanceSlide();
    }
  }

  private advanceSlide(): void {
    this.currentSlide++;
    if (this.currentSlide >= SLIDES.length) {
      this.input.keyboard!.removeKey(this.enterKey);
      this.input.off('pointerdown', this.advanceSlide, this);
      this.scene.start('MenuScene');
    } else {
      this.showSlide();
    }
  }

  private showSlide(): void {
    const { width, height } = this.scale;
    const slide = SLIDES[this.currentSlide];
    const isLast = this.currentSlide === SLIDES.length - 1;

    this.container.removeAll(true);

    // ── Slide counter ────────────────────────────────────────────────────────
    const counter = this.add.text(
      width - 16, 14,
      `${this.currentSlide + 1} / ${SLIDES.length}`,
      { fontSize: '13px', color: DIM_GREY },
    ).setOrigin(1, 0);
    this.container.add(counter);

    // ── Title ────────────────────────────────────────────────────────────────
    const title = this.add.text(width / 2, height * 0.22, slide.title, {
      fontSize: '36px',
      color: ORANGE,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    // ── Divider line ─────────────────────────────────────────────────────────
    const divider = this.add.graphics();
    divider.lineStyle(1, 0xff8800, 0.4);
    divider.beginPath();
    divider.moveTo(width * 0.2, height * 0.33);
    divider.lineTo(width * 0.8, height * 0.33);
    divider.strokePath();
    this.container.add(divider);

    // ── Body lines ───────────────────────────────────────────────────────────
    const startY  = height * 0.40;
    const lineH   = 34;

    slide.lines.forEach((line, i) => {
      const isKey = line.startsWith('For P');
      const text  = this.add.text(width / 2, startY + i * lineH, line, {
        fontSize:  isKey ? '20px' : '18px',
        color:     isKey ? ORANGE : WHITE,
        fontStyle: isKey ? 'bold' : 'normal',
        align:     'center',
      }).setOrigin(0.5);
      this.container.add(text);
    });

    // ── Footer prompt ────────────────────────────────────────────────────────
    const promptText = IS_MOBILE
      ? (isLast ? 'Tap to return to menu' : 'Tap to continue')
      : (isLast ? 'Press ENTER to return to menu' : 'Press ENTER to continue');
    const prompt = this.add.text(width / 2, height - 36, promptText, {
      fontSize: '16px',
      color: DIM_GREY,
    }).setOrigin(0.5);
    this.container.add(prompt);

    // Blink the prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 550,
      yoyo: true,
      repeat: -1,
    });

    // Fade the whole container in
    this.container.setAlpha(0);
    this.tweens.add({ targets: this.container, alpha: 1, duration: 250 });
  }
}
