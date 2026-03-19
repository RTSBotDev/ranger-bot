import { DataHub } from './data_hub';
import { MicroCombatUnit } from './micro/micro_combat_unit';
import { WORKERS_PER_CASTLE, DEBUG } from './constants';
import { MicroWorker } from './micro/micro_worker';

interface MicroUnitsKwargs {
  data_hub: DataHub;
}

function MicroUnits({ data_hub }: MicroUnitsKwargs): void {
  _RallyCastles(data_hub);

  for (let i=0; i<data_hub.my_wolves.length; i++) {
    const wolf: LwgUnit = data_hub.my_wolves[i];

    MicroCombatUnit(wolf);
  }

  for (let i=0; i<data_hub.my_snakes.length; i++) {
    const snake: LwgUnit = data_hub.my_snakes[i];

    MicroCombatUnit(snake);
  }

  for (let i=0; i<data_hub.my_archers.length; i++) {
    const archer: LwgUnit = data_hub.my_archers[i];

    MicroCombatUnit(archer);
  }

  for (let i=0; i<data_hub.my_soldiers.length; i++) {
    const soldier: LwgUnit = data_hub.my_soldiers[i];

    MicroCombatUnit(soldier);
  }

  for (let i=0; i<data_hub.my_workers.length; i++) {
    const worker = data_hub.my_workers[i];

    MicroWorker(worker, data_hub);
  }
}

function _RallyCastles(data_hub: DataHub): void {
  let needy_mine: ActiveMineData | undefined = (data_hub.workable_mines as ActiveMineData[])
    .sort((a, b) => a.workers.length - b.workers.length)
    .find(() => true);
  if (needy_mine && needy_mine.workers.length >= WORKERS_PER_CASTLE) {
    needy_mine = undefined;
  }

  for (let i=0; i<data_hub.my_castles.length; i++) {
    const castle: LwgBuilding = data_hub.my_castles[i];
    if (!castle.queue[0]) {
      continue;
    }
    const mining_data = castle.ranger_bot.mining_data as MiningData;
    const least_workers: ActiveMineData | undefined = mining_data.mines_data.filter((active_mine: ActiveMineData) => {
      if (!active_mine.gold_mine) {
        if (DEBUG) {
          console.log(active_mine);
        }
        throw new Error('Missing gold_mine for _RallyCastles');
      }

      return active_mine.gold_mine.gold > 0;
    }).sort((a, b) => a.workers.length - b.workers.length).find(() => true);

    const target: MapLocation = (() => {
      if (!needy_mine && !least_workers) {
        return castle.ranger_bot.center;
      } else if (!needy_mine) {
        return ((least_workers as ActiveMineData).gold_mine as CachedGoldMine).center;
      } else if (!least_workers) {
        return (needy_mine.gold_mine as CachedGoldMine).center;
      } else if (needy_mine.workers.length >= least_workers.workers.length) {
        return (least_workers.gold_mine as CachedGoldMine).center;
      }

      const worker_diff = least_workers.workers.length - needy_mine.workers.length;
      if (worker_diff < 2) {
        return (least_workers.gold_mine as CachedGoldMine).center;
      } else {
        return (needy_mine.gold_mine as CachedGoldMine).center;
      }
    })();

    scope.order('Move', [{'unit': castle}], target);
  }
}

export { MicroUnits };
