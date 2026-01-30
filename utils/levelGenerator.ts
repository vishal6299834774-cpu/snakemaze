
import { SnakeData, Point, Direction } from '../types';
import { CANVAS_SIZE, COLORS } from '../constants';
import { checkCollision } from './collision';

const DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const GRID_STEP = 40;
const MARGIN = 40;

/**
 * Validates if the level is logically solvable by simulating removals.
 */
const isLevelSolvable = (snakes: SnakeData[]): boolean => {
  if (snakes.length === 0) return true;
  const remaining = [...snakes];
  let changed = true;
  while (changed && remaining.length > 0) {
    changed = false;
    for (let i = 0; i < remaining.length; i++) {
      const current = remaining[i];
      const others = remaining.filter((_, idx) => idx !== i);
      if (!checkCollision(current, others)) {
        remaining.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return remaining.length === 0;
};

/**
 * Prevents "head-to-head" deadlocks.
 */
const isHeadToHeadConflict = (newSnake: SnakeData, existingSnakes: SnakeData[]): boolean => {
  const newHead = newSnake.points[newSnake.points.length - 1];
  const newDir = newSnake.headDirection;
  for (const snake of existingSnakes) {
    const head = snake.points[snake.points.length - 1];
    const dir = snake.headDirection;
    if (newHead.y === head.y) {
      if (newDir === 'RIGHT' && dir === 'LEFT' && newHead.x < head.x) return true;
      if (newDir === 'LEFT' && dir === 'RIGHT' && newHead.x > head.x) return true;
    }
    if (newHead.x === head.x) {
      if (newDir === 'DOWN' && dir === 'UP' && newHead.y < head.y) return true;
      if (newDir === 'UP' && dir === 'DOWN' && newHead.y > head.y) return true;
    }
  }
  return false;
};

export const generateLevel = (levelId: number): SnakeData[] => {
  let finalSnakes: SnakeData[] = [];
  let attempts = 0;

  const isTitanMode = levelId >= 21;
  const isExtreme = levelId >= 16;
  const isHard = levelId >= 11;
  const isMedium = levelId >= 6;

  // Configuration scaling
  const targetCount = isTitanMode ? 8 : (isExtreme ? 25 : (isHard ? 18 : (isMedium ? 10 : 5)));
  const titanSegments = Math.floor(25 + (levelId * 0.8)); // Titans get longer as level increases
  const maxSegments = isExtreme ? 22 : (isHard ? 14 : 6);

  while (attempts < 1000) {
    attempts++;
    const snakes: SnakeData[] = [];
    const occupiedPoints = new Set<string>();

    const markOccupied = (p1: Point, p2: Point) => {
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      for (let x = minX; x <= maxX; x += GRID_STEP) {
        for (let y = minY; y <= maxY; y += GRID_STEP) {
          occupiedPoints.add(`${x},${y}`);
        }
      }
    };

    const isPathClear = (p1: Point, p2: Point) => {
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);
      for (let x = minX; x <= maxX; x += GRID_STEP) {
        for (let y = minY; y <= maxY; y += GRID_STEP) {
          if (occupiedPoints.has(`${x},${y}`)) return false;
        }
      }
      return true;
    };

    let snakeAttempts = 0;
    while (snakes.length < targetCount && snakeAttempts < 400) {
      snakeAttempts++;
      const startX = Math.floor((Math.random() * (CANVAS_SIZE - 2 * MARGIN) + MARGIN) / GRID_STEP) * GRID_STEP;
      const startY = Math.floor((Math.random() * (CANVAS_SIZE - 2 * MARGIN) + MARGIN) / GRID_STEP) * GRID_STEP;
      
      if (occupiedPoints.has(`${startX},${startY}`)) continue;

      const points: Point[] = [{ x: startX, y: startY }];
      let currentX = startX;
      let currentY = startY;
      let lastDir: Direction | null = null;
      
      const isTitan = isTitanMode && snakes.length < 2; // Usually 2 massive snakes per level in Titan mode
      const targetSegments = isTitan ? titanSegments : (Math.floor(Math.random() * (maxSegments - 4)) + 4);
      const coilDir = Math.random() > 0.5 ? 1 : -1;

      for (let s = 0; s < targetSegments; s++) {
        let availableDirs: Direction[] = [];
        if (lastDir) {
          // Spiraling and wrapping logic
          const turnMap: Record<Direction, Direction[]> = {
            UP: coilDir === 1 ? ['RIGHT', 'UP', 'LEFT'] : ['LEFT', 'UP', 'RIGHT'],
            DOWN: coilDir === 1 ? ['LEFT', 'DOWN', 'RIGHT'] : ['RIGHT', 'DOWN', 'LEFT'],
            LEFT: coilDir === 1 ? ['UP', 'LEFT', 'DOWN'] : ['DOWN', 'LEFT', 'UP'],
            RIGHT: coilDir === 1 ? ['DOWN', 'RIGHT', 'UP'] : ['UP', 'RIGHT', 'DOWN']
          };
          availableDirs = turnMap[lastDir];
          
          // Add some randomness for Titan snakes to make them "wrap" around areas
          if (isTitan && Math.random() < 0.3) {
            availableDirs = [...availableDirs].sort(() => Math.random() - 0.5);
          }
        } else {
          availableDirs = [...DIRECTIONS].sort(() => Math.random() - 0.5);
        }

        let foundSeg = false;
        for (const dir of availableDirs) {
          let nx = currentX, ny = currentY;
          if (dir === 'UP') ny -= GRID_STEP;
          else if (dir === 'DOWN') ny += GRID_STEP;
          else if (dir === 'LEFT') nx -= GRID_STEP;
          else if (dir === 'RIGHT') nx += GRID_STEP;

          if (nx >= 20 && nx <= CANVAS_SIZE - 20 && ny >= 20 && ny <= CANVAS_SIZE - 20) {
            if (isPathClear(points[points.length - 1], { x: nx, y: ny })) {
              currentX = nx; currentY = ny;
              points.push({ x: nx, y: ny });
              lastDir = dir;
              foundSeg = true;
              break;
            }
          }
        }
        if (!foundSeg) break;
      }

      if (points.length >= 2) {
        const potentialSnake: SnakeData = {
          id: `s-${attempts}-${snakes.length}`,
          points,
          headDirection: lastDir!,
          // Pick a random color from our expanded palette
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
        if (!isHeadToHeadConflict(potentialSnake, snakes)) {
          for (let i = 0; i < points.length - 1; i++) {
            markOccupied(points[i], points[i+1]);
          }
          snakes.push(potentialSnake);
        }
      }
    }

    // Success condition: Sufficiently dense and logically solvable
    const countRequirement = isTitanMode ? 4 : (isExtreme ? targetCount * 0.7 : targetCount);
    if (snakes.length >= countRequirement) {
      if (isLevelSolvable(snakes)) {
        finalSnakes = snakes;
        break;
      }
    }
  }
  return finalSnakes;
};
