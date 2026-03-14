import { DataHub } from '../data_hub';
import { WORKER_COST, WORKER_SUPPLY, WORKER_BUILD_TIME, NEAR_MAX_SUPPLY,
  PRE_QUEUE_BUFFER, SPEED_FACTOR } from '../constants';

interface TrainWorkersIfNeededKwargs {
  data_hub: DataHub;
}

function TrainWorkersIfNeeded({ data_hub }: TrainWorkersIfNeededKwargs): void {
  _TrainWorkers(data_hub.active_castles as LwgBuilding[], data_hub);
  _PreQueueWorkers(data_hub.active_castles as LwgBuilding[], data_hub);
  _TrainWorkers(data_hub.my_castles, data_hub);
  _PreQueueWorkers(data_hub.my_castles, data_hub);

  for (let i=0; i<data_hub.my_castles_under_construction.length; i++) {
    const constructing_castle = data_hub.my_castles_under_construction[i];

    const time_left = constructing_castle.buildTicksLeft / SPEED_FACTOR;
    if (time_left <= PRE_QUEUE_BUFFER) {
      data_hub.spendable_gold -= WORKER_COST;
      data_hub.available_supply -= WORKER_SUPPLY;
    }
  }
}

function _TrainWorkers(castles: LwgBuilding[], data_hub: DataHub): void {
  for (let i=0; i<castles.length; i++) {
    const castle: LwgBuilding = castles[i];

    if (data_hub.workers_needed <= 0) {
      return;
    }
    if (castle.isUnderConstruction) {
      continue;
    }
    if (castle.queue[0]) {
      continue;
    }

    _Train(castle, data_hub);
  }
}

function _Train(castle: LwgBuilding, data_hub: DataHub): void {
  if (data_hub.spendable_gold >= WORKER_COST && data_hub.available_supply >= WORKER_SUPPLY) {
    scope.order('Train Worker', [{'unit': castle}]);
    castle.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec() + WORKER_BUILD_TIME;
    data_hub.workers_needed--;
  }

  data_hub.spendable_gold -= WORKER_COST;
  data_hub.available_supply -= WORKER_SUPPLY;
}

function _PreQueueWorkers(castles: LwgBuilding[], data_hub: DataHub): void {
  if (scope.getCurrentSupply() >= scope.player.supplyCap - NEAR_MAX_SUPPLY) {
    return;
  }

  for (let i=0; i<castles.length; i++) {
    const castle: LwgBuilding = castles[i];

    if (data_hub.workers_needed <= 0) {
      return;
    }
    if (castle.isUnderConstruction) {
      continue;
    }

    if (castle.queue[0]) {
      _PreQueue(castle, data_hub);
    } else {
      _Train(castle, data_hub);
    }
  }
}

function _PreQueue(castle: LwgBuilding, data_hub: DataHub): void {
  if (!castle.ranger_bot.queue_finish_time) {
    castle.ranger_bot.queue_finish_time = scope.getCurrentGameTimeInSec();
  }
  const time_left = castle.ranger_bot.queue_finish_time - scope.getCurrentGameTimeInSec();
  if (time_left >= PRE_QUEUE_BUFFER) {
    return;
  }

  if (data_hub.spendable_gold >= WORKER_COST && data_hub.available_supply >= WORKER_SUPPLY) {
    scope.order('Train Worker', [{'unit': castle}]);
    castle.ranger_bot.queue_finish_time += WORKER_BUILD_TIME;
    data_hub.workers_needed--;
  }

  data_hub.spendable_gold -= WORKER_COST;
  data_hub.available_supply -= WORKER_SUPPLY;
}

export { TrainWorkersIfNeeded };
