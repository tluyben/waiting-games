import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Bullet extends Point {
  vx: number;
  vy: number;
  width: number;
  height: number;
  active: boolean;
  isPlayer: boolean;
}

interface Invader {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  type: number;
}

export class SpaceInvaders extends GameEngine {
  private player: Player;
  private bullets: Bullet[] = [];
  private invaders: Invader[] = [];
  private score = 0;
  private lives = 3;
  private gameState: 'playing' | 'gameOver' | 'won' = 'playing';
  private invaderDirection = 1;
  private invaderDropTimer = 0;
  private shootCooldown = 0;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    super(container, config);
    this.initGame();
  }

  private initGame(): void {
    this.player = {
      x: this.config.width / 2 - 15,
      y: this.config.height - 40,
      width: 30,
      height: 20,
      speed: 5
    };

    this.score = 0;
    this.lives = 3;
    this.gameState = 'playing';
    this.bullets = [];
    this.invaderDirection = 1;
    this.invaderDropTimer = 0;
    this.shootCooldown = 0;
    this.createInvaders();
  }

  private createInvaders(): void {
    this.invaders = [];
    const rows = 5;
    const cols = 10;
    const invaderWidth = 24;
    const invaderHeight = 20;
    const spacing = 8;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.invaders.push({
          x: col * (invaderWidth + spacing) + 50,
          y: row * (invaderHeight + spacing) + 50,
          width: invaderWidth,
          height: invaderHeight,
          active: true,
          type: row < 2 ? 3 : row < 4 ? 2 : 1
        });
      }
    }
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);
    this.keys[event.key] = true;

    if (this.isKeyPressed('FIRE', event) && this.shootCooldown <= 0) {
      this.playerShoot();
      this.shootCooldown = 20;
    }

    if (this.isKeyPressed('START', event) && (this.gameState === 'gameOver' || this.gameState === 'won')) {
      this.initGame();
    }
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    super.handleKeyUp(event);
    this.keys[event.key] = false;
  }

  protected handleTouchStart(event: TouchEvent): void {
    super.handleTouchStart(event);
    
    if (this.gameState === 'gameOver' || this.gameState === 'won') {
      this.initGame();
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    if (x < this.config.width / 3) {
      this.keys['left'] = true;
    } else if (x > (2 * this.config.width) / 3) {
      this.keys['right'] = true;
    } else {
      if (this.shootCooldown <= 0) {
        this.playerShoot();
        this.shootCooldown = 20;
      }
    }
  }

  protected handleTouchEnd(event: TouchEvent): void {
    super.handleTouchEnd(event);
    this.keys['left'] = false;
    this.keys['right'] = false;
  }

  private playerShoot(): void {
    this.bullets.push({
      x: this.player.x + this.player.width / 2 - 1,
      y: this.player.y,
      vx: 0,
      vy: -8,
      width: 2,
      height: 8,
      active: true,
      isPlayer: true
    });
  }

  private invaderShoot(): void {
    const activeInvaders = this.invaders.filter(inv => inv.active);
    if (activeInvaders.length === 0) return;

    if (Math.random() < 0.02) {
      const shooter = activeInvaders[Math.floor(Math.random() * activeInvaders.length)];
      this.bullets.push({
        x: shooter.x + shooter.width / 2 - 1,
        y: shooter.y + shooter.height,
        vx: 0,
        vy: 3,
        width: 2,
        height: 8,
        active: true,
        isPlayer: false
      });
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    if (this.shootCooldown > 0) this.shootCooldown--;

    if (this.config.useKeyboard) {
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['left']) {
        this.player.x -= this.player.speed;
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['right']) {
        this.player.x += this.player.speed;
      }
    }

    this.player.x = Math.max(0, Math.min(this.config.width - this.player.width, this.player.x));

    this.bullets = this.bullets.filter(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      return bullet.active && bullet.y > -bullet.height && bullet.y < this.config.height + bullet.height;
    });

    this.checkBulletCollisions();
    this.updateInvaders();
    this.invaderShoot();

    const activeInvaders = this.invaders.filter(inv => inv.active);
    if (activeInvaders.length === 0) {
      this.gameState = 'won';
    }

    if (this.lives <= 0) {
      this.gameState = 'gameOver';
    }

    const lowestInvader = Math.max(...activeInvaders.map(inv => inv.y));
    if (lowestInvader > this.player.y) {
      this.gameState = 'gameOver';
    }
  }

  private updateInvaders(): void {
    let shouldDrop = false;
    const activeInvaders = this.invaders.filter(inv => inv.active);
    
    for (const invader of activeInvaders) {
      invader.x += this.invaderDirection * 0.5;
      
      if (invader.x <= 0 || invader.x >= this.config.width - invader.width) {
        shouldDrop = true;
      }
    }

    if (shouldDrop) {
      this.invaderDirection *= -1;
      for (const invader of activeInvaders) {
        invader.y += 20;
      }
    }
  }

  private checkBulletCollisions(): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      if (bullet.isPlayer) {
        for (const invader of this.invaders) {
          if (invader.active && this.checkCollision(bullet, invader)) {
            bullet.active = false;
            invader.active = false;
            this.score += invader.type * 10;
            break;
          }
        }
      } else {
        if (this.checkCollision(bullet, this.player)) {
          bullet.active = false;
          this.lives--;
        }
      }
    }
  }

  private checkCollision(obj1: any, obj2: any): boolean {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }

  protected render(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    this.ctx.fillStyle = '#0f0';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);

    for (const invader of this.invaders) {
      if (invader.active) {
        this.ctx.fillStyle = invader.type === 3 ? '#f00' : invader.type === 2 ? '#ff0' : '#fff';
        this.ctx.fillRect(invader.x, invader.y, invader.width, invader.height);
      }
    }

    for (const bullet of this.bullets) {
      if (bullet.active) {
        this.ctx.fillStyle = bullet.isPlayer ? '#0ff' : '#f0f';
        this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }
    }

    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    this.ctx.fillText(`Lives: ${this.lives}`, this.config.width - 80, 25);

    if (this.gameState === 'gameOver') {
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
    } else if (this.config.useMobile) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(10, this.config.height - 60, 60, 50);
      this.ctx.fillRect(this.config.width - 70, this.config.height - 60, 60, 50);
      this.ctx.fillRect(this.config.width / 2 - 30, this.config.height - 60, 60, 50);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('←', 40, this.config.height - 30);
      this.ctx.fillText('→', this.config.width - 40, this.config.height - 30);
      this.ctx.fillText('FIRE', this.config.width / 2, this.config.height - 30);
    }

    this.ctx.textAlign = 'left';
  }
}