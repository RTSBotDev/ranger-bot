import { DataHub } from '../data_hub';
import { AllocateWorkerFromActiveMine, AllocateWorkerFromActiveCastle,
  AllocateAvailableWorkerClosestToLocation } from '../allocate_worker';
import { GetNumberFieldValue } from '../utils';
import { FindSpaceForBuilding } from './find_space_for_building';
import { DEBUG } from '../constants';

interface ConstructBuildingKwargs {
  building_type: string;
  build_order: string;
  data_hub: DataHub;
}

function ConstructBuilding({ building_type, build_order, data_hub }: ConstructBuildingKwargs): LwgUnit | undefined {
  const by_workers = (data_hub.active_mines as ActiveMineData[])
    .filter((mine) => mine.workers.length > 0)
    .sort((a, b) => a.workers.length - b.workers.length);

  const no_location: {[castle_id: string]: boolean} = {};
  let target_location: MapLocation | undefined;
  let giver_castle: LwgBuilding | undefined;
  let new_builder: LwgUnit | undefined;
  for (let i=0; i<by_workers.length; i++) {
    const active_mine = by_workers[i];
    const gold_mine = active_mine.gold_mine as CachedGoldMine;
    const active_castle = gold_mine.castle as LwgBuilding;

    target_location = FindSpaceForBuilding({
      active_castle: active_castle,
      building_type: building_type,
      data_hub: data_hub,
    });
    if (target_location) {
      giver_castle = active_castle;
      new_builder = AllocateWorkerFromActiveMine(active_mine);
      break;
    } else {
      no_location[String(active_castle.id)] = true;
    }
  }

  if (!target_location) {
    for (let i=0; i<data_hub.my_castles.length; i++) {
      const castle: LwgBuilding = data_hub.my_castles[i];

      if (no_location[String(castle.id)]) {
        continue;
      }

      target_location = FindSpaceForBuilding({
        active_castle: castle,
        building_type: building_type,
        data_hub: data_hub,
      });
      if (target_location) {
        giver_castle = castle;
        break;
      }
    }
  }

  if (!target_location) {
    if (DEBUG) {
      console.log(building_type);
      console.log(data_hub.my_castles);
    }
    throw new Error('Cannot find target_location for ConstructBuilding');
  }

  if (!new_builder) {
    if (!giver_castle) {
      throw new Error('How? ConstructBuilding');
    }
    new_builder = AllocateWorkerFromActiveCastle(giver_castle);
  }
  if (!new_builder) {
    new_builder = AllocateAvailableWorkerClosestToLocation({
      map_location: target_location,
      active_mines: data_hub.active_mines as ActiveMineData[],
      idle_workers: data_hub.idle_workers as LwgUnit[],
    });
  }
  if (!new_builder) {
    if (DEBUG) {
      console.log('Error: No available builders for ConstructBuilding');
    }
    return undefined;
  }

  const building_cost = GetNumberFieldValue({ piece_name: building_type, field_name: 'cost' });
  new_builder.ranger_bot = {
    'job': 'build',
    'building_type': building_type,
    'order': build_order,
    'exclude_worker_paths': true,
    'cost': building_cost,
    'reserve': building_cost,
    'target_location': target_location,
  };

  scope.order(build_order, [{'unit': new_builder}], target_location);

  return new_builder;
}

export { ConstructBuilding };
