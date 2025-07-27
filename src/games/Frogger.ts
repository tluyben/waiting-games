import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';

interface Frog {
  x: number;
  y: number;
  isOnLog: boolean;
  logSpeed: number;
}

interface Vehicle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
}

interface Log {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface LilyPad {
  x: number;
  y: number;
  occupied: boolean;
}

export class Frogger extends GameEngine {
  private frog: Frog;
  private vehicles: Vehicle[] = [];
  private logs: Log[] = [];
  private lilyPads: LilyPad[] = [];
  private score = 0;
  private lives = 3;
  private time = 60;
  private gameState: 'playing' | 'gameOver' | 'won' = 'playing';
  private cellSize = 32;
  private timer = 0;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const froggerConfig = {
      ...config,
      width: config.width || 13 * 32,
      height: config.height || 14 * 32
    };
    super(container, froggerConfig);
    this.initGame();
  }

  private initGame(): void {
    this.frog = {
      x: 6,
      y: 13,
      isOnLog: false,
      logSpeed: 0
    };

    this.vehicles = [];
    this.logs = [];
    this.lilyPads = [];
    this.score = 0;
    this.lives = 3;
    this.time = 60;
    this.gameState = 'playing';
    this.timer = 0;

    this.createVehicles();
    this.createLogs();
    this.createLilyPads();
  }

  private createVehicles(): void {
    // Row 12 - Cars (slow)
    for (let i = 0; i < 3; i++) {
      this.vehicles.push({
        x: i * 4,
        y: 12,
        width: 2,
        height: 1,
        speed: 1,
        color: '#ff0000'
      });
    }

    // Row 11 - Trucks (medium)
    for (let i = 0; i < 2; i++) {
      this.vehicles.push({
        x: i * 6 + 1,
        y: 11,
        width: 3,
        height: 1,
        speed: -1.5,
        color: '#00ff00'
      });
    }

    // Row 10 - Cars (fast)
    for (let i = 0; i < 4; i++) {
      this.vehicles.push({
        x: i * 3,
        y: 10,
        width: 2,
        height: 1,
        speed: 2,
        color: '#ffff00'
      });
    }

    // Row 8 - Trucks (slow reverse)
    for (let i = 0; i < 2; i++) {
      this.vehicles.push({
        x: i * 7,
        y: 8,
        width: 3,
        height: 1,
        speed: -1,
        color: '#ff8800'
      });
    }

    // Row 7 - Cars (medium reverse)
    for (let i = 0; i < 3; i++) {
      this.vehicles.push({
        x: i * 4 + 2,
        y: 7,
        width: 2,
        height: 1,
        speed: -1.5,
        color: '#8800ff'
      });
    }
  }

  private createLogs(): void {
    // Row 6 - Long logs (slow)
    for (let i = 0; i < 2; i++) {
      this.logs.push({
        x: i * 7,
        y: 6,
        width: 4,
        height: 1,
        speed: 0.8
      });
    }

    // Row 5 - Medium logs (medium)
    for (let i = 0; i < 3; i++) {
      this.logs.push({
        x: i * 4 + 1,
        y: 5,
        width: 3,
        height: 1,
        speed: -1.2
      });
    }

    // Row 4 - Short logs (fast)
    for (let i = 0; i < 4; i++) {
      this.logs.push({
        x: i * 3,
        y: 4,
        width: 2,
        height: 1,
        speed: 1.5
      });
    }

    // Row 3 - Turtles (medium, reverse)
    for (let i = 0; i < 3; i++) {
      this.logs.push({
        x: i * 4 + 2,
        y: 3,
        width: 2,
        height: 1,
        speed: -1
      });
    }

    // Row 2 - Long logs (slow, reverse)
    for (let i = 0; i < 2; i++) {
      this.logs.push({
        x: i * 6 + 1,
        y: 2,
        width: 3,
        height: 1,
        speed: -0.7
      });
    }
  }

  private createLilyPads(): void {
    for (let i = 0; i < 5; i++) {
      this.lilyPads.push({
        x: i * 2.5 + 1,
        y: 1,
        occupied: false
      });
    }
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

    if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') {
      this.moveFrog(0, -1);
    } else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's' || event.key === 'ArrowDown') {
      this.moveFrog(0, 1);
    } else if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') {
      this.moveFrog(-1, 0);
    } else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') {
      this.moveFrog(1, 0);
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
    
    const frogScreenX = (this.frog.x + 0.5) * this.cellSize;
    const frogScreenY = (this.frog.y + 0.5) * this.cellSize;
    
    const deltaX = x - frogScreenX;
    const deltaY = y - frogScreenY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.moveFrog(deltaX > 0 ? 1 : -1, 0);
    } else {
      this.moveFrog(0, deltaY > 0 ? 1 : -1);
    }
  }

  private moveFrog(dx: number, dy: number): void {
    const newX = this.frog.x + dx;
    const newY = this.frog.y + dy;
    
    // Bounds checking
    if (newX < 0 || newX >= 13 || newY < 1 || newY > 13) return;
    
    // Don't allow moving into occupied lily pad
    if (newY === 1) {
      const lilyPad = this.lilyPads.find(pad => 
        Math.floor(pad.x) === newX && pad.y === newY && pad.occupied
      );
      if (lilyPad) return;
    }

    this.frog.x = newX;
    this.frog.y = newY;
    this.frog.isOnLog = false;
    this.frog.logSpeed = 0;

    // Score for moving forward
    if (dy < 0 && this.frog.y < 7) {
      this.score += 10;
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    this.timer++;
    if (this.timer % 60 === 0) {
      this.time--;
      if (this.time <= 0) {
        this.lives--;
        if (this.lives <= 0) {
          this.gameState = 'gameOver';
          return;
        }
        this.resetFrog();
      }
    }

    // Update vehicles
    for (const vehicle of this.vehicles) {
      vehicle.x += vehicle.speed * 0.02;
      
      // Wrap around
      if (vehicle.speed > 0 && vehicle.x > 13) {
        vehicle.x = -vehicle.width;
      } else if (vehicle.speed < 0 && vehicle.x < -vehicle.width) {
        vehicle.x = 13;
      }
    }

    // Update logs
    for (const log of this.logs) {
      log.x += log.speed * 0.02;
      
      // Wrap around
      if (log.speed > 0 && log.x > 13) {
        log.x = -log.width;
      } else if (log.speed < 0 && log.x < -log.width) {
        log.x = 13;
      }
    }

    this.checkCollisions();
    this.checkWinCondition();
  }

  private checkCollisions(): void {
    // Water collision (if not on log)
    if (this.frog.y >= 2 && this.frog.y <= 6) {
      this.frog.isOnLog = false;
      this.frog.logSpeed = 0;
      
      // Check if on a log
      for (const log of this.logs) {
        if (this.frog.y === log.y &&
            this.frog.x >= log.x &&
            this.frog.x < log.x + log.width) {
          this.frog.isOnLog = true;
          this.frog.logSpeed = log.speed;
          break;
        }
      }
      
      // If not on log, drown
      if (!this.frog.isOnLog) {
        this.lives--;
        if (this.lives <= 0) {
          this.gameState = 'gameOver';
          return;
        }
        this.resetFrog();
        return;
      }
    }

    // Move frog with log
    if (this.frog.isOnLog) {
      this.frog.x += this.frog.logSpeed * 0.02;
      
      // Check if frog moved off screen
      if (this.frog.x < 0 || this.frog.x >= 13) {
        this.lives--;
        if (this.lives <= 0) {
          this.gameState = 'gameOver';
          return;
        }
        this.resetFrog();
        return;
      }
    }

    // Vehicle collision
    if (this.frog.y >= 7 && this.frog.y <= 12) {
      for (const vehicle of this.vehicles) {
        if (this.frog.y === vehicle.y &&
            this.frog.x >= vehicle.x &&
            this.frog.x < vehicle.x + vehicle.width) {
          this.lives--;
          if (this.lives <= 0) {
            this.gameState = 'gameOver';
            return;
          }
          this.resetFrog();
          return;
        }
      }
    }

    // Lily pad collision
    if (this.frog.y === 1) {
      for (const lilyPad of this.lilyPads) {
        if (Math.abs(this.frog.x - lilyPad.x) < 0.5) {
          if (!lilyPad.occupied) {
            lilyPad.occupied = true;
            this.score += 50;
            this.resetFrog();
          }
          return;
        }
      }
    }
  }

  private checkWinCondition(): void {
    if (this.lilyPads.every(pad => pad.occupied)) {
      this.gameState = 'won';
    }
  }

  private resetFrog(): void {
    this.frog.x = 6;
    this.frog.y = 13;
    this.frog.isOnLog = false;
    this.frog.logSpeed = 0;
    this.time = 60;
  }

  protected render(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw background areas
    // Safe areas (green)
    this.ctx.fillStyle = '#228B22';
    this.ctx.fillRect(0, 0, this.config.width, this.cellSize); // Top
    this.ctx.fillRect(0, 6 * this.cellSize, this.config.width, this.cellSize); // Middle
    this.ctx.fillRect(0, 13 * this.cellSize, this.config.width, this.cellSize); // Bottom

    // Road (gray)
    this.ctx.fillStyle = '#404040';
    this.ctx.fillRect(0, 7 * this.cellSize, this.config.width, 6 * this.cellSize);

    // Water (blue)
    this.ctx.fillStyle = '#4169E1';
    this.ctx.fillRect(0, 2 * this.cellSize, this.config.width, 5 * this.cellSize);

    // Draw lane dividers
    this.ctx.fillStyle = '#ffff00';
    for (let y = 8; y <= 11; y++) {
      for (let x = 0; x < 13; x += 2) {
        this.ctx.fillRect(x * this.cellSize + this.cellSize * 0.4, y * this.cellSize + this.cellSize * 0.45, this.cellSize * 0.2, this.cellSize * 0.1);
      }
    }

    // Draw lily pads
    for (const lilyPad of this.lilyPads) {
      this.ctx.fillStyle = lilyPad.occupied ? '#32CD32' : '#006400';
      this.ctx.beginPath();
      this.ctx.arc(
        (lilyPad.x + 0.5) * this.cellSize,
        (lilyPad.y + 0.5) * this.cellSize,
        this.cellSize * 0.4,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }

    // Draw logs
    this.ctx.fillStyle = '#8B4513';
    for (const log of this.logs) {
      this.ctx.fillRect(
        log.x * this.cellSize,
        log.y * this.cellSize + this.cellSize * 0.1,
        log.width * this.cellSize,
        this.cellSize * 0.8
      );
    }

    // Draw vehicles
    for (const vehicle of this.vehicles) {
      this.ctx.fillStyle = vehicle.color;
      this.ctx.fillRect(
        vehicle.x * this.cellSize,
        vehicle.y * this.cellSize + this.cellSize * 0.1,
        vehicle.width * this.cellSize,
        this.cellSize * 0.8
      );
    }

    // Draw frog
    this.ctx.fillStyle = '#00ff00';
    this.ctx.beginPath();
    this.ctx.arc(
      (this.frog.x + 0.5) * this.cellSize,
      (this.frog.y + 0.5) * this.cellSize,
      this.cellSize * 0.3,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Frog eyes
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    this.ctx.arc(
      (this.frog.x + 0.3) * this.cellSize,
      (this.frog.y + 0.3) * this.cellSize,
      this.cellSize * 0.05,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(
      (this.frog.x + 0.7) * this.cellSize,
      (this.frog.y + 0.3) * this.cellSize,
      this.cellSize * 0.05,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // UI
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    this.ctx.fillText(`Lives: ${this.lives}`, 120, 20);
    this.ctx.fillText(`Time: ${this.time}`, 220, 20);

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
      this.ctx.fillText('You Win!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
      this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 40);
      
      this.ctx.textAlign = 'left';
    }
  }
}