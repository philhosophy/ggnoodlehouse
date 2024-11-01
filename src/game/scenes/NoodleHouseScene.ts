// src/game/scenes/NoodleHouseScene.ts
import Phaser from 'phaser';

export class NoodleHouseScene extends Phaser.Scene {
  private chatInput!: HTMLInputElement;
  private speechBubble!: Phaser.GameObjects.Container;
  private uncle!: Phaser.GameObjects.Sprite;
  private debugText!: Phaser.GameObjects.Text;
  private debugMode: boolean = false;
  private resizeHandles: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'NoodleHouseScene' });
  }

  preload() {
    // Load assets
    this.load.image('uncle', '/src/assets/uncle.png');
    this.load.image('speech-bubble', '/src/assets/speechbubble.png');
  }

  create() {
    // Add uncle sprite in center-left of screen
    this.uncle = this.add.sprite(200, 300, 'uncle');
    
    // Enable debug mode with D key
    this.input.keyboard.on('keydown-D', () => {
      this.debugMode = !this.debugMode;
      this.updateDebugMode();
    });

    // Create debug text
    this.debugText = this.add.text(10, 10, 'Press D to toggle debug mode\nDebug: OFF', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    });
    this.debugText.setDepth(1000);
    this.debugText.setScrollFactor(0);

    // Create chat interface at bottom of game scene
    this.createChatInput();
    
    // Initial debug mode setup
    this.updateDebugMode();
  }

  private updateDebugMode() {
    // Update debug text
    this.debugText.setText(`Press D to toggle debug mode\nDebug: ${this.debugMode ? 'ON' : 'OFF'}`);

    if (this.debugMode) {
      // Make elements draggable
      this.enableDragging(this.uncle);
      if (this.speechBubble) {
        this.enableDragging(this.speechBubble);
      }

      // Add position indicators
      this.updatePositionIndicators();
    } else {
      // Disable dragging
      this.disableDragging(this.uncle);
      if (this.speechBubble) {
        this.disableDragging(this.speechBubble);
      }

      // Remove position indicators
      this.removePositionIndicators();
    }
  }

  private enableDragging(object: Phaser.GameObjects.GameObject) {
    object.setInteractive({ draggable: true });
    
    // Remove existing listeners to prevent duplicates
    object.removeAllListeners('drag');
    
    object.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (object instanceof Phaser.GameObjects.Container) {
        object.x = dragX;
        object.y = dragY;
      } else if (object instanceof Phaser.GameObjects.Sprite) {
        object.x = dragX;
        object.y = dragY;
      }
      this.updatePositionIndicators();
      this.updateResizeHandles(object);
    });

    // Add visual indicator that element is draggable
    if (object instanceof Phaser.GameObjects.Sprite) {
      object.setTint(0x00ff00);
    }

    // Add resize handles
    this.createResizeHandles(object);
  }

  private disableDragging(object: Phaser.GameObjects.GameObject) {
    object.disableInteractive();
    if (object instanceof Phaser.GameObjects.Sprite) {
      object.clearTint();
    }
    // Remove resize handles
    this.resizeHandles.forEach(handles => handles.destroy());
    this.resizeHandles = [];
  }

  private updatePositionIndicators() {
    this.removePositionIndicators();

    if (!this.debugMode) return;

    // Create position indicators container
    const debugContainer = this.add.container(0, 0);
    debugContainer.setName('debugContainer');

    // Uncle position
    this.addPositionText(debugContainer, this.uncle.x, this.uncle.y - 50, 'Uncle');

    // Speech bubble position
    if (this.speechBubble) {
      this.addPositionText(
        debugContainer,
        this.speechBubble.x,
        this.speechBubble.y - 50,
        'Speech Bubble'
      );
    }
  }

  private addPositionText(container: Phaser.GameObjects.Container, x: number, y: number, label: string) {
    const object = label === 'Uncle' ? this.uncle : this.speechBubble;
    let scaleInfo = '';
    
    if (object instanceof Phaser.GameObjects.Sprite) {
      scaleInfo = `\nscale: ${object.scale.toFixed(2)}`;
    } else if (object instanceof Phaser.GameObjects.Container) {
      const firstChild = object.first as Phaser.GameObjects.Image;
      if (firstChild) {
        scaleInfo = `\nscale: ${firstChild.scale.toFixed(2)}`;
      }
    }

    const text = this.add.text(x, y, 
      `${label}\nx: ${Math.round(x)}\ny: ${Math.round(y)}${scaleInfo}`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 4 }
    });
    text.setOrigin(0.5);
    container.add(text);
  }

  private removePositionIndicators() {
    const debugContainer = this.children.getByName('debugContainer');
    if (debugContainer) {
      debugContainer.destroy();
    }
  }

  private createSpeechBubble(x: number, y: number, quote: string) {
    // Remove old speech bubble and its resize handles
    if (this.speechBubble) {
        // Remove resize handles first
        this.resizeHandles.forEach(handles => handles.destroy());
        this.resizeHandles = [];
        // Then destroy the speech bubble
        this.speechBubble.destroy();
    }

    // Create container for speech bubble and text
    this.speechBubble = this.add.container(x, y);

    // Add speech bubble background image
    const bubbleImage = this.add.image(0, 0, 'speech-bubble');
    bubbleImage.setOrigin(0.5);
    bubbleImage.setScale(0.5);

    // Calculate text bounds based on bubble size
    const bubbleWidth = bubbleImage.width * 0.5;
    const padding = 20;
    
    // Add pixel-style text
    const content = this.add.text(0, 0, quote, {
        fontFamily: '"Press Start 2P"',
        fontSize: '8px',
        color: '#000000',
        align: 'center',
        wordWrap: { width: bubbleWidth - (padding * 2) },
        lineSpacing: 6
    });

    // Center the text
    content.setOrigin(0.5);
    content.setY(-4);

    // Add both to container
    this.speechBubble.add([bubbleImage, content]);

    // Fade-in effect
    this.speechBubble.setAlpha(0);
    this.tweens.add({
        targets: this.speechBubble,
        alpha: 1,
        duration: 200,
        ease: 'Power1',
        onComplete: () => {
            // Re-enable debug mode features if active
            if (this.debugMode) {
                this.enableDragging(this.speechBubble);
                this.updatePositionIndicators();
            }
        }
    });
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
      if (e.key === 'Enter' && input.value.trim()) {
        this.handlePlayerMessage(input.value);
        input.value = '';
      }
    });
  }

  private async handlePlayerMessage(message: string) {
    try {
      console.log('Sending message to backend:', message);
      
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.detail || 'Server error occurred');
      }

      const data = await response.json();
      console.log('Received response:', data);
      this.createSpeechBubble(250, 200, data.response);
    } catch (error) {
      console.error('Error details:', error);
      this.createSpeechBubble(250, 200, 
        "Ah, sorry... I'm having trouble hearing you over the cooking. Could you repeat that?");
    }
  }

  private createResizeHandles(object: Phaser.GameObjects.GameObject) {
    const handleSize = 10;
    const handles = new Phaser.GameObjects.Container(this, 0, 0);
    this.add.existing(handles);
    
    // Get object bounds
    let bounds;
    if (object instanceof Phaser.GameObjects.Sprite) {
      bounds = {
        x: object.x - object.displayWidth/2,
        y: object.y - object.displayHeight/2,
        width: object.displayWidth,
        height: object.displayHeight
      };
    } else if (object instanceof Phaser.GameObjects.Container) {
      // Get the first child (bubble image) for reference
      const bubbleImage = object.list[0] as Phaser.GameObjects.Image;
      if (bubbleImage) {
        bounds = {
          x: object.x - (bubbleImage.displayWidth * bubbleImage.scale)/2,
          y: object.y - (bubbleImage.displayHeight * bubbleImage.scale)/2,
          width: bubbleImage.displayWidth * bubbleImage.scale,
          height: bubbleImage.displayHeight * bubbleImage.scale
        };
      }
    }

    if (!bounds) return;

    // Create corner handles
    const positions = [
      { x: bounds.x, y: bounds.y, cursor: 'nw-resize' },
      { x: bounds.x + bounds.width, y: bounds.y, cursor: 'ne-resize' },
      { x: bounds.x, y: bounds.y + bounds.height, cursor: 'sw-resize' },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height, cursor: 'se-resize' }
    ];

    positions.forEach(pos => {
      const handle = this.add.rectangle(pos.x, pos.y, handleSize, handleSize, 0x00ff00);
      handle.setInteractive({ draggable: true, cursor: pos.cursor });
      handle.setOrigin(0.5);
      
      handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        const deltaX = dragX - handle.x;
        const deltaY = dragY - handle.y;
        handle.x = dragX;
        handle.y = dragY;

        if (object instanceof Phaser.GameObjects.Sprite) {
          // More precise scaling for sprites
          const currentScale = object.scale;
          const scaleChange = (deltaX + deltaY) * 0.005; // Adjust this multiplier to control sensitivity
          const newScale = Math.max(0.1, currentScale + scaleChange); // Prevent negative or zero scale
          object.setScale(newScale);
        } else if (object instanceof Phaser.GameObjects.Container) {
          // Scale container contents
          const scaleChange = (deltaX + deltaY) * 0.005; // Adjust sensitivity as needed
          object.list.forEach((child) => {
            if (child instanceof Phaser.GameObjects.Image || 
                child instanceof Phaser.GameObjects.Text) {
              const newScale = Math.max(0.1, child.scale + scaleChange);
              child.setScale(newScale);
            }
          });
        }

        this.updateResizeHandles(object);
        this.updatePositionIndicators();
      });

      handles.add(handle);
    });

    this.resizeHandles.push(handles);
    return handles;
  }

  private updateResizeHandles(object: Phaser.GameObjects.GameObject) {
    // Remove existing handles
    this.resizeHandles.forEach(handles => handles.destroy());
    this.resizeHandles = [];

    if (this.debugMode) {
      this.createResizeHandles(object);
    }
  }

  shutdown() {
    if (this.chatInput) {
      this.chatInput.remove();
    }
  }
}