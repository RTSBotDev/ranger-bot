import { CASTLE_WIDTH, CASTLE_HEIGHT, MAX_MINING_DISTANCE } from '../constants';
import { AreBuildable } from './buildable';
import { GroundDistanceBetweenBuildings } from '../ground_distance';
import { GetGoldMines } from '../utils';

interface CalculateViableCastleLocationsKwargs {
  raw_mine: LwgGoldMine;
  raw_gold_mines: LwgGoldMine[];
  teams: RangerBotTeams;
}

function CalculateViableCastleLocations({ raw_mine, raw_gold_mines, teams }: CalculateViableCastleLocationsKwargs): number[][] {
  const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;
  if (mine_cache.perimeter === undefined) {
    throw new Error('CalculateViableCastleLocations called out of order');
  }

  const z: number = scope.getHeightLevel(raw_mine.x, raw_mine.y);
  let output: number[][] = [];


  for (const raw_x in mine_cache.perimeter) {
    const x: number = Number(raw_x);
    if (isNaN(x)) {
      continue;
    }
    const y_list: boolean[] = mine_cache.perimeter[x];

    for (const raw_y in y_list) {
      const y: number = Number(raw_y);
      if (isNaN(y)) {
        continue;
      }

      for (let dx:number=0; dx<CASTLE_WIDTH; dx++) {
        const xx: number = x - dx;

        for (let dy:number=0; dy<CASTLE_HEIGHT; dy++) {
          const yy: number = y - dy;

          if (!_IsViable(xx, yy, z, raw_gold_mines, teams)) {
            continue;
          }

          const mining_distance: number = _CalculateMiningDistance(xx, yy, raw_mine.id);
          if (isNaN(mining_distance) || mining_distance > MAX_MINING_DISTANCE) {
            continue;
          }
          // console.log('mining_distance: ' + mining_distance);

          if (output[xx] === undefined) {
            output[xx] = [];
          }
          output[xx][yy] = mining_distance;
        }
      }
    }
  }

  return output;
}

function _IsViable(base_x: number, base_y: number, z: number, raw_gold_mines: LwgGoldMine[], teams: RangerBotTeams): boolean {
  if (z != scope.getHeightLevel(base_x, base_y)) {
    return false;
  }

  for (let dx:number=0; dx<CASTLE_WIDTH; dx++) {
    const x: number = base_x + dx;

    for (let dy:number=0; dy<CASTLE_HEIGHT; dy++) {
      const y: number = base_y + dy;

      for (let i:number=0; i<raw_gold_mines.length; i++) {
        const raw_mine: LwgGoldMine = raw_gold_mines[i];

        // hush TS
        const exclusion_zone = (raw_mine.ranger_bot as RangerBotGoldMine).exclusion_zone as boolean[][];

        if (!exclusion_zone[x]) {
          continue;
        }
        if (exclusion_zone[x][y]) {
          return false;
        }
      }
    }
  }

  return AreBuildable({
    x_min: base_x,
    x_max: base_x + CASTLE_WIDTH - 1,
    y_min: base_y,
    y_max: base_y + CASTLE_HEIGHT - 1,
    teams: teams,
    exclude_worker_paths: false,
  });
}

function _CalculateMiningDistance(base_x: number, base_y: number, mine_id: number): number {
  const real_gold_mine: LwgGoldMine | undefined = GetGoldMines().find((g) => g.id == mine_id);
  if (!real_gold_mine) {
    throw new Error('could not find gold mine with id ' + mine_id);
  }
  const castle_wrapper: LwgBuildingWrapper | undefined = scope.getBuildings({type: 'Castle'}).find(() => true);
  if (!castle_wrapper) {
    throw new Error('no castles for _CalculateMiningDistance');
  }
  const castle_type: LwgPieceType = castle_wrapper.unit.type;
  const dx = (CASTLE_WIDTH - 1) / 2;
  const dy = (CASTLE_HEIGHT - 1) / 2;
  const hypothetical_castle: LwgBuilding = {
    'id': -1,
    'hp': castle_type.hp,
    'type': castle_type,
    'x': base_x,
    'y': base_y,
    'isUnderConstruction': false,
    'ranger_bot': {
      'center': {'x': base_x + dx, 'y': base_y + dy},
    },
    'order': {
      'name': 'Stop',
    },
    'buildTicksLeft': 0,
    'queue': [],
    'owner': scope.player,
    'modifierMods': {},
  };
  return GroundDistanceBetweenBuildings(hypothetical_castle, real_gold_mine);
}

export { CalculateViableCastleLocations };
