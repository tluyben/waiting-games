import { GameEngine, MobileControlsConfig } from '../GameEngine';
import { GameConfig, Point } from '../types';

enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export class Snake extends GameEngine {
  private snake: Point[] = [];
  private food: Point = { x: 0, y: 0 };
  private direction: Direction = Direction.RIGHT;
  private gridSize = 20;
  private score = 0;
  private gameOver = false;
  private gameState: 'waiting' | 'playing' = 'waiting';
  private moveTimer = 0;
  private moveInterval = 12; // Move every 12 frames (5 times per second at 60fps) - Slightly faster

  // Design dimensions - the reference size that the game is designed for
  private readonly DESIGN_WIDTH = 400;
  private readonly DESIGN_HEIGHT = 300;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    super(container, config);
    // Set design dimensions for proper scaling
    this.setDesignDimensions(this.DESIGN_WIDTH, this.DESIGN_HEIGHT);
    this.initGame();
  }

  protected getMobileControlsConfig(): MobileControlsConfig {
    return {
      controlType: 'dpad',
      showDpad: true,
      showActionButton: true,
      actionButtonLabel: '⟳',
      showSecondaryButton: false,
      secondaryButtonLabel: ''
    };
  }

  protected onActionButtonPress(): void {
    // Restart game when action button pressed if game over or start game
    if (this.gameOver) {
      this.initGame();
      this.start();
    } else if (this.gameState === 'waiting') {
      this.gameState = 'playing';
    }
  }

  protected onActionButtonRelease(): void {
    // No action needed
  }

  private initGame(): void {
    this.snake = [{ x: 100, y: 100 }];
    this.generateFood();
    this.score = 0;
    this.gameOver = false;
    this.gameState = 'waiting';
    this.direction = Direction.RIGHT;
    this.moveTimer = 0;
  }

  private generateFood(): void {
    // Use design dimensions for food placement
    const maxX = Math.floor(this.DESIGN_WIDTH / this.gridSize);
    const maxY = Math.floor(this.DESIGN_HEIGHT / this.gridSize);

    this.food = {
      x: Math.floor(Math.random() * maxX) * this.gridSize,
      y: Math.floor(Math.random() * maxY) * this.gridSize
    };
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);
    
    if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') {
      if (this.direction !== Direction.DOWN) {
        this.direction = Direction.UP;
      }
    } else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's' || event.key === 'ArrowDown') {
      if (this.direction !== Direction.UP) {
        this.direction = Direction.DOWN;
      }
    } else if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') {
      if (this.direction !== Direction.RIGHT) {
        this.direction = Direction.LEFT;
      }
    } else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') {
      if (this.direction !== Direction.LEFT) {
        this.direction = Direction.RIGHT;
      }
    } else if (this.isKeyPressed('START', event) || event.key === ' ') {
      if (this.gameOver) {
        this.initGame();
        this.start();
      } else if (this.gameState === 'waiting') {
        this.gameState = 'playing';
      }
    }
  }

  protected handleTouchStart(event: TouchEvent): void {
    super.handleTouchStart(event);

    if (this.gameOver) {
      this.initGame();
      this.start();
      return;
    }

    if (this.gameState === 'waiting') {
      this.gameState = 'playing';
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    // Convert touch position to design coordinates
    const x = (touch.clientX - rect.left) / this.scale;
    const y = (touch.clientY - rect.top) / this.scale;

    const centerX = this.DESIGN_WIDTH / 2;
    const centerY = this.DESIGN_HEIGHT / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && this.direction !== Direction.LEFT) {
        this.direction = Direction.RIGHT;
      } else if (deltaX < 0 && this.direction !== Direction.RIGHT) {
        this.direction = Direction.LEFT;
      }
    } else {
      if (deltaY > 0 && this.direction !== Direction.UP) {
        this.direction = Direction.DOWN;
      } else if (deltaY < 0 && this.direction !== Direction.DOWN) {
        this.direction = Direction.UP;
      }
    }
  }

  protected update(): void {
    if (this.gameOver || this.gameState !== 'playing') return;

    // Check for d-pad/keyboard input to change direction
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      if (this.direction !== Direction.DOWN) {
        this.direction = Direction.UP;
      }
    } else if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      if (this.direction !== Direction.UP) {
        this.direction = Direction.DOWN;
      }
    } else if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      if (this.direction !== Direction.RIGHT) {
        this.direction = Direction.LEFT;
      }
    } else if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      if (this.direction !== Direction.LEFT) {
        this.direction = Direction.RIGHT;
      }
    }

    // Only move snake at controlled intervals (frame counting like Tetris)
    this.moveTimer++;
    if (this.moveTimer < this.moveInterval) {
      return;
    }
    this.moveTimer = 0;

    const head = { ...this.snake[0] };

    switch (this.direction) {
      case Direction.UP:
        head.y -= this.gridSize;
        break;
      case Direction.DOWN:
        head.y += this.gridSize;
        break;
      case Direction.LEFT:
        head.x -= this.gridSize;
        break;
      case Direction.RIGHT:
        head.x += this.gridSize;
        break;
    }

    // Use design dimensions for boundary checking
    if (head.x < 0 || head.x >= this.DESIGN_WIDTH ||
        head.y < 0 || head.y >= this.DESIGN_HEIGHT) {
      this.gameOver = true;
      return;
    }

    for (const segment of this.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        this.gameOver = true;
        return;
      }
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.generateFood();
    } else {
      this.snake.pop();
    }
  }

  protected render(): void {
    // Fill the entire canvas with background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Apply scaling transform for all game rendering
    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);

    this.ctx.fillStyle = '#0f0';
    for (const segment of this.snake) {
      this.ctx.fillRect(segment.x, segment.y, this.gridSize - 2, this.gridSize - 2);
    }

    this.ctx.fillStyle = '#f00';
    this.ctx.fillRect(this.food.x, this.food.y, this.gridSize - 2, this.gridSize - 2);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);

    if (this.gameState === 'waiting') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.DESIGN_WIDTH, this.DESIGN_HEIGHT);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Snake', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2 - 20);

      this.ctx.font = '16px Arial';
      this.ctx.fillText('Press SPACE or tap to start', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2 + 10);

      this.ctx.textAlign = 'left';
    } else if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.DESIGN_WIDTH, this.DESIGN_HEIGHT);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2 - 20);

      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2 + 10);
      this.ctx.fillText('Press SPACE or tap to restart', this.DESIGN_WIDTH / 2, this.DESIGN_HEIGHT / 2 + 40);

      this.ctx.textAlign = 'left';
    }

    // Restore transform
    this.ctx.restore();
  }

  start(): void {
    super.start();
    this.moveTimer = 0;
  }
}