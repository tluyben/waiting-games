export interface KeyMapping {
  UP?: string;
  DOWN?: string;
  LEFT?: string;
  RIGHT?: string;
  FIRE?: string;
  PAUSE?: string;
  START?: string;
}

export interface GameConfig {
  useKeyboard?: boolean;
  useMobile?: boolean;
  width?: number;
  height?: number;
  theme?: 'classic' | 'neon' | 'retro';
  keys?: KeyMapping;
}

export interface GameInstance {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface Point {
  x: number;
  y: number;
}

export type GameType = 'snake' | 'pong' | 'breakout' | 'spaceinvaders' | 'pacman' | 'frogger' | 'donkeykong' | 'asteroids' | 'tetris' | 'qbert' | 'kaboom' | 'adventure' | 'missilecommand' | 'joust' | 'lunarlander' | 'battlezone' | 'berzerk' | 'circusatari' | 'elevatoraction' | 'digdug';