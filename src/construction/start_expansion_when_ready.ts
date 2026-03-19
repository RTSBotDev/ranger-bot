import { DataHub } from '../data_hub';
import { SelectCastlePlacement } from './select_castle_placement';
import { AllocateAvailableWorkerClosestToLocation, AllocateWorkerFromActiveMine } from '../allocate_worker';
import { GetClosestActiveMineToLocation, SafeGroundDistance } from '../ground_distance';
import { WORKER_SPEED, CASTLE_COST, DEBUG } from '../constants';

interface StartExpansionWhenReadyKwargs {
  data_hub: DataHub;
}

function StartExpansionWhenReady({ data_hub }: StartExpansionWhenReadyKwargs): void {
  const next_expansion: PlayerExpansion | undefined = _SelectNextExpansion(data_hub);
  if (!next_expansion) {
    if (DEBUG) {
      console.log(data_hub.map.expansions);
      console.log('ERROR: Missing next_expansion for StartExpansionWhenReady');
    }
    return;
  }

  const castle_placement: PlayerCastlePlacement | undefined = SelectCastlePlacement({ player_expansion: next_expansion });
  if (!castle_placement) {
    if (DEBUG) {
      console.log(next_expansion);
      console.log('ERROR: Missing castle_placement for StartExpansionWhenReady');
    }
    return;
  }

  if (_NeedsTower(castle_placement, data_hub)) {
    if (data_hub.spendable_gold < data_hub.TowerCost()) {
      data_hub.spendable_gold -= data_hub.TowerCost();
      return;
    }
    data_hub.spendable_gold -= data_hub.TowerCost();

    _BuildTower(castle_placement, data_hub);
  }

  const closest_mine: ActiveMineData | undefined = GetClosestActiveMineToLocation(castle_placement.castle_location, data_hub.active_mines as ActiveMineData[]);
  if (!closest_mine) {
    if (DEBUG) {
      console.log('ERROR: Missing closest_mine for StartExpansionWhenReady');
    }
    return;
  }
  const ground_distance = SafeGroundDistance(closest_mine.midpoint, castle_placement.castle_location);
  if (isNaN(ground_distance)) {
    if (DEBUG) {
      console.log('ERROR: Missing ground_distance for StartExpansionWhenReady');
    }
    return;
  }
  const travel_time = Math.floor(ground_distance / WORKER_SPEED);
  const travel_gold = travel_time * data_hub.net_gold_per_sec;
  if (data_hub.spendable_gold < CASTLE_COST - travel_gold) {
    return;
  }

  const new_builder: LwgUnit | undefined = AllocateWorkerFromActiveMine(closest_mine);
  if (!new_builder) {
    if (DEBUG) {
      console.log('ERROR: Missing new_builder for StartExpansionWhenReady');
    }
    return;
  }

  new_builder.ranger_bot = {
    'expansion': next_expansion,
    'placement': castle_placement,
    'job': 'build',
    'building_type': 'castle',
    'order': 'Build Castle',
    'exclude_worker_paths': false,
    'cost': CASTLE_COST,
    'reserve': 0,
    'target_location': castle_placement.castle_location,
  };
  (data_hub.castle_builders as LwgUnit[]).push(new_builder);

  scope.order('Move', [{'unit': new_builder}], new_builder.ranger_bot.target_location);
}

function _SelectNextExpansion(data_hub: DataHub): PlayerExpansion | undefined {
  return data_hub.map.expansions.filter((player_expansion: PlayerExpansion) => {
    let is_viable = false;

    for (let i=0; i<player_expansion.castle_placements.length; i++) {
      const placement: PlayerCastlePlacement = player_expansion.castle_placements[i];

      for (let j=0; j<placement.mines_data.length; j++) {
        const active_mine: ActiveMineData = placement.mines_data[j];
        if (!active_mine.gold_mine) {
          if (DEBUG) {
            console.log(active_mine);
          }
          throw new Error('Missing gold_mine for _SelectNextExpansion');
        }
        const gold_mine: CachedGoldMine = active_mine.gold_mine;

        if (gold_mine.castle) {
          return false;
        } else if (gold_mine.gold > 0) {
          is_viable = true;
        }
      }
    }

    return is_viable;
  }).sort((a, b) => a.score - b.score).find(() => true);
}

function _NeedsTower(castle_placement: PlayerCastlePlacement, data_hub: DataHub): boolean {
  if (!scope.ranger_bot.player_caches[data_hub.player_cache_key].build_towers) {
    return false;
  } else if ((data_hub.traveling_tower_builders as LwgUnit[]).length > 0) {
    // TODO: identify true conflicts by target_location
    return false;
  }

  for (let i=0; i<castle_placement.mines_data.length; i++) {
    const active_mine: ActiveMineData = castle_placement.mines_data[i];
    if (!active_mine.gold_mine) {
      if (DEBUG) {
        console.log(active_mine);
      }
      throw new Error('Missing gold_mine for _NeedsTower');
    }
    const gold_mine: CachedGoldMine = active_mine.gold_mine;

    if (gold_mine.tower) {
      return false;
    }
  }

  return true;
}

function _BuildTower(castle_placement: PlayerCastlePlacement, data_hub: DataHub): void {
  const new_builder: LwgUnit | undefined = AllocateAvailableWorkerClosestToLocation({
    map_location: castle_placement.tower_location,
    active_mines: data_hub.active_mines as ActiveMineData[],
    idle_workers: data_hub.idle_workers as LwgUnit[],
  });
  if (!new_builder) {
    if (DEBUG) {
      console.log('ERROR: Missing new_builder for _BuildTower');
    }
    return;
  }

  new_builder.ranger_bot = {
    'active_mines': castle_placement.mines_data,
    'job': 'build',
    'building_type': 'watchtower',
    'order': 'Build Watchtower',
    'exclude_worker_paths': false,
    'cost': data_hub.TowerCost(),
    'reserve': data_hub.TowerCost(),
    'target_location': castle_placement.tower_location,
  };
  (data_hub.traveling_tower_builders as LwgUnit[]).push(new_builder);
  scope.order('Move', [{'unit': new_builder}], new_builder.ranger_bot.target_location);
}

export { StartExpansionWhenReady };
