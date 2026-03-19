import { GetClosestActiveMineToBuilding, GetClosestUnitToBuilding,
  GetClosestActiveMineToLocation, GetClosestUnitToLocation } from './ground_distance';
import { DEBUG } from './constants';

interface AllocateAvailableWorkerClosestToBuildingKwargs {
  building: LwgBuilding;
  active_mines: ActiveMineData[];
  idle_workers: LwgUnit[];
}

function AllocateAvailableWorkerClosestToBuilding({ building, active_mines, idle_workers }: AllocateAvailableWorkerClosestToBuildingKwargs): LwgUnit | undefined {
  const useful_mines = active_mines.filter((mine) => mine.workers.length > 0);
  if (useful_mines.length > 0) {
    const giver_mine: ActiveMineData | undefined = GetClosestActiveMineToBuilding(building, useful_mines);
    if (giver_mine) {
      const new_worker: LwgUnit | undefined = AllocateWorkerFromActiveMine(giver_mine);
      if (new_worker) {
        return new_worker;
      } else if (DEBUG) {
        console.log('Error: Missing new_worker for AllocateAvailableWorkerClosestToBuilding');
      }
    } else if (DEBUG) {
      console.log('Error: Missing giver_mine for AllocateAvailableWorkerClosestToBuilding');
    }
  } else if (DEBUG) {
    console.log('Error: No useful_mines  for AllocateAvailableWorkerClosestToBuilding');
  }
    
  if (idle_workers.length > 0) {
    const closest_idle_worker: LwgUnit | undefined = GetClosestUnitToBuilding(building, idle_workers);
    if (closest_idle_worker) {
      closest_idle_worker.ranger_bot = {};
      return closest_idle_worker;
    } else {
      if (DEBUG) {
        console.log('Error: Missing idle worker for AllocateAvailableWorkerClosestToBuilding');
      }
      return undefined;
    }
  } else {
    if (DEBUG) {
      console.log('Error: AllocateAvailableWorkerClosestToBuilding Failed');
    }
    return undefined;
  }
}

function AllocateWorkerFromActiveMine(active_mine: ActiveMineData): LwgUnit | undefined {
  if (!active_mine.gold_mine) {
    if (DEBUG) {
      console.log(active_mine);
    }
    throw new Error('Missing gold mine for AllocateWorkerFromActiveMine');
  }
  const gold_mine: CachedGoldMine = active_mine.gold_mine;
  if (!gold_mine.castle) {
    if (DEBUG) {
      console.log(gold_mine);
    }
    throw new Error('Missing castle for AllocateWorkerFromActiveMine');
  }
  const castle: LwgBuilding = gold_mine.castle;

  let empty_hands = active_mine.workers.filter((w) => (!w.carriedGoldAmount || w.carriedGoldAmount <= 0));
  if (empty_hands.length <= 0) {
    empty_hands = active_mine.workers;
  }
  if (empty_hands.length <= 0) {
    return undefined;
  }
  const with_distance = empty_hands.map((worker) => {
    return {
      'worker': worker,
      'distance': Math.sqrt((castle.ranger_bot.center.x - worker.pos.x)**2 +
                            (castle.ranger_bot.center.y - worker.pos.y)**2),
    };
  }).sort((a, b) => a.distance - b.distance);
  const output = with_distance[0].worker;
  active_mine.workers = active_mine.workers.filter((w) => w.id != output.id);
  output.ranger_bot = {};
  return output;
}

function AllocateWorkerFromActiveCastle(giver_castle: LwgBuilding): LwgUnit | undefined {
  const active_mines: ActiveMineData[] = (giver_castle.ranger_bot.mining_data as MiningData).mines_data;
  for (let i=0; i<active_mines.length; i++) {
    const active_mine: ActiveMineData = active_mines[i];

    const new_worker = AllocateWorkerFromActiveMine(active_mine);
    if (new_worker) {
      return new_worker;
    }
  }
  return undefined;
}

interface AllocateAvailableWorkerClosestToLocationKwargs {
  map_location: MapLocation;
  active_mines: ActiveMineData[];
  idle_workers: LwgUnit[];
}

function AllocateAvailableWorkerClosestToLocation({ map_location, active_mines, idle_workers }: AllocateAvailableWorkerClosestToLocationKwargs): LwgUnit | undefined {
  const useful_mines = active_mines.filter((mine) => mine.workers.length > 0);
  if (useful_mines.length > 0) {
    const giver_mine: ActiveMineData | undefined = GetClosestActiveMineToLocation(map_location, useful_mines);
    if (giver_mine) {
      const new_worker: LwgUnit | undefined = AllocateWorkerFromActiveMine(giver_mine);
      if (new_worker) {
        return new_worker;
      } else if (DEBUG) {
        console.log('Error: Missing new_worker for AllocateAvailableWorkerClosestToLocation');
      }
    } else if (DEBUG) {
      console.log('Error: Missing giver_mine for AllocateAvailableWorkerClosestToLocation');
    }
  } else if (DEBUG) {
    console.log('Error: No useful_mines for AllocateAvailableWorkerClosestToLocation');
  }
    
  if (idle_workers.length > 0) {
    const closest_idle_worker: LwgUnit | undefined = GetClosestUnitToLocation(map_location, idle_workers);
    if (closest_idle_worker) {
      closest_idle_worker.ranger_bot = {};
      return closest_idle_worker;
    } else {
      if (DEBUG) {
        console.log('ERROR: Missing idle worker for AllocateAvailableWorkerClosestToLocation');
      }
      return undefined;
    }
  } else {
    if (DEBUG) {
      console.log('ERROR: AllocateAvailableWorkerClosestToLocation Failed');
    }
    return undefined;
  }
}

export { AllocateAvailableWorkerClosestToLocation, AllocateWorkerFromActiveCastle,
  AllocateAvailableWorkerClosestToBuilding, AllocateWorkerFromActiveMine };
