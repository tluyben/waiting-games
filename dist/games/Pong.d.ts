import { GameEngine, MobileControlsConfig } from '../GameEngine';
import { GameConfig } from '../types';
export declare class Pong extends GameEngine {
    private ball;
    private leftPaddle;
    private rightPaddle;
    private leftScore;
    private rightScore;
    private gameState;
    private readonly DESIGN_WIDTH;
    private readonly DESIGN_HEIGHT;
    constructor(container: HTMLElement | string, config?: GameConfig);
    protected getMobileControlsConfig(): MobileControlsConfig;
    protected onActionButtonPress(): void;
    protected onActionButtonRelease(): void;
    private initGame;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleKeyUp(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    protected handleTouchMove(event: TouchEvent): void;
    private clampPaddles;
    protected update(): void;
    private checkPaddleCollision;
    private resetBall;
    protected render(): void;
}
