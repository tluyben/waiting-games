import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';
export declare class Frogger extends GameEngine {
    private frog;
    private vehicles;
    private logs;
    private lilyPads;
    private score;
    private lives;
    private time;
    private gameState;
    private cellSize;
    private timer;
    private keys;
    constructor(container: HTMLElement | string, config?: GameConfig);
    private initGame;
    private createVehicles;
    private createLogs;
    private createLilyPads;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleKeyUp(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    private moveFrog;
    protected update(): void;
    private checkCollisions;
    private checkWinCondition;
    private resetFrog;
    protected render(): void;
}
