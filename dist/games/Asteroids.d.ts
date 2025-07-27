import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';
export declare class Asteroids extends GameEngine {
    private ship;
    private bullets;
    private asteroids;
    private score;
    private lives;
    private gameState;
    private shootCooldown;
    private invulnerabilityTime;
    constructor(container: HTMLElement | string, config?: GameConfig);
    private initGame;
    private createAsteroids;
    private createAsteroid;
    private wrapPosition;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleKeyUp(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    protected handleTouchEnd(event: TouchEvent): void;
    private shoot;
    protected update(): void;
    private checkCollisions;
    protected render(): void;
}
