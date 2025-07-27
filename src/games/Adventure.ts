import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hasKey: boolean;
  hasSword: boolean;
}

interface Dragon {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  alive: boolean;
  chaseTimer: number;
}

interface Item {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'key' | 'sword' | 'chalice';
  collected: boolean;
  color: string;
}

interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Room {
  walls: Wall[];
  items: Item[];
  dragons: Dragon[];
  color: string;
}

export class Adventure extends GameEngine {
  private player: Player;
  private rooms: Room[] = [];
  private currentRoom = 0;
  private score = 0;
  private gameState: 'playing' | 'gameOver' | 'won' = 'playing';
  private gameWon = false;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const adventureConfig = {
      ...config,
      width: config.width || 400,
      height: config.height || 300
    };
    super(container, adventureConfig);
    this.initGame();
  }

  private initGame(): void {
    this.player = {
      x: 50,
      y: this.config.height / 2,
      width: 12,
      height: 12,
      speed: 3,
      hasKey: false,
      hasSword: false
    };

    this.currentRoom = 0;
    this.score = 0;
    this.gameState = 'playing';
    this.gameWon = false;
    this.createRooms();
  }

  private createRooms(): void {
    this.rooms = [];

    // Room 0: Starting room with key
    this.rooms.push({
      walls: [
        // Outer walls
        { x: 0, y: 0, width: this.config.width, height: 10 },
        { x: 0, y: 0, width: 10, height: this.config.height },
        { x: this.config.width - 10, y: 0, width: 10, height: this.config.height },
        { x: 0, y: this.config.height - 10, width: this.config.width, height: 10 },
        // Exit gap on right
      ],
      items: [
        { x: 100, y: 100, width: 8, height: 8, type: 'key', collected: false, color: '#FFD700' }
      ],
      dragons: [],
      color: '#87CEEB'
    });

    // Room 1: Dragon room with sword
    this.rooms.push({
      walls: [
        { x: 0, y: 0, width: this.config.width, height: 10 },
        { x: 0, y: 0, width: 10, height: this.config.height },
        { x: this.config.width - 10, y: 0, width: 10, height: this.config.height },
        { x: 0, y: this.config.height - 10, width: this.config.width, height: 10 },
        // Maze walls
        { x: 100, y: 50, width: 10, height: 100 },
        { x: 200, y: 100, width: 10, height: 150 },
      ],
      items: [
        { x: 300, y: 50, width: 8, height: 16, type: 'sword', collected: false, color: '#C0C0C0' }
      ],
      dragons: [
        { x: 150, y: 120, width: 20, height: 20, vx: 1, vy: 1, alive: true, chaseTimer: 0 }
      ],
      color: '#DDA0DD'
    });

    // Room 2: Treasure room with chalice
    this.rooms.push({
      walls: [
        { x: 0, y: 0, width: this.config.width, height: 10 },
        { x: 0, y: 0, width: 10, height: this.config.height },
        { x: this.config.width - 10, y: 0, width: 10, height: this.config.height },
        { x: 0, y: this.config.height - 10, width: this.config.width, height: 10 },
        // Locked door (requires key)
        { x: 0, y: this.config.height / 2 - 30, width: 10, height: 60 },
      ],
      items: [
        { x: this.config.width / 2, y: this.config.height / 2, width: 12, height: 16, type: 'chalice', collected: false, color: '#FFD700' }
      ],
      dragons: [],
      color: '#98FB98'
    });
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
      this.attackDragon();
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
    
    const deltaX = x - (this.player.x + this.player.width / 2);
    const deltaY = y - (this.player.y + this.player.height / 2);
    
    // Attack if touching near player
    if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
      this.attackDragon();
      return;
    }
    
    // Move toward touch
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.keys['touchLeft'] = deltaX < 0;
      this.keys['touchRight'] = deltaX > 0;
      this.keys['touchUp'] = false;
      this.keys['touchDown'] = false;
    } else {
      this.keys['touchUp'] = deltaY < 0;
      this.keys['touchDown'] = deltaY > 0;
      this.keys['touchLeft'] = false;
      this.keys['touchRight'] = false;
    }
  }

  protected handleTouchEnd(event: TouchEvent): void {
    super.handleTouchEnd(event);
    this.keys['touchLeft'] = false;
    this.keys['touchRight'] = false;
    this.keys['touchUp'] = false;
    this.keys['touchDown'] = false;
  }

  private attackDragon(): void {
    if (!this.player.hasSword) return;

    const room = this.rooms[this.currentRoom];
    for (const dragon of room.dragons) {
      if (!dragon.alive) continue;

      const distance = Math.sqrt(
        Math.pow(this.player.x - dragon.x, 2) + 
        Math.pow(this.player.y - dragon.y, 2)
      );

      if (distance < 40) {
        dragon.alive = false;
        this.score += 100;
      }
    }
  }

  private checkWallCollision(x: number, y: number, width: number, height: number): boolean {
    const room = this.rooms[this.currentRoom];
    
    for (const wall of room.walls) {
      // Special case: locked door in room 2
      if (this.currentRoom === 2 && wall.x === 0 && wall.width === 10 && !this.player.hasKey) {
        if (x < wall.x + wall.width &&
            x + width > wall.x &&
            y < wall.y + wall.height &&
            y + height > wall.y) {
          return true;
        }
      } else if (!(this.currentRoom === 2 && wall.x === 0 && wall.width === 10)) {
        // Normal wall collision
        if (x < wall.x + wall.width &&
            x + width > wall.x &&
            y < wall.y + wall.height &&
            y + height > wall.y) {
          return true;
        }
      }
    }
    return false;
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    // Player movement
    let newX = this.player.x;
    let newY = this.player.y;

    if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['touchLeft']) {
      newX -= this.player.speed;
    }
    if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['touchRight']) {
      newX += this.player.speed;
    }
    if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W'] || this.keys['touchUp']) {
      newY -= this.player.speed;
    }
    if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S'] || this.keys['touchDown']) {
      newY += this.player.speed;
    }

    // Check wall collisions
    if (!this.checkWallCollision(newX, this.player.y, this.player.width, this.player.height)) {
      this.player.x = newX;
    }
    if (!this.checkWallCollision(this.player.x, newY, this.player.width, this.player.height)) {
      this.player.y = newY;
    }

    // Check room transitions
    if (this.player.x >= this.config.width - this.player.width) {
      if (this.currentRoom < this.rooms.length - 1) {
        this.currentRoom++;
        this.player.x = 10;
      }
    } else if (this.player.x <= 0) {
      if (this.currentRoom > 0) {
        this.currentRoom--;
        this.player.x = this.config.width - this.player.width - 10;
      }
    }

    // Update dragons
    const room = this.rooms[this.currentRoom];
    for (const dragon of room.dragons) {
      if (!dragon.alive) continue;

      // Simple AI: move toward player occasionally
      dragon.chaseTimer++;
      if (dragon.chaseTimer > 60) {
        if (this.player.x > dragon.x) dragon.vx = Math.abs(dragon.vx);
        else dragon.vx = -Math.abs(dragon.vx);
        
        if (this.player.y > dragon.y) dragon.vy = Math.abs(dragon.vy);
        else dragon.vy = -Math.abs(dragon.vy);
        
        dragon.chaseTimer = 0;
      }

      // Move dragon
      let newDragonX = dragon.x + dragon.vx;
      let newDragonY = dragon.y + dragon.vy;

      // Bounce off walls
      if (this.checkWallCollision(newDragonX, dragon.y, dragon.width, dragon.height)) {
        dragon.vx *= -1;
        newDragonX = dragon.x;
      }
      if (this.checkWallCollision(dragon.x, newDragonY, dragon.width, dragon.height)) {
        dragon.vy *= -1;
        newDragonY = dragon.y;
      }

      dragon.x = newDragonX;
      dragon.y = newDragonY;

      // Check dragon-player collision
      if (this.player.x < dragon.x + dragon.width &&
          this.player.x + this.player.width > dragon.x &&
          this.player.y < dragon.y + dragon.height &&
          this.player.y + this.player.height > dragon.y) {
        this.gameState = 'gameOver';
      }
    }

    // Check item collection
    for (const item of room.items) {
      if (item.collected) continue;

      if (this.player.x < item.x + item.width &&
          this.player.x + this.player.width > item.x &&
          this.player.y < item.y + item.height &&
          this.player.y + this.player.height > item.y) {
        
        item.collected = true;
        
        switch (item.type) {
          case 'key':
            this.player.hasKey = true;
            this.score += 50;
            break;
          case 'sword':
            this.player.hasSword = true;
            this.score += 75;
            break;
          case 'chalice':
            this.score += 200;
            this.gameState = 'won';
            break;
        }
      }
    }
  }

  protected render(): void {
    const room = this.rooms[this.currentRoom];
    
    // Room background
    this.ctx.fillStyle = room.color;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw walls
    this.ctx.fillStyle = '#8B4513';
    for (const wall of room.walls) {
      // Special rendering for locked door
      if (this.currentRoom === 2 && wall.x === 0 && wall.width === 10 && !this.player.hasKey) {
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        this.ctx.fillStyle = '#8B4513';
      } else if (!(this.currentRoom === 2 && wall.x === 0 && wall.width === 10)) {
        this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      }
    }

    // Draw items
    for (const item of room.items) {
      if (item.collected) continue;

      this.ctx.fillStyle = item.color;
      
      switch (item.type) {
        case 'key':
          // Draw key shape
          this.ctx.fillRect(item.x, item.y + 2, 6, 2);
          this.ctx.fillRect(item.x, item.y, 2, 6);
          this.ctx.fillRect(item.x + 4, item.y + 4, 2, 2);
          break;
        case 'sword':
          // Draw sword shape
          this.ctx.fillRect(item.x + 3, item.y, 2, 12);
          this.ctx.fillRect(item.x + 1, item.y + 12, 6, 2);
          this.ctx.fillRect(item.x + 3, item.y + 14, 2, 2);
          break;
        case 'chalice':
          // Draw chalice shape
          this.ctx.fillRect(item.x + 2, item.y + 8, 8, 2);
          this.ctx.fillRect(item.x + 4, item.y + 10, 4, 6);
          this.ctx.fillRect(item.x + 1, item.y, 10, 8);
          break;
      }
    }

    // Draw dragons
    for (const dragon of room.dragons) {
      if (!dragon.alive) continue;

      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillRect(dragon.x, dragon.y, dragon.width, dragon.height);
      
      // Dragon eyes
      this.ctx.fillStyle = '#FFFF00';
      this.ctx.fillRect(dragon.x + 3, dragon.y + 3, 3, 3);
      this.ctx.fillRect(dragon.x + 14, dragon.y + 3, 3, 3);
      
      // Dragon spikes
      this.ctx.fillStyle = '#8B0000';
      for (let i = 0; i < 4; i++) {
        this.ctx.fillRect(dragon.x + i * 5, dragon.y - 2, 2, 4);
      }
    }

    // Draw player
    this.ctx.fillStyle = '#0000FF';
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Player face
    this.ctx.fillStyle = '#FFDBAC';
    this.ctx.fillRect(this.player.x + 2, this.player.y + 2, 8, 6);
    
    // Player eyes
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.player.x + 3, this.player.y + 3, 1, 1);
    this.ctx.fillRect(this.player.x + 8, this.player.y + 3, 1, 1);

    // Draw inventory indicators
    this.ctx.fillStyle = '#000';
    this.ctx.font = '12px Arial';
    this.ctx.fillText(`Room: ${this.currentRoom + 1}`, 10, 20);
    this.ctx.fillText(`Score: ${this.score}`, 10, 35);
    
    if (this.player.hasKey) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText('🗝️', this.config.width - 60, 20);
    }
    
    if (this.player.hasSword) {
      this.ctx.fillStyle = '#C0C0C0';
      this.ctx.fillText('⚔️', this.config.width - 40, 20);
    }

    if (this.gameState === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('The Dragon Got You!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.font = '14px Arial';
      this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
      this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 35);
      
      this.ctx.textAlign = 'left';
    } else if (this.gameState === 'won') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('You Found the Chalice!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.font = '14px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 10);
      this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 35);
      
      this.ctx.textAlign = 'left';
    } else if (this.score === 0) {
      // Instructions
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(20, 60, this.config.width - 40, 80);
      
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Find the key, get the sword,', this.config.width / 2, 85);
      this.ctx.fillText('slay the dragon, find the chalice!', this.config.width / 2, 100);
      this.ctx.fillText('Move: WASD or arrows', this.config.width / 2, 120);
      this.ctx.fillText('Attack: Space (when you have sword)', this.config.width / 2, 135);
      
      this.ctx.textAlign = 'left';
    }
  }
}