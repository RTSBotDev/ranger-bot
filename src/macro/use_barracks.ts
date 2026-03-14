import { DataHub } from '../data_hub';
import { SOLDIER_COST, SOLDIER_SUPPLY, SOLDIER_BUILD_TIME, PRE_QUEUE_BUFFER,
  ARCHER_COST, ARCHER_SUPPLY, ARCHER_BUILD_TIME, NEAR_MAX_SUPPLY,
  SPEED_FACTOR } from '../constants';

interface UseBarracksKwargs {
  data_hub: DataHub;
}

function UseBarracks({ data_hub }: UseBarracksKwargs): void {
  // First train
  for (let i=0; i<data_hub.my_barracks.length; i++) {
    const barracks: LwgBuilding = data_hub.my_barracks[i];

    if (barracks.isUnderConstruction) {
      continue;
    }
    if (barracks.queue[0]) {
      continue;
    }

    const unit: UnitSelection = _SelectBarracksUnit(data_hub);

    if (data_hub.spendable_gold >= unit.cost && data_hub.available_supply >= unit.supply) {
      scope.order(unit.order, [{'unit': barracks}]);
      barracks.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec() + unit.build_time;
    }

    data_hub.spendable_gold -= unit.cost;
    data_hub.available_supply -= unit.supply;
  }

  // Then pre-queue, unless maxed
  if (scope.getCurrentSupply() >= scope.player.supplyCap - NEAR_MAX_SUPPLY) {
    return;
  }
  for (let i=0; i<data_hub.my_barracks.length; i++) {
    const barracks: LwgBuilding = data_hub.my_barracks[i];

    if (barracks.isUnderConstruction) {
      continue;
    }
    if (!barracks.queue[0]) {
      continue;
    }
    if (barracks.queue[0] && barracks.queue[1]) {
      continue;
    }

    if (!barracks.ranger_bot.queue_finish_time) {
      barracks.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec();
    }
    const time_left = barracks.ranger_bot.queue_finish_time - scope.getCurrentGameTimeInSec();
    if (time_left >= PRE_QUEUE_BUFFER) {
      continue;
    }

    const unit: UnitSelection = _SelectBarracksUnit(data_hub);

    if (data_hub.spendable_gold >= unit.cost && data_hub.available_supply >= unit.supply) {
      scope.order(unit.order, [{'unit': barracks}]);
      barracks.ranger_bot.queue_finish_time += unit.build_time;
    }

    data_hub.spendable_gold -= unit.cost;
    data_hub.available_supply -= unit.supply;
  }

  // Finally reserve
  for (let i=0; i<data_hub.my_barracks.length; i++) {
    const barracks: LwgBuilding = data_hub.my_barracks[i];

    if (!barracks.isUnderConstruction) {
      continue;
    }

    const time_left = barracks.buildTicksLeft / SPEED_FACTOR;
    if (time_left > PRE_QUEUE_BUFFER) {
      continue;
    }

    const unit: UnitSelection = _SelectBarracksUnit(data_hub);
    data_hub.spendable_gold -= unit.cost;
    data_hub.available_supply -= unit.supply;
  }
}

const SOLDIER_SELECTION: UnitSelection = {
  'order': 'Train Soldier',
  'cost': SOLDIER_COST,
  'supply': SOLDIER_SUPPLY,
  'build_time': SOLDIER_BUILD_TIME,
};

const ARCHER_SELECTION: UnitSelection = {
  'order': 'Train Archer',
  'cost': ARCHER_COST,
  'supply': ARCHER_SUPPLY,
  'build_time': ARCHER_BUILD_TIME,
};

function _SelectBarracksUnit(data_hub: DataHub): UnitSelection {
  if (data_hub.count_melee < 7) {
    data_hub.count_melee ++;
    return SOLDIER_SELECTION;
  }

  const total = data_hub.count_melee + data_hub.count_ranged;
  const target_ratio = total / 50;
  const actual_ratio = data_hub.count_ranged / total;
  if (target_ratio > actual_ratio) {
    data_hub.count_ranged ++;
    return ARCHER_SELECTION;
  } else {
    data_hub.count_melee ++;
    return SOLDIER_SELECTION;
  }
}

export { UseBarracks };
