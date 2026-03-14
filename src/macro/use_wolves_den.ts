import { DataHub } from '../data_hub';
import { WolvesAreObsolete } from '../utils';
import { WOLF_COST, WOLF_SUPPLY, WOLF_BUILD_TIME, PRE_QUEUE_BUFFER,
  NEAR_MAX_SUPPLY } from '../constants';

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

    let queued_wolf = false;
    if (data_hub.spendable_gold >= WOLF_COST && data_hub.available_supply >= WOLF_SUPPLY) {
      scope.order('Train Wolf', [{'unit': wolf_den}]);
      wolf_den.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec() + WOLF_BUILD_TIME;
      queued_wolf = true;
    }

    if (!_BuildOrderExceptionApplies(data_hub, queued_wolf)) {
      data_hub.spendable_gold -= WOLF_COST;
      data_hub.available_supply -= WOLF_SUPPLY;
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

    const available_supply = (() => {
      if (_BuildOrderExceptionApplies(data_hub, false)) {
        return data_hub.available_supply - data_hub.units_supply_producing;
      } else {
        return data_hub.available_supply;
      }
    })();
    let queued_wolf = false;
    if (data_hub.spendable_gold >= WOLF_COST && available_supply >= WOLF_SUPPLY) {
      scope.order('Train Wolf', [{'unit': wolf_den}]);
      wolf_den.ranger_bot.queue_finish_time += WOLF_BUILD_TIME;
      queued_wolf = true;
    }

    if (!_BuildOrderExceptionApplies(data_hub, queued_wolf)) {
      data_hub.spendable_gold -= WOLF_COST;
      data_hub.available_supply -= WOLF_SUPPLY;
    }
  }
}

function _BuildOrderExceptionApplies(data_hub: DataHub, queued_wolf: boolean): boolean {
  if (queued_wolf) {
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

export { UseWolvesDen };
