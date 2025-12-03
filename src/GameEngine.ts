import { GameConfig, GameInstance, KeyMapping } from './types';

export abstract class GameEngine implements GameInstance {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected config: Required<GameConfig>;
  protected keyMap: Required<KeyMapping>;
  protected keys: { [key: string]: boolean } = {};
  protected animationId: number | null = null;
  protected isRunning = false;
  protected isPaused = false;

  // Design dimensions - the reference size that games are designed for
  protected designWidth: number;
  protected designHeight: number;
  // Scale factor to convert design coordinates to actual canvas coordinates
  protected scale: number;

  constructor(container: HTMLElement | string, config: GameConfig = {}) {
    const element = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!element) {
      throw new Error('Container element not found');
    }

    this.config = {
      useKeyboard: true,
      useMobile: false,
      width: 600,
      height: 400,
      theme: 'classic',
      keys: {},
      ...config
    };

    this.keyMap = {
      UP: 'ArrowUp',
      DOWN: 'ArrowDown',
      LEFT: 'ArrowLeft',
      RIGHT: 'ArrowRight',
      FIRE: ' ',
      PAUSE: 'p',
      START: 'Enter',
      ...this.config.keys
    };

    // Default design dimensions - subclasses can override these
    this.designWidth = 600;
    this.designHeight = 450;

    // Calculate scale based on the smaller ratio to maintain aspect ratio
    this.scale = Math.min(
      this.config.width / this.designWidth,
      this.config.height / this.designHeight
    );

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.canvas.style.border = '2px solid #333';
    this.canvas.style.backgroundColor = '#000';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;

    element.appendChild(this.canvas);

    this.setupControls();
  }

  // Set design dimensions and recalculate scale
  protected setDesignDimensions(width: number, height: number): void {
    this.designWidth = width;
    this.designHeight = height;
    this.scale = Math.min(
      this.config.width / this.designWidth,
      this.config.height / this.designHeight
    );
  }

  // Convert design coordinate to actual canvas coordinate
  protected scaleX(x: number): number {
    return x * this.scale;
  }

  protected scaleY(y: number): number {
    return y * this.scale;
  }

  // Scale a value (used for sizes, speeds, etc.)
  protected scaleValue(v: number): number {
    return v * this.scale;
  }

  // Get the scaled width (effective game area width in design coordinates)
  protected get scaledWidth(): number {
    return this.config.width / this.scale;
  }

  // Get the scaled height (effective game area height in design coordinates)
  protected get scaledHeight(): number {
    return this.config.height / this.scale;
  }

  protected setupControls(): void {
    if (this.config.useKeyboard) {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    if (this.config.useMobile) {
      this.setupMobileControls();
    }
  }

  protected setupMobileControls(): void {
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    event.preventDefault();
    this.keys[event.key] = true;
  }

  protected isKeyPressed(action: keyof KeyMapping, event: KeyboardEvent): boolean {
    const key = this.keyMap[action];
    return event.key === key || event.key.toLowerCase() === key.toLowerCase();
  }

  protected handleKeyUp(event: KeyboardEvent): void {
    event.preventDefault();
    this.keys[event.key] = false;
  }

  protected handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
  }

  protected handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
  }

  protected handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
  }

  protected gameLoop(): void {
    if (!this.isRunning || this.isPaused) return;

    this.update();
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  protected abstract update(): void;
  protected abstract render(): void;

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.gameLoop();
  }

  destroy(): void {
    this.stop();
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}