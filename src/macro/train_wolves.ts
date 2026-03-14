import { DataHub } from '../data_hub';
import { WolvesAreObsolete } from '../utils';
import { WOLF_COST, WOLF_SUPPLY, WOLF_BUILD_TIME, PRE_QUEUE_BUFFER,
  NEAR_MAX_SUPPLY } from '../constants';

interface TrainWolvesKwargs {
  data_hub: DataHub;
}

function TrainWolves({ data_hub }: TrainWolvesKwargs): void {
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

    if (data_hub.spendable_gold >= WOLF_COST && data_hub.available_supply >= WOLF_SUPPLY) {
      scope.order('Train Wolf', [{'unit': wolf_den}]);
      wolf_den.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec() + WOLF_BUILD_TIME;
    }

    data_hub.spendable_gold -= WOLF_COST;
    data_hub.available_supply -= WOLF_SUPPLY;
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

    if (data_hub.spendable_gold >= WOLF_COST && data_hub.available_supply >= WOLF_SUPPLY) {
      scope.order('Train Wolf', [{'unit': wolf_den}]);
      wolf_den.ranger_bot.queue_finish_time += WOLF_BUILD_TIME;
    }

    data_hub.spendable_gold -= WOLF_COST;
    data_hub.available_supply -= WOLF_SUPPLY;
  }
}

export { TrainWolves };
