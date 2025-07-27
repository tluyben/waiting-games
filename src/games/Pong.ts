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

export class Pong extends GameEngine {
  private ball: Ball;
  private leftPaddle: Paddle;
  private rightPaddle: Paddle;
  private leftScore = 0;
  private rightScore = 0;
  private gameState: 'waiting' | 'playing' | 'paused' = 'waiting';

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    super(container, config);
    this.initGame();
  }

  private initGame(): void {
    const paddleHeight = 80;
    const paddleWidth = 10;
    const paddleSpeed = 5;

    this.ball = {
      x: this.config.width / 2,
      y: this.config.height / 2,
      vx: Math.random() < 0.5 ? -3 : 3,
      vy: Math.random() * 4 - 2,
      radius: 8
    };

    this.leftPaddle = {
      x: 20,
      y: this.config.height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: paddleSpeed
    };

    this.rightPaddle = {
      x: this.config.width - 30,
      y: this.config.height / 2 - paddleHeight / 2,
      width: paddleWidth,
      height: paddleHeight,
      speed: paddleSpeed
    };

    this.leftScore = 0;
    this.rightScore = 0;
    this.gameState = 'waiting';
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);
    this.keys[event.key] = true;

    if (this.isKeyPressed('START', event) || event.key === ' ') {
      if (this.gameState === 'waiting') {
        this.gameState = 'playing';
      } else if (this.gameState === 'playing') {
        this.gameState = 'paused';
      } else if (this.gameState === 'paused') {
        this.gameState = 'playing';
      }
    }
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    super.handleKeyUp(event);
    this.keys[event.key] = false;
  }

  protected handleTouchStart(event: TouchEvent): void {
    super.handleTouchStart(event);
    
    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    if (this.gameState === 'waiting') {
      this.gameState = 'playing';
      return;
    }

    if (x < this.config.width / 2) {
      this.leftPaddle.y = y - this.leftPaddle.height / 2;
    } else {
      this.rightPaddle.y = y - this.rightPaddle.height / 2;
    }
    
    this.clampPaddles();
  }

  protected handleTouchMove(event: TouchEvent): void {
    super.handleTouchMove(event);
    this.handleTouchStart(event);
  }

  private clampPaddles(): void {
    this.leftPaddle.y = Math.max(0, Math.min(this.config.height - this.leftPaddle.height, this.leftPaddle.y));
    this.rightPaddle.y = Math.max(0, Math.min(this.config.height - this.rightPaddle.height, this.rightPaddle.y));
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    if (this.config.useKeyboard) {
      if (this.isKeyPressed('UP', { key: Object.keys(this.keys).find(k => this.keys[k] && k === this.keyMap.UP) || '' } as KeyboardEvent) || this.keys['w'] || this.keys['W']) {
        this.leftPaddle.y -= this.leftPaddle.speed;
      }
      if (this.isKeyPressed('DOWN', { key: Object.keys(this.keys).find(k => this.keys[k] && k === this.keyMap.DOWN) || '' } as KeyboardEvent) || this.keys['s'] || this.keys['S']) {
        this.leftPaddle.y += this.leftPaddle.speed;
      }

      if (this.keys[this.keyMap.UP] || this.keys['i'] || this.keys['I']) {
        this.rightPaddle.y -= this.rightPaddle.speed;
      }
      if (this.keys[this.keyMap.DOWN] || this.keys['k'] || this.keys['K']) {
        this.rightPaddle.y += this.rightPaddle.speed;
      }
    }

    this.clampPaddles();

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    if (this.ball.y <= this.ball.radius || this.ball.y >= this.config.height - this.ball.radius) {
      this.ball.vy = -this.ball.vy;
    }

    if (this.checkPaddleCollision(this.leftPaddle) || this.checkPaddleCollision(this.rightPaddle)) {
      this.ball.vx = -this.ball.vx;
      this.ball.vx *= 1.05;
      this.ball.vy *= 1.05;
    }

    if (this.ball.x < 0) {
      this.rightScore++;
      this.resetBall();
    } else if (this.ball.x > this.config.width) {
      this.leftScore++;
      this.resetBall();
    }
  }

  private checkPaddleCollision(paddle: Paddle): boolean {
    return this.ball.x - this.ball.radius < paddle.x + paddle.width &&
           this.ball.x + this.ball.radius > paddle.x &&
           this.ball.y - this.ball.radius < paddle.y + paddle.height &&
           this.ball.y + this.ball.radius > paddle.y;
  }

  private resetBall(): void {
    this.ball.x = this.config.width / 2;
    this.ball.y = this.config.height / 2;
    this.ball.vx = Math.random() < 0.5 ? -3 : 3;
    this.ball.vy = Math.random() * 4 - 2;
    this.gameState = 'waiting';
  }

  protected render(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.config.width / 2, 0);
    this.ctx.lineTo(this.config.width / 2, this.config.height);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.leftPaddle.x, this.leftPaddle.y, this.leftPaddle.width, this.leftPaddle.height);
    this.ctx.fillRect(this.rightPaddle.x, this.rightPaddle.y, this.rightPaddle.width, this.rightPaddle.height);

    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.font = '30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.leftScore.toString(), this.config.width / 4, 50);
    this.ctx.fillText(this.rightScore.toString(), (3 * this.config.width) / 4, 50);

    if (this.gameState === 'waiting') {
      this.ctx.font = '20px Arial';
      this.ctx.fillText('Press SPACE or tap to start', this.config.width / 2, this.config.height / 2 + 50);
      
      if (this.config.useKeyboard) {
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Left: W/S or ↑/↓ | Right: I/K', this.config.width / 2, this.config.height / 2 + 80);
      }
    } else if (this.gameState === 'paused') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.fillText('PAUSED', this.config.width / 2, this.config.height / 2);
      this.ctx.font = '16px Arial';
      this.ctx.fillText('Press SPACE to resume', this.config.width / 2, this.config.height / 2 + 30);
    }

    this.ctx.textAlign = 'left';
  }
}