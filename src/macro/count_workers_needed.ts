import { DataHub } from '../data_hub';
import { MAX_WORKERS, WORKERS_PER_CASTLE } from '../constants';

interface CountWorkersNeededKwargs {
  data_hub: DataHub;
}

function CountWorkersNeeded({ data_hub }: CountWorkersNeededKwargs): number {
  if (data_hub.my_workers.length >= MAX_WORKERS) {
    return 0;
  }

  let output = (WORKERS_PER_CASTLE + 1) * data_hub.active_mining_bases;
  output = Math.min(output, MAX_WORKERS);
  output = Math.max(output, 1);
  output -= data_hub.my_workers.length

  for (let i=0; i<data_hub.my_castles.length; i++) {
    const castle = data_hub.my_castles[i];

    for (let j=0; j<castle.queue.length; j++) {
      const queued_unit = castle.queue[j];

      if (!queued_unit) {
        continue;
      }

      if (queued_unit.id_string == 'worker') {
        output--;
      }
    }
  }

  return output;
}

export { CountWorkersNeeded };
