import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';

interface Cube {
  x: number;
  y: number;
  color: number;
  targetColor: number;
  isActive: boolean;
}

interface QBert {
  cubeX: number;
  cubeY: number;
  x: number;
  y: number;
  isJumping: boolean;
  jumpProgress: number;
  targetX: number;
  targetY: number;
}

interface Enemy {
  cubeX: number;
  cubeY: number;
  x: number;
  y: number;
  type: 'coily' | 'wrongway' | 'ugg';
  color: string;
  moveTimer: number;
  isJumping: boolean;
  jumpProgress: number;
  targetX: number;
  targetY: number;
}

export class Qbert extends GameEngine {
  private qbert: QBert;
  private cubes: Cube[][] = [];
  private enemies: Enemy[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private gameState: 'playing' | 'gameOver' | 'won' = 'playing';
  private pyramidSize = 7;
  private cubeSize = 40;
  private jumpDuration = 20;
  private enemySpawnTimer = 0;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const qbertConfig = {
      ...config,
      width: config.width || 450,
      height: config.height || 400
    };
    super(container, qbertConfig);
    this.initGame();
  }

  private initGame(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameState = 'playing';
    this.enemySpawnTimer = 0;
    this.initLevel();
  }

  private initLevel(): void {
    this.enemies = [];
    this.createPyramid();
    this.qbert = {
      cubeX: 0,
      cubeY: 0,
      x: 0,
      y: 0,
      isJumping: false,
      jumpProgress: 0,
      targetX: 0,
      targetY: 0
    };
    this.updateQBertPosition();
  }

  private createPyramid(): void {
    this.cubes = [];
    const offsetX = this.config.width / 2;
    const offsetY = 50;

    for (let row = 0; row < this.pyramidSize; row++) {
      this.cubes[row] = [];
      for (let col = 0; col <= row; col++) {
        const isoX = (col - row / 2) * this.cubeSize;
        const isoY = row * this.cubeSize * 0.5;
        
        this.cubes[row][col] = {
          x: offsetX + isoX,
          y: offsetY + isoY,
          color: 0,
          targetColor: this.level % 3 + 1,
          isActive: true
        };
      }
    }
  }

  private updateQBertPosition(): void {
    if (this.qbert.cubeY >= 0 && this.qbert.cubeY < this.cubes.length &&
        this.qbert.cubeX >= 0 && this.qbert.cubeX < this.cubes[this.qbert.cubeY].length) {
      const cube = this.cubes[this.qbert.cubeY][this.qbert.cubeX];
      this.qbert.x = cube.x;
      this.qbert.y = cube.y - 20;
    }
  }

  private isValidPosition(cubeX: number, cubeY: number): boolean {
    return cubeY >= 0 && cubeY < this.cubes.length &&
           cubeX >= 0 && cubeX < this.cubes[cubeY].length;
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

    if (this.qbert.isJumping) return;

    // Diagonal movement for Q*bert
    if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') {
      this.moveQBert(-1, -1); // Up-left
    } else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's' || event.key === 'ArrowDown') {
      this.moveQBert(1, 1); // Down-right
    } else if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') {
      this.moveQBert(0, -1); // Up-right
    } else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') {
      this.moveQBert(-1, 0); // Down-left
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

    if (this.qbert.isJumping) return;

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Diagonal touch controls
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        this.moveQBert(-1, 0); // Down-left
      } else {
        this.moveQBert(0, -1); // Up-right
      }
    } else {
      if (deltaY > 0) {
        this.moveQBert(1, 1); // Down-right
      } else {
        this.moveQBert(-1, -1); // Up-left
      }
    }
  }

  private moveQBert(deltaX: number, deltaY: number): void {
    const newCubeX = this.qbert.cubeX + deltaX;
    const newCubeY = this.qbert.cubeY + deltaY;
    
    if (this.isValidPosition(newCubeX, newCubeY)) {
      this.qbert.cubeX = newCubeX;
      this.qbert.cubeY = newCubeY;
      this.startJump();
      
      // Change cube color
      const cube = this.cubes[newCubeY][newCubeX];
      cube.color = (cube.color + 1) % 4;
      
      // Score points
      this.score += 25;
      
      this.checkWinCondition();
    } else {
      // Jumped off pyramid
      this.lives--;
      if (this.lives <= 0) {
        this.gameState = 'gameOver';
      } else {
        this.resetQBert();
      }
    }
  }

  private startJump(): void {
    this.qbert.isJumping = true;
    this.qbert.jumpProgress = 0;
    this.qbert.targetX = this.cubes[this.qbert.cubeY][this.qbert.cubeX].x;
    this.qbert.targetY = this.cubes[this.qbert.cubeY][this.qbert.cubeX].y - 20;
  }

  private resetQBert(): void {
    this.qbert.cubeX = 0;
    this.qbert.cubeY = 0;
    this.qbert.isJumping = false;
    this.qbert.jumpProgress = 0;
    this.updateQBertPosition();
  }

  private spawnEnemy(): void {
    const types: Array<Enemy['type']> = ['coily', 'wrongway', 'ugg'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const colors = {
      coily: '#800080',
      wrongway: '#ff0000',
      ugg: '#00ff00'
    };

    this.enemies.push({
      cubeX: Math.floor(Math.random() * this.cubes[this.pyramidSize - 1].length),
      cubeY: this.pyramidSize - 1,
      x: 0,
      y: 0,
      type: type,
      color: colors[type],
      moveTimer: 60 + Math.random() * 120,
      isJumping: false,
      jumpProgress: 0,
      targetX: 0,
      targetY: 0
    });
  }

  private updateEnemies(): void {
    for (const enemy of this.enemies) {
      if (enemy.isJumping) {
        enemy.jumpProgress++;
        if (enemy.jumpProgress >= this.jumpDuration) {
          enemy.isJumping = false;
          enemy.x = enemy.targetX;
          enemy.y = enemy.targetY;
        } else {
          const progress = enemy.jumpProgress / this.jumpDuration;
          const jumpHeight = Math.sin(progress * Math.PI) * 15;
          
          enemy.x = enemy.x + (enemy.targetX - enemy.x) * progress;
          enemy.y = enemy.y + (enemy.targetY - enemy.y) * progress - jumpHeight;
        }
      } else {
        enemy.moveTimer--;
        if (enemy.moveTimer <= 0) {
          this.moveEnemy(enemy);
          enemy.moveTimer = 60 + Math.random() * 120;
        }
        
        // Update enemy position to match cube
        if (this.isValidPosition(enemy.cubeX, enemy.cubeY)) {
          const cube = this.cubes[enemy.cubeY][enemy.cubeX];
          enemy.x = cube.x;
          enemy.y = cube.y - 20;
        }
      }
    }
    
    // Remove enemies that fell off
    this.enemies = this.enemies.filter(enemy => 
      this.isValidPosition(enemy.cubeX, enemy.cubeY)
    );
  }

  private moveEnemy(enemy: Enemy): void {
    const moves = [
      { dx: -1, dy: -1 }, // Up-left
      { dx: 1, dy: 1 },   // Down-right
      { dx: 0, dy: -1 },  // Up-right
      { dx: -1, dy: 0 }   // Down-left
    ];
    
    const validMoves = moves.filter(move => 
      this.isValidPosition(enemy.cubeX + move.dx, enemy.cubeY + move.dy)
    );
    
    if (validMoves.length > 0) {
      const move = validMoves[Math.floor(Math.random() * validMoves.length)];
      enemy.cubeX += move.dx;
      enemy.cubeY += move.dy;
      
      enemy.isJumping = true;
      enemy.jumpProgress = 0;
      enemy.targetX = this.cubes[enemy.cubeY][enemy.cubeX].x;
      enemy.targetY = this.cubes[enemy.cubeY][enemy.cubeX].y - 20;
    }
  }

  private checkCollisions(): void {
    for (const enemy of this.enemies) {
      if (enemy.cubeX === this.qbert.cubeX && enemy.cubeY === this.qbert.cubeY) {
        this.lives--;
        if (this.lives <= 0) {
          this.gameState = 'gameOver';
        } else {
          this.resetQBert();
        }
        return;
      }
    }
  }

  private checkWinCondition(): void {
    let allCorrect = true;
    for (let row = 0; row < this.cubes.length; row++) {
      for (let col = 0; col < this.cubes[row].length; col++) {
        const cube = this.cubes[row][col];
        if (cube.color !== cube.targetColor) {
          allCorrect = false;
          break;
        }
      }
      if (!allCorrect) break;
    }
    
    if (allCorrect) {
      this.level++;
      this.score += 1000;
      this.initLevel();
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    // Update Q*bert jumping
    if (this.qbert.isJumping) {
      this.qbert.jumpProgress++;
      if (this.qbert.jumpProgress >= this.jumpDuration) {
        this.qbert.isJumping = false;
        this.qbert.x = this.qbert.targetX;
        this.qbert.y = this.qbert.targetY;
      } else {
        const progress = this.qbert.jumpProgress / this.jumpDuration;
        const jumpHeight = Math.sin(progress * Math.PI) * 20;
        
        this.qbert.x = this.qbert.x + (this.qbert.targetX - this.qbert.x) * progress;
        this.qbert.y = this.qbert.y + (this.qbert.targetY - this.qbert.y) * progress - jumpHeight;
      }
    }

    // Spawn enemies
    this.enemySpawnTimer++;
    if (this.enemySpawnTimer > 180) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }

    this.updateEnemies();
    this.checkCollisions();
  }

  protected render(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw pyramid cubes
    for (let row = 0; row < this.cubes.length; row++) {
      for (let col = 0; col < this.cubes[row].length; col++) {
        const cube = this.cubes[row][col];
        this.drawCube(cube.x, cube.y, cube.color, cube.targetColor);
      }
    }

    // Draw Q*bert
    this.ctx.fillStyle = '#ff8800';
    this.ctx.beginPath();
    this.ctx.arc(this.qbert.x + 10, this.qbert.y + 10, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Q*bert's nose
    this.ctx.fillStyle = '#ffaa00';
    this.ctx.beginPath();
    this.ctx.arc(this.qbert.x + 13, this.qbert.y + 8, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw enemies
    for (const enemy of this.enemies) {
      this.ctx.fillStyle = enemy.color;
      this.ctx.beginPath();
      this.ctx.arc(enemy.x + 10, enemy.y + 10, 6, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // UI
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
    this.ctx.fillText(`Level: ${this.level}`, 10, 65);

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
      this.ctx.fillRect(this.config.width / 2 - 80, this.config.height - 80, 40, 40);
      this.ctx.fillRect(this.config.width / 2 + 40, this.config.height - 80, 40, 40);
      this.ctx.fillRect(this.config.width / 2 - 80, this.config.height - 120, 40, 40);
      this.ctx.fillRect(this.config.width / 2 + 40, this.config.height - 120, 40, 40);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('↖', this.config.width / 2 - 60, this.config.height - 95);
      this.ctx.fillText('↗', this.config.width / 2 + 60, this.config.height - 95);
      this.ctx.fillText('↙', this.config.width / 2 - 60, this.config.height - 55);
      this.ctx.fillText('↘', this.config.width / 2 + 60, this.config.height - 55);
      
      this.ctx.textAlign = 'left';
    }
  }

  private drawCube(x: number, y: number, color: number, targetColor: number): void {
    const colors = ['#888888', '#ff0000', '#00ff00', '#0000ff'];
    
    // Main cube face
    this.ctx.fillStyle = colors[color];
    this.ctx.fillRect(x - 15, y - 10, 30, 20);
    
    // Cube edges for 3D effect
    this.ctx.fillStyle = this.darkenColor(colors[color]);
    
    // Right face
    this.ctx.beginPath();
    this.ctx.moveTo(x + 15, y - 10);
    this.ctx.lineTo(x + 25, y - 15);
    this.ctx.lineTo(x + 25, y + 5);
    this.ctx.lineTo(x + 15, y + 10);
    this.ctx.fill();
    
    // Top face
    this.ctx.beginPath();
    this.ctx.moveTo(x - 15, y - 10);
    this.ctx.lineTo(x - 5, y - 15);
    this.ctx.lineTo(x + 25, y - 15);
    this.ctx.lineTo(x + 15, y - 10);
    this.ctx.fill();
    
    // Border
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - 15, y - 10, 30, 20);
    
    // Target color indicator
    if (color !== targetColor) {
      this.ctx.fillStyle = colors[targetColor];
      this.ctx.fillRect(x - 5, y - 5, 10, 10);
      this.ctx.strokeStyle = '#000';
      this.ctx.strokeRect(x - 5, y - 5, 10, 10);
    }
  }

  private darkenColor(color: string): string {
    // Simple color darkening
    const colorMap: { [key: string]: string } = {
      '#888888': '#666666',
      '#ff0000': '#cc0000',
      '#00ff00': '#00cc00',
      '#0000ff': '#0000cc'
    };
    return colorMap[color] || color;
  }
}