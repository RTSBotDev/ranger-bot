import { DataHub } from '../data_hub';
import { CONSCRIPTION_DISTANCE, CALM_DOWN_DISTANCE, BASE_TARGET_RADIUS } from '../constants';

interface ConscriptWorkersKwargs {
  data_hub: DataHub;
}

function ConscriptWorkers({ data_hub }: ConscriptWorkersKwargs): RangerBotSquad[] {
  const active_castles = data_hub.active_castles as LwgBuilding[];
  const conscripted_squads: RangerBotSquad[] = [];

  for (let i=0; i<active_castles.length; i++) {
    const active_castle = active_castles[i];

    const target = data_hub.targets.filter((target) => {
      if (!target.dps || target.dps <= 0) {
        return false; // AAAAAAAHH BIRD! PANIK!
      }
      if (!target.active_castle || !target.ground_distance) {
        return false;
      }
      // TODO: Should targets have mining_data_id's instead of active_castle_id's?
      return target.active_castle.id == active_castle.id;
    }).sort((a, b) => {
      // Hush TS, we just filtered for !target.ground_distance
      const gda = a.ground_distance as number;
      const gdb = b.ground_distance as number;
      return gda - gdb;
    }).find(() => true);

    const mining_data = active_castle.ranger_bot.mining_data as MiningData;

    if (!target) {
      _UnconscriptCastle(mining_data);
      continue;
    }

    // Hush TS, we just filtered for !target.ground_distance
    const ground_distance = target.ground_distance as number;
    if ((mining_data.conscripted && ground_distance < CALM_DOWN_DISTANCE) ||
        ground_distance < CONSCRIPTION_DISTANCE) {
      const new_squad = _ConscriptCastle(mining_data, target);
      if (new_squad) {
        conscripted_squads.push(new_squad);
      }
    } else {
      _UnconscriptCastle(mining_data);
    }
  }

  return conscripted_squads;
}

function _ConscriptCastle(mining_data: MiningData, target: RangerBotTarget): RangerBotSquad | undefined {
  mining_data.conscripted = true;

  let unconscripted_workers: LwgUnit[] = [];
  for (let i=0; i<mining_data.mines_data.length; i++) {
    const active_mine = mining_data.mines_data[i];

    unconscripted_workers = unconscripted_workers.concat(active_mine.workers.filter((w) => !w.ranger_bot.conscripted));
  }
  if (unconscripted_workers.length <= 0) {
    return;
  }

  const target_location: MapLocation = {
    'x': target.location.x,
    'y': target.location.y,
  };

  let total_x = 0;
  let total_y = 0;
  for (let i=0; i<unconscripted_workers.length; i++) {
    const worker = unconscripted_workers[i];

    worker.ranger_bot.conscripted = true;
    // command and command_at might get overridden by ManageSquad but that's fine
    worker.ranger_bot.command = 'defend';
    worker.ranger_bot.command_at = target_location;

    total_x += worker.pos.x;
    total_y += worker.pos.y;
  }
  const squad_location: MapLocation = {
    'x': total_x / unconscripted_workers.length,
    'y': total_y / unconscripted_workers.length,
  };
  const new_squad: RangerBotSquad = {
    'location': squad_location,
    'r': BASE_TARGET_RADIUS * Math.cbrt(unconscripted_workers.length),
    'units': unconscripted_workers,
    'command': 'defend',
    'attack_at': target_location,
    'is_air': false,
  };

  // CalculateSquadStrength(new_squad); TODO: Is this needed?

  return new_squad;
}

function _UnconscriptCastle(mining_data: MiningData): void {
  mining_data.conscripted = false;

  for (let i=0; i<mining_data.mines_data.length; i ++) {
    const active_mine = mining_data.mines_data[i];

    for (let j=0; j<active_mine.workers.length; j++) {
      const worker = active_mine.workers[j];

      worker.ranger_bot.conscripted = false;
    }
  }
}

export { ConscriptWorkers };
