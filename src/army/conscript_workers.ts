import { DataHub } from '../data_hub';
import { CONSCRIPTION_DISTANCE, CALM_DOWN_DISTANCE, BASE_TARGET_RADIUS,
  CONSCRIPTION_THREAT_RESPONSE } from '../constants';
import { ArmorFactor, CalculateDps } from '../unit_stats';
import { SafeGroundDistance } from '../ground_distance';

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
      if (target.is_air) {
        return false;
      }
      if (target.is_invisible) {
        // TODO: Should conscript iff there's a detector nearby
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

  let conscripted_workers: LwgUnit[] = [];
  for (let i=0; i<mining_data.mines_data.length; i++) {
    const active_mine = mining_data.mines_data[i];

    conscripted_workers = conscripted_workers.concat(active_mine.workers.filter((w) => w.ranger_bot.conscripted));
  }

  const target_unit_ids: RangerBotBusyUnits = {};
  for (let i=0; i<target.units.length; i++) {
    const unit = target.units[i];

    target_unit_ids[unit.id] = true;
  }

  for (let i=0; i<conscripted_workers.length; i++) {
    const worker = conscripted_workers[i];

    if (target_unit_ids[worker.id]) {
      continue;
    }

    target.units.push(worker);
  }

  // Technically this can be inaccurate because unit assignment hasn't been run yet.
  // But unit assignment is run every tick, so it should be pretty close.
  let units_hp = 0;
  let units_dps = 0;
  for (let i=0; i<target.units.length; i++) {
    const unit = target.units[i];

    const ground_distance = SafeGroundDistance(unit.pos, target.location);
    const is_far = isNaN(ground_distance) || ground_distance > CONSCRIPTION_DISTANCE;
    if (is_far) {
      continue;
    }

    units_dps += CalculateDps(unit);
    const effective_hp = unit.hp * ArmorFactor(unit.type.armor);
    units_hp += effective_hp;
  }

  for (let i=0; i<mining_data.mines_data.length; i++) {
    const active_mine = mining_data.mines_data[i];

    if (units_hp * units_dps > (target.strength as number) * CONSCRIPTION_THREAT_RESPONSE) {
      break;
    }

    for (let j=0; j<active_mine.workers.length; j++) {
      const worker = active_mine.workers[j];

      if (units_hp * units_dps > (target.strength as number) * CONSCRIPTION_THREAT_RESPONSE) {
        break;
      }
      if (worker.ranger_bot.conscripted) {
        continue;
      }

      worker.ranger_bot.conscripted = true;
      conscripted_workers.push(worker);
      units_dps += CalculateDps(worker);
      const effective_hp = worker.hp * ArmorFactor(worker.type.armor);
      units_hp += effective_hp;
    }
  }

  const target_location: MapLocation = {
    'x': target.location.x,
    'y': target.location.y,
  };
  let total_x = 0;
  let total_y = 0;
  for (let i=0; i<conscripted_workers.length; i++) {
    const worker = conscripted_workers[i];

    // command and command_at might get overridden by ManageSquad but that's fine
    worker.ranger_bot.command = 'defend';
    worker.ranger_bot.command_at = target_location;

    total_x += worker.pos.x;
    total_y += worker.pos.y;
  }
  const squad_location: MapLocation = {
    'x': total_x / conscripted_workers.length,
    'y': total_y / conscripted_workers.length,
  };
  const new_squad: RangerBotSquad = {
    'location': squad_location,
    'r': BASE_TARGET_RADIUS * Math.cbrt(conscripted_workers.length),
    'units': conscripted_workers,
    'command': 'defend',
    'attack_at': target_location,
    'is_air': false,
  };

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
