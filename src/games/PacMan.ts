import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

interface Ghost {
  x: number;
  y: number;
  direction: Direction;
  color: string;
  mode: 'chase' | 'scatter' | 'frightened';
  modeTimer: number;
}

interface Dot {
  x: number;
  y: number;
  isPowerPellet: boolean;
  collected: boolean;
}

const MAZE = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.#####.##.#####.######',
  '     #.##..........##.#     ',
  '######.##.###  ###.##.######',
  '#........#      #........#',
  '######.##.########.##.######',
  '     #.##..........##.#     ',
  '######.##.########.##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o..##................##..o#',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################'
];

export class PacMan extends GameEngine {
  private pacman: { x: number; y: number; direction: Direction; nextDirection: Direction };
  private ghosts: Ghost[] = [];
  private dots: Dot[] = [];
  private score = 0;
  private lives = 3;
  private gameState: 'playing' | 'gameOver' | 'won' = 'playing';
  private cellSize = 14;
  private frightModeTimer = 0;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const mazeConfig = {
      ...config,
      width: config.width || MAZE[0].length * 14,
      height: config.height || MAZE.length * 14
    };
    super(container, mazeConfig);
    this.initGame();
  }

  private initGame(): void {
    this.pacman = {
      x: 13,
      y: 18,
      direction: Direction.RIGHT,
      nextDirection: Direction.RIGHT
    };

    this.ghosts = [
      { x: 13, y: 9, direction: Direction.UP, color: '#ff0000', mode: 'scatter', modeTimer: 0 },
      { x: 13, y: 10, direction: Direction.UP, color: '#ffb8ff', mode: 'scatter', modeTimer: 30 },
      { x: 12, y: 10, direction: Direction.UP, color: '#00ffff', mode: 'scatter', modeTimer: 60 },
      { x: 14, y: 10, direction: Direction.UP, color: '#ffb852', mode: 'scatter', modeTimer: 90 }
    ];

    this.dots = [];
    this.score = 0;
    this.lives = 3;
    this.gameState = 'playing';
    this.frightModeTimer = 0;
    this.createDots();
  }

  private createDots(): void {
    for (let y = 0; y < MAZE.length; y++) {
      for (let x = 0; x < MAZE[y].length; x++) {
        if (MAZE[y][x] === '.') {
          this.dots.push({ x, y, isPowerPellet: false, collected: false });
        } else if (MAZE[y][x] === 'o') {
          this.dots.push({ x, y, isPowerPellet: true, collected: false });
        }
      }
    }
  }

  private isWall(x: number, y: number): boolean {
    if (y < 0 || y >= MAZE.length || x < 0 || x >= MAZE[0].length) return true;
    return MAZE[y][x] === '#';
  }

  private wrapPosition(x: number, y: number): { x: number; y: number } {
    // Tunnel wrapping
    if (x < 0) x = MAZE[0].length - 1;
    if (x >= MAZE[0].length) x = 0;
    return { x, y };
  }

  private getNextPosition(x: number, y: number, direction: Direction): { x: number; y: number } {
    let newX = x;
    let newY = y;

    switch (direction) {
      case Direction.UP:
        newY--;
        break;
      case Direction.DOWN:
        newY++;
        break;
      case Direction.LEFT:
        newX--;
        break;
      case Direction.RIGHT:
        newX++;
        break;
    }

    return this.wrapPosition(newX, newY);
  }

  private canMove(x: number, y: number, direction: Direction): boolean {
    const next = this.getNextPosition(x, y, direction);
    return !this.isWall(next.x, next.y);
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
      this.pacman.nextDirection = Direction.UP;
    } else if (this.isKeyPressed('DOWN', event) || event.key.toLowerCase() === 's' || event.key === 'ArrowDown') {
      this.pacman.nextDirection = Direction.DOWN;
    } else if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a' || event.key === 'ArrowLeft') {
      this.pacman.nextDirection = Direction.LEFT;
    } else if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd' || event.key === 'ArrowRight') {
      this.pacman.nextDirection = Direction.RIGHT;
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
    
    const pacmanScreenX = (this.pacman.x + 0.5) * this.cellSize;
    const pacmanScreenY = (this.pacman.y + 0.5) * this.cellSize;
    
    const deltaX = x - pacmanScreenX;
    const deltaY = y - pacmanScreenY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.pacman.nextDirection = deltaX > 0 ? Direction.RIGHT : Direction.LEFT;
    } else {
      this.pacman.nextDirection = deltaY > 0 ? Direction.DOWN : Direction.UP;
    }
  }

  private movePacman(): void {
    // Try to change direction
    if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDirection)) {
      this.pacman.direction = this.pacman.nextDirection;
    }

    // Move in current direction
    if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.direction)) {
      const next = this.getNextPosition(this.pacman.x, this.pacman.y, this.pacman.direction);
      this.pacman.x = next.x;
      this.pacman.y = next.y;
    }
  }

  private moveGhost(ghost: Ghost): void {
    ghost.modeTimer--;
    
    if (ghost.modeTimer <= 0) {
      if (ghost.mode === 'scatter') {
        ghost.mode = 'chase';
        ghost.modeTimer = 200;
      } else if (ghost.mode === 'chase') {
        ghost.mode = 'scatter';
        ghost.modeTimer = 100;
      }
    }

    const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
    const validDirections = directions.filter(dir => this.canMove(ghost.x, ghost.y, dir));
    
    if (validDirections.length > 0) {
      if (ghost.mode === 'frightened') {
        // Random movement when frightened
        ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
      } else {
        // Simple AI: move towards pacman
        let bestDirection = ghost.direction;
        let bestDistance = Infinity;
        
        for (const dir of validDirections) {
          const next = this.getNextPosition(ghost.x, ghost.y, dir);
          const distance = Math.abs(next.x - this.pacman.x) + Math.abs(next.y - this.pacman.y);
          
          if (ghost.mode === 'chase' && distance < bestDistance) {
            bestDistance = distance;
            bestDirection = dir;
          } else if (ghost.mode === 'scatter' && distance > bestDistance) {
            bestDistance = distance;
            bestDirection = dir;
          }
        }
        
        ghost.direction = bestDirection;
      }
      
      const next = this.getNextPosition(ghost.x, ghost.y, ghost.direction);
      ghost.x = next.x;
      ghost.y = next.y;
    }
  }

  private checkCollisions(): void {
    // Check dot collection
    for (const dot of this.dots) {
      if (!dot.collected && dot.x === this.pacman.x && dot.y === this.pacman.y) {
        dot.collected = true;
        this.score += dot.isPowerPellet ? 50 : 10;
        
        if (dot.isPowerPellet) {
          this.frightModeTimer = 200;
          this.ghosts.forEach(ghost => {
            ghost.mode = 'frightened';
            ghost.modeTimer = 200;
          });
        }
      }
    }

    // Check ghost collisions
    for (const ghost of this.ghosts) {
      if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
        if (ghost.mode === 'frightened') {
          // Eat ghost
          this.score += 200;
          ghost.x = 13;
          ghost.y = 9;
          ghost.mode = 'scatter';
          ghost.modeTimer = 100;
        } else {
          // Pacman dies
          this.lives--;
          if (this.lives <= 0) {
            this.gameState = 'gameOver';
          } else {
            // Reset positions
            this.pacman.x = 13;
            this.pacman.y = 18;
            this.pacman.direction = Direction.RIGHT;
            this.pacman.nextDirection = Direction.RIGHT;
          }
        }
      }
    }

    // Check win condition
    const remainingDots = this.dots.filter(dot => !dot.collected);
    if (remainingDots.length === 0) {
      this.gameState = 'won';
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    if (this.frightModeTimer > 0) {
      this.frightModeTimer--;
      if (this.frightModeTimer === 0) {
        this.ghosts.forEach(ghost => {
          if (ghost.mode === 'frightened') {
            ghost.mode = 'scatter';
            ghost.modeTimer = 100;
          }
        });
      }
    }

    this.movePacman();
    this.ghosts.forEach(ghost => this.moveGhost(ghost));
    this.checkCollisions();
  }

  protected render(): void {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw maze
    this.ctx.fillStyle = '#0000ff';
    for (let y = 0; y < MAZE.length; y++) {
      for (let x = 0; x < MAZE[y].length; x++) {
        if (MAZE[y][x] === '#') {
          this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
        }
      }
    }

    // Draw dots
    for (const dot of this.dots) {
      if (!dot.collected) {
        this.ctx.fillStyle = '#ffff00';
        if (dot.isPowerPellet) {
          this.ctx.beginPath();
          this.ctx.arc(
            (dot.x + 0.5) * this.cellSize,
            (dot.y + 0.5) * this.cellSize,
            this.cellSize / 3,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        } else {
          this.ctx.beginPath();
          this.ctx.arc(
            (dot.x + 0.5) * this.cellSize,
            (dot.y + 0.5) * this.cellSize,
            2,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
      }
    }

    // Draw ghosts
    for (const ghost of this.ghosts) {
      this.ctx.fillStyle = ghost.mode === 'frightened' && this.frightModeTimer > 0 ? '#0000ff' : ghost.color;
      this.ctx.beginPath();
      this.ctx.arc(
        (ghost.x + 0.5) * this.cellSize,
        (ghost.y + 0.5) * this.cellSize,
        this.cellSize / 2 - 1,
        0,
        Math.PI * 2
      );
      this.ctx.fill();

      // Ghost eyes
      this.ctx.fillStyle = '#fff';
      this.ctx.fillRect(
        ghost.x * this.cellSize + 3,
        ghost.y * this.cellSize + 3,
        3,
        3
      );
      this.ctx.fillRect(
        ghost.x * this.cellSize + 8,
        ghost.y * this.cellSize + 3,
        3,
        3
      );
    }

    // Draw Pacman
    this.ctx.fillStyle = '#ffff00';
    this.ctx.beginPath();
    this.ctx.arc(
      (this.pacman.x + 0.5) * this.cellSize,
      (this.pacman.y + 0.5) * this.cellSize,
      this.cellSize / 2 - 1,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Pacman mouth
    this.ctx.fillStyle = '#000';
    this.ctx.beginPath();
    const mouthAngle = Math.PI / 3;
    let startAngle = 0;
    
    switch (this.pacman.direction) {
      case Direction.RIGHT:
        startAngle = -mouthAngle / 2;
        break;
      case Direction.LEFT:
        startAngle = Math.PI - mouthAngle / 2;
        break;
      case Direction.UP:
        startAngle = -Math.PI / 2 - mouthAngle / 2;
        break;
      case Direction.DOWN:
        startAngle = Math.PI / 2 - mouthAngle / 2;
        break;
    }

    this.ctx.moveTo((this.pacman.x + 0.5) * this.cellSize, (this.pacman.y + 0.5) * this.cellSize);
    this.ctx.arc(
      (this.pacman.x + 0.5) * this.cellSize,
      (this.pacman.y + 0.5) * this.cellSize,
      this.cellSize / 2 - 1,
      startAngle,
      startAngle + mouthAngle
    );
    this.ctx.closePath();
    this.ctx.fill();

    // UI
    this.ctx.fillStyle = '#ffff00';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 40);

    if (this.gameState === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#ffff00';
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
      
      this.ctx.fillStyle = '#ffff00';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('You Win!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
      this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 40);
      
      this.ctx.textAlign = 'left';
    }
  }

  start(): void {
    super.start();
    setInterval(() => {
      if (this.isRunning && !this.isPaused && this.gameState === 'playing') {
        this.update();
      }
    }, 150);
  }
}