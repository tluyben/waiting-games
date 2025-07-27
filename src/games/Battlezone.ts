import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Tank {
  x: number;
  y: number;
  angle: number;
  turretAngle: number;
  speed: number;
  health: number;
}

interface Enemy {
  x: number;
  y: number;
  angle: number;
  type: 'tank' | 'ufo';
  health: number;
  lastShot: number;
  color: string;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  active: boolean;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'block' | 'pyramid';
}

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export class Battlezone extends GameEngine {
  private player: Tank;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private obstacles: Obstacle[] = [];
  private score = 0;
  private lives = 3;
  private gameState: 'playing' | 'gameOver' = 'playing';
  private radar: { enemies: Point[], obstacles: Point[] } = { enemies: [], obstacles: [] };
  private crosshair = { x: 0, y: 0 };
  private camera = { x: 0, y: 0, angle: 0, height: 10 };
  private horizon = 150;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const battlezoneConfig = {
      ...config,
      width: config.width || 600,
      height: config.height || 400
    };
    super(container, battlezoneConfig);
    this.initGame();
  }

  private initGame(): void {
    this.player = {
      x: 0,
      y: 0,
      angle: 0,
      turretAngle: 0,
      speed: 2,
      health: 100
    };

    this.enemies = [];
    this.projectiles = [];
    this.obstacles = [];
    this.score = 0;
    this.lives = 3;
    this.gameState = 'playing';
    
    this.crosshair = { x: this.config.width / 2, y: this.config.height / 2 - 50 };
    this.camera = { x: 0, y: 0, angle: 0, height: 10 };
    
    this.generateWorld();
    this.spawnEnemyWave();
  }

  private generateWorld(): void {
    // Generate random obstacles
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 300;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      this.obstacles.push({
        x: x,
        y: y,
        width: 20 + Math.random() * 20,
        height: 10 + Math.random() * 20,
        type: Math.random() < 0.7 ? 'block' : 'pyramid'
      });
    }
  }

  private spawnEnemyWave(): void {
    const enemyCount = 2 + Math.floor(this.score / 1000);
    
    for (let i = 0; i < enemyCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 200;
      const x = this.player.x + Math.cos(angle) * distance;
      const y = this.player.y + Math.sin(angle) * distance;
      
      this.enemies.push({
        x: x,
        y: y,
        angle: Math.random() * Math.PI * 2,
        type: Math.random() < 0.8 ? 'tank' : 'ufo',
        health: 1,
        lastShot: 0,
        color: Math.random() < 0.5 ? '#FF0000' : '#00FF00'
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

    if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.shoot();
    }
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
    
    // Upper area - shoot
    if (y < this.config.height * 0.6) {
      this.shoot();
    } else {
      // Lower area - movement
      const centerX = this.config.width / 2;
      if (x < centerX - 100) {
        // Turn left
        this.player.angle -= 0.2;
        this.player.turretAngle -= 0.2;
      } else if (x > centerX + 100) {
        // Turn right
        this.player.angle += 0.2;
        this.player.turretAngle += 0.2;
      } else {
        // Move forward
        this.player.x += Math.cos(this.player.angle) * this.player.speed;
        this.player.y += Math.sin(this.player.angle) * this.player.speed;
      }
    }
  }

  private shoot(): void {
    this.projectiles.push({
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(this.player.turretAngle) * 8,
      vy: Math.sin(this.player.turretAngle) * 8,
      fromPlayer: true,
      active: true
    });
  }

  private updatePlayer(): void {
    // Tank controls
    if (this.config.useKeyboard) {
      if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W']) {
        this.player.x += Math.cos(this.player.angle) * this.player.speed;
        this.player.y += Math.sin(this.player.angle) * this.player.speed;
      }
      if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S']) {
        this.player.x -= Math.cos(this.player.angle) * this.player.speed * 0.5;
        this.player.y -= Math.sin(this.player.angle) * this.player.speed * 0.5;
      }
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
        this.player.angle -= 0.1;
        this.player.turretAngle -= 0.1;
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
        this.player.angle += 0.1;
        this.player.turretAngle += 0.1;
      }
    }

    // Update camera to follow player
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.camera.angle = this.player.angle;
  }

  private updateEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Simple AI: move toward player and shoot occasionally
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const targetAngle = Math.atan2(dy, dx);
      
      if (distance > 50) {
        // Move toward player
        enemy.x += Math.cos(targetAngle) * 1;
        enemy.y += Math.sin(targetAngle) * 1;
        enemy.angle = targetAngle;
      }
      
      // Shoot at player occasionally
      enemy.lastShot++;
      if (enemy.lastShot > 120 && distance < 200) {
        this.projectiles.push({
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(targetAngle) * 4,
          vy: Math.sin(targetAngle) * 4,
          fromPlayer: false,
          active: true
        });
        enemy.lastShot = 0;
      }
      
      // Remove dead enemies
      if (enemy.health <= 0) {
        this.score += enemy.type === 'ufo' ? 1000 : 500;
        this.enemies.splice(i, 1);
      }
    }
    
    // Spawn new wave if all enemies defeated
    if (this.enemies.length === 0) {
      this.spawnEnemyWave();
    }
  }

  private updateProjectiles(): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      
      proj.x += proj.vx;
      proj.y += proj.vy;
      
      // Check collision with enemies (player projectiles only)
      if (proj.fromPlayer) {
        for (const enemy of this.enemies) {
          const dx = proj.x - enemy.x;
          const dy = proj.y - enemy.y;
          if (Math.sqrt(dx * dx + dy * dy) < 15) {
            enemy.health--;
            this.projectiles.splice(i, 1);
            break;
          }
        }
      } else {
        // Check collision with player (enemy projectiles)
        const dx = proj.x - this.player.x;
        const dy = proj.y - this.player.y;
        if (Math.sqrt(dx * dx + dy * dy) < 15) {
          this.player.health -= 20;
          this.projectiles.splice(i, 1);
          
          if (this.player.health <= 0) {
            this.lives--;
            if (this.lives <= 0) {
              this.gameState = 'gameOver';
            } else {
              this.player.health = 100;
            }
          }
        }
      }
      
      // Remove projectiles that are too far
      if (Math.abs(proj.x - this.camera.x) > 500 || Math.abs(proj.y - this.camera.y) > 500) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateRadar(): void {
    this.radar.enemies = this.enemies.map(enemy => ({
      x: enemy.x - this.camera.x,
      y: enemy.y - this.camera.y
    }));
    
    this.radar.obstacles = this.obstacles.map(obstacle => ({
      x: obstacle.x - this.camera.x,
      y: obstacle.y - this.camera.y
    }));
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    this.updatePlayer();
    this.updateEnemies();
    this.updateProjectiles();
    this.updateRadar();
  }

  private project3D(x: number, y: number, z: number): Point {
    // Transform world coordinates to camera coordinates
    const dx = x - this.camera.x;
    const dy = y - this.camera.y;
    
    // Rotate by camera angle
    const cos = Math.cos(-this.camera.angle);
    const sin = Math.sin(-this.camera.angle);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    
    // Project to screen
    if (ry <= 0) return { x: -1000, y: -1000 }; // Behind camera
    
    const scale = 200 / ry;
    const screenX = this.config.width / 2 + rx * scale;
    const screenY = this.horizon - (z - this.camera.height) * scale;
    
    return { x: screenX, y: screenY };
  }

  protected render(): void {
    // Sky
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.horizon);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#003366');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.width, this.horizon);
    
    // Ground
    this.ctx.fillStyle = '#2F4F2F';
    this.ctx.fillRect(0, this.horizon, this.config.width, this.config.height - this.horizon);
    
    // Grid lines on ground
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    
    for (let i = -10; i <= 10; i++) {
      // Vertical lines
      const start = this.project3D(i * 50, 0, 0);
      const end = this.project3D(i * 50, 500, 0);
      if (start.x >= 0 && start.x <= this.config.width) {
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
      }
      
      // Horizontal lines
      const hStart = this.project3D(-500, i * 50, 0);
      const hEnd = this.project3D(500, i * 50, 0);
      if (i * 50 > 0) {
        this.ctx.moveTo(hStart.x, hStart.y);
        this.ctx.lineTo(hEnd.x, hEnd.y);
      }
    }
    this.ctx.stroke();

    // Draw obstacles
    this.ctx.fillStyle = '#666666';
    for (const obstacle of this.obstacles) {
      const base1 = this.project3D(obstacle.x - obstacle.width/2, obstacle.y - obstacle.width/2, 0);
      const base2 = this.project3D(obstacle.x + obstacle.width/2, obstacle.y - obstacle.width/2, 0);
      const base3 = this.project3D(obstacle.x + obstacle.width/2, obstacle.y + obstacle.width/2, 0);
      const base4 = this.project3D(obstacle.x - obstacle.width/2, obstacle.y + obstacle.width/2, 0);
      const top1 = this.project3D(obstacle.x - obstacle.width/2, obstacle.y - obstacle.width/2, obstacle.height);
      const top2 = this.project3D(obstacle.x + obstacle.width/2, obstacle.y - obstacle.width/2, obstacle.height);
      const top3 = this.project3D(obstacle.x + obstacle.width/2, obstacle.y + obstacle.width/2, obstacle.height);
      const top4 = this.project3D(obstacle.x - obstacle.width/2, obstacle.y + obstacle.width/2, obstacle.height);
      
      // Only draw if visible
      if (base1.x > -100 && base1.x < this.config.width + 100) {
        this.ctx.beginPath();
        this.ctx.moveTo(base1.x, base1.y);
        this.ctx.lineTo(base2.x, base2.y);
        this.ctx.lineTo(top2.x, top2.y);
        this.ctx.lineTo(top1.x, top1.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.stroke();
      }
    }

    // Draw enemies
    for (const enemy of this.enemies) {
      const pos = this.project3D(enemy.x, enemy.y, 5);
      if (pos.x > 0 && pos.x < this.config.width && pos.y > 0 && pos.y < this.config.height) {
        this.ctx.fillStyle = enemy.color;
        this.ctx.fillRect(pos.x - 8, pos.y - 8, 16, 16);
        
        // Tank turret
        if (enemy.type === 'tank') {
          const turretEnd = this.project3D(
            enemy.x + Math.cos(enemy.angle) * 15,
            enemy.y + Math.sin(enemy.angle) * 15,
            5
          );
          this.ctx.strokeStyle = enemy.color;
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.moveTo(pos.x, pos.y);
          this.ctx.lineTo(turretEnd.x, turretEnd.y);
          this.ctx.stroke();
        }
      }
    }

    // Draw projectiles
    this.ctx.fillStyle = '#FFFF00';
    for (const proj of this.projectiles) {
      const pos = this.project3D(proj.x, proj.y, 2);
      if (pos.x > 0 && pos.x < this.config.width && pos.y > 0 && pos.y < this.config.height) {
        this.ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
      }
    }

    // Crosshair
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.crosshair.x - 10, this.crosshair.y);
    this.ctx.lineTo(this.crosshair.x + 10, this.crosshair.y);
    this.ctx.moveTo(this.crosshair.x, this.crosshair.y - 10);
    this.ctx.lineTo(this.crosshair.x, this.crosshair.y + 10);
    this.ctx.stroke();

    // Radar display
    const radarSize = 80;
    const radarX = this.config.width - radarSize - 10;
    const radarY = 10;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(radarX, radarY, radarSize, radarSize);
    this.ctx.strokeStyle = '#00FF00';
    this.ctx.strokeRect(radarX, radarY, radarSize, radarSize);
    
    // Radar center (player)
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(radarX + radarSize/2 - 2, radarY + radarSize/2 - 2, 4, 4);
    
    // Radar enemies
    this.ctx.fillStyle = '#FF0000';
    for (const enemy of this.radar.enemies) {
      const rx = radarX + radarSize/2 + (enemy.x / 10);
      const ry = radarY + radarSize/2 + (enemy.y / 10);
      if (rx >= radarX && rx <= radarX + radarSize && ry >= radarY && ry <= radarY + radarSize) {
        this.ctx.fillRect(rx - 1, ry - 1, 2, 2);
      }
    }

    // HUD
    this.ctx.fillStyle = '#00FF00';
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 10, 25);
    this.ctx.fillText(`LIVES: ${this.lives}`, 10, 45);
    
    // Health bar
    const healthWidth = 100;
    const healthHeight = 10;
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(10, 55, healthWidth, healthHeight);
    this.ctx.fillStyle = this.player.health > 50 ? '#00FF00' : this.player.health > 25 ? '#FFFF00' : '#FF0000';
    this.ctx.fillRect(10, 55, (healthWidth * this.player.health) / 100, healthHeight);

    if (this.gameState === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
      
      this.ctx.textAlign = 'left';
    } else if (this.score === 0) {
      // Instructions
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(20, this.config.height - 140, this.config.width - 40, 120);
      
      this.ctx.fillStyle = '#00FF00';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('3D tank combat! Destroy enemy tanks and UFOs', this.config.width / 2, this.config.height - 115);
      this.ctx.fillText('Move: WASD or arrows', this.config.width / 2, this.config.height - 95);
      this.ctx.fillText('Shoot: Space or tap', this.config.width / 2, this.config.height - 75);
      this.ctx.fillText('Use radar to track enemies', this.config.width / 2, this.config.height - 55);
      this.ctx.fillText('Watch your health!', this.config.width / 2, this.config.height - 35);
      
      this.ctx.textAlign = 'left';
    }
  }
}