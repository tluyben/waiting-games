import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'up' | 'down' | 'left' | 'right';
  pumping: boolean;
  pumpCooldown: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'pooka' | 'fygar';
  color: string;
  health: number;
  maxHealth: number;
  inflated: number;
  maxInflated: number;
  stunned: number;
  lastMove: number;
  ghost: boolean;
  ghostTimer: number;
}

interface Pump {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  active: boolean;
  connectedEnemy: Enemy | null;
}

interface Rock {
  x: number;
  y: number;
  width: number;
  height: number;
  falling: boolean;
  vy: number;
}

interface Tunnel {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class DigDug extends GameEngine {
  private player: Player;
  private enemies: Enemy[] = [];
  private pump: Pump | null = null;
  private rocks: Rock[] = [];
  private tunnels: Tunnel[] = [];
  private grid: boolean[][] = []; // true = dirt, false = tunnel
  private score = 0;
  private lives = 3;
  private level = 1;
  private gameState: 'playing' | 'gameOver' | 'levelComplete' = 'playing';
  private cellSize = 16;
  private gridWidth = 0;
  private gridHeight = 0;
  private gameStarted = false; // Track if player has started playing
  private instructionTimer = 180; // Show instructions for 3 seconds (60 fps * 3)

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const digdugConfig = {
      ...config,
      width: config.width || 608,
      height: config.height || 448
    };
    super(container, digdugConfig);
    this.initGame();
  }

  private initGame(): void {
    this.gridWidth = Math.floor(this.config.width / this.cellSize);
    this.gridHeight = Math.floor(this.config.height / this.cellSize);

    this.player = {
      x: 0,
      y: this.cellSize,
      vx: 0,
      vy: 0,
      width: this.cellSize - 2,
      height: this.cellSize - 2,
      facing: 'right',
      pumping: false,
      pumpCooldown: 0
    };

    this.enemies = [];
    this.pump = null;
    this.rocks = [];
    this.tunnels = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameState = 'playing';
    this.gameStarted = false;
    this.instructionTimer = 180;

    this.generateLevel();
  }

  private generateLevel(): void {
    // Initialize grid with dirt - top 2 rows are sky/surface
    this.grid = [];
    const skyRows = 2;
    for (let x = 0; x < this.gridWidth; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.gridHeight; y++) {
        this.grid[x][y] = y >= skyRows; // Top rows are sky
      }
    }

    // Create starting tunnel from surface going down
    const startX = Math.floor(this.gridWidth / 4);
    this.digTunnel(startX, skyRows, 1, 3);

    // Reset player position to surface
    this.player.x = startX * this.cellSize;
    this.player.y = skyRows * this.cellSize;

    // Clear old enemies and rocks
    this.enemies = [];
    this.rocks = [];

    // Generate enemies in deeper areas
    const enemyCount = Math.min(2 + this.level, 6);
    const minEnemyY = skyRows + 4; // Enemies start deeper
    for (let i = 0; i < enemyCount; i++) {
      const type: Enemy['type'] = Math.random() < 0.6 ? 'pooka' : 'fygar';
      const gridX = Math.floor(2 + Math.random() * (this.gridWidth - 4));
      const gridY = Math.floor(minEnemyY + Math.random() * (this.gridHeight - minEnemyY - 2));
      const x = gridX * this.cellSize;
      const y = gridY * this.cellSize;

      // Dig small pocket for enemy
      this.digTunnel(gridX, gridY, 1, 1);

      this.enemies.push({
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        width: this.cellSize - 2,
        height: this.cellSize - 2,
        type: type,
        color: type === 'pooka' ? '#FF6B6B' : '#4ECDC4',
        health: 1,
        maxHealth: 1,
        inflated: 0,
        maxInflated: 4,
        stunned: 0,
        lastMove: 0,
        ghost: false,
        ghostTimer: 0
      });
    }

    // Generate rocks in upper-middle area
    const rockCount = Math.min(2 + Math.floor(this.level / 2), 5);
    for (let i = 0; i < rockCount; i++) {
      const gridX = Math.floor(1 + Math.random() * (this.gridWidth - 2));
      const gridY = Math.floor(skyRows + 2 + Math.random() * (this.gridHeight / 3));
      const x = gridX * this.cellSize;
      const y = gridY * this.cellSize;

      this.rocks.push({
        x: x,
        y: y,
        width: this.cellSize,
        height: this.cellSize,
        falling: false,
        vy: 0
      });
    }
  }

  private digTunnel(gridX: number, gridY: number, width: number, height: number): void {
    for (let x = gridX; x < Math.min(gridX + width, this.gridWidth); x++) {
      for (let y = gridY; y < Math.min(gridY + height, this.gridHeight); y++) {
        if (x >= 0 && y >= 0) {
          this.grid[x][y] = false;
        }
      }
    }
  }

  private isInTunnel(x: number, y: number): boolean {
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    
    if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
      return false;
    }
    
    return !this.grid[gridX][gridY];
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
        this.generateLevel();
        this.gameState = 'playing';
      }
      return;
    }

    if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.startPump();
    }
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    super.handleKeyUp(event);

    if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.stopPump();
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
      this.generateLevel();
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
    
    // Determine direction or pump
    this.gameStarted = true;
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
      this.startPump();
    } else {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        this.player.facing = deltaX > 0 ? 'right' : 'left';
        this.player.vx = deltaX > 0 ? 1 : -1;
        this.player.vy = 0;
      } else {
        this.player.facing = deltaY > 0 ? 'down' : 'up';
        this.player.vx = 0;
        this.player.vy = deltaY > 0 ? 1 : -1;
      }
    }
  }

  protected handleTouchEnd(event: TouchEvent): void {
    super.handleTouchEnd(event);
    this.player.vx = 0;
    this.player.vy = 0;
    this.stopPump();
  }

  private startPump(): void {
    if (this.pump || this.player.pumpCooldown > 0) return;

    this.gameStarted = true;
    this.player.pumping = true;
    
    let targetX = this.player.x;
    let targetY = this.player.y;
    
    switch (this.player.facing) {
      case 'up':
        targetY -= this.cellSize * 3;
        break;
      case 'down':
        targetY += this.cellSize * 3;
        break;
      case 'left':
        targetX -= this.cellSize * 3;
        break;
      case 'right':
        targetX += this.cellSize * 3;
        break;
    }
    
    this.pump = {
      x: this.player.x + this.player.width / 2,
      y: this.player.y + this.player.height / 2,
      targetX: targetX + this.player.width / 2,
      targetY: targetY + this.player.height / 2,
      active: true,
      connectedEnemy: null
    };
  }

  private stopPump(): void {
    this.player.pumping = false;
    if (this.pump) {
      if (this.pump.connectedEnemy) {
        this.pump.connectedEnemy.inflated = 0;
      }
      this.pump = null;
      this.player.pumpCooldown = 30;
    }
  }

  private updatePlayer(): void {
    if (this.player.pumping) return;

    // Movement
    if (this.config.useKeyboard) {
      this.player.vx = 0;
      this.player.vy = 0;

      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) {
        this.player.vx = -1;
        this.player.facing = 'left';
        this.gameStarted = true;
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) {
        this.player.vx = 1;
        this.player.facing = 'right';
        this.gameStarted = true;
      }
      if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) {
        this.player.vy = -1;
        this.player.facing = 'up';
        this.gameStarted = true;
      }
      if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) {
        this.player.vy = 1;
        this.player.facing = 'down';
        this.gameStarted = true;
      }
    }

    // Apply movement
    const newX = this.player.x + this.player.vx * 2;
    const newY = this.player.y + this.player.vy * 2;
    
    // Check bounds
    if (newX >= 0 && newX + this.player.width <= this.config.width) {
      this.player.x = newX;
    }
    if (newY >= 0 && newY + this.player.height <= this.config.height) {
      this.player.y = newY;
    }

    // Dig tunnels
    if (this.player.vx !== 0 || this.player.vy !== 0) {
      const gridX = Math.floor(this.player.x / this.cellSize);
      const gridY = Math.floor(this.player.y / this.cellSize);
      this.digTunnel(gridX, gridY, 1, 1);
    }

    this.player.pumpCooldown = Math.max(0, this.player.pumpCooldown - 1);
  }

  private updateEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Check if enemy should explode
      if (enemy.inflated >= enemy.maxInflated) {
        this.score += enemy.type === 'fygar' ? 200 : 100;
        this.enemies.splice(i, 1);
        continue;
      }

      // Update stunned state
      if (enemy.stunned > 0) {
        enemy.stunned--;
        continue;
      }

      // Ghost mode (can move through dirt)
      if (enemy.ghost) {
        enemy.ghostTimer--;
        if (enemy.ghostTimer <= 0) {
          enemy.ghost = false;
        }
      }

      // AI Movement
      enemy.lastMove++;
      if (enemy.lastMove > 30) {
        const playerDistance = Math.sqrt(
          Math.pow(this.player.x - enemy.x, 2) + 
          Math.pow(this.player.y - enemy.y, 2)
        );

        // Move toward player if close and in tunnel, otherwise random
        if (playerDistance < 100 && (this.isInTunnel(enemy.x, enemy.y) || enemy.ghost)) {
          const dx = this.player.x - enemy.x;
          const dy = this.player.y - enemy.y;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            enemy.vx = dx > 0 ? 1 : -1;
            enemy.vy = 0;
          } else {
            enemy.vx = 0;
            enemy.vy = dy > 0 ? 1 : -1;
          }
        } else if (enemy.ghost || Math.random() < 0.3) {
          // Random movement or become ghost
          if (!enemy.ghost && !this.isInTunnel(enemy.x, enemy.y) && Math.random() < 0.1) {
            enemy.ghost = true;
            enemy.ghostTimer = 300; // 5 seconds
          }
          
          const directions = [
            { vx: 0, vy: -1 },
            { vx: 0, vy: 1 },
            { vx: -1, vy: 0 },
            { vx: 1, vy: 0 }
          ];
          const dir = directions[Math.floor(Math.random() * directions.length)];
          enemy.vx = dir.vx;
          enemy.vy = dir.vy;
        }
        
        enemy.lastMove = 0;
      }

      // Apply movement
      const speed = enemy.ghost ? 1.5 : 1;
      const newX = enemy.x + enemy.vx * speed;
      const newY = enemy.y + enemy.vy * speed;
      
      // Check if can move (tunnel or ghost mode)
      const canMove = enemy.ghost || this.isInTunnel(newX + enemy.width / 2, newY + enemy.height / 2);
      
      if (canMove) {
        if (newX >= 0 && newX + enemy.width <= this.config.width) {
          enemy.x = newX;
        }
        if (newY >= 0 && newY + enemy.height <= this.config.height) {
          enemy.y = newY;
        }
      }

      // Check collision with player
      if (this.player.x < enemy.x + enemy.width &&
          this.player.x + this.player.width > enemy.x &&
          this.player.y < enemy.y + enemy.height &&
          this.player.y + this.player.height > enemy.y) {
        
        this.lives--;
        if (this.lives <= 0) {
          this.gameState = 'gameOver';
        } else {
          // Reset player position
          this.player.x = 0;
          this.player.y = this.cellSize;
        }
      }

      // Reduce inflation over time
      if (enemy.inflated > 0) {
        enemy.inflated = Math.max(0, enemy.inflated - 0.02);
      }
    }
  }

  private updatePump(): void {
    if (!this.pump) return;
    
    const dx = this.pump.targetX - this.pump.x;
    const dy = this.pump.targetY - this.pump.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      const speed = 8;
      this.pump.x += (dx / distance) * speed;
      this.pump.y += (dy / distance) * speed;
    }

    // Check for enemy collision
    if (!this.pump.connectedEnemy) {
      for (const enemy of this.enemies) {
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        
        if (Math.sqrt(
          Math.pow(this.pump.x - enemyCenterX, 2) + 
          Math.pow(this.pump.y - enemyCenterY, 2)
        ) < 20) {
          this.pump.connectedEnemy = enemy;
          break;
        }
      }
    }

    // Inflate connected enemy
    if (this.pump.connectedEnemy) {
      this.pump.connectedEnemy.inflated += 0.1;
      this.pump.connectedEnemy.stunned = 60;
    }
  }

  private updateRocks(): void {
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const rock = this.rocks[i];
      
      // Check if rock should fall
      if (!rock.falling) {
        const belowClear = !this.grid[Math.floor(rock.x / this.cellSize)][Math.floor((rock.y + rock.height) / this.cellSize)];
        if (belowClear) {
          rock.falling = true;
          rock.vy = 0;
        }
      }

      if (rock.falling) {
        rock.vy += 0.5; // Gravity
        rock.y += rock.vy;
        
        // Check collision with ground or dirt
        const gridY = Math.floor((rock.y + rock.height) / this.cellSize);
        if (gridY >= this.gridHeight || this.grid[Math.floor(rock.x / this.cellSize)][gridY]) {
          rock.falling = false;
          rock.vy = 0;
          rock.y = gridY * this.cellSize - rock.height;
          
          // Check if rock hits player
          if (this.player.x < rock.x + rock.width &&
              this.player.x + this.player.width > rock.x &&
              this.player.y < rock.y + rock.height &&
              this.player.y + this.player.height > rock.y) {
            
            this.lives--;
            if (this.lives <= 0) {
              this.gameState = 'gameOver';
            } else {
              this.player.x = 0;
              this.player.y = this.cellSize;
            }
          }
          
          // Check if rock hits enemies
          for (let j = this.enemies.length - 1; j >= 0; j--) {
            const enemy = this.enemies[j];
            if (enemy.x < rock.x + rock.width &&
                enemy.x + enemy.width > rock.x &&
                enemy.y < rock.y + rock.height &&
                enemy.y + enemy.height > rock.y) {
              
              this.score += 1000;
              this.enemies.splice(j, 1);
            }
          }
        }
      }
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    // Decrease instruction timer
    if (this.instructionTimer > 0) {
      this.instructionTimer--;
    }

    this.updatePlayer();
    this.updateEnemies();
    this.updatePump();
    this.updateRocks();

    // Check win condition
    if (this.enemies.length === 0) {
      this.gameState = 'levelComplete';
    }
  }

  protected render(): void {
    const skyRows = 2;

    // Sky background (light blue)
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.config.width, skyRows * this.cellSize);

    // Underground background (dark)
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, skyRows * this.cellSize, this.config.width, this.config.height - skyRows * this.cellSize);

    // Draw dirt with depth-based colors (authentic Dig Dug layers)
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = 0; y < this.gridHeight; y++) {
        if (this.grid[x][y]) {
          // Different dirt colors based on depth
          const depth = y - skyRows;
          if (depth < 4) {
            this.ctx.fillStyle = '#C4A35A'; // Light brown/tan (top layer)
          } else if (depth < 8) {
            this.ctx.fillStyle = '#8B6914'; // Medium brown
          } else if (depth < 14) {
            this.ctx.fillStyle = '#A0522D'; // Sienna
          } else {
            this.ctx.fillStyle = '#654321'; // Dark brown (deep)
          }
          this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);

          // Add subtle texture
          this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
          if ((x + y) % 3 === 0) {
            this.ctx.fillRect(x * this.cellSize + 2, y * this.cellSize + 2, 3, 3);
          }
        }
      }
    }

    // Draw grass on top of dirt
    this.ctx.fillStyle = '#228B22';
    for (let x = 0; x < this.gridWidth; x++) {
      if (this.grid[x][skyRows]) {
        // Grass line
        this.ctx.fillRect(x * this.cellSize, skyRows * this.cellSize - 3, this.cellSize, 3);
        // Grass blades
        for (let blade = 0; blade < 3; blade++) {
          const bladeX = x * this.cellSize + blade * 5 + 2;
          this.ctx.fillRect(bladeX, skyRows * this.cellSize - 6, 2, 6);
        }
      }
    }

    // Draw flowers on surface (decorative)
    for (let x = 2; x < this.gridWidth; x += 5) {
      if (this.grid[x][skyRows]) {
        // Flower stem
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(x * this.cellSize + 7, skyRows * this.cellSize - 12, 2, 10);
        // Flower head
        this.ctx.fillStyle = ['#FF6B6B', '#FFFF00', '#FF69B4', '#FFA500'][x % 4];
        this.ctx.beginPath();
        this.ctx.arc(x * this.cellSize + 8, skyRows * this.cellSize - 14, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Draw tunnel outlines for visibility
    this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.gridWidth; x++) {
      for (let y = skyRows; y < this.gridHeight; y++) {
        if (!this.grid[x][y]) {
          this.ctx.strokeRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }

    // Draw rocks
    this.ctx.fillStyle = '#696969';
    for (const rock of this.rocks) {
      this.ctx.fillRect(rock.x, rock.y, rock.width, rock.height);
      
      // Rock highlight
      this.ctx.fillStyle = '#A9A9A9';
      this.ctx.fillRect(rock.x + 2, rock.y + 2, rock.width - 4, rock.height - 4);
      this.ctx.fillStyle = '#696969';
    }

    // Draw enemies
    for (const enemy of this.enemies) {
      const inflateScale = 1 + enemy.inflated * 0.3;
      const size = enemy.width * inflateScale;
      const offsetX = (size - enemy.width) / 2;
      const offsetY = (size - enemy.height) / 2;
      const ex = enemy.x - offsetX;
      const ey = enemy.y - offsetY;

      // Ghost mode transparency
      const alpha = enemy.ghost ? 0.5 : 1;
      this.ctx.globalAlpha = alpha;

      if (enemy.type === 'pooka') {
        // Pooka - round red creature with goggles
        // Body (red/orange, round)
        this.ctx.fillStyle = '#FF6347';
        this.ctx.beginPath();
        this.ctx.arc(ex + size / 2, ey + size / 2, size / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Goggles strap (yellow)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(ex + 2, ey + size / 3, size - 4, 3);

        // Goggle lenses (white circles)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(ex + size / 3, ey + size / 3 + 1, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(ex + size * 2 / 3, ey + size / 3 + 1, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupils
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(ex + size / 3, ey + size / 3 + 1, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(ex + size * 2 / 3, ey + size / 3 + 1, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Inflation effect
        if (enemy.inflated > 2) {
          this.ctx.fillStyle = '#FFA07A';
          this.ctx.beginPath();
          this.ctx.arc(ex + size / 2, ey + size / 2, size / 2 - 2, 0, Math.PI * 2);
          this.ctx.fill();
        }
      } else {
        // Fygar - green dragon
        // Body (green, rectangular with pointed head)
        this.ctx.fillStyle = '#32CD32';
        this.ctx.fillRect(ex + 2, ey + 4, size - 4, size - 6);

        // Head (triangle-ish)
        this.ctx.beginPath();
        this.ctx.moveTo(ex + size - 2, ey + 4);
        this.ctx.lineTo(ex + size + 4, ey + size / 2);
        this.ctx.lineTo(ex + size - 2, ey + size - 2);
        this.ctx.closePath();
        this.ctx.fill();

        // Eyes (yellow)
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(ex + 4, ey + 6, 4, 4);
        this.ctx.fillRect(ex + size - 10, ey + 6, 4, 4);

        // Pupils
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(ex + 5, ey + 7, 2, 2);
        this.ctx.fillRect(ex + size - 9, ey + 7, 2, 2);

        // Spikes on back
        this.ctx.fillStyle = '#228B22';
        for (let spike = 0; spike < 3; spike++) {
          const spikeX = ex + 4 + spike * 4;
          this.ctx.beginPath();
          this.ctx.moveTo(spikeX, ey + 4);
          this.ctx.lineTo(spikeX + 2, ey);
          this.ctx.lineTo(spikeX + 4, ey + 4);
          this.ctx.closePath();
          this.ctx.fill();
        }

        // Fire breath (random chance when not inflated)
        if (enemy.inflated < 1 && Math.random() < 0.05) {
          this.ctx.fillStyle = '#FF4500';
          this.ctx.beginPath();
          this.ctx.moveTo(ex + size + 4, ey + size / 2 - 3);
          this.ctx.lineTo(ex + size + 16, ey + size / 2);
          this.ctx.lineTo(ex + size + 4, ey + size / 2 + 3);
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.fillStyle = '#FFD700';
          this.ctx.beginPath();
          this.ctx.moveTo(ex + size + 4, ey + size / 2 - 2);
          this.ctx.lineTo(ex + size + 10, ey + size / 2);
          this.ctx.lineTo(ex + size + 4, ey + size / 2 + 2);
          this.ctx.closePath();
          this.ctx.fill();
        }

        // Inflation effect
        if (enemy.inflated > 2) {
          this.ctx.fillStyle = '#90EE90';
          this.ctx.fillRect(ex + 4, ey + 6, size - 8, size - 10);
        }
      }

      this.ctx.globalAlpha = 1;
    }

    // Draw pump
    if (this.pump) {
      this.ctx.strokeStyle = '#00FF00';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
      this.ctx.lineTo(this.pump.x, this.pump.y);
      this.ctx.stroke();
      
      // Pump head
      this.ctx.fillStyle = '#FFFF00';
      this.ctx.beginPath();
      this.ctx.arc(this.pump.x, this.pump.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw player (Dig Dug style - white suit with blue accents)
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    // Body (white suit)
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(px + 2, py + 4, pw - 4, ph - 4);

    // Helmet/head (blue)
    this.ctx.fillStyle = '#4169E1';
    this.ctx.beginPath();
    this.ctx.arc(px + pw / 2, py + 4, 5, 0, Math.PI * 2);
    this.ctx.fill();

    // Face
    this.ctx.fillStyle = '#FFDBAC';
    this.ctx.fillRect(px + 4, py + 2, pw - 8, 5);

    // Eyes (direction based)
    this.ctx.fillStyle = '#000000';
    if (this.player.facing === 'left') {
      this.ctx.fillRect(px + 3, py + 3, 2, 2);
      this.ctx.fillRect(px + 6, py + 3, 2, 2);
    } else if (this.player.facing === 'right') {
      this.ctx.fillRect(px + pw - 5, py + 3, 2, 2);
      this.ctx.fillRect(px + pw - 8, py + 3, 2, 2);
    } else {
      this.ctx.fillRect(px + 4, py + 3, 2, 2);
      this.ctx.fillRect(px + pw - 6, py + 3, 2, 2);
    }

    // Blue boots
    this.ctx.fillStyle = '#4169E1';
    this.ctx.fillRect(px + 2, py + ph - 4, 4, 4);
    this.ctx.fillRect(px + pw - 6, py + ph - 4, 4, 4);

    // Pump/weapon when pumping
    if (this.player.pumping || this.pump) {
      this.ctx.fillStyle = '#FFD700';
      switch (this.player.facing) {
        case 'right':
          this.ctx.fillRect(px + pw, py + ph / 2 - 1, 6, 3);
          break;
        case 'left':
          this.ctx.fillRect(px - 6, py + ph / 2 - 1, 6, 3);
          break;
        case 'up':
          this.ctx.fillRect(px + pw / 2 - 1, py - 6, 3, 6);
          break;
        case 'down':
          this.ctx.fillRect(px + pw / 2 - 1, py + ph, 3, 6);
          break;
      }
    }

    // HUD - positioned in sky area with retro styling
    this.ctx.fillStyle = '#000000';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'left';

    // Score (top left)
    this.ctx.fillText(`SCORE: ${this.score}`, 8, 14);

    // Lives (show remaining lives as icons)
    this.ctx.fillText('LIVES:', 8, 28);
    for (let i = 0; i < this.lives; i++) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(55 + i * 12, 20, 8, 10);
      this.ctx.fillStyle = '#4169E1';
      this.ctx.fillRect(56 + i * 12, 21, 6, 4);
    }
    this.ctx.fillStyle = '#000000';

    // Level (top right)
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`LEVEL: ${this.level}`, this.config.width - 8, 14);
    this.ctx.fillText(`ENEMIES: ${this.enemies.length}`, this.config.width - 8, 28);

    this.ctx.textAlign = 'left';

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
      this.ctx.fillText('Level Complete!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.fillText('Press SPACE or tap for next level', this.config.width / 2, this.config.height / 2 + 50);
      
      this.ctx.textAlign = 'left';
    } else if (!this.gameStarted && this.instructionTimer > 0) {
      // Instructions - show only before player starts and with fade out
      const alpha = Math.min(0.8, this.instructionTimer / 60); // Fade out over last second
      this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      this.ctx.fillRect(this.config.width / 2 - 160, this.config.height / 2 - 70, 320, 140);

      // Border
      this.ctx.strokeStyle = '#FFFF00';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(this.config.width / 2 - 160, this.config.height / 2 - 70, 320, 140);

      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('DIG DUG', this.config.width / 2, this.config.height / 2 - 45);

      this.ctx.font = '12px Arial';
      this.ctx.fillStyle = '#FFFF00';
      this.ctx.fillText('Dig tunnels and defeat enemies!', this.config.width / 2, this.config.height / 2 - 20);

      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('Move: WASD or Arrow keys', this.config.width / 2, this.config.height / 2 + 5);
      this.ctx.fillText('Pump: Space (hold to inflate)', this.config.width / 2, this.config.height / 2 + 25);
      this.ctx.fillText('Watch for falling rocks!', this.config.width / 2, this.config.height / 2 + 45);

      this.ctx.textAlign = 'left';
    }
  }
}