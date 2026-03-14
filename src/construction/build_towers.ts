import { DataHub } from '../data_hub';
import { AllocateAvailableWorkerClosestToLocation } from '../allocate_worker';

interface BuildTowersKwargs {
  data_hub: DataHub;
}

function BuildTowers({ data_hub }: BuildTowersKwargs): boolean {
  if (!scope.ranger_bot.player_caches[data_hub.player_cache_key].build_towers) {
    return false;
  }

  const without_towers: LwgBuilding[] = data_hub.my_castles.filter((c) => !c.ranger_bot.tower && c.ranger_bot.mining_data)
    .sort((a, b) => b.id - a.id); // prioritize newer castles
  if (without_towers.length <= 0) {
    return false;
  }

  const traveling_tower_builders = data_hub.traveling_tower_builders as LwgUnit[];
  if (traveling_tower_builders.length > 0) {
    return false;
  }

  if (data_hub.spendable_gold < data_hub.TowerCost()) {
    return false;
  }

  const next_castle: LwgBuilding = without_towers[0];
  const mining_data = next_castle.ranger_bot.mining_data as MiningData;
  const target_location: MapLocation = mining_data.tower_location;
  const new_builder = AllocateAvailableWorkerClosestToLocation({
    map_location: target_location,
    active_mines: data_hub.active_mines as ActiveMineData[],
    idle_workers: data_hub.idle_workers as LwgUnit[],
  });
  if (!new_builder) {
    console.log('ERROR: Missing new_builder for BuildTowers');
    return false;
  }

  new_builder.ranger_bot = {
    'castle': next_castle,
    'active_mines': mining_data.mines_data,
    'job': 'build',
    'building_type': 'watchtower',
    'order': 'Build Watchtower',
    'exclude_worker_paths': false,
    'cost': data_hub.TowerCost(),
    'reserve': data_hub.TowerCost(),
    'target_location': target_location,
  };
  traveling_tower_builders.push(new_builder);

  return true;
}

export { BuildTowers };
