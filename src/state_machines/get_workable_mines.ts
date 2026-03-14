/*
Conceptually, this belongs on DataHub.
But it can't run until after active_castles has been populated.
*/

import { DataHub } from '../data_hub';
import { WORKER_SPEED, SPEED_FACTOR } from '../constants';
import { GetShortestGroundDistanceToActiveCastle } from '../ground_distance';

interface GetWorkableCastlesKwargs {
  data_hub: DataHub;
}

function GetWorkableMines({ data_hub }: GetWorkableCastlesKwargs): void {
  const active_mines: ActiveMineData[] = [];
  const workable_mines: ActiveMineData[] = [];
  const active_castles = data_hub.active_castles as LwgBuilding[];

  for (let i=0; i<active_castles.length; i++) {
    const castle: LwgBuilding = active_castles[i];

    const mining_data = castle.ranger_bot.mining_data as MiningData;

    for (let j=0; j<mining_data.mines_data.length; j++) {
      const active_mine: ActiveMineData = mining_data.mines_data[j];
      const gold_mine = active_mine.gold_mine as CachedGoldMine;

      if (gold_mine.gold <= 0) {
        continue;
      }

      active_mines.push(active_mine);
      workable_mines.push(active_mine);
    }
  }

  data_hub.active_mines = active_mines;

  for (let i=0; i<data_hub.my_castles.length; i++) {
    const castle: LwgBuilding = data_hub.my_castles[i];
    if (!castle.isUnderConstruction) {
      continue;
    }
    const mining_data = castle.ranger_bot.mining_data as MiningData;

    if (!mining_data.closest_time) {
      const closest_time: number = _CalculateClosestTime(mining_data, active_castles);
      if (isNaN(closest_time)) {
        continue;
      }
      mining_data.closest_time = closest_time;
    }
    const build_time_left = castle.buildTicksLeft / SPEED_FACTOR;
    if (build_time_left < mining_data.closest_time) {
      for (let j=0; j<mining_data.mines_data.length; j++) {
        const active_mine: ActiveMineData = mining_data.mines_data[j];
        const gold_mine = active_mine.gold_mine as CachedGoldMine;

        if (gold_mine.gold <= 0) {
          continue;
        }

        workable_mines.push(active_mine);
      }
    }
  }

  data_hub.workable_mines = workable_mines;
}

function _CalculateClosestTime(mining_data: MiningData, active_castles: LwgBuilding[]): number {
  const distances: number[] = [];

  for (let i=0; i<mining_data.mines_data.length; i++) {
    const active_mine: ActiveMineData = mining_data.mines_data[i];

    const closest_distance = GetShortestGroundDistanceToActiveCastle({
      map_location: active_mine.midpoint,
      active_castles: active_castles,
      with_workers: false,
    });
    if (isNaN(closest_distance)) {
      continue;
    }
    distances.push(closest_distance);
  }

  if (distances.length <= 0) {
    console.log('ERROR: Missing GetShortestGroundDistanceToActiveCastle for _CalculateClosestTime');
    return NaN;
  }
  return Math.min(...distances) / WORKER_SPEED;
}

export { GetWorkableMines };
