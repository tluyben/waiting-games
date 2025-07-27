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
      width: 400,
      height: 300,
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