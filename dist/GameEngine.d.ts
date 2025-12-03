import { GameConfig, GameInstance, KeyMapping } from './types';
export declare abstract class GameEngine implements GameInstance {
    protected canvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;
    protected config: Required<GameConfig>;
    protected keyMap: Required<KeyMapping>;
    protected keys: {
        [key: string]: boolean;
    };
    protected animationId: number | null;
    protected isRunning: boolean;
    protected isPaused: boolean;
    protected designWidth: number;
    protected designHeight: number;
    protected scale: number;
    constructor(container: HTMLElement | string, config?: GameConfig);
    protected setDesignDimensions(width: number, height: number): void;
    protected scaleX(x: number): number;
    protected scaleY(y: number): number;
    protected scaleValue(v: number): number;
    protected get scaledWidth(): number;
    protected get scaledHeight(): number;
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
