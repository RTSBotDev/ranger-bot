import { DataHub } from '../data_hub';
import { WolvesAreObsolete } from '../utils';
import { WOLF_COST, WOLF_SUPPLY, WOLF_BUILD_TIME, PRE_QUEUE_BUFFER,
  NEAR_MAX_SUPPLY, SNAKE_COST, SNAKE_SUPPLY, SNAKE_BUILD_TIME } from '../constants';

interface TrainWolvesKwargs {
  data_hub: DataHub;
}

function UseWolvesDen({ data_hub }: TrainWolvesKwargs): void {
  if (WolvesAreObsolete()) {
    return;
  }

  // First train
  for (let i=0; i<data_hub.my_wolf_dens.length; i++) {
    const wolf_den: LwgBuilding = data_hub.my_wolf_dens[i];

    if (wolf_den.isUnderConstruction) {
      continue;
    }
    if (wolf_den.queue[0]) {
      continue;
    }

    const unit_selection: UnitSelection = _SelectWolfDenUnit(data_hub);

    let queued_unit = false;
    if (data_hub.spendable_gold >= unit_selection.cost && data_hub.available_supply >= unit_selection.supply) {
      scope.order(unit_selection.order, [{'unit': wolf_den}]);
      wolf_den.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec() + unit_selection.build_time;
      queued_unit = true;
    }

    if (!_BuildOrderExceptionApplies(data_hub, queued_unit)) {
      data_hub.spendable_gold -= unit_selection.cost;
      data_hub.available_supply -= unit_selection.supply;
    }
  }

  // Then pre-queue, unless maxed
  if (scope.getCurrentSupply() >= scope.player.supplyCap - NEAR_MAX_SUPPLY) {
    return;
  }
  for (let i=0; i<data_hub.my_wolf_dens.length; i++) {
    const wolf_den: LwgBuilding = data_hub.my_wolf_dens[i];

    if (wolf_den.isUnderConstruction) {
      continue;
    }
    if (!wolf_den.queue[0]) {
      continue;
    }
    if (wolf_den.queue[0] && wolf_den.queue[1]) {
      continue;
    }

    if (!wolf_den.ranger_bot.queue_finish_time) {
      wolf_den.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec();
    }
    const time_left = wolf_den.ranger_bot.queue_finish_time - scope.getCurrentGameTimeInSec();
    if (time_left >= PRE_QUEUE_BUFFER) {
      continue;
    }

    const unit_selection: UnitSelection = _SelectWolfDenUnit(data_hub);

    const available_supply = (() => {
      if (_BuildOrderExceptionApplies(data_hub, false)) {
        return data_hub.available_supply - data_hub.units_supply_producing;
      } else {
        return data_hub.available_supply;
      }
    })();
    let queued_unit = false;
    if (data_hub.spendable_gold >= unit_selection.cost && available_supply >= unit_selection.supply) {
      scope.order(unit_selection.order, [{'unit': wolf_den}]);
      wolf_den.ranger_bot.queue_finish_time += unit_selection.build_time;
      queued_unit = true;
    }

    if (!_BuildOrderExceptionApplies(data_hub, queued_unit)) {
      data_hub.spendable_gold -= unit_selection.cost;
      data_hub.available_supply -= unit_selection.supply;
    }
  }
}

function _BuildOrderExceptionApplies(data_hub: DataHub, queued_unit: boolean): boolean {
  if (queued_unit) {
    return false;
  } else if (WolvesAreObsolete()) {
    return false;
  } else if (data_hub.active_mining_bases > 1) {
    return false;
  } else if ((data_hub.viable_gold_mines as CachedGoldMine[]).length < 1) {
    return false;
  } else if (!scope.player.buildings.house) {
    return false;
  } else if (2 != scope.player.buildings.house) {
    return false;
  } else if (!scope.player.buildings.wolvesden) {
    return false;
  } else if (2 != scope.player.buildings.wolvesden) {
    return false;
  } else {
    return true;
  }
}

const WOLF_SELECTION: UnitSelection = {
  'order': 'Train Wolf',
  'cost': WOLF_COST,
  'supply': WOLF_SUPPLY,
  'build_time': WOLF_BUILD_TIME,
};

const SNAKE_SELECTION: UnitSelection = {
  'order': 'Train Snake',
  'cost': SNAKE_COST,
  'supply': SNAKE_SUPPLY,
  'build_time': SNAKE_BUILD_TIME,
};

function _SelectWolfDenUnit(data_hub: DataHub): UnitSelection {
  if (!scope.player.buildings.snakecharmer || scope.player.buildings.snakecharmer < 1) {
    return WOLF_SELECTION;
  }
  if (data_hub.count_melee < 7) {
    data_hub.count_melee ++;
    return WOLF_SELECTION;
  }

  const total = data_hub.count_melee + data_hub.count_ranged;
  const target_ratio = total / 50;
  const actual_ratio = data_hub.count_ranged / total;
  if (target_ratio > actual_ratio) {
    data_hub.count_ranged ++;
    return SNAKE_SELECTION;
  } else {
    data_hub.count_melee ++;
    return WOLF_SELECTION;
  }
}

export { UseWolvesDen };
