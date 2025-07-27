import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';

interface Block {
  x: number;
  y: number;
  color: string;
}

interface Piece {
  blocks: Block[];
  color: string;
  x: number;
  y: number;
  rotation: number;
}

const TETROMINOS = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]]
  ],
  O: [
    [[1, 1], [1, 1]]
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]]
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]]
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]]
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]]
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]]
  ]
};

const COLORS = {
  I: '#00ffff',
  O: '#ffff00',
  T: '#800080',
  S: '#00ff00',
  Z: '#ff0000',
  J: '#0000ff',
  L: '#ffa500'
};

export class Tetris extends GameEngine {
  private grid: string[][];
  private currentPiece: Piece | null = null;
  private nextPiece: Piece | null = null;
  private score = 0;
  private lines = 0;
  private level = 1;
  private dropTimer = 0;
  private dropInterval = 60;
  private gameState: 'playing' | 'gameOver' = 'playing';
  private blockSize = 20;
  private gridWidth = 10;
  private gridHeight = 20;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    super(container, config);
    this.initGame();
  }

  private initGame(): void {
    this.grid = Array(this.gridHeight).fill(null).map(() => Array(this.gridWidth).fill(''));
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropTimer = 0;
    this.dropInterval = 60;
    this.gameState = 'playing';
    this.currentPiece = this.createRandomPiece();
    this.nextPiece = this.createRandomPiece();
  }

  private createRandomPiece(): Piece {
    const types = Object.keys(TETROMINOS);
    const type = types[Math.floor(Math.random() * types.length)] as keyof typeof TETROMINOS;
    const shapes = TETROMINOS[type];
    
    return {
      blocks: this.shapeToBlocks(shapes[0], COLORS[type]),
      color: COLORS[type],
      x: Math.floor(this.gridWidth / 2) - 1,
      y: 0,
      rotation: 0
    };
  }

  private shapeToBlocks(shape: number[][], color: string): Block[] {
    const blocks: Block[] = [];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          blocks.push({ x, y, color });
        }
      }
    }
    return blocks;
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

    if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') {
      this.movePiece(-1, 0);
    } else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') {
      this.movePiece(1, 0);
    } else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's' || event.key === 'ArrowDown') {
      this.movePiece(0, 1);
    } else if (this.isKeyPressed('UP', event) || event.key.toLowerCase() === 'w' || event.key === 'ArrowUp') {
      this.rotatePiece();
    } else if (event.key === ' ') {
      this.dropPiece();
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
    
    const gameAreaWidth = this.gridWidth * this.blockSize;
    const gameAreaHeight = this.gridHeight * this.blockSize;
    const offsetX = (this.config.width - gameAreaWidth) / 2;
    const offsetY = 20;

    if (x < offsetX) {
      this.movePiece(-1, 0);
    } else if (x > offsetX + gameAreaWidth) {
      this.movePiece(1, 0);
    } else if (y > offsetY + gameAreaHeight - 60) {
      this.dropPiece();
    } else {
      this.rotatePiece();
    }
  }

  private movePiece(dx: number, dy: number): boolean {
    if (!this.currentPiece) return false;
    
    this.currentPiece.x += dx;
    this.currentPiece.y += dy;
    
    if (this.checkCollision()) {
      this.currentPiece.x -= dx;
      this.currentPiece.y -= dy;
      return false;
    }
    return true;
  }

  private rotatePiece(): void {
    if (!this.currentPiece) return;
    
    const rotatedBlocks = this.currentPiece.blocks.map(block => ({
      ...block,
      x: -block.y,
      y: block.x
    }));
    
    const originalBlocks = this.currentPiece.blocks;
    this.currentPiece.blocks = rotatedBlocks;
    
    if (this.checkCollision()) {
      this.currentPiece.blocks = originalBlocks;
    }
  }

  private dropPiece(): void {
    if (!this.currentPiece) return;
    
    while (this.movePiece(0, 1)) {
      // Keep dropping
    }
  }

  private checkCollision(): boolean {
    if (!this.currentPiece) return false;
    
    for (const block of this.currentPiece.blocks) {
      const x = this.currentPiece.x + block.x;
      const y = this.currentPiece.y + block.y;
      
      if (x < 0 || x >= this.gridWidth || y >= this.gridHeight) {
        return true;
      }
      
      if (y >= 0 && this.grid[y][x]) {
        return true;
      }
    }
    return false;
  }

  private placePiece(): void {
    if (!this.currentPiece) return;
    
    for (const block of this.currentPiece.blocks) {
      const x = this.currentPiece.x + block.x;
      const y = this.currentPiece.y + block.y;
      
      if (y >= 0) {
        this.grid[y][x] = this.currentPiece.color;
      }
    }
    
    this.clearLines();
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.createRandomPiece();
    
    if (this.checkCollision()) {
      this.gameState = 'gameOver';
    }
  }

  private clearLines(): void {
    let linesCleared = 0;
    
    for (let y = this.gridHeight - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== '')) {
        this.grid.splice(y, 1);
        this.grid.unshift(Array(this.gridWidth).fill(''));
        linesCleared++;
        y++; // Check the same row again
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += linesCleared * 100 * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(10, 60 - (this.level - 1) * 5);
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;
    
    this.dropTimer++;
    if (this.dropTimer >= this.dropInterval) {
      if (!this.movePiece(0, 1)) {
        this.placePiece();
      }
      this.dropTimer = 0;
    }
  }

  protected render(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    
    const gameAreaWidth = this.gridWidth * this.blockSize;
    const gameAreaHeight = this.gridHeight * this.blockSize;
    const offsetX = (this.config.width - gameAreaWidth) / 2;
    const offsetY = 20;
    
    // Draw grid
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.gridWidth; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX + x * this.blockSize, offsetY);
      this.ctx.lineTo(offsetX + x * this.blockSize, offsetY + gameAreaHeight);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.gridHeight; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(offsetX, offsetY + y * this.blockSize);
      this.ctx.lineTo(offsetX + gameAreaWidth, offsetY + y * this.blockSize);
      this.ctx.stroke();
    }
    
    // Draw placed blocks
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x]) {
          this.ctx.fillStyle = this.grid[y][x];
          this.ctx.fillRect(
            offsetX + x * this.blockSize + 1,
            offsetY + y * this.blockSize + 1,
            this.blockSize - 2,
            this.blockSize - 2
          );
        }
      }
    }
    
    // Draw current piece
    if (this.currentPiece) {
      this.ctx.fillStyle = this.currentPiece.color;
      for (const block of this.currentPiece.blocks) {
        const x = this.currentPiece.x + block.x;
        const y = this.currentPiece.y + block.y;
        if (y >= 0) {
          this.ctx.fillRect(
            offsetX + x * this.blockSize + 1,
            offsetY + y * this.blockSize + 1,
            this.blockSize - 2,
            this.blockSize - 2
          );
        }
      }
    }
    
    // Draw UI
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    this.ctx.fillText(`Lines: ${this.lines}`, 10, 40);
    this.ctx.fillText(`Level: ${this.level}`, 10, 60);
    
    // Draw next piece
    if (this.nextPiece) {
      this.ctx.fillText('Next:', this.config.width - 80, 20);
      this.ctx.fillStyle = this.nextPiece.color;
      for (const block of this.nextPiece.blocks) {
        this.ctx.fillRect(
          this.config.width - 70 + block.x * 15,
          30 + block.y * 15,
          13,
          13
        );
      }
    }
    
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
    }
  }
}