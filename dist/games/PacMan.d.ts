import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';
export declare class PacMan extends GameEngine {
    private pacman;
    private ghosts;
    private dots;
    private score;
    private lives;
    private gameState;
    private cellSize;
    private frightModeTimer;
    constructor(container: HTMLElement | string, config?: GameConfig);
    private initGame;
    private createDots;
    private isWall;
    private wrapPosition;
    private getNextPosition;
    private canMove;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleKeyUp(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    private movePacman;
    private moveGhost;
    private checkCollisions;
    protected update(): void;
    protected render(): void;
    start(): void;
}
