import { DataHub } from '../data_hub';
import { BASE_TARGET_RADIUS, TARGET_RESET_THRESHOLD, DEBUG } from '../constants';
import { SafeGroundDistance } from '../ground_distance';
import { IsFlying } from '../unit_stats';

interface FormSquadsKwargs {
  data_hub: DataHub;
}

function FormSquads({ data_hub }: FormSquadsKwargs): RangerBotSquad[] {
  const output: RangerBotSquad[] = [];

  const unallocated_units = [data_hub.my_fighting_units.map((u) => u)];

  while (unallocated_units[0].length > 0) {
    const unit = unallocated_units[0].pop() as LwgUnit;

    const location: MapLocation = {
      'x': unit.pos.x,
      'y': unit.pos.y,
    };
    const new_squad: RangerBotSquad = {
      'location': location,
      'r': BASE_TARGET_RADIUS,
      'units': [unit],
      'is_air': IsFlying(unit),
    }

    _AddUnits(new_squad, unallocated_units);
    output.push(new_squad);
  }

  return output;
}

function _AddUnits(squad: RangerBotSquad, unallocated_units: LwgUnit[][]): void {
  let done = false;
  while (!done) {
    done = _GlomUnits(squad, unallocated_units);
    const new_radius = BASE_TARGET_RADIUS * Math.cbrt(squad.units.length);
    if (new_radius > squad.r) {
      squad.r = new_radius;
      done = false;
    }

    let total_x = 0;
    let total_y = 0;
    for (let i=0; i<squad.units.length; i++) {
      total_x += squad.units[i].pos.x;
      total_y += squad.units[i].pos.y;
    }
    const new_x = total_x / squad.units.length;
    const new_y = total_y / squad.units.length;

    if (Math.abs(new_x - squad.location.x) > TARGET_RESET_THRESHOLD || Math.abs(new_y - squad.location.y) > TARGET_RESET_THRESHOLD) {
      squad.location.x = new_x;
      squad.location.y = new_y;
    } else {
      const distance = Math.sqrt((new_x - squad.location.x)**2 + (new_y - squad.location.y)**2);
      if (distance > TARGET_RESET_THRESHOLD) {
        squad.location.x = new_x;
        squad.location.y = new_y;
      }
    }
  }
}

function _GlomUnits(squad: RangerBotSquad, units: LwgUnit[][]): boolean {
  const new_units: LwgUnit[] = [];
  let done = true;
  while (units[0].length > 0) {
    const unit = units[0].pop() as LwgUnit;

    if (IsFlying(unit) != squad.is_air) {
      new_units.push(unit);
      continue;
    }

    const air_distance = Math.sqrt((squad.location.x - unit.pos.x)**2 + (squad.location.y - unit.pos.y)**2);
    if (air_distance > squad.r) {
      new_units.push(unit);
      continue;
    } else if (IsFlying(unit)) {
      squad.units.push(unit);
      done = false;
      continue;
    }

    const ground_distance = SafeGroundDistance(unit.pos, squad.location);
    if (isNaN(ground_distance)) {
      if (DEBUG) {
        console.log('Error: missing SafeGroundDistance for _GlomUnits');
      }
      new_units.push(unit);
      continue;
    }
    if (ground_distance > squad.r) {
      new_units.push(unit);
    } else {
      squad.units.push(unit);
      done = false;
    }
  }
  units[0] = new_units;
  return done;
}

export { FormSquads };
