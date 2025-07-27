import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';

interface Bird {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  flapping: boolean;
  onGround: boolean;
  facing: 'left' | 'right';
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'hunter' | 'shadow' | 'buzzard';
  onGround: boolean;
  alive: boolean;
  color: string;
  speed: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Egg {
  x: number;
  y: number;
  width: number;
  height: number;
  timer: number;
  active: boolean;
}

export class Joust extends GameEngine {
  private player: Bird;
  private enemies: Enemy[] = [];
  private platforms: Platform[] = [];
  private eggs: Egg[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private gameState: 'playing' | 'gameOver' | 'levelComplete' = 'playing';
  private gravity = 0.4;
  private flapPower = -8;
  private enemySpawnTimer = 0;
  private waveComplete = false;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const joustConfig = {
      ...config,
      width: config.width || 600,
      height: config.height || 400
    };
    super(container, joustConfig);
    this.initGame();
  }

  private initGame(): void {
    this.player = {
      x: this.config.width / 2,
      y: this.config.height - 150,
      vx: 0,
      vy: 0,
      width: 20,
      height: 16,
      flapping: false,
      onGround: false,
      facing: 'right'
    };

    this.enemies = [];
    this.eggs = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameState = 'playing';
    this.enemySpawnTimer = 0;
    this.waveComplete = false;
    
    this.createPlatforms();
    this.spawnEnemyWave();
  }

  private createPlatforms(): void {
    this.platforms = [];
    
    // Ground platforms
    this.platforms.push(
      { x: 0, y: this.config.height - 20, width: 150, height: 20 },
      { x: this.config.width - 150, y: this.config.height - 20, width: 150, height: 20 }
    );
    
    // Mid-level platforms
    this.platforms.push(
      { x: 50, y: this.config.height - 120, width: 100, height: 15 },
      { x: this.config.width - 150, y: this.config.height - 120, width: 100, height: 15 },
      { x: this.config.width / 2 - 80, y: this.config.height - 180, width: 160, height: 15 }
    );
    
    // Upper platforms
    this.platforms.push(
      { x: 20, y: this.config.height - 250, width: 120, height: 15 },
      { x: this.config.width - 140, y: this.config.height - 250, width: 120, height: 15 }
    );
    
    // Top platform
    this.platforms.push(
      { x: this.config.width / 2 - 60, y: this.config.height - 320, width: 120, height: 15 }
    );
  }

  private spawnEnemyWave(): void {
    const enemyCount = Math.min(2 + this.level, 5);
    
    for (let i = 0; i < enemyCount; i++) {
      const types: Enemy['type'][] = ['hunter', 'shadow', 'buzzard'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let color: string;
      let speed: number;
      
      switch (type) {
        case 'hunter':
          color = '#FF4444';
          speed = 1.5;
          break;
        case 'shadow':
          color = '#444444';
          speed = 2.0;
          break;
        case 'buzzard':
          color = '#8B4513';
          speed = 1.0;
          break;
      }
      
      this.enemies.push({
        x: Math.random() * (this.config.width - 40) + 20,
        y: this.config.height - 100,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        width: 18,
        height: 14,
        type: type,
        onGround: false,
        alive: true,
        color: color,
        speed: speed
      });
    }
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);

    if (this.gameState === 'gameOver') {
      if (this.isKeyPressed('START', event) || event.key === ' ') {
        this.initGame();
      }
      return;
    }

    if (this.gameState === 'levelComplete') {
      if (this.isKeyPressed('START', event) || event.key === ' ') {
        this.level++;
        this.spawnEnemyWave();
        this.gameState = 'playing';
      }
      return;
    }

    if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.flapWings();
    }
  }

  protected handleTouchStart(event: TouchEvent): void {
    super.handleTouchStart(event);
    
    if (this.gameState === 'gameOver') {
      this.initGame();
      return;
    }

    if (this.gameState === 'levelComplete') {
      this.level++;
      this.spawnEnemyWave();
      this.gameState = 'playing';
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Flap if touching upper half, move if touching sides
    if (y < this.config.height / 2) {
      this.flapWings();
    } else {
      const centerX = this.config.width / 2;
      if (x < centerX - 50) {
        this.player.facing = 'left';
        this.player.vx = Math.max(this.player.vx - 1, -3);
      } else if (x > centerX + 50) {
        this.player.facing = 'right';
        this.player.vx = Math.min(this.player.vx + 1, 3);
      } else {
        this.flapWings();
      }
    }
  }

  private flapWings(): void {
    this.player.flapping = true;
    this.player.vy = this.flapPower;
  }

  private checkPlatformCollision(entity: { x: number; y: number; vx: number; vy: number; width: number; height: number; onGround: boolean }): boolean {
    for (const platform of this.platforms) {
      if (entity.x < platform.x + platform.width &&
          entity.x + entity.width > platform.x &&
          entity.y + entity.height > platform.y &&
          entity.y + entity.height < platform.y + platform.height + 5) {
        
        if (entity.vy > 0) {
          entity.y = platform.y - entity.height;
          entity.vy = 0;
          entity.onGround = true;
          return true;
        }
      }
    }
    return false;
  }

  private updatePlayer(): void {
    // Horizontal movement
    if (this.config.useKeyboard) {
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
        this.player.facing = 'left';
        this.player.vx = Math.max(this.player.vx - 0.5, -3);
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
        this.player.facing = 'right';
        this.player.vx = Math.min(this.player.vx + 0.5, 3);
      }
    }

    // Apply friction
    this.player.vx *= 0.95;

    // Apply gravity
    this.player.vy += this.gravity;
    this.player.onGround = false;

    // Update position
    this.player.x += this.player.vx;
    this.player.y += this.player.vy;

    // Check platform collisions
    this.checkPlatformCollision(this.player);

    // Ground collision
    if (this.player.y + this.player.height >= this.config.height - 20) {
      this.player.y = this.config.height - 20 - this.player.height;
      this.player.vy = 0;
      this.player.onGround = true;
    }

    // Screen wrapping
    if (this.player.x < -this.player.width) {
      this.player.x = this.config.width;
    } else if (this.player.x > this.config.width) {
      this.player.x = -this.player.width;
    }

    // Top boundary
    if (this.player.y < 0) {
      this.player.y = 0;
      this.player.vy = 0;
    }

    this.player.flapping = false;
  }

  private updateEnemies(): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      // Simple AI: move toward player occasionally
      if (Math.random() < 0.02) {
        if (this.player.x > enemy.x) {
          enemy.vx = Math.min(enemy.vx + 0.3, enemy.speed);
        } else {
          enemy.vx = Math.max(enemy.vx - 0.3, -enemy.speed);
        }

        // Flap occasionally
        if (Math.random() < 0.1) {
          enemy.vy = this.flapPower * 0.8;
        }
      }

      // Apply friction and gravity
      enemy.vx *= 0.98;
      enemy.vy += this.gravity;
      enemy.onGround = false;

      // Update position
      enemy.x += enemy.vx;
      enemy.y += enemy.vy;

      // Check platform collisions
      this.checkPlatformCollision(enemy);

      // Ground collision
      if (enemy.y + enemy.height >= this.config.height - 20) {
        enemy.y = this.config.height - 20 - enemy.height;
        enemy.vy = 0;
        enemy.onGround = true;
      }

      // Screen wrapping
      if (enemy.x < -enemy.width) {
        enemy.x = this.config.width;
      } else if (enemy.x > this.config.width) {
        enemy.x = -enemy.width;
      }

      // Top boundary
      if (enemy.y < 0) {
        enemy.y = 0;
        enemy.vy = 0;
      }
    }
  }

  private checkCombat(): void {
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (!enemy.alive) continue;

      // Check collision with player
      if (this.player.x < enemy.x + enemy.width &&
          this.player.x + this.player.width > enemy.x &&
          this.player.y < enemy.y + enemy.height &&
          this.player.y + this.player.height > enemy.y) {
        
        // Determine winner based on relative height
        if (this.player.y + this.player.height / 2 < enemy.y + enemy.height / 2) {
          // Player wins - enemy becomes egg
          enemy.alive = false;
          this.eggs.push({
            x: enemy.x,
            y: enemy.y,
            width: 12,
            height: 10,
            timer: 300, // 5 seconds at 60fps
            active: true
          });
          this.score += enemy.type === 'buzzard' ? 500 : enemy.type === 'shadow' ? 1000 : 750;
        } else {
          // Player loses a life
          this.lives--;
          if (this.lives <= 0) {
            this.gameState = 'gameOver';
          } else {
            // Respawn player
            this.player.x = this.config.width / 2;
            this.player.y = this.config.height - 150;
            this.player.vx = 0;
            this.player.vy = 0;
          }
        }
      }
    }
  }

  private updateEggs(): void {
    for (let i = this.eggs.length - 1; i >= 0; i--) {
      const egg = this.eggs[i];
      egg.timer--;

      // Check if player collects egg
      if (this.player.x < egg.x + egg.width &&
          this.player.x + this.player.width > egg.x &&
          this.player.y < egg.y + egg.height &&
          this.player.y + this.player.height > egg.y) {
        this.score += 250;
        this.eggs.splice(i, 1);
        continue;
      }

      // Egg times out and respawns enemy
      if (egg.timer <= 0) {
        const types: Enemy['type'][] = ['hunter', 'shadow', 'buzzard'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.enemies.push({
          x: egg.x,
          y: egg.y,
          vx: 0,
          vy: 0,
          width: 18,
          height: 14,
          type: type,
          onGround: false,
          alive: true,
          color: type === 'hunter' ? '#FF4444' : type === 'shadow' ? '#444444' : '#8B4513',
          speed: type === 'hunter' ? 1.5 : type === 'shadow' ? 2.0 : 1.0
        });
        
        this.eggs.splice(i, 1);
      }
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    this.updatePlayer();
    this.updateEnemies();
    this.checkCombat();
    this.updateEggs();

    // Check for wave completion
    const aliveEnemies = this.enemies.filter(e => e.alive).length;
    if (aliveEnemies === 0 && this.eggs.length === 0) {
      this.gameState = 'levelComplete';
    }
  }

  protected render(): void {
    // Sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#DDA0DD');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw platforms
    this.ctx.fillStyle = '#8B4513';
    for (const platform of this.platforms) {
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Platform highlight
      this.ctx.fillStyle = '#D2691E';
      this.ctx.fillRect(platform.x, platform.y, platform.width, 3);
      this.ctx.fillStyle = '#8B4513';
    }

    // Draw ground
    this.ctx.fillStyle = '#228B22';
    this.ctx.fillRect(0, this.config.height - 20, this.config.width, 20);

    // Draw player
    this.ctx.fillStyle = '#0000FF';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Player wings
    if (this.player.flapping || !this.player.onGround) {
      this.ctx.fillStyle = '#ADD8E6';
      const wingOffset = this.player.facing === 'right' ? 2 : -6;
      this.ctx.fillRect(this.player.x + wingOffset, this.player.y - 2, 8, 4);
      this.ctx.fillRect(this.player.x + wingOffset, this.player.y + this.player.height - 2, 8, 4);
    }

    // Player rider
    this.ctx.fillStyle = '#FFB6C1';
    this.ctx.fillRect(this.player.x + 6, this.player.y - 4, 8, 8);

    // Draw enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      this.ctx.fillStyle = enemy.color;
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      // Enemy wings
      this.ctx.fillStyle = '#696969';
      this.ctx.fillRect(enemy.x - 2, enemy.y - 1, 6, 3);
      this.ctx.fillRect(enemy.x + enemy.width - 4, enemy.y - 1, 6, 3);
      
      // Enemy rider
      this.ctx.fillStyle = '#800080';
      this.ctx.fillRect(enemy.x + 5, enemy.y - 3, 6, 6);
    }

    // Draw eggs
    this.ctx.fillStyle = '#FFFACD';
    for (const egg of this.eggs) {
      this.ctx.beginPath();
      this.ctx.ellipse(
        egg.x + egg.width / 2, 
        egg.y + egg.height / 2, 
        egg.width / 2, 
        egg.height / 2, 
        0, 0, Math.PI * 2
      );
      this.ctx.fill();
      
      // Egg spots
      this.ctx.fillStyle = '#DDD';
      this.ctx.beginPath();
      this.ctx.arc(egg.x + 3, egg.y + 3, 1, 0, Math.PI * 2);
      this.ctx.arc(egg.x + 8, egg.y + 6, 1, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#FFFACD';
    }

    // UI
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
    this.ctx.fillText(`Level: ${this.level}`, 10, 65);

    if (this.gameState === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
      
      this.ctx.textAlign = 'left';
    } else if (this.gameState === 'levelComplete') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#00FF00';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Wave Complete!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.fillText('Press SPACE or tap for next wave', this.config.width / 2, this.config.height / 2 + 50);
      
      this.ctx.textAlign = 'left';
    } else if (this.score === 0) {
      // Instructions
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(20, 100, this.config.width - 40, 120);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Fly on your ostrich and battle enemies!', this.config.width / 2, 125);
      this.ctx.fillText('Hit enemies from above to defeat them', this.config.width / 2, 145);
      this.ctx.fillText('Move: A/D or ←/→', this.config.width / 2, 165);
      this.ctx.fillText('Flap: Space or tap', this.config.width / 2, 185);
      this.ctx.fillText('Collect eggs for bonus points!', this.config.width / 2, 205);
      
      this.ctx.textAlign = 'left';
    }
  }
}