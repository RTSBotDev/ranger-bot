import { DataHub } from '../data_hub';
import { SafeGroundDistance } from '../ground_distance';
import { AssignMiner } from '../utils';
import { WORKERS_PER_CASTLE, DEBUG } from '../constants';

interface RedistributeMinersKwargs {
  data_hub: DataHub;
}

function RedistributeMiners({ data_hub }: RedistributeMinersKwargs): void {
  let workable_mines = data_hub.workable_mines as ActiveMineData[];
  if (workable_mines.length <= 0) {
    if (DEBUG) {
      console.log('Error: No workable_mines');
    }
    return;
  } else if (workable_mines.length <= 1) {
    return;
  }

  workable_mines = workable_mines.sort((a, b) => a.workers.length - b.workers.length);
  let from_mine: ActiveMineData = workable_mines[workable_mines.length - 1];
  let to_mine: ActiveMineData = workable_mines[0];
  while (_ShouldTransfer(from_mine, to_mine)) {
    let empty_hands: LwgUnit[] = from_mine.workers.filter((m) => (!m.carriedGoldAmount || m.carriedGoldAmount <= 0));
    if (empty_hands.length <= 0) {
      empty_hands = from_mine.workers;
    }

    const with_air_distance = empty_hands.map((miner) => {
      return {
        'miner': miner,
        'air_distance': Math.sqrt((to_mine.midpoint.x - miner.pos.x)**2 +
                                  (to_mine.midpoint.y - miner.pos.y)**2),
      };
    }).sort((a, b) => a.air_distance - b.air_distance);
    let transfer_candidate: LwgUnit | undefined;
    let shortest_distance: number = NaN;
    for (let i=0; i<with_air_distance.length; i++) {
      const data = with_air_distance[i];

      if (isNaN(shortest_distance)) {
        const ground_distance: number = SafeGroundDistance(to_mine.midpoint, data.miner.pos);
        if (isNaN(ground_distance)) {
          if (DEBUG) {
            console.log('Error: missing SafeGroundDistance for RedistributeMiners 1');
          }
          continue;
        }
        shortest_distance = ground_distance;
        transfer_candidate = data.miner;
      } else if (data.air_distance < shortest_distance) {
        const ground_distance: number = SafeGroundDistance(to_mine.midpoint, data.miner.pos);
        if (isNaN(ground_distance)) {
          if (DEBUG) {
            console.log('Error: missing SafeGroundDistance for RedistributeMiners 2');
          }
          continue;
        }
        if (ground_distance < shortest_distance) {
          shortest_distance = ground_distance;
          transfer_candidate = data.miner;
        }
      }
    }

    if (!transfer_candidate) {
      if (DEBUG) {
        console.log(from_mine);
        console.log(to_mine);
      }
      throw new Error('No transfer candidates');
    }

    AssignMiner(transfer_candidate, to_mine);
    from_mine.workers = from_mine.workers.filter((w) => w.id != transfer_candidate.id);
    
    workable_mines = workable_mines.sort((a, b) => a.workers.length - b.workers.length);
    from_mine = workable_mines[workable_mines.length - 1];
    to_mine = workable_mines[0];
  }
}

function _ShouldTransfer(from_mine: ActiveMineData, to_mine: ActiveMineData): boolean {
  if (from_mine.gold_mine_id == to_mine.gold_mine_id) {
    return false;
  }
  const worker_diff = from_mine.workers.length - to_mine.workers.length;
  if (worker_diff <= 1) {
    return false;
  }
  if (from_mine.workers.length > WORKERS_PER_CASTLE) {
    return true;
  }
  if (to_mine.workers.length >= WORKERS_PER_CASTLE) {
    return false;
  }
  return true;
}

export { RedistributeMiners };
