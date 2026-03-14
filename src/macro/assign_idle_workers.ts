import { DataHub } from '../data_hub';
import { WORKERS_PER_CASTLE } from '../constants';
import { SafeGroundDistance } from '../ground_distance';
import { AssignMiner } from '../utils';

interface AssignIdleWorkersKwargs {
  data_hub: DataHub;
}

function AssignIdleWorkers({ data_hub }: AssignIdleWorkersKwargs): void {
  const workable_mines = data_hub.workable_mines as ActiveMineData[];
  if (workable_mines.length <= 0) {
    return;
  }
  const idle_workers = data_hub.idle_workers as LwgUnit[];

  for (let i=0; i<idle_workers.length; i++) {
    const idle_worker: LwgUnit = idle_workers[i];

    const need_workers = workable_mines.filter((am) => am.workers.length < WORKERS_PER_CASTLE);
    if (need_workers.length <= 0) {
      _AssignToLeastOverfull(idle_worker, workable_mines);
      continue;
    }

    const with_air_distance = need_workers.map((active_mine: ActiveMineData) => {
      return {
        'active_mine': active_mine,
        'air_distance': Math.sqrt((active_mine.midpoint.x - idle_worker.pos.x)**2 + (active_mine.midpoint.y - idle_worker.pos.y)**2),
      };
    }).sort((a, b) => a.air_distance - b.air_distance);

    let assigned_mine: ActiveMineData | undefined;
    let shortest_distance: number = NaN;

    for (let j=0; j<with_air_distance.length; j++) {
      const data = with_air_distance[j];

      if (isNaN(shortest_distance)) {
        const ground_distance = SafeGroundDistance(data.active_mine.midpoint, idle_worker.pos);
        if (isNaN(ground_distance)) {
          console.log('\nERROR: missing SafeGroundDistance for AssignIdleWorkers 1');
          continue;
        }
        shortest_distance = ground_distance;
        assigned_mine = data.active_mine;
      } else if (data.air_distance < shortest_distance) {
        const ground_distance = SafeGroundDistance(data.active_mine.midpoint, idle_worker.pos);
        if (isNaN(ground_distance)) {
          console.log('\nERROR: missing SafeGroundDistance for AssignIdleWorkers 2');
          continue;
        }
        if (ground_distance < shortest_distance) {
          shortest_distance = ground_distance;
          assigned_mine = data.active_mine;
        }
      }
    }

    if (!assigned_mine) {
      console.log(idle_worker);
      console.log(with_air_distance);
      throw new Error('Unable to assign idle worker');
    }

    AssignMiner(idle_worker, assigned_mine);
  }

  data_hub.idle_workers = idle_workers.filter((u) => !u.ranger_bot.job);
}

function _AssignToLeastOverfull(idle_worker: LwgUnit, workable_mines: ActiveMineData[]): void {
  const by_overfull = workable_mines.sort((a, b) => a.workers.length - b.workers.length);
  AssignMiner(idle_worker, by_overfull[0]);
}

export { AssignIdleWorkers };
