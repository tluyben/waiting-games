import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';
export declare class Kaboom extends GameEngine {
    private bucket;
    private bombs;
    private explosions;
    private score;
    private lives;
    private level;
    private gameState;
    private bombSpawnTimer;
    private bombSpawnRate;
    private speedMultiplier;
    constructor(container: HTMLElement | string, config?: GameConfig);
    private initGame;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleKeyUp(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    protected handleTouchMove(event: TouchEvent): void;
    private clampBucket;
    private spawnBomb;
    private createExplosion;
    protected update(): void;
    protected render(): void;
}
