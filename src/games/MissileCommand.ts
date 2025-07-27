import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface City {
  x: number;
  y: number;
  width: number;
  height: number;
  destroyed: boolean;
}

interface Missile {
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  active: boolean;
  trail: Point[];
}

interface DefenseMissile {
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  active: boolean;
  exploded: boolean;
  trail: Point[];
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  growing: boolean;
  active: boolean;
}

interface Battery {
  x: number;
  y: number;
  width: number;
  height: number;
  ammo: number;
  destroyed: boolean;
}

export class MissileCommand extends GameEngine {
  private cities: City[] = [];
  private missiles: Missile[] = [];
  private defenseMissiles: DefenseMissile[] = [];
  private explosions: Explosion[] = [];
  private batteries: Battery[] = [];
  private score = 0;
  private level = 1;
  private gameState: 'playing' | 'gameOver' | 'levelComplete' = 'playing';
  private missileSpawnTimer = 0;
  private missileSpawnRate = 120;
  private crosshair = { x: 200, y: 150 };

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const missileConfig = {
      ...config,
      width: config.width || 500,
      height: config.height || 400
    };
    super(container, missileConfig);
    this.initGame();
  }

  private initGame(): void {
    this.score = 0;
    this.level = 1;
    this.gameState = 'playing';
    this.missileSpawnTimer = 0;
    this.missileSpawnRate = 120;
    this.crosshair = { x: this.config.width / 2, y: this.config.height / 2 };
    this.initLevel();
  }

  private initLevel(): void {
    this.missiles = [];
    this.defenseMissiles = [];
    this.explosions = [];
    
    // Create cities
    this.cities = [];
    const cityCount = 6;
    const citySpacing = (this.config.width - 100) / (cityCount - 1);
    for (let i = 0; i < cityCount; i++) {
      this.cities.push({
        x: 50 + i * citySpacing - 15,
        y: this.config.height - 40,
        width: 30,
        height: 20,
        destroyed: false
      });
    }

    // Create missile batteries
    this.batteries = [];
    this.batteries.push({
      x: 20,
      y: this.config.height - 30,
      width: 40,
      height: 20,
      ammo: 10,
      destroyed: false
    });
    this.batteries.push({
      x: this.config.width / 2 - 20,
      y: this.config.height - 30,
      width: 40,
      height: 20,
      ammo: 10,
      destroyed: false
    });
    this.batteries.push({
      x: this.config.width - 60,
      y: this.config.height - 30,
      width: 40,
      height: 20,
      ammo: 10,
      destroyed: false
    });

    this.missileSpawnRate = Math.max(30, 120 - this.level * 10);
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
        this.initLevel();
        this.gameState = 'playing';
      }
      return;
    }

    if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.fireMissile();
    }
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    super.handleKeyUp(event);
  }

  protected handleTouchStart(event: TouchEvent): void {
    super.handleTouchStart(event);
    
    if (this.gameState === 'gameOver') {
      this.initGame();
      return;
    }

    if (this.gameState === 'levelComplete') {
      this.level++;
      this.initLevel();
      this.gameState = 'playing';
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    this.crosshair.x = touch.clientX - rect.left;
    this.crosshair.y = touch.clientY - rect.top;
    
    this.fireMissile();
  }

  protected handleTouchMove(event: TouchEvent): void {
    super.handleTouchMove(event);
    
    if (this.gameState === 'playing') {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.crosshair.x = touch.clientX - rect.left;
      this.crosshair.y = touch.clientY - rect.top;
    }
  }

  private fireMissile(): void {
    // Find closest battery with ammo
    let closestBattery: Battery | null = null;
    let closestDistance = Infinity;

    for (const battery of this.batteries) {
      if (battery.destroyed || battery.ammo <= 0) continue;

      const distance = Math.abs(battery.x + battery.width / 2 - this.crosshair.x);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestBattery = battery;
      }
    }

    if (!closestBattery) return;

    closestBattery.ammo--;

    this.defenseMissiles.push({
      startX: closestBattery.x + closestBattery.width / 2,
      startY: closestBattery.y,
      x: closestBattery.x + closestBattery.width / 2,
      y: closestBattery.y,
      targetX: this.crosshair.x,
      targetY: this.crosshair.y,
      speed: 8,
      active: true,
      exploded: false,
      trail: []
    });
  }

  private spawnMissile(): void {
    // Random target (city or battery)
    const targets = [
      ...this.cities.filter(c => !c.destroyed).map(c => ({ x: c.x + c.width / 2, y: c.y + c.height / 2 })),
      ...this.batteries.filter(b => !b.destroyed).map(b => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 }))
    ];

    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    const startX = Math.random() * this.config.width;

    this.missiles.push({
      startX: startX,
      startY: 0,
      x: startX,
      y: 0,
      targetX: target.x,
      targetY: target.y,
      speed: 1 + Math.random() * 2,
      active: true,
      trail: []
    });
  }

  private updateMissiles(): void {
    for (const missile of this.missiles) {
      if (!missile.active) continue;

      // Calculate direction
      const dx = missile.targetX - missile.x;
      const dy = missile.targetY - missile.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < missile.speed) {
        // Missile reached target
        missile.active = false;
        this.createExplosion(missile.targetX, missile.targetY, 40);
      } else {
        // Move missile
        missile.x += (dx / distance) * missile.speed;
        missile.y += (dy / distance) * missile.speed;

        // Add to trail
        missile.trail.push({ x: missile.x, y: missile.y });
        if (missile.trail.length > 20) {
          missile.trail.shift();
        }
      }
    }
  }

  private updateDefenseMissiles(): void {
    for (const missile of this.defenseMissiles) {
      if (!missile.active) continue;

      if (!missile.exploded) {
        // Calculate direction
        const dx = missile.targetX - missile.x;
        const dy = missile.targetY - missile.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < missile.speed) {
          // Missile reached target
          missile.exploded = true;
          this.createExplosion(missile.targetX, missile.targetY, 60);
          this.score += 25;
        } else {
          // Move missile
          missile.x += (dx / distance) * missile.speed;
          missile.y += (dy / distance) * missile.speed;

          // Add to trail
          missile.trail.push({ x: missile.x, y: missile.y });
          if (missile.trail.length > 15) {
            missile.trail.shift();
          }
        }
      }
    }
  }

  private createExplosion(x: number, y: number, maxRadius: number): void {
    this.explosions.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: maxRadius,
      growing: true,
      active: true
    });
  }

  private updateExplosions(): void {
    for (const explosion of this.explosions) {
      if (!explosion.active) continue;

      if (explosion.growing) {
        explosion.radius += 3;
        if (explosion.radius >= explosion.maxRadius) {
          explosion.growing = false;
        }

        // Check if explosion destroys incoming missiles
        for (const missile of this.missiles) {
          if (!missile.active) continue;

          const distance = Math.sqrt(
            Math.pow(missile.x - explosion.x, 2) + 
            Math.pow(missile.y - explosion.y, 2)
          );

          if (distance <= explosion.radius) {
            missile.active = false;
            this.score += 100;
          }
        }
      } else {
        explosion.radius -= 2;
        if (explosion.radius <= 0) {
          explosion.active = false;
        }
      }
    }

    // Check explosion damage to cities and batteries
    for (const explosion of this.explosions) {
      if (!explosion.active || !explosion.growing) continue;

      // Check cities
      for (const city of this.cities) {
        if (city.destroyed) continue;

        const distance = Math.sqrt(
          Math.pow(city.x + city.width / 2 - explosion.x, 2) + 
          Math.pow(city.y + city.height / 2 - explosion.y, 2)
        );

        if (distance <= explosion.radius) {
          city.destroyed = true;
        }
      }

      // Check batteries
      for (const battery of this.batteries) {
        if (battery.destroyed) continue;

        const distance = Math.sqrt(
          Math.pow(battery.x + battery.width / 2 - explosion.x, 2) + 
          Math.pow(battery.y + battery.height / 2 - explosion.y, 2)
        );

        if (distance <= explosion.radius) {
          battery.destroyed = true;
        }
      }
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    // Update crosshair with keyboard
    if (this.config.useKeyboard) {
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
        this.crosshair.x = Math.max(0, this.crosshair.x - 5);
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
        this.crosshair.x = Math.min(this.config.width, this.crosshair.x + 5);
      }
      if (this.keys[this.keyMap.UP] || this.keys['w'] || this.keys['W']) {
        this.crosshair.y = Math.max(0, this.crosshair.y - 5);
      }
      if (this.keys[this.keyMap.DOWN] || this.keys['s'] || this.keys['S']) {
        this.crosshair.y = Math.min(this.config.height, this.crosshair.y + 5);
      }
    }

    // Spawn missiles
    this.missileSpawnTimer++;
    if (this.missileSpawnTimer >= this.missileSpawnRate) {
      this.spawnMissile();
      this.missileSpawnTimer = 0;
    }

    this.updateMissiles();
    this.updateDefenseMissiles();
    this.updateExplosions();

    // Clean up inactive objects
    this.missiles = this.missiles.filter(m => m.active);
    this.defenseMissiles = this.defenseMissiles.filter(m => m.active);
    this.explosions = this.explosions.filter(e => e.active);

    // Check win/lose conditions
    const activeCities = this.cities.filter(c => !c.destroyed);
    const activeBatteries = this.batteries.filter(b => !b.destroyed);
    
    if (activeCities.length === 0 && activeBatteries.length === 0) {
      this.gameState = 'gameOver';
    } else if (this.missiles.length === 0 && this.missileSpawnTimer === 0) {
      // Level complete (no more missiles and none spawning)
      this.score += activeCities.length * 100; // Bonus for surviving cities
      this.score += activeBatteries.reduce((sum, b) => sum + b.ammo * 5, 0); // Bonus for remaining ammo
      this.gameState = 'levelComplete';
    }
  }

  protected render(): void {
    // Sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#003366');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Ground
    this.ctx.fillStyle = '#2F4F2F';
    this.ctx.fillRect(0, this.config.height - 50, this.config.width, 50);

    // Draw cities
    for (const city of this.cities) {
      if (city.destroyed) {
        // Destroyed city (rubble)
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(city.x, city.y + 10, city.width, city.height - 10);
      } else {
        // Intact city
        this.ctx.fillStyle = '#4169E1';
        this.ctx.fillRect(city.x, city.y, city.width, city.height);
        
        // City windows
        this.ctx.fillStyle = '#FFFF00';
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 2; j++) {
            this.ctx.fillRect(city.x + 4 + i * 8, city.y + 4 + j * 8, 3, 3);
          }
        }
      }
    }

    // Draw batteries
    for (const battery of this.batteries) {
      if (battery.destroyed) {
        this.ctx.fillStyle = '#666666';
        this.ctx.fillRect(battery.x, battery.y + 5, battery.width, battery.height - 5);
      } else {
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(battery.x, battery.y, battery.width, battery.height);
        
        // Ammo display
        this.ctx.fillStyle = '#000';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(battery.ammo.toString(), battery.x + battery.width / 2, battery.y + 12);
      }
    }

    // Draw missile trails and missiles
    for (const missile of this.missiles) {
      if (!missile.active) continue;

      // Trail
      this.ctx.strokeStyle = '#FF0000';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(missile.startX, missile.startY);
      for (const point of missile.trail) {
        this.ctx.lineTo(point.x, point.y);
      }
      this.ctx.stroke();

      // Missile head
      this.ctx.fillStyle = '#FFFF00';
      this.ctx.beginPath();
      this.ctx.arc(missile.x, missile.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw defense missile trails and missiles
    for (const missile of this.defenseMissiles) {
      if (!missile.active) continue;

      // Trail
      this.ctx.strokeStyle = '#00FF00';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(missile.startX, missile.startY);
      for (const point of missile.trail) {
        this.ctx.lineTo(point.x, point.y);
      }
      this.ctx.stroke();

      // Missile head
      if (!missile.exploded) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(missile.x, missile.y, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Draw explosions
    for (const explosion of this.explosions) {
      if (!explosion.active) continue;

      const alpha = explosion.growing ? 0.8 : 0.4;
      this.ctx.fillStyle = `rgba(255, 165, 0, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner core
      this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(explosion.x, explosion.y, explosion.radius * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw crosshair
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(this.crosshair.x - 10, this.crosshair.y);
    this.ctx.lineTo(this.crosshair.x + 10, this.crosshair.y);
    this.ctx.moveTo(this.crosshair.x, this.crosshair.y - 10);
    this.ctx.lineTo(this.crosshair.x, this.crosshair.y + 10);
    this.ctx.stroke();

    // UI
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    this.ctx.fillText(`Level: ${this.level}`, 10, 45);

    if (this.gameState === 'gameOver') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('CITIES DESTROYED!', this.config.width / 2, this.config.height / 2 - 20);
      
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
      this.ctx.fillText('LEVEL COMPLETE!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.fillText('Press SPACE or tap for next level', this.config.width / 2, this.config.height / 2 + 50);
      
      this.ctx.textAlign = 'left';
    } else if (this.score === 0) {
      // Instructions
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(20, 70, this.config.width - 40, 100);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Defend your cities!', this.config.width / 2, 95);
      this.ctx.fillText('Move crosshair: WASD or mouse/touch', this.config.width / 2, 115);
      this.ctx.fillText('Fire missile: SPACE or tap', this.config.width / 2, 135);
      this.ctx.fillText('Intercept enemy missiles before', this.config.width / 2, 155);
      this.ctx.fillText('they destroy your cities!', this.config.width / 2, 175);
      
      this.ctx.textAlign = 'left';
    }
  }
}