
import { Point, SnakeData, Direction } from '../types';
import { SNAKE_STROKE_WIDTH, CANVAS_SIZE } from '../constants';

/**
 * Checks if a ray starting from the head of the moving snake hits any part of the other snakes.
 */
export const checkCollision = (
  movingSnake: SnakeData,
  staticSnakes: SnakeData[]
): boolean => {
  const head = movingSnake.points[movingSnake.points.length - 1];
  const dir = movingSnake.headDirection;
  
  // Define the ray bounds (from head to infinity/edge)
  const ray = {
    x1: head.x,
    y1: head.y,
    x2: dir === 'LEFT' ? -1000 : (dir === 'RIGHT' ? 2000 : head.x),
    y2: dir === 'UP' ? -1000 : (dir === 'DOWN' ? 2000 : head.y)
  };

  const tolerance = SNAKE_STROKE_WIDTH / 2 - 0.5;

  for (const snake of staticSnakes) {
    for (let i = 0; i < snake.points.length - 1; i++) {
      const p1 = snake.points[i];
      const p2 = snake.points[i + 1];

      // Check intersection of ray and this segment
      if (rayIntersectsSegment(ray.x1, ray.y1, ray.x2, ray.y2, p1.x, p1.y, p2.x, p2.y, tolerance)) {
        return true;
      }
    }
  }

  return false;
};

function rayIntersectsSegment(
  rx1: number, ry1: number, rx2: number, ry2: number,
  sx1: number, sy1: number, sx2: number, sy2: number,
  tolerance: number
): boolean {
  // Ray is vertical or horizontal
  const isRayHorizontal = Math.abs(ry1 - ry2) < 0.1;
  const isSegHorizontal = Math.abs(sy1 - sy2) < 0.1;

  if (isRayHorizontal) {
    if (isSegHorizontal) {
      // Both horizontal: check if they are on same Y and overlap X
      if (Math.abs(ry1 - sy1) > tolerance) return false;
      const rMinX = Math.min(rx1, rx2);
      const rMaxX = Math.max(rx1, rx2);
      const sMinX = Math.min(sx1, sx2);
      const sMaxX = Math.max(sx1, sx2);
      // We check if the ray's path *ahead* of the head hits the segment
      // Since ray is from head outwards:
      if (rx2 > rx1) { // Moving Right
         return sMaxX > rx1 + 1 && sMinX < rx2;
      } else { // Moving Left
         return sMinX < rx1 - 1 && sMaxX > rx2;
      }
    } else {
      // Ray horizontal, segment vertical
      const sX = sx1;
      const sMinY = Math.min(sy1, sy2);
      const sMaxY = Math.max(sy1, sy2);
      if (ry1 < sMinY - tolerance || ry1 > sMaxY + tolerance) return false;
      if (rx2 > rx1) { // Moving Right
        return sX > rx1 + 1 && sX < rx2;
      } else { // Moving Left
        return sX < rx1 - 1 && sX > rx2;
      }
    }
  } else {
    // Ray is vertical
    if (!isSegHorizontal) {
      // Both vertical
      if (Math.abs(rx1 - sx1) > tolerance) return false;
      const rMinY = Math.min(ry1, ry2);
      const rMaxY = Math.max(ry1, ry2);
      const sMinY = Math.min(sy1, sy2);
      const sMaxY = Math.max(sy1, sy2);
      if (ry2 > ry1) { // Moving Down
        return sMaxY > ry1 + 1 && sMinY < ry2;
      } else { // Moving Up
        return sMinY < ry1 - 1 && sMaxY > ry2;
      }
    } else {
      // Ray vertical, segment horizontal
      const sY = sy1;
      const sMinX = Math.min(sx1, sx2);
      const sMaxX = Math.max(sx1, sx2);
      if (rx1 < sMinX - tolerance || rx1 > sMaxX + tolerance) return false;
      if (ry2 > ry1) { // Moving Down
        return sY > ry1 + 1 && sY < ry2;
      } else { // Moving Up
        return sY < ry1 - 1 && sY > ry2;
      }
    }
  }
}
