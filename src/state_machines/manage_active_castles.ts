import { DataHub } from '../data_hub';
import { REPLACEMENT_BASE_THRESHOLD, DEBUG } from '../constants';

interface ManageActiveCastlesKwargs {
  data_hub: DataHub;
}

function ManageActiveCastles({ data_hub }: ManageActiveCastlesKwargs): LwgBuilding[] {
  const output: LwgBuilding[] = [];

  for (let i=0; i<data_hub.my_castles.length; i++) {
    const castle: LwgBuilding = data_hub.my_castles[i];

    if (!castle.ranger_bot.mining_data) {
      if (DEBUG) {
        console.log(castle.ranger_bot);
      }
      throw new Error('Missing mining data');
    }

    let has_mine: boolean = false;

    for (let j=0; j<castle.ranger_bot.mining_data.mines_data.length; j++) {
      const active_mine: ActiveMineData = castle.ranger_bot.mining_data.mines_data[j];

      // isAlive seems to be undefined by default
      active_mine.workers = active_mine.workers.filter((w) => {
        return (w.isAlive || w.hp > 0) && w.ranger_bot.job == 'mine';
      });

      const gold_mine = active_mine.gold_mine as CachedGoldMine;
      if (castle.ranger_bot.tower && !castle.ranger_bot.tower.isAlive && castle.ranger_bot.tower.hp <= 0) {
        delete castle.ranger_bot['tower'];
      }
      if (!castle.ranger_bot.tower && gold_mine.tower) {
        castle.ranger_bot.tower = gold_mine.tower;
      }

      if (gold_mine.gold <= 0) {
        _ReleaseWorkers(active_mine);
      } else if (castle.isUnderConstruction) {
        data_hub.active_mining_bases ++;
      } else if (gold_mine.gold > REPLACEMENT_BASE_THRESHOLD) {
        data_hub.active_mining_bases ++;
        has_mine = true;
      } else {
        has_mine = true;
      }
    }

    if (has_mine) {
      // avoid duplicates
      output.push(castle);
    }
  }

  return output;
}

function _ReleaseWorkers(inactive_mine: ActiveMineData): void {
  for (let i=0; i<inactive_mine.workers.length; i++) {
    const miner: LwgUnit = inactive_mine.workers[i];

    miner.ranger_bot = {};
  }

  inactive_mine.workers = [];
}

export { ManageActiveCastles };
