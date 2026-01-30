
export type Point = {
  x: number;
  y: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface SnakeData {
  id: string;
  points: Point[]; // Sequence of coordinates forming the snake's body
  headDirection: Direction;
  color: string;
}

export interface Level {
  id: number;
  snakes: SnakeData[];
  description: string;
}

export enum GameState {
  START = 'START',
  LEVEL_SELECT = 'LEVEL_SELECT',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
  LEVEL_TRANSITION = 'LEVEL_TRANSITION'
}
