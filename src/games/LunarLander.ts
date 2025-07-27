import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Lander {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fuel: number;
  width: number;
  height: number;
  thrustPower: number;
  rotationSpeed: number;
}

interface Terrain {
  points: Point[];
  landingPads: { startX: number; endX: number; y: number; bonus: number }[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export class LunarLander extends GameEngine {
  private lander: Lander;
  private terrain: Terrain;
  private particles: Particle[] = [];
  private score = 0;
  private gameState: 'flying' | 'landed' | 'crashed' | 'gameOver' = 'flying';
  private gravity = 0.1;
  private thrusting = false;
  private rotatingLeft = false;
  private rotatingRight = false;
  private altitude = 0;
  private speed = 0;
  private landingScore = 0;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const landerConfig = {
      ...config,
      width: config.width || 600,
      height: config.height || 400
    };
    super(container, landerConfig);
    this.initGame();
  }

  private initGame(): void {
    this.lander = {
      x: this.config.width / 2,
      y: 50,
      vx: 0,
      vy: 0,
      angle: 0,
      fuel: 1000,
      width: 12,
      height: 8,
      thrustPower: 0.15,
      rotationSpeed: 0.1
    };

    this.generateTerrain();
    this.particles = [];
    this.score = 0;
    this.gameState = 'flying';
    this.thrusting = false;
    this.rotatingLeft = false;
    this.rotatingRight = false;
  }

  private generateTerrain(): void {
    const points: Point[] = [];
    const landingPads: Terrain['landingPads'] = [];
    
    let x = 0;
    let y = this.config.height - 80;
    
    while (x <= this.config.width) {
      // Add some randomness to terrain
      if (Math.random() < 0.3 && x > 50 && x < this.config.width - 100) {
        // Create landing pad
        const padWidth = 60 + Math.random() * 40;
        const padY = y + (Math.random() - 0.5) * 30;
        
        points.push({ x: x, y: y });
        points.push({ x: x, y: padY });
        points.push({ x: x + padWidth, y: padY });
        points.push({ x: x + padWidth, y: y });
        
        landingPads.push({
          startX: x,
          endX: x + padWidth,
          y: padY,
          bonus: padWidth < 80 ? 500 : 250 // Smaller pads give more points
        });
        
        x += padWidth;
      } else {
        // Regular terrain
        const nextX = x + 20 + Math.random() * 40;
        const nextY = y + (Math.random() - 0.5) * 60;
        
        // Keep terrain within bounds
        const clampedY = Math.max(this.config.height - 150, Math.min(this.config.height - 30, nextY));
        
        points.push({ x: x, y: y });
        points.push({ x: nextX, y: clampedY });
        
        x = nextX;
        y = clampedY;
      }
    }
    
    // Ensure terrain goes to edge
    points.push({ x: this.config.width, y: y });
    points.push({ x: this.config.width, y: this.config.height });
    points.push({ x: 0, y: this.config.height });
    points.push({ x: 0, y: points[0].y });
    
    this.terrain = { points, landingPads };
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);

    if (this.gameState === 'landed' || this.gameState === 'crashed' || this.gameState === 'gameOver') {
      if (this.isKeyPressed('START', event) || event.key === ' ') {
        this.initGame();
      }
      return;
    }

    if (this.isKeyPressed('UP', event) || this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.thrusting = true;
    }
    if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
      this.rotatingLeft = true;
    }
    if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
      this.rotatingRight = true;
    }
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    super.handleKeyUp(event);

    if (this.isKeyPressed('UP', event) || this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.thrusting = false;
    }
    if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
      this.rotatingLeft = false;
    }
    if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
      this.rotatingRight = false;
    }
  }

  protected handleTouchStart(event: TouchEvent): void {
    super.handleTouchStart(event);
    
    if (this.gameState === 'landed' || this.gameState === 'crashed' || this.gameState === 'gameOver') {
      this.initGame();
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;
    
    if (y < centerY) {
      // Upper half - thrust
      this.thrusting = true;
    } else {
      // Lower half - rotate
      if (x < centerX - 50) {
        this.rotatingLeft = true;
      } else if (x > centerX + 50) {
        this.rotatingRight = true;
      } else {
        this.thrusting = true;
      }
    }
  }

  protected handleTouchEnd(event: TouchEvent): void {
    super.handleTouchEnd(event);
    this.thrusting = false;
    this.rotatingLeft = false;
    this.rotatingRight = false;
  }

  private updateLander(): void {
    if (this.gameState !== 'flying') return;

    // Rotation
    if (this.rotatingLeft) {
      this.lander.angle -= this.lander.rotationSpeed;
    }
    if (this.rotatingRight) {
      this.lander.angle += this.lander.rotationSpeed;
    }

    // Thrust
    if (this.thrusting && this.lander.fuel > 0) {
      const thrustX = Math.sin(this.lander.angle) * this.lander.thrustPower;
      const thrustY = -Math.cos(this.lander.angle) * this.lander.thrustPower;
      
      this.lander.vx += thrustX;
      this.lander.vy += thrustY;
      this.lander.fuel -= 2;
      
      // Create thrust particles
      this.createThrustParticles();
    }

    // Apply gravity
    this.lander.vy += this.gravity;

    // Update position
    this.lander.x += this.lander.vx;
    this.lander.y += this.lander.vy;

    // Calculate altitude and speed
    this.altitude = this.getAltitude();
    this.speed = Math.sqrt(this.lander.vx * this.lander.vx + this.lander.vy * this.lander.vy);

    // Check boundaries
    if (this.lander.x < 0) this.lander.x = 0;
    if (this.lander.x > this.config.width) this.lander.x = this.config.width;
    
    if (this.lander.y < 0) {
      this.lander.y = 0;
      this.lander.vy = 0;
    }

    // Check terrain collision
    this.checkTerrainCollision();
  }

  private getAltitude(): number {
    const groundY = this.getGroundHeight(this.lander.x);
    return groundY - (this.lander.y + this.lander.height);
  }

  private getGroundHeight(x: number): number {
    // Find the ground height at given x coordinate
    for (let i = 0; i < this.terrain.points.length - 1; i++) {
      const p1 = this.terrain.points[i];
      const p2 = this.terrain.points[i + 1];
      
      if (x >= p1.x && x <= p2.x) {
        // Linear interpolation between points
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + (p2.y - p1.y) * t;
      }
    }
    return this.config.height - 50;
  }

  private checkTerrainCollision(): void {
    const groundY = this.getGroundHeight(this.lander.x);
    
    if (this.lander.y + this.lander.height >= groundY) {
      this.lander.y = groundY - this.lander.height;
      this.lander.vy = 0;
      
      // Check if landed on landing pad
      const landingPad = this.terrain.landingPads.find(pad => 
        this.lander.x >= pad.startX && 
        this.lander.x + this.lander.width <= pad.endX &&
        Math.abs(groundY - pad.y) < 5
      );
      
      if (landingPad && this.speed < 2 && Math.abs(this.lander.angle) < 0.3) {
        // Successful landing
        this.gameState = 'landed';
        this.landingScore = Math.floor(landingPad.bonus + this.lander.fuel + (1000 / Math.max(this.speed, 0.1)));
        this.score += this.landingScore;
      } else {
        // Crashed
        this.gameState = 'crashed';
        this.createCrashParticles();
      }
    }
  }

  private createThrustParticles(): void {
    for (let i = 0; i < 3; i++) {
      const angle = this.lander.angle + Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 2;
      
      this.particles.push({
        x: this.lander.x + this.lander.width / 2,
        y: this.lander.y + this.lander.height,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        life: 0,
        maxLife: 20 + Math.random() * 10,
        color: `hsl(${30 + Math.random() * 60}, 100%, 50%)`
      });
    }
  }

  private createCrashParticles(): void {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      
      this.particles.push({
        x: this.lander.x + this.lander.width / 2,
        y: this.lander.y + this.lander.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 40 + Math.random() * 20,
        color: Math.random() < 0.5 ? '#FF4444' : '#FFA500'
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // Gravity on particles
      particle.life++;
      
      if (particle.life >= particle.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  protected update(): void {
    this.updateLander();
    this.updateParticles();
    
    // Check fuel
    if (this.lander.fuel <= 0 && this.gameState === 'flying') {
      // No fuel - just gravity
    }
  }

  protected render(): void {
    // Space background
    this.ctx.fillStyle = '#000011';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    
    // Stars
    this.ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.config.width;
      const y = (i * 23) % (this.config.height / 2);
      this.ctx.fillRect(x, y, 1, 1);
    }

    // Draw terrain
    this.ctx.fillStyle = '#666666';
    this.ctx.beginPath();
    this.ctx.moveTo(this.terrain.points[0].x, this.terrain.points[0].y);
    
    for (const point of this.terrain.points) {
      this.ctx.lineTo(point.x, point.y);
    }
    
    this.ctx.closePath();
    this.ctx.fill();

    // Draw landing pads
    this.ctx.fillStyle = '#00FF00';
    for (const pad of this.terrain.landingPads) {
      this.ctx.fillRect(pad.startX, pad.y - 3, pad.endX - pad.startX, 3);
      
      // Landing pad lights
      for (let x = pad.startX + 10; x < pad.endX - 10; x += 15) {
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.beginPath();
        this.ctx.arc(x, pad.y - 1, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.fillStyle = '#00FF00';
    }

    // Draw particles
    for (const particle of this.particles) {
      const alpha = 1 - (particle.life / particle.maxLife);
      this.ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw lander
    this.ctx.save();
    this.ctx.translate(this.lander.x + this.lander.width / 2, this.lander.y + this.lander.height / 2);
    this.ctx.rotate(this.lander.angle);
    
    if (this.gameState === 'crashed') {
      this.ctx.fillStyle = '#FF4444';
    } else {
      this.ctx.fillStyle = '#FFFFFF';
    }
    
    // Lander body
    this.ctx.fillRect(-this.lander.width / 2, -this.lander.height / 2, this.lander.width, this.lander.height);
    
    // Lander legs
    this.ctx.strokeStyle = '#CCCCCC';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(-this.lander.width / 2, this.lander.height / 2);
    this.ctx.lineTo(-this.lander.width / 2 - 4, this.lander.height / 2 + 6);
    this.ctx.moveTo(this.lander.width / 2, this.lander.height / 2);
    this.ctx.lineTo(this.lander.width / 2 + 4, this.lander.height / 2 + 6);
    this.ctx.stroke();
    
    this.ctx.restore();

    // HUD
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Fuel: ${Math.max(0, this.lander.fuel)}`, 10, 25);
    this.ctx.fillText(`Altitude: ${Math.max(0, Math.floor(this.altitude))}`, 10, 45);
    this.ctx.fillText(`Speed: ${this.speed.toFixed(1)}`, 10, 65);
    this.ctx.fillText(`Score: ${this.score}`, 10, 85);

    // Fuel bar
    const fuelBarWidth = 100;
    const fuelLevel = Math.max(0, this.lander.fuel / 1000);
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(this.config.width - 120, 10, fuelBarWidth, 10);
    this.ctx.fillStyle = fuelLevel > 0.3 ? '#00FF00' : fuelLevel > 0.1 ? '#FFFF00' : '#FF0000';
    this.ctx.fillRect(this.config.width - 120, 10, fuelBarWidth * fuelLevel, 10);

    // Game state messages
    if (this.gameState === 'landed') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#00FF00';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('SUCCESSFUL LANDING!', this.config.width / 2, this.config.height / 2 - 40);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Landing Bonus: ${this.landingScore}`, this.config.width / 2, this.config.height / 2);
      this.ctx.fillText(`Total Score: ${this.score}`, this.config.width / 2, this.config.height / 2 + 25);
      this.ctx.fillText('Press SPACE or tap to play again', this.config.width / 2, this.config.height / 2 + 60);
      
      this.ctx.textAlign = 'left';
    } else if (this.gameState === 'crashed') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.width, this.config.height);
      
      this.ctx.fillStyle = '#FF0000';
      this.ctx.font = '30px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('CRASHED!', this.config.width / 2, this.config.height / 2 - 20);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '16px Arial';
      let reason = '';
      if (this.speed >= 2) reason = 'Too fast!';
      else if (Math.abs(this.lander.angle) >= 0.3) reason = 'Wrong angle!';
      else reason = 'Missed landing pad!';
      
      this.ctx.fillText(reason, this.config.width / 2, this.config.height / 2 + 20);
      this.ctx.fillText('Press SPACE or tap to restart', this.config.width / 2, this.config.height / 2 + 50);
      
      this.ctx.textAlign = 'left';
    } else if (this.score === 0) {
      // Instructions
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(20, 120, this.config.width - 40, 120);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Land safely on the green landing pads!', this.config.width / 2, 145);
      this.ctx.fillText('Thrust: W/↑ or Space', this.config.width / 2, 165);
      this.ctx.fillText('Rotate: A/D or ←/→', this.config.width / 2, 185);
      this.ctx.fillText('Land slowly and upright for bonus points', this.config.width / 2, 205);
      this.ctx.fillText('Watch your fuel!', this.config.width / 2, 225);
      
      this.ctx.textAlign = 'left';
    }
  }
}