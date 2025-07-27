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

export function createGame(
  game: GameType,
  container: HTMLElement | string,
  config: GameConfig = {}
): GameInstance {
  switch (game) {
    case 'snake':
      return new Snake(container, config);
    case 'pong':
      return new Pong(container, config);
    case 'breakout':
      return new Breakout(container, config);
    case 'spaceinvaders':
      return new SpaceInvaders(container, config);
    case 'tetris':
      return new Tetris(container, config);
    case 'pacman':
      return new PacMan(container, config);
    case 'asteroids':
      return new Asteroids(container, config);
    case 'frogger':
      return new Frogger(container, config);
    case 'donkeykong':
      return new DonkeyKong(container, config);
    case 'qbert':
      return new Qbert(container, config);
    case 'kaboom':
      return new Kaboom(container, config);
    case 'adventure':
      return new Adventure(container, config);
    case 'missilecommand':
      return new MissileCommand(container, config);
    case 'joust':
      return new Joust(container, config);
    case 'lunarlander':
      return new LunarLander(container, config);
    case 'battlezone':
      return new Battlezone(container, config);
    case 'berzerk':
      return new Berzerk(container, config);
    case 'circusatari':
      return new CircusAtari(container, config);
    case 'elevatoraction':
      return new ElevatorAction(container, config);
    case 'digdug':
      return new DigDug(container, config);
    default:
      throw new Error(`Game type "${game}" not implemented`);
  }
}

export default {
  createGame,
  Snake,
  Pong,
  Breakout,
  SpaceInvaders,
  Tetris,
  PacMan,
  Asteroids,
  Frogger,
  DonkeyKong,
  Qbert,
  Kaboom,
  Adventure,
  MissileCommand,
  Joust,
  LunarLander,
  Battlezone,
  Berzerk,
  CircusAtari,
  ElevatorAction,
  DigDug
};