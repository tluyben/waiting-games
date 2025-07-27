import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';

interface Bomb {
  x: number;
  y: number;
  speed: number;
  type: 'normal' | 'fast' | 'heavy';
  color: string;
  size: number;
  active: boolean;
}

interface Bucket {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  active: boolean;
}

export class Kaboom extends GameEngine {
  private bucket: Bucket;
  private bombs: Bomb[] = [];
  private explosions: Explosion[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private gameState: 'playing' | 'gameOver' = 'playing';
  private bombSpawnTimer = 0;
  private bombSpawnRate = 60;
  private speedMultiplier = 1;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const kaboomConfig = {
      ...config,
      width: config.width || 400,
      height: config.height || 500
    };
    super(container, kaboomConfig);
    this.initGame();
  }

  private initGame(): void {
    this.bucket = {
      x: this.config.width / 2 - 30,
      y: this.config.height - 60,
      width: 60,
      height: 40,
      speed: 8
    };

    this.bombs = [];
    this.explosions = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameState = 'playing';
    this.bombSpawnTimer = 0;
    this.bombSpawnRate = 60;
    this.speedMultiplier = 1;
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);
    this.keys[event.key] = true;

    if (this.gameState === 'gameOver') {
      if (this.isKeyPressed('START', event) || event.key === ' ') {
        this.initGame();
      }
      return;
    }
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    super.handleKeyUp(event);
    this.keys[event.key] = false;
  }

  protected handleTouchStart(event: TouchEvent): void {
    super.handleTouchStart(event);
    
    if (this.gameState === 'gameOver') {
      this.initGame();
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    
    // Move bucket to touch position
    this.bucket.x = x - this.bucket.width / 2;
    this.clampBucket();
  }

  protected handleTouchMove(event: TouchEvent): void {
    super.handleTouchMove(event);
    this.handleTouchStart(event);
  }

  private clampBucket(): void {
    this.bucket.x = Math.max(0, Math.min(this.config.width - this.bucket.width, this.bucket.x));
  }

  private spawnBomb(): void {
    const types: Array<Bomb['type']> = ['normal', 'fast', 'heavy'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let speed: number;
    let color: string;
    let size: number;
    
    switch (type) {
      case 'fast':
        speed = 4 * this.speedMultiplier;
        color = '#ff4444';
        size = 8;
        break;
      case 'heavy':
        speed = 1.5 * this.speedMultiplier;
        color = '#444444';
        size = 16;
        break;
      default: // normal
        speed = 2.5 * this.speedMultiplier;
        color = '#000000';
        size = 12;
        break;
    }

    this.bombs.push({
      x: Math.random() * (this.config.width - size),
      y: -size,
      speed: speed,
      type: type,
      color: color,
      size: size,
      active: true
    });
  }

  private createExplosion(x: number, y: number, size: number): void {
    this.explosions.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: size * 2,
      active: true
    });
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    // Handle bucket movement
    if (this.config.useKeyboard) {
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
        this.bucket.x -= this.bucket.speed;
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
        this.bucket.x += this.bucket.speed;
      }
    }

    this.clampBucket();

    // Spawn bombs
    this.bombSpawnTimer++;
    if (this.bombSpawnTimer >= this.bombSpawnRate) {
      this.spawnBomb();
      this.bombSpawnTimer = 0;
    }

    // Update bombs
    for (const bomb of this.bombs) {
      if (!bomb.active) continue;

      bomb.y += bomb.speed;

      // Check if bomb reached ground
      if (bomb.y > this.config.height) {
        bomb.active = false;
        this.createExplosion(bomb.x + bomb.size / 2, this.config.height - 20, bomb.size);
        this.lives--;
        
        if (this.lives <= 0) {
          this.gameState = 'gameOver';
        }
      }
    }

    // Check bomb-bucket collisions
    for (const bomb of this.bombs) {
      if (!bomb.active) continue;

      if (bomb.x < this.bucket.x + this.bucket.width &&
          bomb.x + bomb.size > this.bucket.x &&
          bomb.y < this.bucket.y + this.bucket.height &&
          bomb.y + bomb.size > this.bucket.y) {
        
        bomb.active = false;
        
        // Score based on bomb type
        switch (bomb.type) {
          case 'fast':
            this.score += 30;
            break;
          case 'heavy':
            this.score += 50;
            break;
          default:
            this.score += 20;
            break;
        }

        // Level progression
        if (this.score > this.level * 500) {
          this.level++;
          this.speedMultiplier += 0.2;
          this.bombSpawnRate = Math.max(20, this.bombSpawnRate - 5);
        }
      }
    }

    // Update explosions
    for (const explosion of this.explosions) {
      if (!explosion.active) continue;

      explosion.radius += 2;
      if (explosion.radius >= explosion.maxRadius) {
        explosion.active = false;
      }
    }

    // Clean up inactive objects
    this.bombs = this.bombs.filter(bomb => bomb.active);
    this.explosions = this.explosions.filter(explosion => explosion.active);
  }

  protected render(): void {
    // Sky gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Ground
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.config.height - 20, this.config.width, 20);

    // Draw bucket
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(this.bucket.x, this.bucket.y, this.bucket.width, this.bucket.height);
    
    // Bucket rim
    this.ctx.strokeStyle = '#FFA500';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(this.bucket.x, this.bucket.y, this.bucket.width, this.bucket.height);
    
    // Bucket handle
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.bucket.x - 5, this.bucket.y + 10, 8, 0, Math.PI);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(this.bucket.x + this.bucket.width + 5, this.bucket.y + 10, 8, 0, Math.PI);
    this.ctx.stroke();

    // Draw bombs
    for (const bomb of this.bombs) {
      if (!bomb.active) continue;

      this.ctx.fillStyle = bomb.color;
      this.ctx.beginPath();
      this.ctx.arc(bomb.x + bomb.size / 2, bomb.y + bomb.size / 2, bomb.size / 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Bomb fuse
      this.ctx.strokeStyle = '#8B4513';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(bomb.x + bomb.size / 2, bomb.y);
      this.ctx.lineTo(bomb.x + bomb.size / 2 - 3, bomb.y - 8);
      this.ctx.stroke();

      // Spark on fuse
      this.ctx.fillStyle = '#FF4500';
      this.ctx.beginPath();
      this.ctx.arc(bomb.x + bomb.size / 2 - 3, bomb.y - 8, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw explosions
    for (const explosion of this.explosions) {
      if (!explosion.active) continue;

      const alpha = 1 - (explosion.radius / explosion.maxRadius);
      this.ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner explosion core
      this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha * 0.8})`;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // UI
    this.ctx.fillStyle = '#000';
    this.ctx.font = 'bold 18px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 55);
    this.ctx.fillText(`Level: ${this.level}`, 10, 80);

    if (this.gameState === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('KABOOM!', this.config.width / 2, this.config.height / 2 - 40);
      this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2);
      
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 30);
      this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 60);
      
      this.ctx.textAlign = 'left';
    } else if (this.config.useMobile) {
      // Mobile control hints
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(10, this.config.height - 120, this.config.width - 20, 40);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Touch to move bucket and catch bombs!', this.config.width / 2, this.config.height - 95);
      
      this.ctx.textAlign = 'left';
    }

    // Draw instructions at start
    if (this.score === 0) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(50, 120, this.config.width - 100, 100);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Catch the falling bombs!', this.config.width / 2, 150);
      this.ctx.fillText('Use A/D or ←/→ to move', this.config.width / 2, 175);
      this.ctx.fillText('Don\'t let them hit the ground!', this.config.width / 2, 200);
      
      this.ctx.textAlign = 'left';
    }
  }
}