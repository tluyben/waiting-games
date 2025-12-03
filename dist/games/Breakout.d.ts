import { GameEngine, MobileControlsConfig } from '../GameEngine';
import { GameConfig } from '../types';
export declare class Breakout extends GameEngine {
    private ball;
    private paddle;
    private bricks;
    private score;
    private lives;
    private gameState;
    private readonly DESIGN_WIDTH;
    private readonly DESIGN_HEIGHT;
    constructor(container: HTMLElement | string, config?: GameConfig);
    protected getMobileControlsConfig(): MobileControlsConfig;
    protected onActionButtonPress(): void;
    protected onActionButtonRelease(): void;
    private initGame;
    private createBricks;
    private launchBall;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleKeyUp(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    protected handleTouchMove(event: TouchEvent): void;
    private clampPaddle;
    protected update(): void;
    private checkPaddleCollision;
    private checkBrickCollisions;
    private resetBall;
    protected render(): void;
}
