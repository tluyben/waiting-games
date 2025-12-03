import { GameConfig, GameInstance, KeyMapping } from './types';

// Control type definitions for different games
export type MobileControlType = 'dpad' | 'joystick';
export type ActionButtonType = 'fire' | 'action' | 'none';

export interface MobileControlsConfig {
  controlType: MobileControlType;
  showDpad: boolean;
  showActionButton: boolean;
  actionButtonLabel: string;
  showSecondaryButton: boolean;
  secondaryButtonLabel: string;
}

// Detect if the device is mobile/tablet
export function isMobileDevice(): boolean {
  // Check for touch support
  const hasTouchScreen = 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    ((navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints ?? 0) > 0;

  // Check user agent for mobile/tablet
  const userAgent = navigator.userAgent?.toLowerCase() ?? '';
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(userAgent);

  // Check screen size (tablets and phones typically < 1024px width in portrait)
  const isSmallScreen = window.innerWidth <= 1024 || window.innerHeight <= 1024;

  return hasTouchScreen && (isMobileUA || isSmallScreen);
}

export abstract class GameEngine implements GameInstance {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected config: Required<GameConfig>;
  protected keyMap: Required<KeyMapping>;
  protected keys: { [key: string]: boolean } = {};
  protected animationId: number | null = null;
  protected isRunning = false;
  protected isPaused = false;
  protected isMobile: boolean;

  // Mobile controls state
  protected mobileControlsContainer: HTMLDivElement | null = null;
  protected dpadState: { up: boolean; down: boolean; left: boolean; right: boolean } = {
    up: false, down: false, left: false, right: false
  };
  protected actionButtonPressed = false;
  protected secondaryButtonPressed = false;

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

    // Detect mobile device
    this.isMobile = isMobileDevice();

    this.config = {
      useKeyboard: true,
      useMobile: this.isMobile, // Auto-enable mobile controls on mobile devices
      width: 600,
      height: 400,
      theme: 'classic',
      keys: {},
      ...config
    };

    // If explicitly set in config, use that value
    if (config.useMobile !== undefined) {
      this.config.useMobile = config.useMobile;
    }

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
    this.canvas.style.display = 'block';

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
    // Set up touch events on canvas for backwards compatibility
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

    // Create visible mobile controls overlay if on mobile
    if (this.isMobile && this.config.useMobile) {
      this.createMobileControlsOverlay();
    }
  }

  // Get mobile controls configuration - subclasses should override this
  protected getMobileControlsConfig(): MobileControlsConfig {
    return {
      controlType: 'dpad',
      showDpad: true,
      showActionButton: true,
      actionButtonLabel: 'A',
      showSecondaryButton: false,
      secondaryButtonLabel: 'B'
    };
  }

  protected createMobileControlsOverlay(): void {
    const controlsConfig = this.getMobileControlsConfig();

    // Create container for mobile controls
    this.mobileControlsContainer = document.createElement('div');
    this.mobileControlsContainer.className = 'mobile-controls-overlay';
    this.mobileControlsContainer.style.cssText = `
      position: relative;
      width: ${this.config.width}px;
      height: 120px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    `;

    // Create D-Pad
    if (controlsConfig.showDpad) {
      const dpad = this.createDpad();
      this.mobileControlsContainer.appendChild(dpad);
    } else {
      // Add spacer if no d-pad
      const spacer = document.createElement('div');
      spacer.style.width = '120px';
      this.mobileControlsContainer.appendChild(spacer);
    }

    // Create action buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 15px;
      align-items: center;
    `;

    if (controlsConfig.showSecondaryButton) {
      const secondaryButton = this.createActionButton(
        controlsConfig.secondaryButtonLabel,
        '#666',
        () => { this.secondaryButtonPressed = true; this.onSecondaryButtonPress(); },
        () => { this.secondaryButtonPressed = false; this.onSecondaryButtonRelease(); }
      );
      buttonsContainer.appendChild(secondaryButton);
    }

    if (controlsConfig.showActionButton) {
      const actionButton = this.createActionButton(
        controlsConfig.actionButtonLabel,
        '#e74c3c',
        () => { this.actionButtonPressed = true; this.onActionButtonPress(); },
        () => { this.actionButtonPressed = false; this.onActionButtonRelease(); }
      );
      buttonsContainer.appendChild(actionButton);
    }

    this.mobileControlsContainer.appendChild(buttonsContainer);

    // Insert controls after canvas
    if (this.canvas.parentNode) {
      this.canvas.parentNode.insertBefore(this.mobileControlsContainer, this.canvas.nextSibling);
    }
  }

  protected createDpad(): HTMLDivElement {
    const dpad = document.createElement('div');
    dpad.style.cssText = `
      position: relative;
      width: 120px;
      height: 120px;
    `;

    // Common button style
    const buttonStyle = `
      position: absolute;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    `;

    // Up button
    const upBtn = document.createElement('div');
    upBtn.innerHTML = '▲';
    upBtn.style.cssText = buttonStyle + 'left: 40px; top: 0;';
    this.setupDpadButton(upBtn, 'up');
    dpad.appendChild(upBtn);

    // Down button
    const downBtn = document.createElement('div');
    downBtn.innerHTML = '▼';
    downBtn.style.cssText = buttonStyle + 'left: 40px; bottom: 0;';
    this.setupDpadButton(downBtn, 'down');
    dpad.appendChild(downBtn);

    // Left button
    const leftBtn = document.createElement('div');
    leftBtn.innerHTML = '◀';
    leftBtn.style.cssText = buttonStyle + 'left: 0; top: 40px;';
    this.setupDpadButton(leftBtn, 'left');
    dpad.appendChild(leftBtn);

    // Right button
    const rightBtn = document.createElement('div');
    rightBtn.innerHTML = '▶';
    rightBtn.style.cssText = buttonStyle + 'right: 0; top: 40px;';
    this.setupDpadButton(rightBtn, 'right');
    dpad.appendChild(rightBtn);

    // Center (optional visual)
    const center = document.createElement('div');
    center.style.cssText = `
      position: absolute;
      left: 40px;
      top: 40px;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
    `;
    dpad.appendChild(center);

    return dpad;
  }

  protected setupDpadButton(button: HTMLDivElement, direction: 'up' | 'down' | 'left' | 'right'): void {
    const handlePress = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.dpadState[direction] = true;
      this.updateKeysFromDpad();
      (button as HTMLElement).style.background = 'rgba(255, 255, 255, 0.6)';
    };

    const handleRelease = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      this.dpadState[direction] = false;
      this.updateKeysFromDpad();
      (button as HTMLElement).style.background = 'rgba(255, 255, 255, 0.3)';
    };

    button.addEventListener('touchstart', handlePress, { passive: false });
    button.addEventListener('touchend', handleRelease, { passive: false });
    button.addEventListener('touchcancel', handleRelease, { passive: false });
    button.addEventListener('mousedown', handlePress);
    button.addEventListener('mouseup', handleRelease);
    button.addEventListener('mouseleave', handleRelease);
  }

  protected updateKeysFromDpad(): void {
    // Update keys object based on d-pad state
    this.keys['ArrowUp'] = this.dpadState.up;
    this.keys['ArrowDown'] = this.dpadState.down;
    this.keys['ArrowLeft'] = this.dpadState.left;
    this.keys['ArrowRight'] = this.dpadState.right;
    this.keys['w'] = this.dpadState.up;
    this.keys['W'] = this.dpadState.up;
    this.keys['s'] = this.dpadState.down;
    this.keys['S'] = this.dpadState.down;
    this.keys['a'] = this.dpadState.left;
    this.keys['A'] = this.dpadState.left;
    this.keys['d'] = this.dpadState.right;
    this.keys['D'] = this.dpadState.right;
  }

  protected createActionButton(
    label: string,
    color: string,
    onPress: () => void,
    onRelease: () => void
  ): HTMLDivElement {
    const button = document.createElement('div');
    button.innerHTML = label;
    button.style.cssText = `
      width: 60px;
      height: 60px;
      background: ${color};
      border: 3px solid rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      color: white;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    `;

    const handlePress = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      button.style.transform = 'scale(0.9)';
      button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
      onPress();
    };

    const handleRelease = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
      onRelease();
    };

    button.addEventListener('touchstart', handlePress, { passive: false });
    button.addEventListener('touchend', handleRelease, { passive: false });
    button.addEventListener('touchcancel', handleRelease, { passive: false });
    button.addEventListener('mousedown', handlePress);
    button.addEventListener('mouseup', handleRelease);
    button.addEventListener('mouseleave', handleRelease);

    return button;
  }

  // Action button handlers - subclasses can override
  protected onActionButtonPress(): void {
    // Simulate space bar press
    this.keys[' '] = true;
    this.keys[this.keyMap.FIRE] = true;
  }

  protected onActionButtonRelease(): void {
    this.keys[' '] = false;
    this.keys[this.keyMap.FIRE] = false;
  }

  protected onSecondaryButtonPress(): void {
    // Default: no action
  }

  protected onSecondaryButtonRelease(): void {
    // Default: no action
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
    if (this.mobileControlsContainer && this.mobileControlsContainer.parentNode) {
      this.mobileControlsContainer.parentNode.removeChild(this.mobileControlsContainer);
    }
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}