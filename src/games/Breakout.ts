import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Ball extends Point {
  vx: number;
  vy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  destroyed: boolean;
}

export class Breakout extends GameEngine {
  private ball: Ball;
  private paddle: Paddle;
  private bricks: Brick[] = [];
  private score = 0;
  private lives = 3;
  private gameState: 'waiting' | 'playing' | 'gameOver' | 'won' = 'waiting';

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    super(container, config);
    this.initGame();
  }

  private initGame(): void {
    this.ball = {
      x: this.config.width / 2,
      y: this.config.height - 80,
      vx: 0,
      vy: 0,
      radius: 8
    };

    this.paddle = {
      x: this.config.width / 2 - 40,
      y: this.config.height - 30,
      width: 80,
      height: 10,
      speed: 6
    };

    this.score = 0;
    this.lives = 3;
    this.gameState = 'waiting';
    this.createBricks();
  }

  private createBricks(): void {
    this.bricks = [];
    const rows = 6;
    const cols = 8;
    const brickWidth = this.config.width / cols - 4;
    const brickHeight = 20;
    const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#0000ff'];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.bricks.push({
          x: col * (brickWidth + 4) + 2,
          y: row * (brickHeight + 4) + 50,
          width: brickWidth,
          height: brickHeight,
          color: colors[row],
          destroyed: false
        });
      }
    }
  }

  private launchBall(): void {
    this.ball.vx = Math.random() * 4 - 2;
    this.ball.vy = -4;
    this.gameState = 'playing';
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);
    this.keys[event.key] = true;

    if (this.isKeyPressed('START', event) || event.key === ' ') {
      if (this.gameState === 'waiting') {
        this.launchBall();
      } else if (this.gameState === 'gameOver' || this.gameState === 'won') {
        this.initGame();
      }
    }
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    super.handleKeyUp(event);
    this.keys[event.key] = false;
  }

  protected handleTouchStart(event: TouchEvent): void {
    super.handleTouchStart(event);
    
    if (this.gameState === 'waiting') {
      this.launchBall();
      return;
    }
    
    if (this.gameState === 'gameOver' || this.gameState === 'won') {
      this.initGame();
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    this.paddle.x = x - this.paddle.width / 2;
    this.clampPaddle();
  }

  protected handleTouchMove(event: TouchEvent): void {
    super.handleTouchMove(event);
    if (this.gameState === 'playing') {
      this.handleTouchStart(event);
    }
  }

  private clampPaddle(): void {
    this.paddle.x = Math.max(0, Math.min(this.config.width - this.paddle.width, this.paddle.x));
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    if (this.config.useKeyboard) {
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
        this.paddle.x -= this.paddle.speed;
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
        this.paddle.x += this.paddle.speed;
      }
    }

    this.clampPaddle();

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    if (this.ball.x <= this.ball.radius || this.ball.x >= this.config.width - this.ball.radius) {
      this.ball.vx = -this.ball.vx;
    }

    if (this.ball.y <= this.ball.radius) {
      this.ball.vy = -this.ball.vy;
    }

    if (this.checkPaddleCollision()) {
      this.ball.vy = -Math.abs(this.ball.vy);
      const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
      this.ball.vx = (hitPos - 0.5) * 6;
    }

    this.checkBrickCollisions();

    if (this.ball.y > this.config.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameState = 'gameOver';
      } else {
        this.resetBall();
      }
    }

    const remainingBricks = this.bricks.filter(brick => !brick.destroyed);
    if (remainingBricks.length === 0) {
      this.gameState = 'won';
    }
  }

  private checkPaddleCollision(): boolean {
    return this.ball.x >= this.paddle.x &&
           this.ball.x <= this.paddle.x + this.paddle.width &&
           this.ball.y + this.ball.radius >= this.paddle.y &&
           this.ball.y - this.ball.radius <= this.paddle.y + this.paddle.height;
  }

  private checkBrickCollisions(): void {
    for (const brick of this.bricks) {
      if (brick.destroyed) continue;

      if (this.ball.x + this.ball.radius >= brick.x &&
          this.ball.x - this.ball.radius <= brick.x + brick.width &&
          this.ball.y + this.ball.radius >= brick.y &&
          this.ball.y - this.ball.radius <= brick.y + brick.height) {
        
        brick.destroyed = true;
        this.score += 10;
        this.ball.vy = -this.ball.vy;
        break;
      }
    }
  }

  private resetBall(): void {
    this.ball.x = this.config.width / 2;
    this.ball.y = this.config.height - 80;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.gameState = 'waiting';
  }

  protected render(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    for (const brick of this.bricks) {
      if (!brick.destroyed) {
        this.ctx.fillStyle = brick.color;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    }

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    this.ctx.fillText(`Lives: ${this.lives}`, this.config.width - 100, 30);

    if (this.gameState === 'waiting') {
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Press SPACE or tap to launch ball', this.config.width / 2, this.config.height / 2);
      
      if (this.config.useKeyboard) {
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Use A/D or ←/→ to move paddle', this.config.width / 2, this.config.height / 2 + 30);
      }
    } else if (this.gameState === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
      this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 40);
    } else if (this.gameState === 'won') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('You Win!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
      this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 40);
    }

    this.ctx.textAlign = 'left';
  }
}