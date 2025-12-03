import { GameEngine } from '../GameEngine';
import { GameConfig, Point } from '../types';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Bullet extends Point {
  vx: number;
  vy: number;
  width: number;
  height: number;
  active: boolean;
  isPlayer: boolean;
}

interface Invader {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  type: number;
  frame: number;
}

interface Shield {
  x: number;
  y: number;
  pixels: boolean[][];
}

interface Star {
  x: number;
  y: number;
  brightness: number;
  twinkleSpeed: number;
}

export class SpaceInvaders extends GameEngine {
  private player: Player;
  private bullets: Bullet[] = [];
  private invaders: Invader[] = [];
  private shields: Shield[] = [];
  private stars: Star[] = [];
  private score = 0;
  private lives = 3;
  private highScore = 0;
  private gameState: 'playing' | 'gameOver' | 'won' = 'playing';
  private invaderDirection = 1;
  private invaderMoveTimer = 0;
  private invaderAnimTimer = 0;
  private shootCooldown = 0;
  private explosions: { x: number; y: number; frame: number; maxFrames: number }[] = [];

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    super(container, config);
    this.createStars();
    this.initGame();
  }

  private createStars(): void {
    this.stars = [];
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * this.config.width,
        y: Math.random() * (this.config.height - 100),
        brightness: Math.random() * 0.5 + 0.3,
        twinkleSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }

  private initGame(): void {
    this.player = {
      x: this.config.width / 2 - 20,
      y: this.config.height - 50,
      width: 40,
      height: 24,
      speed: 5
    };

    this.score = 0;
    this.lives = 3;
    this.gameState = 'playing';
    this.bullets = [];
    this.explosions = [];
    this.invaderDirection = 1;
    this.invaderMoveTimer = 0;
    this.invaderAnimTimer = 0;
    this.shootCooldown = 0;
    this.createInvaders();
    this.createShields();
  }

  private createInvaders(): void {
    this.invaders = [];
    const rows = 5;
    const cols = 11;
    const invaderWidth = 24;
    const invaderHeight = 16;
    const spacingX = 12;
    const spacingY = 12;
    const startX = (this.config.width - (cols * (invaderWidth + spacingX) - spacingX)) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.invaders.push({
          x: startX + col * (invaderWidth + spacingX),
          y: row * (invaderHeight + spacingY) + 60,
          width: invaderWidth,
          height: invaderHeight,
          active: true,
          type: row === 0 ? 3 : row < 3 ? 2 : 1,
          frame: 0
        });
      }
    }
  }

  private createShields(): void {
    this.shields = [];
    const shieldCount = 4;
    const shieldWidth = 44;
    const shieldHeight = 32;
    const spacing = (this.config.width - shieldCount * shieldWidth) / (shieldCount + 1);

    for (let i = 0; i < shieldCount; i++) {
      const pixels: boolean[][] = [];
      for (let y = 0; y < shieldHeight; y++) {
        pixels[y] = [];
        for (let x = 0; x < shieldWidth; x++) {
          // Create shield shape with arch cutout at bottom
          const inArch = y > shieldHeight - 12 &&
                        x > shieldWidth / 2 - 8 &&
                        x < shieldWidth / 2 + 8;
          const inTopCorner = y < 4 && (x < 4 || x >= shieldWidth - 4);
          pixels[y][x] = !inArch && !inTopCorner;
        }
      }
      this.shields.push({
        x: spacing + i * (shieldWidth + spacing),
        y: this.config.height - 120,
        pixels
      });
    }
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    super.handleKeyDown(event);
    this.keys[event.key] = true;

    if (this.isKeyPressed('FIRE', event) && this.shootCooldown <= 0) {
      this.playerShoot();
      this.shootCooldown = 20;
    }

    if (this.isKeyPressed('START', event) && (this.gameState === 'gameOver' || this.gameState === 'won')) {
      this.initGame();
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
    
    if (x < this.config.width / 3) {
      this.keys['left'] = true;
    } else if (x > (2 * this.config.width) / 3) {
      this.keys['right'] = true;
    } else {
      if (this.shootCooldown <= 0) {
        this.playerShoot();
        this.shootCooldown = 20;
      }
    }
  }

  protected handleTouchEnd(event: TouchEvent): void {
    super.handleTouchEnd(event);
    this.keys['left'] = false;
    this.keys['right'] = false;
  }

  private playerShoot(): void {
    this.bullets.push({
      x: this.player.x + this.player.width / 2 - 1,
      y: this.player.y,
      vx: 0,
      vy: -8,
      width: 2,
      height: 8,
      active: true,
      isPlayer: true
    });
  }

  private invaderShoot(): void {
    const activeInvaders = this.invaders.filter(inv => inv.active);
    if (activeInvaders.length === 0) return;

    if (Math.random() < 0.02) {
      const shooter = activeInvaders[Math.floor(Math.random() * activeInvaders.length)];
      this.bullets.push({
        x: shooter.x + shooter.width / 2 - 1,
        y: shooter.y + shooter.height,
        vx: 0,
        vy: 3,
        width: 2,
        height: 8,
        active: true,
        isPlayer: false
      });
    }
  }

  protected update(): void {
    if (this.gameState !== 'playing') return;

    if (this.shootCooldown > 0) this.shootCooldown--;

    // Handle keyboard movement with support for arrow keys and WASD
    if (this.config.useKeyboard) {
      if (this.keys[this.keyMap.LEFT] || this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) {
        this.player.x -= this.player.speed;
      }
      if (this.keys[this.keyMap.RIGHT] || this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) {
        this.player.x += this.player.speed;
      }
    }

    this.player.x = Math.max(0, Math.min(this.config.width - this.player.width, this.player.x));

    // Update bullets
    this.bullets = this.bullets.filter(bullet => {
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;
      return bullet.active && bullet.y > -bullet.height && bullet.y < this.config.height + bullet.height;
    });

    // Update explosions
    this.explosions = this.explosions.filter(exp => {
      exp.frame++;
      return exp.frame < exp.maxFrames;
    });

    // Update star twinkle
    for (const star of this.stars) {
      star.brightness += star.twinkleSpeed;
      if (star.brightness > 0.8 || star.brightness < 0.3) {
        star.twinkleSpeed = -star.twinkleSpeed;
      }
    }

    this.checkBulletCollisions();
    this.checkShieldCollisions();
    this.updateInvaders();
    this.invaderShoot();

    const activeInvaders = this.invaders.filter(inv => inv.active);
    if (activeInvaders.length === 0) {
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
      this.gameState = 'won';
    }

    if (this.lives <= 0) {
      if (this.score > this.highScore) {
        this.highScore = this.score;
      }
      this.gameState = 'gameOver';
    }

    const lowestInvader = activeInvaders.length > 0
      ? Math.max(...activeInvaders.map(inv => inv.y + inv.height))
      : 0;
    if (lowestInvader > this.player.y) {
      this.gameState = 'gameOver';
    }
  }

  private checkShieldCollisions(): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      for (const shield of this.shields) {
        const localX = Math.floor(bullet.x - shield.x);
        const localY = Math.floor(bullet.y - shield.y);

        if (localX >= 0 && localX < shield.pixels[0].length &&
            localY >= 0 && localY < shield.pixels.length) {
          // Check a small area around the bullet
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const py = localY + dy;
              const px = localX + dx;
              if (py >= 0 && py < shield.pixels.length &&
                  px >= 0 && px < shield.pixels[0].length &&
                  shield.pixels[py][px]) {
                // Damage shield
                shield.pixels[py][px] = false;
                bullet.active = false;
                // Add explosion effect
                this.explosions.push({
                  x: shield.x + px,
                  y: shield.y + py,
                  frame: 0,
                  maxFrames: 8
                });
              }
            }
          }
        }
      }
    }
  }

  private updateInvaders(): void {
    const activeInvaders = this.invaders.filter(inv => inv.active);
    if (activeInvaders.length === 0) return;

    // Speed up as fewer invaders remain
    const speedMultiplier = Math.max(1, 6 - Math.floor(activeInvaders.length / 10));
    this.invaderMoveTimer++;
    this.invaderAnimTimer++;

    // Animate invaders (switch frames)
    if (this.invaderAnimTimer >= 15) {
      this.invaderAnimTimer = 0;
      for (const invader of this.invaders) {
        invader.frame = invader.frame === 0 ? 1 : 0;
      }
    }

    // Move invaders in steps (more authentic feel)
    if (this.invaderMoveTimer >= Math.max(5, 30 - speedMultiplier * 4)) {
      this.invaderMoveTimer = 0;

      // Check if any invader will hit the edge
      let hitEdge = false;
      for (const invader of activeInvaders) {
        const nextX = invader.x + this.invaderDirection * 8;
        if (nextX <= 0 || nextX >= this.config.width - invader.width) {
          hitEdge = true;
          break;
        }
      }

      if (hitEdge) {
        // Move down and reverse direction
        this.invaderDirection *= -1;
        for (const invader of activeInvaders) {
          invader.y += 16;
        }
      } else {
        // Move sideways
        for (const invader of activeInvaders) {
          invader.x += this.invaderDirection * 8;
        }
      }
    }
  }

  private checkBulletCollisions(): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      if (bullet.isPlayer) {
        for (const invader of this.invaders) {
          if (invader.active && this.checkCollision(bullet, invader)) {
            bullet.active = false;
            invader.active = false;
            this.score += invader.type * 10;
            // Add explosion effect
            this.explosions.push({
              x: invader.x + invader.width / 2,
              y: invader.y + invader.height / 2,
              frame: 0,
              maxFrames: 15
            });
            break;
          }
        }
      } else {
        if (this.checkCollision(bullet, this.player)) {
          bullet.active = false;
          this.lives--;
          // Add player hit explosion
          this.explosions.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            frame: 0,
            maxFrames: 20
          });
        }
      }
    }
  }

  private checkCollision(obj1: any, obj2: any): boolean {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }

  protected render(): void {
    // Dark space background
    this.ctx.fillStyle = '#0a0a15';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    // Draw twinkling stars
    for (const star of this.stars) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      this.ctx.fillRect(star.x, star.y, 1, 1);
    }

    // Draw shields
    this.ctx.fillStyle = '#33ff33';
    for (const shield of this.shields) {
      for (let y = 0; y < shield.pixels.length; y++) {
        for (let x = 0; x < shield.pixels[y].length; x++) {
          if (shield.pixels[y][x]) {
            this.ctx.fillRect(shield.x + x, shield.y + y, 1, 1);
          }
        }
      }
    }

    // Draw player ship (cannon style)
    this.drawPlayer();

    // Draw invaders with proper pixel art style
    for (const invader of this.invaders) {
      if (invader.active) {
        this.drawInvader(invader);
      }
    }

    // Draw bullets
    for (const bullet of this.bullets) {
      if (bullet.active) {
        if (bullet.isPlayer) {
          // Player bullet - bright green/cyan laser
          const gradient = this.ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bullet.height);
          gradient.addColorStop(0, '#00ffff');
          gradient.addColorStop(1, '#00ff00');
          this.ctx.fillStyle = gradient;
          this.ctx.fillRect(bullet.x, bullet.y, bullet.width + 1, bullet.height);
          // Glow effect
          this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
          this.ctx.fillRect(bullet.x - 1, bullet.y, bullet.width + 3, bullet.height);
        } else {
          // Enemy bullet - zigzag pattern
          this.ctx.fillStyle = '#ff4444';
          const zigzag = Math.floor(bullet.y / 4) % 2 === 0 ? 1 : -1;
          this.ctx.fillRect(bullet.x + zigzag, bullet.y, bullet.width, 4);
          this.ctx.fillRect(bullet.x - zigzag, bullet.y + 4, bullet.width, 4);
        }
      }
    }

    // Draw explosions
    for (const exp of this.explosions) {
      this.drawExplosion(exp);
    }

    // Draw HUD with retro styling
    this.drawHUD();

    // Draw game over/won screens
    if (this.gameState === 'gameOver' || this.gameState === 'won') {
      this.drawEndScreen();
    }

    // Draw mobile controls if enabled
    if (this.config.useMobile && this.gameState === 'playing') {
      this.drawMobileControls();
    }

    this.ctx.textAlign = 'left';
  }

  private drawPlayer(): void {
    const px = this.player.x;
    const py = this.player.y;
    const w = this.player.width;
    const h = this.player.height;

    // Main ship body - classic cannon shape
    this.ctx.fillStyle = '#33ff33';

    // Base
    this.ctx.fillRect(px, py + h - 6, w, 6);

    // Middle section
    this.ctx.fillRect(px + 4, py + h - 12, w - 8, 6);

    // Top cannon
    this.ctx.fillRect(px + w/2 - 3, py, 6, h - 12);

    // Cannon tip highlight
    this.ctx.fillStyle = '#66ff66';
    this.ctx.fillRect(px + w/2 - 2, py, 4, 4);
  }

  private drawInvader(invader: Invader): void {
    const x = invader.x;
    const y = invader.y;
    const w = invader.width;
    const h = invader.height;
    const frame = invader.frame;

    // Different colors and shapes for different types
    if (invader.type === 3) {
      // Top row - squid type (magenta/pink)
      this.ctx.fillStyle = '#ff00ff';
      this.drawSquidInvader(x, y, w, h, frame);
    } else if (invader.type === 2) {
      // Middle rows - crab type (cyan)
      this.ctx.fillStyle = '#00ffff';
      this.drawCrabInvader(x, y, w, h, frame);
    } else {
      // Bottom rows - octopus type (green)
      this.ctx.fillStyle = '#00ff00';
      this.drawOctopusInvader(x, y, w, h, frame);
    }
  }

  private drawSquidInvader(x: number, y: number, w: number, h: number, frame: number): void {
    const scale = w / 16;
    // Squid-like invader
    this.ctx.fillRect(x + 6*scale, y, 4*scale, 2*scale);
    this.ctx.fillRect(x + 4*scale, y + 2*scale, 8*scale, 2*scale);
    this.ctx.fillRect(x + 2*scale, y + 4*scale, 12*scale, 2*scale);
    this.ctx.fillRect(x + 2*scale, y + 6*scale, 3*scale, 2*scale);
    this.ctx.fillRect(x + 6*scale, y + 6*scale, 4*scale, 2*scale);
    this.ctx.fillRect(x + 11*scale, y + 6*scale, 3*scale, 2*scale);
    if (frame === 0) {
      this.ctx.fillRect(x + 4*scale, y + 8*scale, 2*scale, 2*scale);
      this.ctx.fillRect(x + 10*scale, y + 8*scale, 2*scale, 2*scale);
    } else {
      this.ctx.fillRect(x + 2*scale, y + 8*scale, 2*scale, 2*scale);
      this.ctx.fillRect(x + 12*scale, y + 8*scale, 2*scale, 2*scale);
    }
    // Eyes
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 5*scale, y + 4*scale, 2*scale, 2*scale);
    this.ctx.fillRect(x + 9*scale, y + 4*scale, 2*scale, 2*scale);
  }

  private drawCrabInvader(x: number, y: number, w: number, h: number, frame: number): void {
    const scale = w / 16;
    // Crab-like invader
    this.ctx.fillRect(x + 3*scale, y, 2*scale, 2*scale);
    this.ctx.fillRect(x + 11*scale, y, 2*scale, 2*scale);
    this.ctx.fillRect(x + 4*scale, y + 2*scale, 8*scale, 2*scale);
    this.ctx.fillRect(x + 2*scale, y + 4*scale, 12*scale, 2*scale);
    this.ctx.fillRect(x + 1*scale, y + 6*scale, 14*scale, 2*scale);
    this.ctx.fillRect(x + 1*scale, y + 8*scale, 2*scale, 2*scale);
    this.ctx.fillRect(x + 5*scale, y + 8*scale, 6*scale, 2*scale);
    this.ctx.fillRect(x + 13*scale, y + 8*scale, 2*scale, 2*scale);
    if (frame === 0) {
      this.ctx.fillRect(x + 2*scale, y + 10*scale, 3*scale, 2*scale);
      this.ctx.fillRect(x + 11*scale, y + 10*scale, 3*scale, 2*scale);
    } else {
      this.ctx.fillRect(x, y + 10*scale, 3*scale, 2*scale);
      this.ctx.fillRect(x + 13*scale, y + 10*scale, 3*scale, 2*scale);
    }
    // Eyes
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 4*scale, y + 4*scale, 2*scale, 2*scale);
    this.ctx.fillRect(x + 10*scale, y + 4*scale, 2*scale, 2*scale);
  }

  private drawOctopusInvader(x: number, y: number, w: number, h: number, frame: number): void {
    const scale = w / 16;
    // Octopus-like invader
    this.ctx.fillRect(x + 5*scale, y, 6*scale, 2*scale);
    this.ctx.fillRect(x + 3*scale, y + 2*scale, 10*scale, 2*scale);
    this.ctx.fillRect(x + 2*scale, y + 4*scale, 12*scale, 2*scale);
    this.ctx.fillRect(x + 1*scale, y + 6*scale, 14*scale, 2*scale);
    this.ctx.fillRect(x + 1*scale, y + 8*scale, 3*scale, 2*scale);
    this.ctx.fillRect(x + 6*scale, y + 8*scale, 4*scale, 2*scale);
    this.ctx.fillRect(x + 12*scale, y + 8*scale, 3*scale, 2*scale);
    if (frame === 0) {
      this.ctx.fillRect(x + 3*scale, y + 10*scale, 2*scale, 2*scale);
      this.ctx.fillRect(x + 7*scale, y + 10*scale, 2*scale, 2*scale);
      this.ctx.fillRect(x + 11*scale, y + 10*scale, 2*scale, 2*scale);
    } else {
      this.ctx.fillRect(x + 2*scale, y + 10*scale, 3*scale, 2*scale);
      this.ctx.fillRect(x + 11*scale, y + 10*scale, 3*scale, 2*scale);
    }
    // Eyes
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(x + 4*scale, y + 4*scale, 2*scale, 2*scale);
    this.ctx.fillRect(x + 10*scale, y + 4*scale, 2*scale, 2*scale);
  }

  private drawExplosion(exp: { x: number; y: number; frame: number; maxFrames: number }): void {
    const progress = exp.frame / exp.maxFrames;
    const size = 15 + progress * 10;
    const alpha = 1 - progress;

    this.ctx.save();
    this.ctx.translate(exp.x, exp.y);

    // Draw explosion particles
    const particles = 8;
    for (let i = 0; i < particles; i++) {
      const angle = (i / particles) * Math.PI * 2;
      const dist = progress * size;
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist;
      const particleSize = (1 - progress) * 4;

      this.ctx.fillStyle = `rgba(255, ${Math.floor(200 - progress * 150)}, 0, ${alpha})`;
      this.ctx.fillRect(px - particleSize/2, py - particleSize/2, particleSize, particleSize);
    }

    // Central flash
    if (progress < 0.3) {
      const flashSize = (1 - progress/0.3) * 12;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${(1 - progress/0.3) * 0.8})`;
      this.ctx.fillRect(-flashSize/2, -flashSize/2, flashSize, flashSize);
    }

    this.ctx.restore();
  }

  private drawHUD(): void {
    // Score display (left)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 14px "Courier New", monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('SCORE', 10, 18);
    this.ctx.fillStyle = '#33ff33';
    this.ctx.fillText(this.score.toString().padStart(5, '0'), 10, 35);

    // High score display (center)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('HIGH SCORE', this.config.width / 2, 18);
    this.ctx.fillStyle = '#ff3333';
    this.ctx.fillText(this.highScore.toString().padStart(5, '0'), this.config.width / 2, 35);

    // Lives display (right) - draw small ships
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('LIVES', this.config.width - 10, 18);

    this.ctx.fillStyle = '#33ff33';
    for (let i = 0; i < this.lives; i++) {
      const lx = this.config.width - 25 - i * 25;
      const ly = 25;
      // Mini ship icon
      this.ctx.fillRect(lx, ly + 6, 20, 4);
      this.ctx.fillRect(lx + 4, ly + 2, 12, 4);
      this.ctx.fillRect(lx + 8, ly, 4, 2);
    }

    // Bottom line (ground)
    this.ctx.fillStyle = '#33ff33';
    this.ctx.fillRect(0, this.config.height - 4, this.config.width, 2);
  }

  private drawEndScreen(): void {
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);

    this.ctx.textAlign = 'center';

    if (this.gameState === 'gameOver') {
      // Game Over text with red glow
      this.ctx.fillStyle = '#ff0000';
      this.ctx.font = 'bold 36px "Courier New", monospace';
      this.ctx.fillText('GAME OVER', this.config.width / 2, this.config.height / 2 - 40);

      // Decorative line
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.config.width / 2 - 100, this.config.height / 2 - 15);
      this.ctx.lineTo(this.config.width / 2 + 100, this.config.height / 2 - 15);
      this.ctx.stroke();
    } else {
      // Victory text with green glow
      this.ctx.fillStyle = '#00ff00';
      this.ctx.font = 'bold 36px "Courier New", monospace';
      this.ctx.fillText('VICTORY!', this.config.width / 2, this.config.height / 2 - 40);

      // Decorative line
      this.ctx.strokeStyle = '#00ff00';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.config.width / 2 - 100, this.config.height / 2 - 15);
      this.ctx.lineTo(this.config.width / 2 + 100, this.config.height / 2 - 15);
      this.ctx.stroke();
    }

    // Score display
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px "Courier New", monospace';
    this.ctx.fillText(`FINAL SCORE: ${this.score}`, this.config.width / 2, this.config.height / 2 + 20);

    // High score
    if (this.score >= this.highScore && this.score > 0) {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.fillText('NEW HIGH SCORE!', this.config.width / 2, this.config.height / 2 + 50);
    }

    // Restart instruction
    this.ctx.fillStyle = '#aaaaaa';
    this.ctx.font = '16px "Courier New", monospace';
    const blinkOn = Math.floor(Date.now() / 500) % 2 === 0;
    if (blinkOn) {
      this.ctx.fillText('PRESS SPACE TO PLAY AGAIN', this.config.width / 2, this.config.height / 2 + 90);
    }
  }

  private drawMobileControls(): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';

    // Left button
    this.ctx.fillRect(10, this.config.height - 55, 50, 45);
    // Right button
    this.ctx.fillRect(this.config.width - 60, this.config.height - 55, 50, 45);
    // Fire button
    this.ctx.fillRect(this.config.width / 2 - 35, this.config.height - 55, 70, 45);

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = 'bold 18px "Courier New", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('<', 35, this.config.height - 27);
    this.ctx.fillText('>', this.config.width - 35, this.config.height - 27);
    this.ctx.fillText('FIRE', this.config.width / 2, this.config.height - 27);
  }
}