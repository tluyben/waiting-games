import { GameEngine } from '../GameEngine';
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
  private lastMoveTime = 0;
  private moveInterval = 400; // Move every 400ms (2.5 moves per second)

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    super(container, config);
    this.initGame();
  }

  private initGame(): void {
    this.snake = [{ x: 100, y: 100 }];
    this.generateFood();
    this.score = 0;
    this.gameOver = false;
    this.direction = Direction.RIGHT;
  }

  private generateFood(): void {
    const maxX = Math.floor(this.config.width / this.gridSize);
    const maxY = Math.floor(this.config.height / this.gridSize);
    
    this.food = {
      x: Math.floor(Math.random() * maxX) * this.gridSize,
      y: Math.floor(Math.random() * maxY) * this.gridSize
    };
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);
    
    if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w') {
      if (this.direction !== Direction.DOWN) {
        this.direction = Direction.UP;
      }
    } else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's') {
      if (this.direction !== Direction.UP) {
        this.direction = Direction.DOWN;
      }
    } else if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
      if (this.direction !== Direction.RIGHT) {
        this.direction = Direction.LEFT;
      }
    } else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
      if (this.direction !== Direction.LEFT) {
        this.direction = Direction.RIGHT;
      }
    } else if (this.isKeyPressed('START', event) || event.key === ' ') {
      if (this.gameOver) {
        this.initGame();
        this.start();
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

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
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
    if (this.gameOver) return;

    // Only move snake at controlled intervals
    const currentTime = Date.now();
    if (currentTime - this.lastMoveTime < this.moveInterval) {
      return;
    }
    this.lastMoveTime = currentTime;

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

    if (head.x < 0 || head.x >= this.config.width || 
        head.y < 0 || head.y >= this.config.height) {
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
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    this.ctx.fillStyle = '#0f0';
    for (const segment of this.snake) {
      this.ctx.fillRect(segment.x, segment.y, this.gridSize - 2, this.gridSize - 2);
    }

    this.ctx.fillStyle = '#f00';
    this.ctx.fillRect(this.food.x, this.food.y, this.gridSize - 2, this.gridSize - 2);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);

    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
      this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 40);
      
      this.ctx.textAlign = 'left';
    }
  }

  start(): void {
    super.start();
    this.lastMoveTime = Date.now();
  }
}