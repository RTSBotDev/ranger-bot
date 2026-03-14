import { IsBuildable } from './buildable';

interface MapGoldMinePerimeterKwargs {
  raw_mine: LwgGoldMine;
  raw_gold_mines: LwgGoldMine[];
}

function MapGoldMinePerimeter({ raw_mine, raw_gold_mines }: MapGoldMinePerimeterKwargs): boolean[][] {
  const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;
  if (mine_cache.exclusion_zone === undefined) {
    throw new Error('MapGoldMinePerimeter called out of order'); // hush TS
  }

  const z: number = scope.getHeightLevel(mine_cache.center.x, mine_cache.center.y);
  let output: boolean[][] = [];

  for (const raw_x in mine_cache.exclusion_zone) {
    const x: number = Number(raw_x);
    if (isNaN(x)) {
      continue;
    }
    const y_list: boolean[] = mine_cache.exclusion_zone[x];

    for (const raw_y in y_list) {
      const y: number = Number(raw_y);
      if (isNaN(y)) {
        continue;
      }
      const new_x = ((): number => {
        if (x < mine_cache.center.x) {
          return x - 1;
        } else if (x > mine_cache.center.x) {
          return x + 1;
        } else {
          return x;
        }
      })();
      if (_IsValid(new_x, y, z, raw_gold_mines)) {
        if (output[new_x] === undefined) {
          output[new_x] = [];
        }
        output[new_x][y] = true;
      }

      const new_y = ((): number => {
        if (y < mine_cache.center.y) {
          return y - 1;
        } else if (y > mine_cache.center.y) {
          return y + 1;
        } else {
          return y;
        }
      })();
      if (_IsValid(x, new_y, z, raw_gold_mines)) {
        if (output[x] === undefined) {
          output[x] = [];
        }
        output[x][new_y] = true;
      }
    }
  }

  return output;
}

function _IsValid(x: number, y: number, z: number, raw_gold_mines: LwgGoldMine[]): boolean {
  if (scope.getHeightLevel(x, y) != z) {
    return false;
  }

  for (let i:number=0; i<raw_gold_mines.length; i++) {
    const other_raw_mine: LwgGoldMine = raw_gold_mines[i];

    // hush TS
    const exclusion_zone = (other_raw_mine.ranger_bot as RangerBotGoldMine).exclusion_zone as boolean[][];
    const y_list = exclusion_zone[x];
    if (y_list === undefined) {
      continue;
    }
    if (y_list[y]) {
      return false;
    }
  }

  const map_location: MapLocation = {'x': x, 'y': y};
  return IsBuildable({ map_location: map_location, exclude_worker_paths: false });
}

export { MapGoldMinePerimeter };
