import React from 'react';
import { GameConfig, GameType } from '../types';
interface WaitingGameProps {
    game: GameType;
    config?: GameConfig;
    autoStart?: boolean;
    className?: string;
    style?: React.CSSProperties;
}
export declare const WaitingGame: React.FC<WaitingGameProps>;
export {};
