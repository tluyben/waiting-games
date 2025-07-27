import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Mario {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  climbing: boolean;
  facingRight: boolean;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Ladder {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Barrel {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  active: boolean;
}

interface Princess {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class DonkeyKong extends GameEngine {
  private mario: Mario;
  private platforms: Platform[] = [];
  private ladders: Ladder[] = [];
  private barrels: Barrel[] = [];
  private princess: Princess;
  private donkeyKong: { x: number; y: number; width: number; height: number };
  private score = 0;
  private lives = 3;
  private gameState: 'playing' | 'gameOver' | 'won' = 'playing';
  private barrelTimer = 0;
  private gravity = 0.5;
  private jumpPower = -12;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const dkConfig = {
      ...config,
      width: config.width || 400,
      height: config.height || 500
    };
    super(container, dkConfig);
    this.initGame();
  }

  private initGame(): void {
    this.mario = {
      x: 50,
      y: this.config.height - 80,
      vx: 0,
      vy: 0,
      width: 16,
      height: 24,
      onGround: false,
      climbing: false,
      facingRight: true
    };

    this.princess = {
      x: this.config.width - 60,
      y: 30,
      width: 16,
      height: 24
    };

    this.donkeyKong = {
      x: 50,
      y: 30,
      width: 32,
      height: 32
    };

    this.platforms = [];
    this.ladders = [];
    this.barrels = [];
    this.score = 0;
    this.lives = 3;
    this.gameState = 'playing';
    this.barrelTimer = 0;

    this.createLevel();
  }

  private createLevel(): void {
    // Ground platform
    this.platforms.push({ x: 0, y: this.config.height - 20, width: this.config.width, height: 20 });
    
    // Level platforms (slanted construction site style)
    for (let level = 1; level <= 4; level++) {
      const y = this.config.height - 20 - (level * 100);
      const isEven = level % 2 === 0;
      
      if (isEven) {
        // Platform goes from left to right, slanted down
        this.platforms.push({ x: 0, y: y, width: this.config.width - 50, height: 10 });
      } else {
        // Platform goes from right to left, slanted down
        this.platforms.push({ x: 50, y: y, width: this.config.width - 50, height: 10 });
      }
      
      // Add ladders connecting levels
      if (level < 4) {
        const ladderX = isEven ? this.config.width - 70 : 70;
        this.ladders.push({ x: ladderX, y: y - 90, width: 16, height: 90 });
      }
    }

    // Top platform for princess and DK
    this.platforms.push({ x: 0, y: 60, width: this.config.width, height: 10 });
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);
    this.keys[event.key] = true;

    if (this.gameState === 'gameOver' || this.gameState === 'won') {
      if (this.isKeyPressed('START', event) || event.key === ' ') {
        this.initGame();
      }
      return;
    }

    if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.jump();
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
    const y = touch.clientY - rect.top;
    
    const marioScreenX = this.mario.x;
    const marioScreenY = this.mario.y;
    
    // Touch controls
    if (x < this.config.width / 3) {
      this.keys['left'] = true;
    } else if (x > (2 * this.config.width) / 3) {
      this.keys['right'] = true;
    } else if (y < this.config.height / 2) {
      this.jump();
    } else {
      // Check for ladder climbing
      const deltaY = y - marioScreenY;
      if (Math.abs(deltaY) > 20) {
        this.keys[deltaY > 0 ? 'down' : 'up'] = true;
      }
    }
  }

  protected handleTouchEnd(event: TouchEvent): void {
    super.handleTouchEnd(event);
    this.keys['left'] = false;
    this.keys['right'] = false;
    this.keys['up'] = false;
    this.keys['down'] = false;
  }

  private jump(): void {
    if (this.mario.onGround && !this.mario.climbing) {
      this.mario.vy = this.jumpPower;
      this.mario.onGround = false;
    }
  }

  private checkPlatformCollision(x: number, y: number, width: number, height: number): Platform | null {
    for (const platform of this.platforms) {
      if (x < platform.x + platform.width &&
          x + width > platform.x &&
          y < platform.y + platform.height &&
          y + height > platform.y) {
        return platform;
      }
    }
    return null;
  }

  private checkLadderCollision(x: number, y: number, width: number, height: number): Ladder | null {
    for (const ladder of this.ladders) {
      if (x < ladder.x + ladder.width &&
          x + width > ladder.x &&
          y < ladder.y + ladder.height &&
          y + height > ladder.y) {
        return ladder;
      }
    }
    return null;
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    // Spawn barrels
    this.barrelTimer++;
    if (this.barrelTimer > 120) {
      this.spawnBarrel();
      this.barrelTimer = 0;
    }

    this.updateMario();
    this.updateBarrels();
    this.checkCollisions();
  }

  private updateMario(): void {
    // Handle input
    const onLadder = this.checkLadderCollision(this.mario.x, this.mario.y, this.mario.width, this.mario.height);
    
    if (onLadder) {
      if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W'] || this.keys['up']) {
        this.mario.climbing = true;
        this.mario.vy = -2;
        this.mario.vx = 0;
      } else if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S'] || this.keys['down']) {
        this.mario.climbing = true;
        this.mario.vy = 2;
        this.mario.vx = 0;
      } else if (this.mario.climbing) {
        this.mario.vy = 0;
      }
    } else {
      this.mario.climbing = false;
    }

    if (!this.mario.climbing) {
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['left']) {
        this.mario.vx = -3;
        this.mario.facingRight = false;
      } else if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['right']) {
        this.mario.vx = 3;
        this.mario.facingRight = true;
      } else {
        this.mario.vx = 0;
      }

      // Apply gravity
      if (!this.mario.onGround) {
        this.mario.vy += this.gravity;
      }
    }

    // Update position
    const newX = this.mario.x + this.mario.vx;
    const newY = this.mario.y + this.mario.vy;

    // Horizontal collision
    if (!this.checkPlatformCollision(newX, this.mario.y, this.mario.width, this.mario.height)) {
      this.mario.x = Math.max(0, Math.min(this.config.width - this.mario.width, newX));
    }

    // Vertical collision
    this.mario.onGround = false;
    const platformHit = this.checkPlatformCollision(this.mario.x, newY, this.mario.width, this.mario.height);
    
    if (platformHit) {
      if (this.mario.vy > 0) { // Falling down
        this.mario.y = platformHit.y - this.mario.height;
        this.mario.vy = 0;
        this.mario.onGround = true;
      } else if (this.mario.vy < 0) { // Jumping up
        this.mario.y = platformHit.y + platformHit.height;
        this.mario.vy = 0;
      }
    } else {
      this.mario.y = newY;
    }

    // Prevent falling off screen
    if (this.mario.y > this.config.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameState = 'gameOver';
      } else {
        this.resetMario();
      }
    }
  }

  private resetMario(): void {
    this.mario.x = 50;
    this.mario.y = this.config.height - 80;
    this.mario.vx = 0;
    this.mario.vy = 0;
    this.mario.onGround = false;
    this.mario.climbing = false;
  }

  private spawnBarrel(): void {
    this.barrels.push({
      x: this.donkeyKong.x + this.donkeyKong.width,
      y: this.donkeyKong.y + this.donkeyKong.height,
      vx: 2,
      vy: 0,
      width: 12,
      height: 12,
      onGround: false,
      active: true
    });
  }

  private updateBarrels(): void {
    for (const barrel of this.barrels) {
      if (!barrel.active) continue;

      // Apply gravity
      if (!barrel.onGround) {
        barrel.vy += this.gravity;
      }

      // Update position
      const newX = barrel.x + barrel.vx;
      const newY = barrel.y + barrel.vy;

      // Platform collision
      barrel.onGround = false;
      const platformHit = this.checkPlatformCollision(newX, newY, barrel.width, barrel.height);
      
      if (platformHit && barrel.vy >= 0) {
        barrel.y = platformHit.y - barrel.height;
        barrel.vy = 0;
        barrel.onGround = true;
        barrel.x = newX;
        
        // Bounce at platform edges
        if (barrel.x <= platformHit.x || barrel.x + barrel.width >= platformHit.x + platformHit.width) {
          barrel.vx *= -1;
        }
      } else {
        barrel.x = newX;
        barrel.y = newY;
      }

      // Remove barrels that fall off screen
      if (barrel.y > this.config.height) {
        barrel.active = false;
      }
    }

    // Clean up inactive barrels
    this.barrels = this.barrels.filter(barrel => barrel.active);
  }

  private checkCollisions(): void {
    // Mario vs barrels
    for (const barrel of this.barrels) {
      if (!barrel.active) continue;
      
      if (this.mario.x < barrel.x + barrel.width &&
          this.mario.x + this.mario.width > barrel.x &&
          this.mario.y < barrel.y + barrel.height &&
          this.mario.y + this.mario.height > barrel.y) {
        this.lives--;
        if (this.lives <= 0) {
          this.gameState = 'gameOver';
        } else {
          this.resetMario();
        }
        return;
      }
    }

    // Mario vs princess (win condition)
    if (this.mario.x < this.princess.x + this.princess.width &&
        this.mario.x + this.mario.width > this.princess.x &&
        this.mario.y < this.princess.y + this.princess.height &&
        this.mario.y + this.mario.height > this.princess.y) {
      this.gameState = 'won';
      this.score += 1000;
    }
  }

  protected render(): void {
    this.ctx.fillStyle = '#000080';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw platforms
    this.ctx.fillStyle = '#8B4513';
    for (const platform of this.platforms) {
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    }

    // Draw ladders
    this.ctx.fillStyle = '#FFD700';
    this.ctx.lineWidth = 2;
    for (const ladder of this.ladders) {
      this.ctx.strokeStyle = '#FFD700';
      for (let y = ladder.y; y < ladder.y + ladder.height; y += 10) {
        this.ctx.beginPath();
        this.ctx.moveTo(ladder.x, y);
        this.ctx.lineTo(ladder.x + ladder.width, y);
        this.ctx.stroke();
      }
      // Side rails
      this.ctx.beginPath();
      this.ctx.moveTo(ladder.x, ladder.y);
      this.ctx.lineTo(ladder.x, ladder.y + ladder.height);
      this.ctx.moveTo(ladder.x + ladder.width, ladder.y);
      this.ctx.lineTo(ladder.x + ladder.width, ladder.y + ladder.height);
      this.ctx.stroke();
    }

    // Draw Donkey Kong
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(this.donkeyKong.x, this.donkeyKong.y, this.donkeyKong.width, this.donkeyKong.height);
    
    // DK face
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.donkeyKong.x + 5, this.donkeyKong.y + 5, 4, 4);
    this.ctx.fillRect(this.donkeyKong.x + 23, this.donkeyKong.y + 5, 4, 4);

    // Draw princess
    this.ctx.fillStyle = '#FF69B4';
    this.ctx.fillRect(this.princess.x, this.princess.y, this.princess.width, this.princess.height);

    // Draw Mario
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(this.mario.x, this.mario.y, this.mario.width, this.mario.height);
    
    // Mario hat
    this.ctx.fillStyle = '#FF0000';
    this.ctx.fillRect(this.mario.x, this.mario.y, this.mario.width, 8);
    
    // Mario face
    this.ctx.fillStyle = '#FFDBAC';
    this.ctx.fillRect(this.mario.x + 2, this.mario.y + 8, this.mario.width - 4, 8);

    // Draw barrels
    this.ctx.fillStyle = '#8B4513';
    for (const barrel of this.barrels) {
      if (barrel.active) {
        this.ctx.fillRect(barrel.x, barrel.y, barrel.width, barrel.height);
        
        // Barrel stripes
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(barrel.x, barrel.y + 3);
        this.ctx.lineTo(barrel.x + barrel.width, barrel.y + 3);
        this.ctx.moveTo(barrel.x, barrel.y + 9);
        this.ctx.lineTo(barrel.x + barrel.width, barrel.y + 9);
        this.ctx.stroke();
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
    } else if (this.gameState === 'won') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('You Rescued the Princess!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
      this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 40);
      
      this.ctx.textAlign = 'left';
    } else if (this.config.useMobile) {
      // Mobile control hints
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(10, this.config.height - 60, 60, 50);
      this.ctx.fillRect(this.config.width - 70, this.config.height - 60, 60, 50);
      this.ctx.fillRect(this.config.width / 2 - 30, 10, 60, 50);
      this.ctx.fillRect(this.config.width / 2 - 30, this.config.height - 120, 60, 50);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('←', 40, this.config.height - 30);
      this.ctx.fillText('→', this.config.width - 40, this.config.height - 30);
      this.ctx.fillText('JUMP', this.config.width / 2, 35);
      this.ctx.fillText('↕', this.config.width / 2, this.config.height - 90);
      
      this.ctx.textAlign = 'left';
    }
  }
}