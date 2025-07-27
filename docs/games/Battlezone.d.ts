import { GameEngine } from '../GameEngine';
import { GameConfig } from '../types';
export declare class Battlezone extends GameEngine {
    private player;
    private enemies;
    private projectiles;
    private obstacles;
    private score;
    private lives;
    private gameState;
    private radar;
    private crosshair;
    private camera;
    private horizon;
    constructor(container: HTMLElement | string, config?: GameConfig);
    private initGame;
    private generateWorld;
    private spawnEnemyWave;
    protected handleKeyDown(event: KeyboardEvent): void;
    protected handleTouchStart(event: TouchEvent): void;
    private shoot;
    private updatePlayer;
    private updateEnemies;
    private updateProjectiles;
    private updateRadar;
    protected update(): void;
    private project3D;
    protected render(): void;
}
