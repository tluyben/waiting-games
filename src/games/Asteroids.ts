import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Ship {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  thrust: boolean;
  size: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  active: boolean;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  size: number;
  active: boolean;
}

export class Asteroids extends GameEngine {
  private ship: Ship;
  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
  private score = 0;
  private lives = 3;
  private gameState: 'playing' | 'gameOver' = 'playing';
  private shootCooldown = 0;
  private invulnerabilityTime = 0;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    super(container, config);
    this.initGame();
  }

  private initGame(): void {
    this.ship = {
      x: this.config.width / 2,
      y: this.config.height / 2,
      angle: 0,
      vx: 0,
      vy: 0,
      thrust: false,
      size: 8
    };

    this.bullets = [];
    this.asteroids = [];
    this.score = 0;
    this.lives = 3;
    this.gameState = 'playing';
    this.shootCooldown = 0;
    this.invulnerabilityTime = 0;
    this.createAsteroids(4);
  }

  private createAsteroids(count: number): void {
    for (let i = 0; i < count; i++) {
      this.createAsteroid(64, Math.random() * this.config.width, Math.random() * this.config.height);
    }
  }

  private createAsteroid(size: number, x?: number, y?: number): void {
    this.asteroids.push({
      x: x ?? Math.random() * this.config.width,
      y: y ?? Math.random() * this.config.height,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      angle: Math.random() * Math.PI * 2,
      size: size,
      active: true
    });
  }

  private wrapPosition(obj: { x: number; y: number }): void {
    if (obj.x < 0) obj.x = this.config.width;
    if (obj.x > this.config.width) obj.x = 0;
    if (obj.y < 0) obj.y = this.config.height;
    if (obj.y > this.config.height) obj.y = 0;
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

    if (this.isKeyPressed('FIRE', event) && this.shootCooldown <= 0) {
      this.shoot();
      this.shootCooldown = 10;
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
    const y = touch.clientY - rect.top;
    
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
      // Horizontal touch - rotate
      if (x > centerX) {
        this.keys['rotateRight'] = true;
      } else {
        this.keys['rotateLeft'] = true;
      }
    } else {
      // Vertical touch
      if (y < centerY) {
        this.keys['thrust'] = true;
      } else {
        // Bottom area - shoot
        if (this.shootCooldown <= 0) {
          this.shoot();
          this.shootCooldown = 10;
        }
      }
    }
  }

  protected handleTouchEnd(event: TouchEvent): void {
    super.handleTouchEnd(event);
    this.keys['rotateLeft'] = false;
    this.keys['rotateRight'] = false;
    this.keys['thrust'] = false;
  }

  private shoot(): void {
    const bulletSpeed = 8;
    this.bullets.push({
      x: this.ship.x,
      y: this.ship.y,
      vx: Math.cos(this.ship.angle) * bulletSpeed + this.ship.vx,
      vy: Math.sin(this.ship.angle) * bulletSpeed + this.ship.vy,
      life: 60,
      active: true
    });
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.invulnerabilityTime > 0) this.invulnerabilityTime--;

    // Ship controls
    if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['rotateLeft']) {
      this.ship.angle -= 0.15;
    }
    if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['rotateRight']) {
      this.ship.angle += 0.15;
    }
    
    this.ship.thrust = this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W'] || this.keys['thrust'];
    
    if (this.ship.thrust) {
      const thrustPower = 0.3;
      this.ship.vx += Math.cos(this.ship.angle) * thrustPower;
      this.ship.vy += Math.sin(this.ship.angle) * thrustPower;
    }

    // Apply friction and max speed
    this.ship.vx *= 0.98;
    this.ship.vy *= 0.98;
    const maxSpeed = 8;
    const speed = Math.sqrt(this.ship.vx * this.ship.vx + this.ship.vy * this.ship.vy);
    if (speed > maxSpeed) {
      this.ship.vx = (this.ship.vx / speed) * maxSpeed;
      this.ship.vy = (this.ship.vy / speed) * maxSpeed;
    }

    // Update ship position
    this.ship.x += this.ship.vx;
    this.ship.y += this.ship.vy;
    this.wrapPosition(this.ship);

    // Update bullets
    this.bullets = this.bullets.filter(bullet => {
      if (!bullet.active) return false;
      
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      bullet.life--;
      
      this.wrapPosition(bullet);
      
      if (bullet.life <= 0) {
        bullet.active = false;
        return false;
      }
      return true;
    });

    // Update asteroids
    for (const asteroid of this.asteroids) {
      if (!asteroid.active) continue;
      
      asteroid.x += asteroid.vx;
      asteroid.y += asteroid.vy;
      asteroid.angle += 0.02;
      this.wrapPosition(asteroid);
    }

    this.checkCollisions();

    // Check if level complete
    const activeAsteroids = this.asteroids.filter(a => a.active);
    if (activeAsteroids.length === 0) {
      this.createAsteroids(Math.min(8, 4 + Math.floor(this.score / 1000)));
    }
  }

  private checkCollisions(): void {
    // Bullet vs Asteroid collisions
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      
      for (const asteroid of this.asteroids) {
        if (!asteroid.active) continue;
        
        const dx = bullet.x - asteroid.x;
        const dy = bullet.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < asteroid.size / 2) {
          bullet.active = false;
          asteroid.active = false;
          
          // Score based on asteroid size
          if (asteroid.size >= 64) {
            this.score += 20;
          } else if (asteroid.size >= 32) {
            this.score += 50;
          } else {
            this.score += 100;
          }
          
          // Split asteroid
          if (asteroid.size >= 32) {
            const newSize = asteroid.size / 2;
            for (let i = 0; i < 2; i++) {
              this.createAsteroid(newSize, asteroid.x, asteroid.y);
            }
          }
          break;
        }
      }
    }

    // Ship vs Asteroid collisions
    if (this.invulnerabilityTime <= 0) {
      for (const asteroid of this.asteroids) {
        if (!asteroid.active) continue;
        
        const dx = this.ship.x - asteroid.x;
        const dy = this.ship.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (asteroid.size / 2) + this.ship.size) {
          this.lives--;
          this.invulnerabilityTime = 120;
          
          // Reset ship position and velocity
          this.ship.x = this.config.width / 2;
          this.ship.y = this.config.height / 2;
          this.ship.vx = 0;
          this.ship.vy = 0;
          this.ship.angle = 0;
          
          if (this.lives <= 0) {
            this.gameState = 'gameOver';
          }
          break;
        }
      }
    }
  }

  protected render(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw asteroids
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    for (const asteroid of this.asteroids) {
      if (!asteroid.active) continue;
      
      this.ctx.save();
      this.ctx.translate(asteroid.x, asteroid.y);
      this.ctx.rotate(asteroid.angle);
      
      this.ctx.beginPath();
      const sides = 8;
      const radius = asteroid.size / 2;
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const r = radius + Math.sin(angle * 3) * (radius * 0.2);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        
        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Draw ship (with invulnerability flashing)
    if (this.invulnerabilityTime <= 0 || Math.floor(this.invulnerabilityTime / 5) % 2 === 0) {
      this.ctx.save();
      this.ctx.translate(this.ship.x, this.ship.y);
      this.ctx.rotate(this.ship.angle);
      
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.ship.size, 0);
      this.ctx.lineTo(-this.ship.size / 2, -this.ship.size / 2);
      this.ctx.lineTo(-this.ship.size / 4, 0);
      this.ctx.lineTo(-this.ship.size / 2, this.ship.size / 2);
      this.ctx.closePath();
      this.ctx.stroke();
      
      // Thrust flame
      if (this.ship.thrust) {
        this.ctx.strokeStyle = '#ff4400';
        this.ctx.beginPath();
        this.ctx.moveTo(-this.ship.size / 4, 0);
        this.ctx.lineTo(-this.ship.size * 1.5, 0);
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    }

    // Draw bullets
    this.ctx.fillStyle = '#fff';
    for (const bullet of this.bullets) {
      if (bullet.active) {
        this.ctx.beginPath();
        this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // UI
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);

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
      
      this.ctx.textAlign = 'left';
    } else if (this.config.useMobile) {
      // Mobile control hints
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(10, this.config.height - 60, 60, 50);
      this.ctx.fillRect(this.config.width - 70, this.config.height - 60, 60, 50);
      this.ctx.fillRect(this.config.width / 2 - 30, 10, 60, 50);
      this.ctx.fillRect(this.config.width / 2 - 30, this.config.height - 60, 60, 50);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('↺', 40, this.config.height - 30);
      this.ctx.fillText('↻', this.config.width - 40, this.config.height - 30);
      this.ctx.fillText('↑', this.config.width / 2, 35);
      this.ctx.fillText('FIRE', this.config.width / 2, this.config.height - 30);
      
      this.ctx.textAlign = 'left';
    }
  }
}