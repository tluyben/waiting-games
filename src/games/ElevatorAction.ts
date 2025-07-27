import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  floor: number;
  inElevator: boolean;
  facing: 'left' | 'right';
  shootCooldown: number;
  health: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  floor: number;
  health: number;
  shootCooldown: number;
  color: string;
  type: 'agent' | 'assassin';
  lastPlayerSeen: number;
}

interface Elevator {
  x: number;
  y: number;
  width: number;
  height: number;
  targetFloor: number;
  currentFloor: number;
  moving: boolean;
  speed: number;
}

interface Floor {
  y: number;
  width: number;
  doors: Door[];
}

interface Door {
  x: number;
  y: number;
  width: number;
  height: number;
  open: boolean;
  secret: boolean;
  collected: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  active: boolean;
}

export class ElevatorAction extends GameEngine {
  private player: Player;
  private enemies: Enemy[] = [];
  private elevators: Elevator[] = [];
  private floors: Floor[] = [];
  private bullets: Bullet[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private gameState: 'playing' | 'gameOver' | 'levelComplete' = 'playing';
  private secretDoors = 0;
  private secretsCollected = 0;
  private buildingHeight = 400;
  private floorHeight = 50;
  private numFloors = 8;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const elevatorConfig = {
      ...config,
      width: config.width || 600,
      height: config.height || 400
    };
    super(container, elevatorConfig);
    this.initGame();
  }

  private initGame(): void {
    this.buildingHeight = this.config.height;
    this.floorHeight = this.buildingHeight / this.numFloors;

    this.player = {
      x: 50,
      y: this.buildingHeight - this.floorHeight - 20,
      vx: 0,
      vy: 0,
      width: 12,
      height: 18,
      floor: 0,
      inElevator: false,
      facing: 'right',
      shootCooldown: 0,
      health: 100
    };

    this.enemies = [];
    this.elevators = [];
    this.floors = [];
    this.bullets = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameState = 'playing';
    this.secretsCollected = 0;

    this.generateBuilding();
    this.spawnEnemies();
  }

  private generateBuilding(): void {
    this.floors = [];
    this.secretDoors = 0;

    // Create floors
    for (let i = 0; i < this.numFloors; i++) {
      const floorY = this.buildingHeight - (i + 1) * this.floorHeight;
      const doors: Door[] = [];
      
      // Add secret doors randomly (2-4 per level)
      if (i > 0 && i < this.numFloors - 1 && Math.random() < 0.6) {
        const doorX = 100 + Math.random() * (this.config.width - 200);
        doors.push({
          x: doorX,
          y: floorY,
          width: 20,
          height: this.floorHeight - 10,
          open: false,
          secret: true,
          collected: false
        });
        this.secretDoors++;
      }

      this.floors.push({
        y: floorY,
        width: this.config.width,
        doors: doors
      });
    }

    // Create elevators
    this.elevators = [];
    const elevatorPositions = [150, this.config.width / 2, this.config.width - 150];
    
    for (const x of elevatorPositions) {
      this.elevators.push({
        x: x,
        y: this.buildingHeight - this.floorHeight,
        width: 30,
        height: this.floorHeight - 10,
        targetFloor: 0,
        currentFloor: 0,
        moving: false,
        speed: 2
      });
    }
  }

  private spawnEnemies(): void {
    const enemyCount = 3 + this.level;
    
    for (let i = 0; i < enemyCount; i++) {
      const floor = 1 + Math.floor(Math.random() * (this.numFloors - 2));
      const x = 50 + Math.random() * (this.config.width - 100);
      const type: Enemy['type'] = Math.random() < 0.7 ? 'agent' : 'assassin';
      
      this.enemies.push({
        x: x,
        y: this.buildingHeight - (floor + 1) * this.floorHeight - 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        width: 12,
        height: 18,
        floor: floor,
        health: type === 'assassin' ? 2 : 1,
        shootCooldown: 0,
        color: type === 'assassin' ? '#8B0000' : '#FF4500',
        type: type,
        lastPlayerSeen: 0
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
        this.initGame();
      }
      return;
    }

    if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.shoot();
    }

    if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w') {
      this.useElevator('up');
    }

    if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's') {
      this.useElevator('down');
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
      this.initGame();
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
    
    // Determine action based on touch position
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY < -30) {
        this.useElevator('up');
      } else if (deltaY > 30) {
        this.useElevator('down');
      } else {
        this.shoot();
      }
    } else {
      if (deltaX > 0) {
        this.player.facing = 'right';
        this.player.vx = 2;
      } else {
        this.player.facing = 'left';
        this.player.vx = -2;
      }
    }
  }

  protected handleTouchEnd(event: TouchEvent): void {
    super.handleTouchEnd(event);
    this.player.vx = 0;
  }

  private shoot(): void {
    if (this.player.shootCooldown > 0) return;
    
    const vx = this.player.facing === 'right' ? 6 : -6;
    
    this.bullets.push({
      x: this.player.x + (this.player.facing === 'right' ? this.player.width : 0),
      y: this.player.y + this.player.height / 2,
      vx: vx,
      vy: 0,
      fromPlayer: true,
      active: true
    });
    
    this.player.shootCooldown = 15;
  }

  private useElevator(direction: 'up' | 'down'): void {
    // Find closest elevator
    let closestElevator: Elevator | null = null;
    let closestDistance = Infinity;
    
    for (const elevator of this.elevators) {
      if (Math.abs(elevator.currentFloor - this.player.floor) === 0) {
        const distance = Math.abs(elevator.x + elevator.width / 2 - this.player.x - this.player.width / 2);
        if (distance < closestDistance && distance < 40) {
          closestDistance = distance;
          closestElevator = elevator;
        }
      }
    }
    
    if (closestElevator && !closestElevator.moving) {
      if (direction === 'up' && closestElevator.currentFloor < this.numFloors - 1) {
        closestElevator.targetFloor = closestElevator.currentFloor + 1;
        closestElevator.moving = true;
        this.player.inElevator = true;
      } else if (direction === 'down' && closestElevator.currentFloor > 0) {
        closestElevator.targetFloor = closestElevator.currentFloor - 1;
        closestElevator.moving = true;
        this.player.inElevator = true;
      }
    }
  }

  private updatePlayer(): void {
    // Horizontal movement
    if (this.config.useKeyboard && !this.player.inElevator) {
      this.player.vx = 0;
      
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
        this.player.vx = -2;
        this.player.facing = 'left';
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
        this.player.vx = 2;
        this.player.facing = 'right';
      }
    }

    // Apply movement
    if (!this.player.inElevator) {
      this.player.x += this.player.vx;
      
      // Keep player on current floor
      this.player.y = this.buildingHeight - (this.player.floor + 1) * this.floorHeight - this.player.height;
      
      // Clamp to screen bounds
      this.player.x = Math.max(10, Math.min(this.config.width - this.player.width - 10, this.player.x));
    }

    // Check door interactions
    this.checkDoorInteractions();

    this.player.shootCooldown = Math.max(0, this.player.shootCooldown - 1);
  }

  private checkDoorInteractions(): void {
    const currentFloor = this.floors[this.player.floor];
    
    for (const door of currentFloor.doors) {
      if (this.player.x < door.x + door.width &&
          this.player.x + this.player.width > door.x &&
          Math.abs(this.player.y - door.y) < 30) {
        
        if (door.secret && !door.collected) {
          door.collected = true;
          door.open = true;
          this.secretsCollected++;
          this.score += 500;
        }
      }
    }
  }

  private updateElevators(): void {
    for (const elevator of this.elevators) {
      if (elevator.moving) {
        const targetY = this.buildingHeight - (elevator.targetFloor + 1) * this.floorHeight;
        const dy = targetY - elevator.y;
        
        if (Math.abs(dy) <= elevator.speed) {
          elevator.y = targetY;
          elevator.currentFloor = elevator.targetFloor;
          elevator.moving = false;
          
          // Update player if in elevator
          if (this.player.inElevator) {
            this.player.floor = elevator.currentFloor;
            this.player.y = elevator.y - this.player.height;
            this.player.inElevator = false;
          }
        } else {
          elevator.y += Math.sign(dy) * elevator.speed;
          
          // Move player with elevator
          if (this.player.inElevator) {
            this.player.y += Math.sign(dy) * elevator.speed;
          }
        }
      }
    }
  }

  private updateEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (enemy.health <= 0) {
        this.score += enemy.type === 'assassin' ? 200 : 100;
        this.enemies.splice(i, 1);
        continue;
      }

      // Simple AI - patrol and shoot at player
      enemy.x += enemy.vx;
      
      // Bounce off floor edges
      if (enemy.x <= 10 || enemy.x >= this.config.width - enemy.width - 10) {
        enemy.vx *= -1;
      }

      // Keep enemy on their floor
      enemy.y = this.buildingHeight - (enemy.floor + 1) * this.floorHeight - enemy.height;

      // Check if can see player (same floor)
      if (enemy.floor === this.player.floor) {
        const canSee = Math.abs(enemy.y - this.player.y) < 30;
        
        if (canSee) {
          enemy.lastPlayerSeen = 60; // Remember for 1 second
          
          // Turn toward player
          if (this.player.x > enemy.x) {
            enemy.vx = Math.abs(enemy.vx);
          } else {
            enemy.vx = -Math.abs(enemy.vx);
          }
          
          // Shoot at player
          enemy.shootCooldown--;
          if (enemy.shootCooldown <= 0) {
            const vx = this.player.x > enemy.x ? 4 : -4;
            
            this.bullets.push({
              x: enemy.x + enemy.width / 2,
              y: enemy.y + enemy.height / 2,
              vx: vx,
              vy: 0,
              fromPlayer: false,
              active: true
            });
            
            enemy.shootCooldown = 90 + Math.random() * 60;
          }
        }
      }
      
      enemy.lastPlayerSeen = Math.max(0, enemy.lastPlayerSeen - 1);
    }
  }

  private updateBullets(): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      // Check enemy collisions (player bullets only)
      if (bullet.fromPlayer) {
        for (const enemy of this.enemies) {
          if (bullet.x >= enemy.x && bullet.x <= enemy.x + enemy.width &&
              bullet.y >= enemy.y && bullet.y <= enemy.y + enemy.height) {
            enemy.health--;
            this.bullets.splice(i, 1);
            break;
          }
        }
      } else {
        // Check player collision (enemy bullets)
        if (bullet.x >= this.player.x && bullet.x <= this.player.x + this.player.width &&
            bullet.y >= this.player.y && bullet.y <= this.player.y + this.player.height) {
          this.player.health -= 25;
          this.bullets.splice(i, 1);
          
          if (this.player.health <= 0) {
            this.lives--;
            if (this.lives <= 0) {
              this.gameState = 'gameOver';
            } else {
              this.player.health = 100;
              this.player.x = 50;
              this.player.floor = 0;
              this.player.y = this.buildingHeight - this.floorHeight - this.player.height;
            }
          }
        }
      }

      // Remove bullets that go off screen
      if (bullet.x < 0 || bullet.x > this.config.width) {
        this.bullets.splice(i, 1);
      }
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    this.updatePlayer();
    this.updateElevators();
    this.updateEnemies();
    this.updateBullets();

    // Check win condition
    if (this.secretsCollected >= this.secretDoors && this.player.floor === this.numFloors - 1) {
      this.gameState = 'levelComplete';
    }
  }

  protected render(): void {
    // Building background
    this.ctx.fillStyle = '#2F2F2F';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw floors
    this.ctx.fillStyle = '#8B4513';
    for (let i = 0; i < this.numFloors; i++) {
      const y = this.buildingHeight - (i + 1) * this.floorHeight;
      this.ctx.fillRect(0, y + this.floorHeight - 5, this.config.width, 5);
      
      // Floor number
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`${i + 1}`, 5, y + 15);
      this.ctx.fillStyle = '#8B4513';
    }

    // Draw elevators
    this.ctx.fillStyle = '#696969';
    for (const elevator of this.elevators) {
      this.ctx.fillRect(elevator.x, elevator.y, elevator.width, elevator.height);
      
      // Elevator shaft
      this.ctx.strokeStyle = '#444444';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(elevator.x, 0, elevator.width, this.buildingHeight);
      
      // Elevator doors
      this.ctx.fillStyle = '#C0C0C0';
      this.ctx.fillRect(elevator.x + 2, elevator.y + 2, elevator.width - 4, elevator.height - 4);
    }

    // Draw secret doors
    for (let i = 0; i < this.floors.length; i++) {
      const floor = this.floors[i];
      for (const door of floor.doors) {
        if (door.secret) {
          this.ctx.fillStyle = door.collected ? '#00FF00' : door.open ? '#FFFF00' : '#FF0000';
          this.ctx.fillRect(door.x, door.y, door.width, door.height);
          
          // Door handle
          this.ctx.fillStyle = '#FFD700';
          this.ctx.fillRect(door.x + door.width - 5, door.y + door.height / 2 - 2, 3, 4);
        }
      }
    }

    // Draw enemies
    for (const enemy of this.enemies) {
      this.ctx.fillStyle = enemy.color;
      this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      
      // Enemy face
      this.ctx.fillStyle = '#FFDBAC';
      this.ctx.fillRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, enemy.height / 2);
      
      // Enemy eyes
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(enemy.x + 3, enemy.y + 4, 2, 2);
      this.ctx.fillRect(enemy.x + enemy.width - 5, enemy.y + 4, 2, 2);
    }

    // Draw player
    this.ctx.fillStyle = '#0000FF';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Player face
    this.ctx.fillStyle = '#FFDBAC';
    this.ctx.fillRect(this.player.x + 2, this.player.y + 2, this.player.width - 4, this.player.height / 2);
    
    // Player eyes
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(this.player.x + 3, this.player.y + 4, 2, 2);
    this.ctx.fillRect(this.player.x + this.player.width - 5, this.player.y + 4, 2, 2);

    // Draw bullets
    this.ctx.fillStyle = '#FFFF00';
    for (const bullet of this.bullets) {
      this.ctx.fillStyle = bullet.fromPlayer ? '#00FF00' : '#FF0000';
      this.ctx.fillRect(bullet.x - 1, bullet.y - 1, 3, 2);
    }

    // HUD
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 10, this.config.height - 80);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, this.config.height - 60);
    this.ctx.fillText(`Secrets: ${this.secretsCollected}/${this.secretDoors}`, 10, this.config.height - 40);
    this.ctx.fillText(`Floor: ${this.player.floor + 1}`, 10, this.config.height - 20);

    // Health bar
    const healthWidth = 100;
    const healthHeight = 10;
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(this.config.width - 120, this.config.height - 40, healthWidth, healthHeight);
    this.ctx.fillStyle = this.player.health > 50 ? '#00FF00' : this.player.health > 25 ? '#FFFF00' : '#FF0000';
    this.ctx.fillRect(this.config.width - 120, this.config.height - 40, (healthWidth * this.player.health) / 100, healthHeight);

    if (this.gameState === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Mission Failed!', this.config.width / 2, this.config.height / 2 - 20);
      
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
      this.ctx.fillText('Mission Complete!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.fillText('Press SPACE or tap for next mission', this.config.width / 2, this.config.height / 2 + 50);
      
      this.ctx.textAlign = 'left';
    } else if (this.score === 0) {
      // Instructions
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(20, 20, this.config.width - 40, 120);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Infiltrate the building and collect all secret documents!', this.config.width / 2, 45);
      this.ctx.fillText('Move: A/D or ←/→', this.config.width / 2, 65);
      this.ctx.fillText('Use elevator: W/S or ↑/↓', this.config.width / 2, 85);
      this.ctx.fillText('Shoot: Space or tap', this.config.width / 2, 105);
      this.ctx.fillText('Collect all secrets then reach the top floor!', this.config.width / 2, 125);
      
      this.ctx.textAlign = 'left';
    }
  }
}