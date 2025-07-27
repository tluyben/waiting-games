import React, { useEffect, useRef } from 'react';
import { GameConfig, GameType, GameInstance } from '../types';
import { Snake } from '../games/Snake';
import { Pong } from '../games/Pong';
import { Breakout } from '../games/Breakout';
import { SpaceInvaders } from '../games/SpaceInvaders';
import { Tetris } from '../games/Tetris';
import { PacMan } from '../games/PacMan';
import { Asteroids } from '../games/Asteroids';
import { Frogger } from '../games/Frogger';
import { DonkeyKong } from '../games/DonkeyKong';
import { Qbert } from '../games/Qbert';
import { Kaboom } from '../games/Kaboom';
import { Adventure } from '../games/Adventure';
import { MissileCommand } from '../games/MissileCommand';
import { Joust } from '../games/Joust';
import { LunarLander } from '../games/LunarLander';
import { Battlezone } from '../games/Battlezone';
import { Berzerk } from '../games/Berzerk';
import { CircusAtari } from '../games/CircusAtari';
import { ElevatorAction } from '../games/ElevatorAction';
import { DigDug } from '../games/DigDug';

interface WaitingGameProps {
  game: GameType;
  config?: GameConfig;
  autoStart?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const WaitingGame: React.FC<WaitingGameProps> = ({
  game,
  config = {},
  autoStart = true,
  className,
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<GameInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let gameInstance: GameInstance;

    switch (game) {
      case 'snake':
        gameInstance = new Snake(containerRef.current, config);
        break;
      case 'pong':
        gameInstance = new Pong(containerRef.current, config);
        break;
      case 'breakout':
        gameInstance = new Breakout(containerRef.current, config);
        break;
      case 'spaceinvaders':
        gameInstance = new SpaceInvaders(containerRef.current, config);
        break;
      case 'tetris':
        gameInstance = new Tetris(containerRef.current, config);
        break;
      case 'pacman':
        gameInstance = new PacMan(containerRef.current, config);
        break;
      case 'asteroids':
        gameInstance = new Asteroids(containerRef.current, config);
        break;
      case 'frogger':
        gameInstance = new Frogger(containerRef.current, config);
        break;
      case 'donkeykong':
        gameInstance = new DonkeyKong(containerRef.current, config);
        break;
      case 'qbert':
        gameInstance = new Qbert(containerRef.current, config);
        break;
      case 'kaboom':
        gameInstance = new Kaboom(containerRef.current, config);
        break;
      case 'adventure':
        gameInstance = new Adventure(containerRef.current, config);
        break;
      case 'missilecommand':
        gameInstance = new MissileCommand(containerRef.current, config);
        break;
      case 'joust':
        gameInstance = new Joust(containerRef.current, config);
        break;
      case 'lunarlander':
        gameInstance = new LunarLander(containerRef.current, config);
        break;
      case 'battlezone':
        gameInstance = new Battlezone(containerRef.current, config);
        break;
      case 'berzerk':
        gameInstance = new Berzerk(containerRef.current, config);
        break;
      case 'circusatari':
        gameInstance = new CircusAtari(containerRef.current, config);
        break;
      case 'elevatoraction':
        gameInstance = new ElevatorAction(containerRef.current, config);
        break;
      case 'digdug':
        gameInstance = new DigDug(containerRef.current, config);
        break;
      default:
        throw new Error(`Game type "${game}" not implemented`);
    }

    gameInstanceRef.current = gameInstance;

    if (autoStart) {
      gameInstance.start();
    }

    return () => {
      gameInstance.destroy();
    };
  }, [game, config, autoStart]);

  const handleStart = () => {
    gameInstanceRef.current?.start();
  };

  const handleStop = () => {
    gameInstanceRef.current?.stop();
  };

  const handlePause = () => {
    gameInstanceRef.current?.pause();
  };

  const handleResume = () => {
    gameInstanceRef.current?.resume();
  };

  return (
    <div className={className} style={style}>
      <div ref={containerRef} />
      {!autoStart && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <button onClick={handleStart}>Start</button>
          <button onClick={handleStop} style={{ marginLeft: '5px' }}>Stop</button>
          <button onClick={handlePause} style={{ marginLeft: '5px' }}>Pause</button>
          <button onClick={handleResume} style={{ marginLeft: '5px' }}>Resume</button>
        </div>
      )}
    </div>
  );
};