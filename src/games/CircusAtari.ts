import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Clown {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onSeesaw: boolean;
  color: string;
}

interface Seesaw {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  leftSide: Point;
  rightSide: Point;
  fulcrum: Point;
}

interface Balloon {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  value: number;
  popped: boolean;
  popAnimation: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class CircusAtari extends GameEngine {
  private clowns: Clown[] = [];
  private seesaw: Seesaw;
  private balloons: Balloon[] = [];
  private particles: Particle[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private gameState: 'playing' | 'gameOver' | 'levelComplete' = 'playing';
  private gravity = 0.4;
  private seesawBounce = 15;
  private currentClown = 0;
  private balloonTimer = 0;
  private balloonSpawnRate = 180; // 3 seconds at 60fps

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const circusConfig = {
      ...config,
      width: config.width || 500,
      height: config.height || 400
    };
    super(container, circusConfig);
    this.initGame();
  }

  private initGame(): void {
    // Initialize seesaw in center bottom
    this.seesaw = {
      x: this.config.width / 2 - 80,
      y: this.config.height - 60,
      width: 160,
      height: 20,
      angle: 0,
      leftSide: { x: 0, y: 0 },
      rightSide: { x: 0, y: 0 },
      fulcrum: { x: this.config.width / 2, y: this.config.height - 50 }
    };

    this.updateSeesawPositions();

    // Initialize two clowns
    this.clowns = [
      {
        x: this.seesaw.leftSide.x - 10,
        y: this.seesaw.leftSide.y - 20,
        vx: 0,
        vy: 0,
        width: 20,
        height: 20,
        onSeesaw: true,
        color: '#FF0000'
      },
      {
        x: this.seesaw.rightSide.x - 10,
        y: this.seesaw.rightSide.y - 20,
        vx: 0,
        vy: 0,
        width: 20,
        height: 20,
        onSeesaw: true,
        color: '#0000FF'
      }
    ];

    this.balloons = [];
    this.particles = [];
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameState = 'playing';
    this.currentClown = 0;
    this.balloonTimer = 0;
    this.balloonSpawnRate = 180;

    this.spawnInitialBalloons();
  }

  private updateSeesawPositions(): void {
    const halfWidth = this.seesaw.width / 2;
    const cos = Math.cos(this.seesaw.angle);
    const sin = Math.sin(this.seesaw.angle);

    this.seesaw.leftSide = {
      x: this.seesaw.fulcrum.x - halfWidth * cos,
      y: this.seesaw.fulcrum.y - halfWidth * sin
    };

    this.seesaw.rightSide = {
      x: this.seesaw.fulcrum.x + halfWidth * cos,
      y: this.seesaw.fulcrum.y + halfWidth * sin
    };
  }

  private spawnInitialBalloons(): void {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const rows = 3 + this.level;
    const cols = 8;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 40 + col * 55;
        const y = 40 + row * 30;
        
        this.balloons.push({
          x: x,
          y: y,
          width: 20,
          height: 25,
          color: colors[Math.floor(Math.random() * colors.length)],
          value: (rows - row) * 10, // Higher balloons worth more
          popped: false,
          popAnimation: 0
        });
      }
    }
  }

  private spawnNewBalloon(): void {
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
    const x = Math.random() * (this.config.width - 40) + 20;
    const y = Math.random() * 100 + 20;
    
    this.balloons.push({
      x: x,
      y: y,
      width: 20,
      height: 25,
      color: colors[Math.floor(Math.random() * colors.length)],
      value: 50 + Math.floor(Math.random() * 50),
      popped: false,
      popAnimation: 0
    });
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
        this.spawnInitialBalloons();
        this.gameState = 'playing';
      }
      return;
    }

    if (this.isKeyPressed('FIRE', event) || event.key === ' ') {
      this.launchClown();
    }

    if (this.isKeyPressed('LEFT', event) || event.key.toLowerCase() === 'a') {
      this.currentClown = 0;
    }

    if (this.isKeyPressed('RIGHT', event) || event.key.toLowerCase() === 'd') {
      this.currentClown = 1;
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
      this.spawnInitialBalloons();
      this.gameState = 'playing';
      return;
    }

    const touch = event.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Select clown based on touch side
    if (x < this.config.width / 2) {
      this.currentClown = 0;
    } else {
      this.currentClown = 1;
    }
    
    // Launch if touching upper area
    if (y < this.config.height * 0.7) {
      this.launchClown();
    }
  }

  private launchClown(): void {
    const clown = this.clowns[this.currentClown];
    
    if (clown.onSeesaw) {
      clown.onSeesaw = false;
      clown.vy = -this.seesawBounce;
      clown.vx = (Math.random() - 0.5) * 4; // Small random horizontal velocity
      
      // Tilt seesaw based on which clown launched
      if (this.currentClown === 0) {
        this.seesaw.angle = Math.min(this.seesaw.angle + 0.3, 0.5);
      } else {
        this.seesaw.angle = Math.max(this.seesaw.angle - 0.3, -0.5);
      }
      
      this.updateSeesawPositions();
    }
  }

  private updateClowns(): void {
    for (let i = 0; i < this.clowns.length; i++) {
      const clown = this.clowns[i];
      
      if (!clown.onSeesaw) {
        // Apply gravity
        clown.vy += this.gravity;
        
        // Update position
        clown.x += clown.vx;
        clown.y += clown.vy;
        
        // Simple air control
        if (this.config.useKeyboard && i === this.currentClown) {
          if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A']) {
            clown.vx = Math.max(clown.vx - 0.2, -4);
          }
          if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D']) {
            clown.vx = Math.min(clown.vx + 0.2, 4);
          }
        }
        
        // Check balloon collisions
        this.checkBalloonCollisions(clown);
        
        // Check seesaw landing
        this.checkSeesawLanding(clown, i);
        
        // Check ground collision (lose life)
        if (clown.y + clown.height >= this.config.height - 20) {
          this.lives--;
          if (this.lives <= 0) {
            this.gameState = 'gameOver';
          } else {
            this.resetClown(clown, i);
          }
        }
        
        // Check side boundaries
        if (clown.x < 0 || clown.x + clown.width > this.config.width) {
          this.lives--;
          if (this.lives <= 0) {
            this.gameState = 'gameOver';
          } else {
            this.resetClown(clown, i);
          }
        }
      }
    }
  }

  private checkBalloonCollisions(clown: Clown): void {
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const balloon = this.balloons[i];
      
      if (!balloon.popped &&
          clown.x < balloon.x + balloon.width &&
          clown.x + clown.width > balloon.x &&
          clown.y < balloon.y + balloon.height &&
          clown.y + clown.height > balloon.y) {
        
        // Pop balloon
        balloon.popped = true;
        balloon.popAnimation = 20;
        this.score += balloon.value;
        
        // Create pop particles
        this.createPopParticles(balloon.x + balloon.width / 2, balloon.y + balloon.height / 2, balloon.color);
        
        // Small bounce for clown
        clown.vy *= -0.3;
      }
    }
  }

  private checkSeesawLanding(clown: Clown, clownIndex: number): void {
    const seesawTop = this.seesaw.fulcrum.y - 10;
    const leftX = this.seesaw.leftSide.x;
    const rightX = this.seesaw.rightSide.x;
    
    if (clown.y + clown.height >= seesawTop &&
        clown.y + clown.height <= seesawTop + 20 &&
        clown.x + clown.width / 2 >= leftX &&
        clown.x + clown.width / 2 <= rightX) {
      
      // Land on seesaw
      clown.onSeesaw = true;
      clown.vy = 0;
      clown.vx = 0;
      
      // Position clown on correct side
      if (clownIndex === 0) {
        clown.x = this.seesaw.leftSide.x - clown.width / 2;
        clown.y = this.seesaw.leftSide.y - clown.height;
      } else {
        clown.x = this.seesaw.rightSide.x - clown.width / 2;
        clown.y = this.seesaw.rightSide.y - clown.height;
      }
      
      // Launch other clown if they're on seesaw
      const otherClown = this.clowns[1 - clownIndex];
      if (otherClown.onSeesaw) {
        otherClown.onSeesaw = false;
        otherClown.vy = -this.seesawBounce * 1.2; // Extra bounce
        otherClown.vx = (Math.random() - 0.5) * 3;
      }
      
      // Reset seesaw angle gradually
      this.seesaw.angle *= 0.7;
      this.updateSeesawPositions();
    }
  }

  private resetClown(clown: Clown, clownIndex: number): void {
    clown.onSeesaw = true;
    clown.vy = 0;
    clown.vx = 0;
    
    if (clownIndex === 0) {
      clown.x = this.seesaw.leftSide.x - clown.width / 2;
      clown.y = this.seesaw.leftSide.y - clown.height;
    } else {
      clown.x = this.seesaw.rightSide.x - clown.width / 2;
      clown.y = this.seesaw.rightSide.y - clown.height;
    }
  }

  private createPopParticles(x: number, y: number, color: string): void {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        color: color,
        size: 3 + Math.random() * 3
      });
    }
  }

  private updateBalloons(): void {
    // Update pop animations
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const balloon = this.balloons[i];
      
      if (balloon.popped) {
        balloon.popAnimation--;
        if (balloon.popAnimation <= 0) {
          this.balloons.splice(i, 1);
        }
      }
    }
    
    // Spawn new balloons occasionally
    this.balloonTimer++;
    if (this.balloonTimer >= this.balloonSpawnRate) {
      this.spawnNewBalloon();
      this.balloonTimer = 0;
      this.balloonSpawnRate = Math.max(60, this.balloonSpawnRate - 2); // Spawn faster over time
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // Gravity
      particle.life++;
      
      if (particle.life >= particle.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    this.updateClowns();
    this.updateBalloons();
    this.updateParticles();

    // Check win condition (all initial balloons popped)
    const initialBalloons = this.balloons.filter(b => !b.popped && b.value <= 50);
    if (initialBalloons.length === 0) {
      this.gameState = 'levelComplete';
    }
  }

  protected render(): void {
    // Sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Ground
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, this.config.height - 20, this.config.width, 20);

    // Draw seesaw
    this.ctx.save();
    this.ctx.translate(this.seesaw.fulcrum.x, this.seesaw.fulcrum.y);
    this.ctx.rotate(this.seesaw.angle);
    
    // Seesaw plank
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(-this.seesaw.width / 2, -5, this.seesaw.width, 10);
    
    this.ctx.restore();
    
    // Seesaw fulcrum
    this.ctx.fillStyle = '#696969';
    this.ctx.beginPath();
    this.ctx.moveTo(this.seesaw.fulcrum.x - 20, this.seesaw.fulcrum.y + 10);
    this.ctx.lineTo(this.seesaw.fulcrum.x, this.seesaw.fulcrum.y - 10);
    this.ctx.lineTo(this.seesaw.fulcrum.x + 20, this.seesaw.fulcrum.y + 10);
    this.ctx.closePath();
    this.ctx.fill();

    // Draw balloons
    for (const balloon of this.balloons) {
      if (!balloon.popped) {
        // Balloon body
        this.ctx.fillStyle = balloon.color;
        this.ctx.beginPath();
        this.ctx.ellipse(
          balloon.x + balloon.width / 2,
          balloon.y + balloon.height * 0.7,
          balloon.width / 2,
          balloon.height * 0.7,
          0, 0, Math.PI * 2
        );
        this.ctx.fill();
        
        // Balloon string
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(balloon.x + balloon.width / 2, balloon.y + balloon.height);
        this.ctx.lineTo(balloon.x + balloon.width / 2, balloon.y + balloon.height + 10);
        this.ctx.stroke();
        
        // Value text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          balloon.value.toString(),
          balloon.x + balloon.width / 2,
          balloon.y + balloon.height / 2 + 3
        );
      } else if (balloon.popAnimation > 0) {
        // Pop animation
        const alpha = balloon.popAnimation / 20;
        this.ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(
          balloon.x + balloon.width / 2,
          balloon.y + balloon.height / 2,
          (20 - balloon.popAnimation) * 2,
          0, Math.PI * 2
        );
        this.ctx.fill();
      }
    }

    // Draw particles
    for (const particle of this.particles) {
      const alpha = 1 - (particle.life / particle.maxLife);
      this.ctx.fillStyle = particle.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw clowns
    for (let i = 0; i < this.clowns.length; i++) {
      const clown = this.clowns[i];
      
      // Clown body
      this.ctx.fillStyle = clown.color;
      this.ctx.fillRect(clown.x, clown.y, clown.width, clown.height);
      
      // Clown face
      this.ctx.fillStyle = '#FFDBAC';
      this.ctx.fillRect(clown.x + 2, clown.y + 2, clown.width - 4, clown.height / 2 - 2);
      
      // Clown eyes
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(clown.x + 4, clown.y + 4, 2, 2);
      this.ctx.fillRect(clown.x + clown.width - 6, clown.y + 4, 2, 2);
      
      // Clown nose
      this.ctx.fillStyle = '#FF0000';
      this.ctx.beginPath();
      this.ctx.arc(clown.x + clown.width / 2, clown.y + 8, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Current clown indicator
      if (i === this.currentClown) {
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(clown.x - 2, clown.y - 2, clown.width + 4, clown.height + 4);
      }
    }

    // HUD
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Score: ${this.score}`, 10, 25);
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
    this.ctx.fillText(`Level: ${this.level}`, 10, 65);

    // Current clown indicator
    this.ctx.fillText(`Clown: ${this.currentClown + 1}`, this.config.width - 100, 25);

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
    } else if (this.score === 0) {
      // Instructions
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(20, this.config.height - 140, this.config.width - 40, 120);
      
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = '14px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Launch clowns from the seesaw to pop balloons!', this.config.width / 2, this.config.height - 115);
      this.ctx.fillText('Launch: Space or tap', this.config.width / 2, this.config.height - 95);
      this.ctx.fillText('Switch clown: A/D or ←/→', this.config.width / 2, this.config.height - 75);
      this.ctx.fillText('Steer in air: A/D or ←/→', this.config.width / 2, this.config.height - 55);
      this.ctx.fillText('Land on seesaw to bounce the other clown!', this.config.width / 2, this.config.height - 35);
      
      this.ctx.textAlign = 'left';
    }
  }
}