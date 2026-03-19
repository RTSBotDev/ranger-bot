import { TOWER_WIDTH, TOWER_HEIGHT, DEBUG } from '../constants';
import { IsBuildable, AreBuildable } from './buildable';

interface CalculateTowerLocationKwargs {
  mines_data: CastleMineData[];
  raw_gold_mines: LwgGoldMine[];
}

function CalculateTowerLocation({ mines_data, raw_gold_mines }: CalculateTowerLocationKwargs): MapLocation {
  const midpoints: MapLocation[] = [];
  const perimeter: boolean[][] = [];

  for (let i:number=0; i<mines_data.length; i++) {
    const mine_data: CastleMineData = mines_data[i];

    const z: number = scope.getHeightLevel(mine_data.midpoint.x, mine_data.midpoint.y);
    midpoints.push(mine_data.midpoint);

    for (const [raw_x, y_list] of Object.entries(mine_data.worker_paths)) {
      const x: number = Number(raw_x);
      if (isNaN(x)) {
        continue;
      }

      const new_x: number = (():number => {
        if (x < mine_data.midpoint.x) {
          return x - 1;
        } else {
          return x + 1;
        }
      })();

      for (let raw_y in y_list) {
        const y: number = Number(raw_y);
        if (isNaN(y)) {
          continue;
        }

        if (_IsValid(new_x, y, z, raw_gold_mines)) {
          if (perimeter[new_x] === undefined) {
            perimeter[new_x] = [];
          }
          perimeter[new_x][y] = true;
        }

        const new_y: number = (():number => {
          if (y < mine_data.midpoint.y) {
            return y - 1;
          } else {
            return y + 1;
          }
        })();

        if (_IsValid(x, new_y, z, raw_gold_mines)) {
          if (perimeter[x] === undefined) {
            perimeter[x] = [];
          }
          perimeter[x][new_y] = true;
        }
      }
    }
  }

  const candidates: boolean[][] = []; // avoid duplicates
  for (const [raw_x, y_list] of Object.entries(perimeter)) {
    const x: number = Number(raw_x);
    if (isNaN(x)) {
      continue;
    }

    for (const raw_y in y_list) {
      const y: number = Number(raw_y);
      if (isNaN(y)) {
        continue;
      }

      for (let dx=(-1 * TOWER_WIDTH); dx<=TOWER_WIDTH; dx++) {
        const xx = x - dx;
        for (let dy=(-1 * TOWER_HEIGHT); dy<=TOWER_HEIGHT; dy++) {
          const yy = y - dy;

          if (candidates[xx] === undefined) {
            candidates[xx] = [];
          }
          candidates[xx][yy] = true;
        }
      }
    }
  }

  const viable: { x: number, y: number, score: number }[] = [];
  for (const [raw_x, y_list] of Object.entries(candidates)) {
    const x: number = Number(raw_x);
    if (isNaN(x)) {
      continue;
    }

    for (const raw_y in y_list) {
      const y: number = Number(raw_y);
      if (isNaN(y)) {
        continue;
      }

      if (!_AreBuildable(x, y, raw_gold_mines)) {
        continue;
      }

      const center_x: number = x + (TOWER_WIDTH - 1) / 2;
      const center_y: number = y + (TOWER_HEIGHT - 1) / 2;
      let score: number = 0;
      for (let i:number=0; i<midpoints.length; i++) {
        const midpoint: MapLocation = midpoints[i];

        score += Math.sqrt((center_x - midpoint.x)**2 + (center_y - midpoint.y)**2);
      }

      viable.push({'x': x, 'y': y, 'score': score});
    }
  }

  if (viable.length <= 0) {
    if (DEBUG) {
      console.log(perimeter);
      // PrintExpansionData({
      //   mines_data: mines_data,
      //   midpoints: midpoints,
      //   debug: perimeter,
      // });
      console.log(candidates);
      // PrintExpansionData({
      //   mines_data: mines_data,
      //   midpoints: midpoints,
      //   debug: candidates,
      // });
    }
    throw new Error('no viable tower locations');
  }

  const winner = viable.sort((a, b) => a.score - b.score)[0];
  return {'x': winner.x, 'y': winner.y};
}

function _IsValid(x: number, y: number, z: number, raw_gold_mines: LwgGoldMine[]): boolean {
  if (scope.getHeightLevel(x, y) != z) {
    return false;
  }

  return IsBuildable({
    map_location: {'x': x, 'y': y},
    exclude_worker_paths: true,
    raw_gold_mines: raw_gold_mines,
  });
}

function _AreBuildable(x: number, y: number, raw_gold_mines: LwgGoldMine[]): boolean {
  return AreBuildable({
    x_min: x,
    x_max: x + TOWER_WIDTH - 1,
    y_min: y,
    y_max: y + TOWER_HEIGHT - 1,
    exclude_worker_paths: true,
    raw_gold_mines: raw_gold_mines,
  });
}

export { CalculateTowerLocation };
