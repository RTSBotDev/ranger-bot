import { DataHub } from '../data_hub';
import { GOLD_PER_MIN } from '../constants';

interface CountWorkersNeededKwargs {
  data_hub: DataHub;
}

function EstimateIncome({ data_hub }: CountWorkersNeededKwargs): void {
  const active_mines = data_hub.active_mines as ActiveMineData[];
  
  for (let i=0; i<active_mines.length; i++) {
    const active_mine: ActiveMineData = active_mines[i];

    const worker_key = Math.min(active_mine.workers.length, 13);
    data_hub.gross_gold_per_min += GOLD_PER_MIN[String(worker_key)];
  }

  const net_gold_per_min = data_hub.gross_gold_per_min - data_hub.gold_spend_per_min;
  data_hub.net_gold_per_sec = net_gold_per_min / 60;
}

export { EstimateIncome };
