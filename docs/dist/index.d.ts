import { GameConfig, GameType, GameInstance } from './types';
import { Snake } from './games/Snake';
import { Pong } from './games/Pong';
import { Breakout } from './games/Breakout';
import { SpaceInvaders } from './games/SpaceInvaders';
import { Tetris } from './games/Tetris';
import { PacMan } from './games/PacMan';
import { Asteroids } from './games/Asteroids';
import { Frogger } from './games/Frogger';
import { DonkeyKong } from './games/DonkeyKong';
import { Qbert } from './games/Qbert';
import { Kaboom } from './games/Kaboom';
import { Adventure } from './games/Adventure';
import { MissileCommand } from './games/MissileCommand';
import { Joust } from './games/Joust';
import { LunarLander } from './games/LunarLander';
import { Battlezone } from './games/Battlezone';
import { Berzerk } from './games/Berzerk';
import { CircusAtari } from './games/CircusAtari';
import { ElevatorAction } from './games/ElevatorAction';
import { DigDug } from './games/DigDug';
export * from './types';
export * from './games/Snake';
export * from './games/Pong';
export * from './games/Breakout';
export * from './games/SpaceInvaders';
export * from './games/Tetris';
export * from './games/PacMan';
export * from './games/Asteroids';
export * from './games/Frogger';
export * from './games/DonkeyKong';
export * from './games/Qbert';
export * from './games/Kaboom';
export * from './games/Adventure';
export * from './games/MissileCommand';
export * from './games/Joust';
export * from './games/LunarLander';
export * from './games/Battlezone';
export * from './games/Berzerk';
export * from './games/CircusAtari';
export * from './games/ElevatorAction';
export * from './games/DigDug';
export * from './components/WaitingGame';
export declare function createGame(game: GameType, container: HTMLElement | string, config?: GameConfig): GameInstance;
declare const _default: {
    createGame: typeof createGame;
    Snake: typeof Snake;
    Pong: typeof Pong;
    Breakout: typeof Breakout;
    SpaceInvaders: typeof SpaceInvaders;
    Tetris: typeof Tetris;
    PacMan: typeof PacMan;
    Asteroids: typeof Asteroids;
    Frogger: typeof Frogger;
    DonkeyKong: typeof DonkeyKong;
    Qbert: typeof Qbert;
    Kaboom: typeof Kaboom;
    Adventure: typeof Adventure;
    MissileCommand: typeof MissileCommand;
    Joust: typeof Joust;
    LunarLander: typeof LunarLander;
    Battlezone: typeof Battlezone;
    Berzerk: typeof Berzerk;
    CircusAtari: typeof CircusAtari;
    ElevatorAction: typeof ElevatorAction;
    DigDug: typeof DigDug;
};
export default _default;
