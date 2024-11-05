// src/game/config/gameConfig.ts
import Phaser from 'phaser';
import { NoodleHouseScene } from '../scenes/NoodleHouseScene';

export const gameConfig = {
  type: Phaser.WEBGL,
  parent: 'phaser-game',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  scene: [NoodleHouseScene],
  backgroundColor: '#000000',
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true
  },
  dom: {
    createContainer: true
  }
};