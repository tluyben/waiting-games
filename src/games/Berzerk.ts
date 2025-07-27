import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  shootCooldown: number;
  facing: 'up' | 'down' | 'left' | 'right';
}

interface Robot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  shootCooldown: number;
  lastPlayerSeen: Point | null;
  color: string;
  type: 'grunt' | 'hulk' | 'brain';
  speed: number;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  active: boolean;
  trail: Point[];
}

interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
  destructible: boolean;
}

interface Exit {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

export class Berzerk extends GameEngine {
  private player: Player;
  private robots: Robot[] = [];
  private bullets: Bullet[] = [];
  private walls: Wall[] = [];
  private exits: Exit[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private gameState: 'playing' | 'gameOver' | 'levelComplete' = 'playing';
  private roomWidth = 480;
  private roomHeight = 320;
  private cellSize = 20;
  private evilOtto = { active: false, x: 0, y: 0, timer: 0 };

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const berzerkConfig = {
      ...config,
      width: config.width || 520,
      height: config.height || 360
    };
    super(container, berzerkConfig);
    this.initGame();
  }

  private initGame(): void {
    this.player = {
      x: this.config.width / 2,
      y: this.config.height - 40,
      vx: 0,
      vy: 0,
      width: 12,
      height: 12,
      shootCooldown: 0,
      facing: 'up'
    };

    this.robots = [];
    this.bullets = [];
    this.walls = [];
    this.exits = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameState = 'playing';
    this.evilOtto = { active: false, x: 0, y: 0, timer: 0 };
    
    this.generateRoom();
  }

  private generateRoom(): void {
    this.walls = [];
    this.robots = [];
    this.exits = [];
    
    const margin = 20;
    
    // Create outer walls
    this.walls.push(
      // Top wall
      { x: 0, y: 0, width: this.config.width, height: margin, destructible: false },
      // Bottom wall  
      { x: 0, y: this.config.height - margin, width: this.config.width, height: margin, destructible: false },
      // Left wall
      { x: 0, y: 0, width: margin, height: this.config.height, destructible: false },
      // Right wall
      { x: this.config.width - margin, y: 0, width: margin, height: this.config.height, destructible: false }
    );

    // Create exits
    this.exits.push(
      { x: this.config.width / 2 - 30, y: -5, width: 60, height: 10, direction: 'up' },
      { x: this.config.width / 2 - 30, y: this.config.height - 5, width: 60, height: 10, direction: 'down' },
      { x: -5, y: this.config.height / 2 - 30, width: 10, height: 60, direction: 'left' },
      { x: this.config.width - 5, y: this.config.height / 2 - 30, width: 10, height: 60, direction: 'right' }
    );

    // Generate maze walls
    for (let i = 0; i < 8 + this.level; i++) {
      const x = margin + Math.random() * (this.config.width - margin * 2 - 60);
      const y = margin + Math.random() * (this.config.height - margin * 2 - 60);
      const width = 20 + Math.random() * 40;
      const height = 20 + Math.random() * 40;
      
      this.walls.push({
        x: x,
        y: y,
        width: width,
        height: height,
        destructible: Math.random() < 0.7
      });
    }

    // Spawn robots
    const robotCount = 3 + Math.floor(this.level / 2);
    for (let i = 0; i < robotCount; i++) {
      let attempts = 0;
      let validPosition = false;
      let x, y;
      
      do {
        x = margin + Math.random() * (this.config.width - margin * 2);
        y = margin + Math.random() * (this.config.height - margin * 2);
        
        // Check if position is clear
        validPosition = !this.checkWallCollision(x, y, 15, 15) &&
                       Math.sqrt(Math.pow(x - this.player.x, 2) + Math.pow(y - this.player.y, 2)) > 100;
        attempts++;
      } while (!validPosition && attempts < 50);
      
      if (validPosition) {
        const types: Robot['type'][] = ['grunt', 'hulk', 'brain'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let color: string;
        let speed: number;
        let health: number;
        
        switch (type) {
          case 'grunt':
            color = '#00FF00';
            speed = 1;
            health = 1;
            break;
          case 'hulk':
            color = '#FF0000';
            speed = 0.5;
            health = 3;
            break;
          case 'brain':
            color = '#FFFF00';
            speed = 1.5;
            health = 1;
            break;
        }
        
        this.robots.push({
          x: x!,
          y: y!,
          vx: 0,
          vy: 0,
          width: 15,
          height: 15,
          health: health,
          shootCooldown: 0,
          lastPlayerSeen: null,
          color: color,
          type: type,
          speed: speed
        });
      }
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
        this.generateRoom();
        this.gameState = 'playing';
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

    if (this.gameState === 'levelComplete') {
      this.level++;
      this.generateRoom();
      this.gameState = 'playing';
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;
    
    const deltaX = x - playerCenterX;
    const deltaY = y - playerCenterY;
    
    // Determine direction and action
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        this.player.facing = 'right';
        this.player.vx = 2;
        this.player.vy = 0;
      } else {
        this.player.facing = 'left';
        this.player.vx = -2;
        this.player.vy = 0;
      }
    } else {
      if (deltaY > 0) {
        this.player.facing = 'down';
        this.player.vx = 0;
        this.player.vy = 2;
      } else {
        this.player.facing = 'up';
        this.player.vx = 0;
        this.player.vy = -2;
      }
    }
    
    // Shoot if close to player
    if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) < 50) {
      this.shoot();
    }
  }

  protected handleTouchEnd(event: TouchEvent): void {
    super.handleTouchEnd(event);
    this.player.vx = 0;
    this.player.vy = 0;
  }

  private shoot(): void {
    if (this.player.shootCooldown > 0) return;
    
    let vx = 0, vy = 0;
    
    switch (this.player.facing) {
      case 'up':
        vy = -6;
        break;
      case 'down':
        vy = 6;
        break;
      case 'left':
        vx = -6;
        break;
      case 'right':
        vx = 6;
        break;
    }
    
    this.bullets.push({
      x: this.player.x + this.player.width / 2,
      y: this.player.y + this.player.height / 2,
      vx: vx,
      vy: vy,
      fromPlayer: true,
      active: true,
      trail: []
    });
    
    this.player.shootCooldown = 15;
  }

  private checkWallCollision(x: number, y: number, width: number, height: number): Wall | null {
    for (const wall of this.walls) {
      if (x < wall.x + wall.width &&
          x + width > wall.x &&
          y < wall.y + wall.height &&
          y + height > wall.y) {
        return wall;
      }
    }
    return null;
  }

  private hasLineOfSight(from: Point, to: Point): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(distance / 5);
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const checkX = from.x + dx * t;
      const checkY = from.y + dy * t;
      
      if (this.checkWallCollision(checkX, checkY, 1, 1)) {
        return false;
      }
    }
    return true;
  }

  private updatePlayer(): void {
    // Movement
    if (this.config.useKeyboard) {
      this.player.vx = 0;
      this.player.vy = 0;
      
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
        this.player.vx = -2;
        this.player.facing = 'left';
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
        this.player.vx = 2;
        this.player.facing = 'right';
      }
      if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W']) {
        this.player.vy = -2;
        this.player.facing = 'up';
      }
      if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S']) {
        this.player.vy = 2;
        this.player.facing = 'down';
      }
    }

    // Apply movement with collision detection
    const newX = this.player.x + this.player.vx;
    const newY = this.player.y + this.player.vy;
    
    if (!this.checkWallCollision(newX, this.player.y, this.player.width, this.player.height)) {
      this.player.x = newX;
    }
    if (!this.checkWallCollision(this.player.x, newY, this.player.width, this.player.height)) {
      this.player.y = newY;
    }

    // Check exit collisions
    for (const exit of this.exits) {
      if (this.player.x < exit.x + exit.width &&
          this.player.x + this.player.width > exit.x &&
          this.player.y < exit.y + exit.height &&
          this.player.y + this.player.height > exit.y) {
        
        if (this.robots.length === 0) {
          this.gameState = 'levelComplete';
        } else {
          // Move to new room (just regenerate for now)
          this.generateRoom();
          this.player.x = this.config.width / 2;
          this.player.y = this.config.height / 2;
        }
        break;
      }
    }

    this.player.shootCooldown = Math.max(0, this.player.shootCooldown - 1);
  }

  private updateRobots(): void {
    for (let i = this.robots.length - 1; i >= 0; i--) {
      const robot = this.robots[i];
      
      if (robot.health <= 0) {
        this.score += robot.type === 'brain' ? 500 : robot.type === 'hulk' ? 200 : 100;
        this.robots.splice(i, 1);
        continue;
      }

      const playerCenter = {
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2
      };
      
      const robotCenter = {
        x: robot.x + robot.width / 2,
        y: robot.y + robot.height / 2
      };

      // Check line of sight to player
      if (this.hasLineOfSight(robotCenter, playerCenter)) {
        robot.lastPlayerSeen = { ...playerCenter };
        
        // Shoot at player occasionally
        robot.shootCooldown--;
        if (robot.shootCooldown <= 0) {
          const dx = playerCenter.x - robotCenter.x;
          const dy = playerCenter.y - robotCenter.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          this.bullets.push({
            x: robotCenter.x,
            y: robotCenter.y,
            vx: (dx / distance) * 4,
            vy: (dy / distance) * 4,
            fromPlayer: false,
            active: true,
            trail: []
          });
          
          robot.shootCooldown = 60 + Math.random() * 60;
        }
      }

      // AI Movement
      let targetX = robotCenter.x;
      let targetY = robotCenter.y;
      
      if (robot.lastPlayerSeen) {
        targetX = robot.lastPlayerSeen.x;
        targetY = robot.lastPlayerSeen.y;
      }

      const dx = targetX - robotCenter.x;
      const dy = targetY - robotCenter.y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        robot.vx = dx > 0 ? robot.speed : -robot.speed;
        robot.vy = 0;
      } else {
        robot.vx = 0;
        robot.vy = dy > 0 ? robot.speed : -robot.speed;
      }

      // Apply movement with collision detection
      const newX = robot.x + robot.vx;
      const newY = robot.y + robot.vy;
      
      if (!this.checkWallCollision(newX, robot.y, robot.width, robot.height)) {
        robot.x = newX;
      } else {
        robot.vx = 0;
      }
      
      if (!this.checkWallCollision(robot.x, newY, robot.width, robot.height)) {
        robot.y = newY;
      } else {
        robot.vy = 0;
      }

      // Check collision with player
      if (this.player.x < robot.x + robot.width &&
          this.player.x + this.player.width > robot.x &&
          this.player.y < robot.y + robot.height &&
          this.player.y + this.player.height > robot.y) {
        
        this.lives--;
        if (this.lives <= 0) {
          this.gameState = 'gameOver';
        } else {
          // Respawn player
          this.player.x = this.config.width / 2;
          this.player.y = this.config.height - 40;
        }
      }
    }

    // Spawn Evil Otto if robots take too long
    if (this.robots.length > 0) {
      this.evilOtto.timer++;
      if (this.evilOtto.timer > 1800 && !this.evilOtto.active) { // 30 seconds
        this.evilOtto.active = true;
        this.evilOtto.x = 0;
        this.evilOtto.y = this.config.height / 2;
      }
    } else {
      this.evilOtto.active = false;
      this.evilOtto.timer = 0;
    }

    // Update Evil Otto
    if (this.evilOtto.active) {
      const dx = this.player.x - this.evilOtto.x;
      const dy = this.player.y - this.evilOtto.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      this.evilOtto.x += (dx / distance) * 3;
      this.evilOtto.y += (dy / distance) * 3;
      
      // Check collision with player
      if (Math.sqrt(Math.pow(this.player.x - this.evilOtto.x, 2) + Math.pow(this.player.y - this.evilOtto.y, 2)) < 20) {
        this.lives--;
        if (this.lives <= 0) {
          this.gameState = 'gameOver';
        }
      }
    }
  }

  private updateBullets(): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      
      // Add to trail
      bullet.trail.push({ x: bullet.x, y: bullet.y });
      if (bullet.trail.length > 5) {
        bullet.trail.shift();
      }

      // Check wall collisions
      const hitWall = this.checkWallCollision(bullet.x, bullet.y, 2, 2);
      if (hitWall) {
        if (hitWall.destructible) {
          // Remove wall
          const wallIndex = this.walls.indexOf(hitWall);
          if (wallIndex > -1) {
            this.walls.splice(wallIndex, 1);
            if (bullet.fromPlayer) {
              this.score += 10;
            }
          }
        }
        this.bullets.splice(i, 1);
        continue;
      }

      // Check robot collisions (player bullets only)
      if (bullet.fromPlayer) {
        for (const robot of this.robots) {
          if (bullet.x >= robot.x && bullet.x <= robot.x + robot.width &&
              bullet.y >= robot.y && bullet.y <= robot.y + robot.height) {
            robot.health--;
            this.bullets.splice(i, 1);
            break;
          }
        }
      } else {
        // Check player collision (robot bullets)
        if (bullet.x >= this.player.x && bullet.x <= this.player.x + this.player.width &&
            bullet.y >= this.player.y && bullet.y <= this.player.y + this.player.height) {
          this.lives--;
          if (this.lives <= 0) {
            this.gameState = 'gameOver';
          }
          this.bullets.splice(i, 1);
        }
      }

      // Remove bullets that go off screen
      if (bullet.x < 0 || bullet.x > this.config.width || 
          bullet.y < 0 || bullet.y > this.config.height) {
        this.bullets.splice(i, 1);
      }
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    this.updatePlayer();
    this.updateRobots();
    this.updateBullets();

    // Check win condition
    if (this.robots.length === 0 && !this.evilOtto.active) {
      this.gameState = 'levelComplete';
    }
  }

  protected render(): void {
    // Black background
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw walls
    for (const wall of this.walls) {
      this.ctx.fillStyle = wall.destructible ? '#FFFF00' : '#FFFFFF';
      this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    }

    // Draw exits
    this.ctx.fillStyle = '#00FFFF';
    for (const exit of this.exits) {
      this.ctx.fillRect(exit.x, exit.y, exit.width, exit.height);
    }

    // Draw player
    this.ctx.fillStyle = '#00FF00';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Player direction indicator
    this.ctx.fillStyle = '#FFFFFF';
    let dirX = this.player.x + this.player.width / 2;
    let dirY = this.player.y + this.player.height / 2;
    
    switch (this.player.facing) {
      case 'up':
        dirY -= 8;
        break;
      case 'down':
        dirY += 8;
        break;
      case 'left':
        dirX -= 8;
        break;
      case 'right':
        dirX += 8;
        break;
    }
    this.ctx.fillRect(dirX - 1, dirY - 1, 2, 2);

    // Draw robots
    for (const robot of this.robots) {
      this.ctx.fillStyle = robot.color;
      this.ctx.fillRect(robot.x, robot.y, robot.width, robot.height);
      
      // Robot eyes
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(robot.x + 3, robot.y + 3, 2, 2);
      this.ctx.fillRect(robot.x + robot.width - 5, robot.y + 3, 2, 2);
    }

    // Draw Evil Otto
    if (this.evilOtto.active) {
      this.ctx.fillStyle = '#FF00FF';
      this.ctx.beginPath();
      this.ctx.arc(this.evilOtto.x, this.evilOtto.y, 15, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Otto's smile
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(this.evilOtto.x - 5, this.evilOtto.y - 5, 2, 2);
      this.ctx.fillRect(this.evilOtto.x + 3, this.evilOtto.y - 5, 2, 2);
      this.ctx.fillRect(this.evilOtto.x - 8, this.evilOtto.y + 3, 16, 2);
    }

    // Draw bullets with trails
    for (const bullet of this.bullets) {
      // Trail
      this.ctx.strokeStyle = bullet.fromPlayer ? '#00FF00' : '#FF0000';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      
      for (let i = 0; i < bullet.trail.length - 1; i++) {
        const point = bullet.trail[i];
        const nextPoint = bullet.trail[i + 1];
        this.ctx.moveTo(point.x, point.y);
        this.ctx.lineTo(nextPoint.x, nextPoint.y);
      }
      this.ctx.stroke();
      
      // Bullet
      this.ctx.fillStyle = bullet.fromPlayer ? '#FFFFFF' : '#FF0000';
      this.ctx.fillRect(bullet.x - 1, bullet.y - 1, 3, 3);
    }

    // HUD
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`SCORE: ${this.score}`, 10, 25);
    this.ctx.fillText(`LIVES: ${this.lives}`, 10, 45);
    this.ctx.fillText(`LEVEL: ${this.level}`, 10, 65);
    this.ctx.fillText(`ROBOTS: ${this.robots.length}`, 10, 85);

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
    } else if (this.gameState === 'levelComplete') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#00FF00';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('ROOM CLEAR!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.fillText('Press SPACE or tap for next level', this.config.width / 2, this.config.height / 2 + 50);
      
      this.ctx.textAlign = 'left';
    } else if (this.score === 0) {
      // Instructions
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(20, this.config.height - 140, this.config.width - 40, 120);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Destroy all robots in the maze!', this.config.width / 2, this.config.height - 115);
      this.ctx.fillText('Move: WASD or arrows', this.config.width / 2, this.config.height - 95);
      this.ctx.fillText('Shoot: Space or tap', this.config.width / 2, this.config.height - 75);
      this.ctx.fillText('Exit through doors when room is clear', this.config.width / 2, this.config.height - 55);
      this.ctx.fillText('Beware of Evil Otto!', this.config.width / 2, this.config.height - 35);
      
      this.ctx.textAlign = 'left';
    }
  }
}