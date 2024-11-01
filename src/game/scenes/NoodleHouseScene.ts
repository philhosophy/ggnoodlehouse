// src/game/scenes/NoodleHouseScene.ts
import Phaser from 'phaser';

export class NoodleHouseScene extends Phaser.Scene {
  private chatInput!: HTMLInputElement;
  private speechBubble!: Phaser.GameObjects.Container;
  private uncle!: Phaser.GameObjects.Sprite;
  private debugText!: Phaser.GameObjects.Text;
  private debugMode: boolean = false;
  private resizeHandles: Phaser.GameObjects.Container[] = [];
  private initialScale: number = 1;
  private initialDistance: number = 0;

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

    // Clean up existing handles first
    this.resizeHandles.forEach(handle => handle.destroy());
    this.resizeHandles = [];

    if (this.debugMode) {
      // Make elements draggable
      this.enableDragging(this.uncle);
      if (this.speechBubble) {
        this.enableDragging(this.speechBubble);
      }

      // Add resize handles with a slight delay to ensure proper positioning
      this.time.delayedCall(100, () => {
        this.createResizeHandles(this.uncle);
        if (this.speechBubble) {
          this.createResizeHandles(this.speechBubble);
        }
      });

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
    });

    // Add visual indicator that element is draggable
    if (object instanceof Phaser.GameObjects.Sprite) {
      object.setTint(0x00ff00);
    }
  }

  private disableDragging(object: Phaser.GameObjects.GameObject) {
    object.disableInteractive();
    if (object instanceof Phaser.GameObjects.Sprite) {
      object.clearTint();
    }
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
    const text = this.add.text(x, y, `${label}\nx: ${Math.round(x)}\ny: ${Math.round(y)}`, {
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
    // Remove old speech bubble if it exists
    if (this.speechBubble) {
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
      ease: 'Power1'
    });

    // If debug mode is on, make the new speech bubble draggable
    if (this.debugMode) {
      this.enableDragging(this.speechBubble);
      this.updatePositionIndicators();
    }
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

  shutdown() {
    if (this.chatInput) {
      this.chatInput.remove();
    }
  }

  private createResizeHandles(object: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container) {
    const handleSize = 16;
    const handles = new Phaser.GameObjects.Container(this, 0, 0);
    this.add.existing(handles);
    
    // Get object bounds
    let bounds;
    if (object instanceof Phaser.GameObjects.Sprite) {
      bounds = {
        x: object.x - (object.displayWidth * object.scaleX)/2,
        y: object.y - (object.displayHeight * object.scaleY)/2,
        width: object.displayWidth * object.scaleX,
        height: object.displayHeight * object.scaleY
      };
    } else if (object instanceof Phaser.GameObjects.Container) {
      const bubbleImage = object.list[0] as Phaser.GameObjects.Image;
      if (bubbleImage) {
        bounds = {
          x: object.x - (bubbleImage.displayWidth * bubbleImage.scaleX)/2,
          y: object.y - (bubbleImage.displayHeight * bubbleImage.scaleY)/2,
          width: bubbleImage.displayWidth * bubbleImage.scaleX,
          height: bubbleImage.displayHeight * bubbleImage.scaleY
        };
      }
    }

    if (!bounds) return;

    // Create corner handles
    const positions = [
      { x: bounds.x, y: bounds.y, type: 'nw' },
      { x: bounds.x + bounds.width, y: bounds.y, type: 'ne' },
      { x: bounds.x, y: bounds.y + bounds.height, type: 'sw' },
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height, type: 'se' }
    ];

    positions.forEach(pos => {
      // Create outer border for better visibility
      const outerBorder = this.add.rectangle(pos.x, pos.y, handleSize + 4, handleSize + 4, 0x000000, 1);
      const handle = this.add.rectangle(pos.x, pos.y, handleSize, handleSize, 0x00ff00, 0.8);
      
      outerBorder.setOrigin(0.5);
      handle.setOrigin(0.5);
      handle.setDepth(1000); // Ensure handles are always visible
      outerBorder.setDepth(999);
      
      // Make handle interactive
      handle.setInteractive({ 
        draggable: true,
        useHandCursor: true,
        hitArea: new Phaser.Geom.Rectangle(-handleSize/2, -handleSize/2, handleSize, handleSize),
        hitAreaCallback: Phaser.Geom.Rectangle.Contains
      });
      
      // Visual feedback
      handle.on('pointerover', () => {
        handle.setFillStyle(0x00ff00, 1);
        outerBorder.setStrokeStyle(2, 0xffffff);
      });
      
      handle.on('pointerout', () => {
        handle.setFillStyle(0x00ff00, 0.8);
        outerBorder.setStrokeStyle(0);
      });
      
      // Resize logic
      handle.on('dragstart', () => {
        if (object instanceof Phaser.GameObjects.Sprite) {
          this.initialScale = object.scaleX; // Use scaleX instead of scale
        } else if (object instanceof Phaser.GameObjects.Container) {
          const firstChild = object.list[0] as Phaser.GameObjects.Image;
          if (firstChild) {
            this.initialScale = firstChild.scaleX;
          }
        }
        
        this.initialDistance = Phaser.Math.Distance.Between(
          object.x, object.y,
          pos.x, pos.y
        );
      });

      handle.on('drag', (pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        const newDistance = Phaser.Math.Distance.Between(
          object.x, object.y,
          dragX, dragY
        );

        const scaleFactor = newDistance / this.initialDistance;
        const newScale = this.initialScale * scaleFactor;
        const limitedScale = Phaser.Math.Clamp(newScale, 0.2, 3.0);

        if (object instanceof Phaser.GameObjects.Sprite) {
          object.setScale(limitedScale);
        } else if (object instanceof Phaser.GameObjects.Container) {
          object.list.forEach((child) => {
            if (child instanceof Phaser.GameObjects.Image || 
                child instanceof Phaser.GameObjects.Text) {
              child.setScale(limitedScale);
            }
          });
        }

        // Update handles position
        this.createResizeHandles(object);
      });

      handles.add([outerBorder, handle]);
    });

    this.resizeHandles.push(handles);
    return handles;
  }

  private updateResizeHandles(object: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container) {
    const existingHandles = this.resizeHandles.find(handles => 
      handles.getData('target') === object
    );
    if (existingHandles) {
      existingHandles.destroy();
      this.resizeHandles = this.resizeHandles.filter(h => h !== existingHandles);
    }
    
    if (this.debugMode) {
      const newHandles = this.createResizeHandles(object);
      if (newHandles) {
        newHandles.setData('target', object);
      }
    }
  }
}