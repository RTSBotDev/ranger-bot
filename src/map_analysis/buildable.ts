import { CASTLE_WIDTH, CASTLE_HEIGHT, TOWER_WIDTH, TOWER_HEIGHT } from '../constants';
import { DataHub } from '../data_hub';

interface IsBuildableKwargs {
  map_location: MapLocation;
  exclude_worker_paths: boolean;
  raw_gold_mines?: LwgGoldMine[];
  data_hub?: DataHub;
  teams?: RangerBotTeams;
}

function IsBuildable({ map_location, exclude_worker_paths, raw_gold_mines, data_hub, teams }: IsBuildableKwargs): boolean {
  if (map_location.x < 0 || scope.getMapWidth() < map_location.x) {
    return false;
  }
  if (map_location.y < 0 || scope.getMapHeight() < map_location.y) {
    return false;
  }
  if (scope.fieldIsRamp(map_location.x, map_location.y)) {
    return false;
  }

  if (!scope.positionIsPathable(map_location.x, map_location.y)) {
    if (exclude_worker_paths) {
      return false;
    }

    if (teams) {
      // Initial castles makes starting positions unpathable,
      // think of AnalyzeGoldMines at the start of the game.
      const start_locations = [teams.my.start];
      const players_data = Object.values(teams.players);
      for (let i=0; i<players_data.length; i++) {
        const player_data = players_data[i];

        start_locations.push(player_data.start_location);
      }
      for (let i=0; i<start_locations.length; i++) {
        const start_location = start_locations[i];

        if (start_location.x <= map_location.x && map_location.x <= (start_location.x + CASTLE_WIDTH) &&
            start_location.y <= map_location.y && map_location.y <= (start_location.y + CASTLE_HEIGHT)) {
          return true;
        }
      }
      return false;
    }
  }

  if (exclude_worker_paths) {
    // Once AnalyzeGoldMines has run we have the option of using expansion data.
    // But AnalyzeGoldMines itself uses IsBuildable and AreBuildable, so it
    // has to pass in gold_mines.
    if (raw_gold_mines) {
      return _UseGoldMines(map_location, raw_gold_mines);
    } else if (data_hub) {
      return _UseExpansionDataFromDataHub(map_location, data_hub);
    // } else if (scope.ranger_bot.expansions) {
    //   return _UseExpansionDataFromGlobalCache(map_location, scope.ranger_bot.expansions);
    } else {
      throw new Error('Missing data for IsBuildable with exclude_worker_paths');
    }
  } else {
    return true;
  }
}

interface AreBuildableKwargs {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
  exclude_worker_paths: boolean;
  raw_gold_mines?: LwgGoldMine[];
  data_hub?: DataHub;
  teams?: RangerBotTeams;
}

function AreBuildable({ x_min, x_max, y_min, y_max, exclude_worker_paths, raw_gold_mines, data_hub, teams }: AreBuildableKwargs): boolean {
  for (let x:number=x_min; x<=x_max; x++) {
    for (let y:number=y_min; y<=y_max; y++) {
      const map_location: MapLocation = {'x': x, 'y': y};

      const kwargs: IsBuildableKwargs = {
        'map_location': map_location,
        'exclude_worker_paths': exclude_worker_paths,
      };
      if (raw_gold_mines) {
        kwargs['raw_gold_mines'] = raw_gold_mines;
      }
      if (data_hub) {
        kwargs['data_hub'] = data_hub;
      }
      if (teams) {
        kwargs['teams'] = teams;
      }

      if (!IsBuildable(kwargs)) {
        return false;
      }
    }
  }

  return true;
}

function _UseGoldMines(map_location: MapLocation, raw_gold_mines: LwgGoldMine[]): boolean {
  for (let i=0; i<raw_gold_mines.length; i++) {
    const raw_mine: LwgGoldMine = raw_gold_mines[i];
    const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

    const all_worker_paths: boolean[][][] = (() => {
      if (mine_cache._worker_paths) {
        return [mine_cache._worker_paths];
      } else if (mine_cache.expansion_data) {
        return mine_cache.expansion_data.map((ed:ExpansionData) => ed.worker_paths);
      }  else {
        throw new Error('all_worker_paths missing for _UseGoldMines');
      }
    })();
    for (let j=0; j<all_worker_paths.length; j++) {
      const worker_paths: boolean[][] = all_worker_paths[j];

      if (_OverlapsWorkerPaths(map_location, worker_paths)) {
        return false;
      }
    }

    const castle_locations: MapLocation[] = (() => {
      if (mine_cache._castle_location) {
        return [mine_cache._castle_location];
      } else if (mine_cache.expansion_data) {
        return mine_cache.expansion_data.map((ed:ExpansionData) => ed.castle_location);
      } else {
        throw new Error('castle_locations missing for _UseGoldMines');
      }
    })();
    for (let j=0; j<castle_locations.length; j++) {
      const castle_location: MapLocation = castle_locations[j];

      if (_OverlapsCastle(map_location, castle_location)) {
        return false;
      }
    }

    const tower_locations: MapLocation[] = (() => {
      if (mine_cache.expansion_data) {
        return mine_cache.expansion_data.map((ed:ExpansionData) => ed.tower_location);
      } else {
        return [];
      }
    })();
    for (let j=0; j<tower_locations.length; j++) {
      const tower_location: MapLocation = tower_locations[j];

      if (_OverlapsTower(map_location, tower_location)) {
        return false;
      }
    }
  }

  return true;
}

function _UseExpansionDataFromDataHub(map_location: MapLocation, data_hub: DataHub): boolean {
  for (let i=0; i<data_hub.map.expansions.length; i++) {
    const player_expansion: PlayerExpansion = data_hub.map.expansions[i];

    if (_OverlapsExpansion(map_location, player_expansion)) {
      return false;
    }
  }

  return true;
}

function _OverlapsExpansion(map_location: MapLocation, player_expansion: PlayerExpansion): boolean {
  const castles: LwgBuilding[] = [];

  for (let i=0; i<player_expansion.castle_placements.length; i++) {
    const placement: PlayerCastlePlacement = player_expansion.castle_placements[i];

    for (let j=0; j<placement.mines_data.length; j++) {
      const active_mine: ActiveMineData = placement.mines_data[j];

      if (!active_mine.gold_mine) {
        console.log(active_mine);
        throw new Error('Missing gold_mine for _OverlapsExpansion');
      }

      if (!active_mine.gold_mine.castle) {
        continue;
      }

      castles[active_mine.gold_mine.castle.id] = active_mine.gold_mine.castle;
    }
  }

  if (castles.length <= 0) {
    return _OverlapsAnyPlacement(map_location, player_expansion.castle_placements);
  }

  for (const [raw_id, castle] of Object.entries(castles)) {
    const id = Number(raw_id);
    if (isNaN(id)) {
      continue;
    }

    if (!castle.ranger_bot.mining_data) {
      console.log(castle);
      throw new Error('Missing mining_data for _OverlapsExpansion');
    }

    if (_OverlapsTower(map_location, castle.ranger_bot.mining_data.tower_location)) {
      return true;
    }

    for (let i=0; i<castle.ranger_bot.mining_data.mines_data.length; i++) {
      const active_mine: ActiveMineData = castle.ranger_bot.mining_data.mines_data[i];

      if (_OverlapsWorkerPaths(map_location, active_mine.worker_paths)) {
        return true;
      }
    }
  }

  return false;
}

function _OverlapsAnyPlacement(map_location: MapLocation, castle_placements: PlayerCastlePlacement[]): boolean {
  for (let i=0; i<castle_placements.length; i++) {
    const placement: PlayerCastlePlacement = castle_placements[i];

    if (_OverlapsCastle(map_location, placement.castle_location)) {
      return true;
    }

    if (_OverlapsTower(map_location, placement.tower_location)) {
      return true;
    }

    for (let j=0; j<placement.mines_data.length; j++) {
      const active_mine: ActiveMineData = placement.mines_data[j];

      if (_OverlapsWorkerPaths(map_location, active_mine.worker_paths)) {
        return true;
      }
    }
  }

  return false;
}

// function _UseExpansionDataFromGlobalCache(map_location: MapLocation, expansions: Expansion[]): boolean {
//   for (let i=0; i<expansions.length; i++) {
//     const expansion_placement: Expansion = expansions[i];

//     for (let j=0; j<expansion_placement.castle_placements.length; j++) {
//       const castle_placement: CastlePlacement = expansion_placement.castle_placements[j];

//       if (_OverlapsCastle(map_location, castle_placement.castle_location)) {
//         return false;
//       }

//       if (_OverlapsTower(map_location, castle_placement.tower_location)) {
//         return false;
//       }

//       for (let k=0; k<castle_placement.mines_data.length; k++) {
//         const mine_data: CastleMineData = castle_placement.mines_data[k];

//         if (_OverlapsWorkerPaths(map_location, mine_data.worker_paths)) {
//           return false;
//         }
//       }
//     }
//   }

//   return true;
// }

function _OverlapsCastle(map_location: MapLocation, castle_location: MapLocation): boolean {
  for (let dx=0; dx<CASTLE_WIDTH; dx++) {
    const xx = castle_location.x + dx;

    if (xx != map_location.x) {
      continue;
    }

    for (let dy=0; dy<CASTLE_HEIGHT; dy++) {
      const yy = castle_location.y + dy;

      if (yy == map_location.y) {
        return true;
      }
    }
  }

  return false;
}

function _OverlapsTower(map_location: MapLocation, tower_location: MapLocation): boolean {
  for (let dx=0; dx<TOWER_WIDTH; dx++) {
    const xx = tower_location.x + dx;

    if (xx != map_location.x) {
      continue;
    }

    for (let dy=0; dy<TOWER_HEIGHT; dy++) {
      const yy = tower_location.y + dy;

      if (yy == map_location.y) {
        return true;
      }
    }
  }

  return false;
}

function _OverlapsWorkerPaths(map_location: MapLocation, worker_paths: boolean[][]): boolean {
  const y_list: boolean[] = worker_paths[map_location.x];
  if (y_list && y_list[map_location.y]) {
    return true;
  }

  return false;
}

export { IsBuildable, AreBuildable };
