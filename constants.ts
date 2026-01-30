
export const GRID_SIZE = 40;
export const CANVAS_SIZE = 400;
export const INITIAL_LIVES = 5;

export const COLORS = [
  '#84cc16', // Vibrant lime green
  '#06b6d4', // Bright cyan
  '#8b5cf6', // Rich violet
  '#f59e0b', // Warm amber
  '#f43f5e', // Deep rose
  '#3b82f6', // Electric blue
  '#10b981', // Emerald green
];

export const SNAKE_STROKE_WIDTH = 18; 
export const HEAD_SIZE = 22;

export const LEVEL_DATA = [
  {
    id: 1,
    description: "Simple paths. Clear the way.",
    snakes: [
      { id: 's1', points: [{x: 100, y: 100}, {x: 100, y: 200}], headDirection: 'DOWN', color: '#84cc16' },
      { id: 's2', points: [{x: 200, y: 150}, {x: 300, y: 150}], headDirection: 'RIGHT', color: '#84cc16' }
    ]
  }
];
