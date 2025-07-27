import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';
export declare class Snake extends GameEngine {
    private snake;
    private food;
    private direction;
    private gridSize;
    private score;
    private gameOver;
    private gameState;
    private moveTimer;
    private moveInterval;
    constructor(container: HTMLElement | string, config?: GameConfig);
    private initGame;
    private generateFood;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    protected update(): void;
    protected render(): void;
    start(): void;
}
