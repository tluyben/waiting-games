import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';
export declare class Pong extends GameEngine {
    private ball;
    private leftPaddle;
    private rightPaddle;
    private leftScore;
    private rightScore;
    private gameState;
    private keys;
    constructor(container: HTMLElement | string, config?: GameConfig);
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
