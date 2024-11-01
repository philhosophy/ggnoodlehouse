// src/game/config/gameConfig.ts
import Phaser from 'phaser';
import { NoodleHouseScene } from '../scenes/NoodleHouseScene';

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-game',
  width: 800,
  height: 600,
  scene: [NoodleHouseScene],
  backgroundColor: '#000000'
};