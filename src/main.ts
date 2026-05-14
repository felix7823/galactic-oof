import * as Phaser from 'phaser';
import { BootScene }       from './scenes/BootScene';
import { MenuScene }       from './scenes/MenuScene';
import { ColorSelectScene } from './scenes/ColorSelectScene';
import { GameScene }       from './scenes/GameScene';
import { GameOverScene }   from './scenes/GameOverScene';
import { TutorialScene }   from './scenes/TutorialScene';
import { IS_MOBILE }       from './utils/DeviceDetect';

// Portrait canvas for mobile (9:16-ish), landscape for desktop.
const GAME_W = IS_MOBILE ? 450 : 800;
const GAME_H = IS_MOBILE ? 800 : 600;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width:  GAME_W,
  height: GAME_H,
  backgroundColor: '#000011',

  // On mobile: scale the canvas to fill the screen while keeping aspect ratio.
  // On desktop: fixed size, no scaling.
  scale: IS_MOBILE
    ? {
        mode:       Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width:      GAME_W,
        height:     GAME_H,
      }
    : undefined,

  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },

  scene: [BootScene, MenuScene, TutorialScene, ColorSelectScene, GameScene, GameOverScene],
};

new Phaser.Game(config);
