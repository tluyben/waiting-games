import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';
export declare class Adventure extends GameEngine {
    private player;
    private rooms;
    private currentRoom;
    private score;
    private gameState;
    private gameWon;
    constructor(container: HTMLElement | string, config?: GameConfig);
    private initGame;
    private createRooms;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleKeyUp(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    protected handleTouchEnd(event: TouchEvent): void;
    private attackDragon;
    private checkWallCollision;
    protected update(): void;
    protected render(): void;
}
