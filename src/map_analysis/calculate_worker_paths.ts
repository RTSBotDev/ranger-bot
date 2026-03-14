import { CASTLE_WIDTH, CASTLE_HEIGHT, MINE_WIDTH, MINE_HEIGHT } from '../constants';
import { IsBuildable } from './buildable';

interface CalculateWorkerPathsKwargs {
  raw_mine: LwgGoldMine;
  castle_location: MapLocation;
}

function CalculateWorkerPaths({ raw_mine, castle_location }: CalculateWorkerPathsKwargs): boolean[][] {
  const castle_points: MapLocation[] = [];
  for (let dx:number=0; dx<CASTLE_WIDTH; dx++) {
    for (let dy:number=0; dy<CASTLE_HEIGHT; dy++) {
      castle_points.push({'x': castle_location.x + dx,
                          'y': castle_location.y + dy});
    }
  }

  const mine_points: MapLocation[] = [];
  for (let dx:number=0; dx<MINE_WIDTH; dx++) {
    for (let dy:number=0; dy<MINE_HEIGHT; dy++) {
      mine_points.push({'x': raw_mine.x + dx, 'y': raw_mine.y + dy});
    }
  }

  const output: boolean[][] = [];
  for (let i:number=0; i<castle_points.length; i++) {
    const start: MapLocation = castle_points[i];

    for (let j:number=0; j<mine_points.length; j++) {
      const finish: MapLocation = mine_points[j];

      let point = start;
      while (point.x != finish.x || point.y != finish.y) {
        const dx:number = (():number => {
          if (finish.x > point.x) {
            return 1;
          } else if (finish.x < point.x) {
            return -1;
          } else {
            return 0;
          }
        })();

        const dy:number = (():number => {
          if (finish.y > point.y) {
            return 1;
          } else if (finish.y < point.y) {
            return -1
          } else {
            return 0;
          }
        })();

        const candidates: MapLocation[] = [];
        if (dx != 0) {
          candidates.push({'x': point.x + dx, 'y': point.y});
        }
        if (dy != 0) {
          candidates.push({'x': point.x, 'y': point.y + dy});
        }

        if (candidates.length <= 0) {
          point = finish; // Theoretically not necessary
        } else if (candidates.length == 1) {
          point = candidates[0];
        } else {
          candidates.sort((a, b) => {
            const dist_a = Math.sqrt((finish.x - a.x)**2 + (finish.y - a.y)**2);
            const dist_b = Math.sqrt((finish.x - b.x)**2 + (finish.y - b.y)**2);
            return dist_a - dist_b;
          });
          point = candidates[0];
        }

        if (IsBuildable({ map_location: point, exclude_worker_paths: false })) {
          if (output[point.x] === undefined) {
            output[point.x] = [];
          }
          output[point.x][point.y] = true;
        }
      }
    }
  }

  return output;
}

export { CalculateWorkerPaths };
