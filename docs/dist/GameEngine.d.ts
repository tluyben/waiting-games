import { GameConfig, GameInstance, KeyMapping } from './types';
export declare abstract class GameEngine implements GameInstance {
    protected canvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;
    protected config: Required<GameConfig>;
    protected keyMap: Required<KeyMapping>;
    protected animationId: number | null;
    protected isRunning: boolean;
    protected isPaused: boolean;
    constructor(container: HTMLElement | string, config?: GameConfig);
    protected setupControls(): void;
    protected setupMobileControls(): void;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected isKeyPressed(action: keyof KeyMapping, event: KeyboardEvent): boolean;
    protected handleKeyUp(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    protected handleTouchMove(event: TouchEvent): void;
    protected handleTouchEnd(event: TouchEvent): void;
    protected gameLoop(): void;
    protected abstract update(): void;
    protected abstract render(): void;
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
}
