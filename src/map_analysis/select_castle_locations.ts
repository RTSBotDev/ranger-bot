import { CASTLE_WIDTH, CASTLE_HEIGHT } from '../constants';
import { CalculateWorkerPaths } from './calculate_worker_paths';
import { CalculateTowerLocation } from './calculate_tower_location';

interface SelectCastleLocationsKwargs {
  raw_gold_mines: LwgGoldMine[];
  teams: RangerBotTeams;
}

interface PartialExpansion {
  viable_castle_locations: MapLocation[];
  raw_gold_mines: LwgGoldMine[];
}

function SelectCastleLocations({ raw_gold_mines, teams }: SelectCastleLocationsKwargs): Expansion[] {
  let grouping: _GroupCastleLocations = new _GroupCastleLocations(raw_gold_mines);
  let placements: PartialExpansion[] = grouping.Run();
  return placements.map((placement: PartialExpansion, index: number) => {
    return _AddCastlePositionData(placement, index, teams);
  });
}

class _GroupCastleLocations {
  raw_gold_mines: LwgGoldMine[];
  placements: PartialExpansion[];

  constructor(raw_gold_mines: LwgGoldMine[]) {
    this.raw_gold_mines = raw_gold_mines;
    this.placements = [];
  }

  Run(): PartialExpansion[] {
    for (let i=0; i<this.raw_gold_mines.length; i++) {
      const raw_mine: LwgGoldMine = this.raw_gold_mines[i];
      const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

      if (!mine_cache.viable_castle_locations || mine_cache.viable_castle_locations.length <= 0) {
        throw new Error('viable_castle_locations missing for gold mine ' + raw_mine.id);
      }

      this._Place(raw_mine);
    }

    return this.placements;
  }

  _Place(raw_mine: LwgGoldMine): void {
    const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;
    if (mine_cache.viable_castle_locations === undefined) {
      throw new Error('SelectCastleLocations called out of order'); // hush TS
    }
    const viable_castle_locations: number[][] = mine_cache.viable_castle_locations;

    for (let i=0; i<this.placements.length; i++) {
      const existing_placement: PartialExpansion = this.placements[i];

      const shared_locations: MapLocation[] = existing_placement.viable_castle_locations.filter((location: MapLocation) => {
        const y_list: number[] = viable_castle_locations[location.x];
        if (!y_list) {
          return false;
        }
        const ground_distance: number = y_list[location.y];
        if (ground_distance === undefined) {
          return false;
        }
        return !isNaN(ground_distance);
      });

      if (shared_locations.length <= 0) {
        continue;
      }

      existing_placement.viable_castle_locations = shared_locations;
      existing_placement.raw_gold_mines.push(raw_mine);

      return;
    }

    const new_locations: MapLocation[] = [];
    for (let raw_x in mine_cache.viable_castle_locations) {
      const x: number = Number(raw_x);
      if (isNaN(x)) {
        continue;
      }
      const y_list: number[] = mine_cache.viable_castle_locations[x];

      for (let raw_y in y_list) {
        const y: number = Number(raw_y);
        if (isNaN(y)) {
          continue;
        }

        const new_location: MapLocation = {'x': x, 'y': y};
        new_locations.push(new_location);
      }
    }

    const new_placement: PartialExpansion = {
      'viable_castle_locations': new_locations,
      'raw_gold_mines': [raw_mine],
    };
    this.placements.push(new_placement);
  }
}

function _AddCastlePositionData(partial: PartialExpansion, expansion_id: number, teams: RangerBotTeams): Expansion {
  const castle_placements: CastlePlacement[] = partial.viable_castle_locations.map((location: MapLocation) => {
    return _CalculateCastlePositionData(location, partial.raw_gold_mines, teams);
  });

  for (let i=0; i<partial.raw_gold_mines.length; i++) {
    const raw_mine = partial.raw_gold_mines[i];
    const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

    if (mine_cache.expansion_data) {
      continue;
    }

    const new_expansion_data: ExpansionData[] = [];
    for (let j=0; j<castle_placements.length; j++) {
      const castle_data: CastlePlacement = castle_placements[j];

      const mine_data: CastleMineData | undefined = castle_data.mines_data
        .find((md: CastleMineData) => md.gold_mine_id == raw_mine.id);
      if (mine_data === undefined) {
        console.log(castle_data);
        throw new Error('Missing mine_data for _AddCastlePositionData');
      }

      new_expansion_data.push({
        'castle_location': castle_data.castle_location,
        'midpoint': mine_data.midpoint,
        'worker_paths': mine_data.worker_paths,
        'tower_location': castle_data.tower_location,
      });
    }

    mine_cache.expansion_data = new_expansion_data;
  }

  const new_expansion_placement: Expansion = {
    'castle_placements': castle_placements.sort((a, b) => a.score - b.score),
    'id': expansion_id,
  };
  return new_expansion_placement;
}

function _CalculateCastlePositionData(castle_location: MapLocation, raw_gold_mines: LwgGoldMine[], teams: RangerBotTeams): CastlePlacement {
  const mines_data: CastleMineData[] = [];
  const castle_center_x: number = castle_location.x + (CASTLE_WIDTH - 1) / 2;
  const castle_center_y: number = castle_location.y + (CASTLE_HEIGHT - 1) / 2;
  for (let i=0; i<raw_gold_mines.length; i++) {
    const raw_mine: LwgGoldMine = raw_gold_mines[i];

    const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

    const midpoint: MapLocation = {
      'x': (castle_center_x + mine_cache.center.x) / 2,
      'y': (castle_center_y + mine_cache.center.y) / 2,
    };

    const worker_paths: boolean[][] = CalculateWorkerPaths({
      raw_mine: raw_mine,
      castle_location: castle_location,
      teams: teams,
    });

    // stop judging me
    mine_cache._worker_paths = worker_paths;
    mine_cache._castle_location = castle_location;

    mines_data.push({
      'gold_mine_id': raw_mine.id,
      'midpoint': midpoint,
      'worker_paths': worker_paths,
    });
  }

  const tower_location: MapLocation = CalculateTowerLocation({
    mines_data: mines_data,
    raw_gold_mines: raw_gold_mines,
  });
  for (let i=0; i<raw_gold_mines.length; i++) {
    const mine_cache = raw_gold_mines[i].ranger_bot as RangerBotGoldMine;

    delete mine_cache['_worker_paths'];
    delete mine_cache['_castle_location'];
  }

  let score: number = 0;
  for (let i=0; i<raw_gold_mines.length; i++) {
    const raw_mine = raw_gold_mines[i];

    // hush TS
    const viable_castle_locations: number[][] = (raw_mine.ranger_bot as RangerBotGoldMine).viable_castle_locations as number[][];

    const y_list: number[] = viable_castle_locations[castle_location.x];
    if (!y_list) {
      throw new Error('viable_castle_locations missing for mine ' + raw_mine.id + ' at ' + castle_location.x);
    }
    const ground_distance: number = y_list[castle_location.y];
    if (ground_distance === undefined) {
      throw new Error('viable_castle_location missing for mine ' + raw_mine.id + ' at ' + castle_location.x + ', ' + castle_location.y);
    }

    if (isNaN(ground_distance)) {
      score += 9001;
    } else {
      score += ground_distance;
    }
  }

  const new_castle_placement: CastlePlacement = {
    'castle_location': castle_location,
    'mines_data': mines_data,
    'tower_location': tower_location,
    'score': score,
  };
  return new_castle_placement;
}

export { SelectCastleLocations };
