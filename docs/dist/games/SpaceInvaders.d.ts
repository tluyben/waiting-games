import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';
export declare class SpaceInvaders extends GameEngine {
    private player;
    private bullets;
    private invaders;
    private score;
    private lives;
    private gameState;
    private keys;
    private invaderDirection;
    private invaderDropTimer;
    private shootCooldown;
    constructor(container: HTMLElement | string, config?: GameConfig);
    private initGame;
    private createInvaders;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleKeyUp(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    protected handleTouchEnd(event: TouchEvent): void;
    private playerShoot;
    private invaderShoot;
    protected update(): void;
    private updateInvaders;
    private checkBulletCollisions;
    private checkCollision;
    protected render(): void;
}
