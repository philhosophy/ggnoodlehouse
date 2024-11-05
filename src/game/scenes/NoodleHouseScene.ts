// src/game/scenes/NoodleHouseScene.ts
import Phaser from 'phaser';

export class NoodleHouseScene extends Phaser.Scene {
  private chatInput!: HTMLInputElement;
  private dialogueBox!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private unclePortrait!: Phaser.GameObjects.Sprite;
  private background!: Phaser.GameObjects.Image;
  private currentText: string = '';
  private isTyping: boolean = false;
  private typewriterDelay: number = 50;
  private thinkingTimer?: Phaser.Time.TimerEvent;
  private jukebox!: Phaser.GameObjects.Sprite;
  private music!: Phaser.Sound.BaseSound;
  private isPlaying: boolean = false;

  constructor() {
    super({ key: 'NoodleHouseScene' });
  }

  preload() {
    this.load.image('noodleshop_background', '/src/assets/noodleshop_background.webp');
    this.load.image('uncle_portrait', '/src/assets/uncle.png');
    this.load.image('jukebox', '/src/assets/jukebox.png');
    this.load.audio('bgMusic', '/src/assets/fly.mp3');
  }

  create() {
    // Add background with proper scaling
    const { width, height } = this.scale;
    this.background = this.add.image(width/2, height/2, 'noodleshop_background');
    this.background.setOrigin(0.5);
    
    // Scale background to cover screen while maintaining aspect ratio
    const scaleX = width / this.background.width;
    const scaleY = height / this.background.height;
    const scale = Math.max(scaleX, scaleY);
    this.background.setScale(scale);

    // Create chat interface at bottom of game scene
    this.createChatInput();
    
    // Create dialogue box above chat input
    this.createDialogueBox();

    // Add this after background setup but before chat interface
    this.createJukebox();
  }

  private createDialogueBox() {
    const { width, height } = this.scale;
    const boxHeight = 150;
    const portraitSize = 120;
    const padding = 15;
    const inputHeight = 100;

    this.dialogueBox = this.add.container(0, height - boxHeight - inputHeight);

    // Add semi-transparent background with low opacity, set origin to match container
    const bg = this.add.rectangle(width/2, boxHeight/2, width, boxHeight, 0x000000, 0.4);
    
    // Add border, adjusted to match background position
    const border = this.add.graphics();
    border.lineStyle(2, 0xffffff, 1);
    border.strokeRect(0, 0, width, boxHeight);

    // Add uncle portrait background (solid black square)
    const portraitBg = this.add.rectangle(
      padding, 
      padding, 
      portraitSize, 
      portraitSize, 
      0x000000,
      1 // Fully opaque for portrait background
    );
    portraitBg.setOrigin(0, 0);

    // Add uncle portrait
    this.unclePortrait = this.add.sprite(
      padding + portraitSize/2,
      padding + portraitSize/2,
      'uncle_portrait'
    );
    this.unclePortrait.setDisplaySize(portraitSize - padding*2, portraitSize - padding*2);

    // Add text
    this.dialogueText = this.add.text(
      portraitSize + padding * 2, 
      padding,
      '', 
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '16px',
        color: '#ffffff',
        wordWrap: { width: width - portraitSize - padding * 4 },
        lineSpacing: 8
      }
    );

    this.dialogueBox.add([bg, border, portraitBg, this.unclePortrait, this.dialogueText]);
    this.dialogueBox.setDepth(1000);
  }

  private createChatInput() {
    const gameHeight = this.game.config.height as number;
    const gameWidth = this.game.config.width as number;
    
    // Create pixel-style chat container at bottom
    const chatBg = this.add.graphics();
    chatBg.fillStyle(0x000000, 0.7);
    chatBg.fillRect(0, gameHeight - 100, gameWidth, 100);

    // Add text input using DOM element
    const input = document.createElement('input');
    input.style.position = 'absolute';
    input.style.bottom = '20px';
    input.style.left = '50%';
    input.style.transform = 'translateX(-50%)';
    input.style.width = '600px';
    input.style.padding = '10px';
    input.style.fontFamily = '"Press Start 2P"';
    input.style.fontSize = '12px';
    input.style.backgroundColor = '#000000';
    input.style.color = '#ffffff';
    input.style.border = '2px solid #ffffff';
    input.style.borderRadius = '4px';

    // Add input to game container instead of body
    const gameContainer = document.getElementById('phaser-game');
    if (gameContainer) {
      gameContainer.appendChild(input);
    }
    this.chatInput = input;

    // Handle input
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.value.trim() && !this.isTyping) {
        this.handlePlayerMessage(input.value);
        input.value = '';
      }
    });
  }

  private startThinking() {
    let dots = 1;
    this.dialogueText.setText('.');
    
    // Disable input while thinking
    if (this.chatInput) {
      this.chatInput.disabled = true;
    }

    this.thinkingTimer = this.time.addEvent({
      delay: 500,
      callback: () => {
        dots = (dots % 3) + 1;
        this.dialogueText.setText('.'.repeat(dots));
      },
      loop: true
    });
  }

  private stopThinking() {
    if (this.thinkingTimer) {
      this.thinkingTimer.destroy();
      this.thinkingTimer = undefined;
    }
    
    // Re-enable input
    if (this.chatInput) {
      this.chatInput.disabled = false;
    }
  }

  private async handlePlayerMessage(message: string) {
    try {
      this.startThinking();
      
      console.log('Sending message to backend:', message);
      
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Server error occurred');
      }

      const data = await response.json();
      console.log('Received response:', data);
      
      this.stopThinking();
      await this.typewriterEffect(data.response);
    } catch (error) {
      console.error('Error:', error);
      this.stopThinking();
      await this.typewriterEffect(
        "Ah, sorry... I'm having trouble hearing you over the cooking. Could you repeat that?"
      );
    }
  }

  private async typewriterEffect(text: string) {
    if (this.isTyping) {
      // If already typing, show full text immediately
      this.dialogueText.setText(text);
      this.isTyping = false;
      return;
    }

    this.isTyping = true;
    this.currentText = '';
    this.dialogueText.setText('');

    // Speed up the typewriter effect by reducing delay to 25ms (from 50ms)
    this.typewriterDelay = 25;

    for (let i = 0; i < text.length; i++) {
      if (!this.isTyping) break;
      this.currentText += text[i];
      this.dialogueText.setText(this.currentText);
      await new Promise(resolve => setTimeout(resolve, this.typewriterDelay));
    }

    this.isTyping = false;
  }

  private createJukebox() {
    const { width } = this.scale;
    const padding = 20;
    const jukeboxSize = 180;

    // Create the jukebox sprite
    this.jukebox = this.add.sprite(
      width - padding - jukeboxSize/2,
      padding + jukeboxSize/2,
      'jukebox'
    );
    
    this.jukebox.setDisplaySize(jukeboxSize, jukeboxSize);
    const originalScale = this.jukebox.scale; // Store original scale
    
    // Load the music
    this.music = this.sound.add('bgMusic', {
      loop: true,
      volume: 0.5
    });

    // Make jukebox interactive
    this.jukebox.setInteractive();
    
    // Add hover effect
    this.jukebox.on('pointerover', () => {
      document.body.style.cursor = 'pointer';
    });
    
    this.jukebox.on('pointerout', () => {
      document.body.style.cursor = 'default';
    });

    // Add click handler
    this.jukebox.on('pointerdown', () => {
      if (this.isPlaying) {
        this.music.stop();
        this.isPlaying = false;
        this.jukebox.setAlpha(0.7);
        // Update cursor immediately on click
        document.body.style.cursor = 'url(/src/assets/play-cursor.png), pointer';
      } else {
        this.music.play();
        this.isPlaying = true;
        this.jukebox.setAlpha(1);
        // Update cursor immediately on click
        document.body.style.cursor = 'url(/src/assets/pause-cursor.png), pointer';
      }
      // Ensure scale stays constant
      this.jukebox.setScale(originalScale);
    });

    // Start with slightly dimmed appearance
    this.jukebox.setAlpha(0.7);
  }

  shutdown() {
    this.stopThinking();
    if (this.chatInput) {
      this.chatInput.remove();
    }
    if (this.music) {
      this.music.stop();
    }
  }
}