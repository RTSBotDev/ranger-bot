import { DataHub } from '../data_hub';
import { SafeGroundDistance } from '../ground_distance';
import { TARGET_RESET_THRESHOLD, BASE_TARGET_RADIUS, DEBUG } from '../constants';

interface UpdateTargetsKwargs {
  data_hub: DataHub;
}

function UpdateTargets({ data_hub }: UpdateTargetsKwargs): RangerBotTarget[] {
  if (scope.ranger_bot.team_caches[data_hub.team_cache_key].targets_last_updated_at &&
      (scope.ranger_bot.team_caches[data_hub.team_cache_key].targets_last_updated_at as number) >= scope.getCurrentGameTimeInSec()) {
    // If 2 or more ranger bots are on the same team
    return scope.ranger_bot.team_caches[data_hub.team_cache_key].targets as RangerBotTarget[];
  }

  if (undefined === scope.ranger_bot.team_caches[data_hub.team_cache_key].targets) {
    scope.ranger_bot.team_caches[data_hub.team_cache_key].targets = [] as RangerBotTarget[];
  }
  const cached_targets = scope.ranger_bot.team_caches[data_hub.team_cache_key].targets as RangerBotTarget[];

  const output = [];
  const unallocated_building_threats = [data_hub.threats.buildings.map((b) => b)];
  const unallocated_unit_threats = [data_hub.threats.units.map((b) => b)];

  for (let i=0; i<cached_targets.length; i++) {
    const target = cached_targets[i];

    _AllocateTargets(target, unallocated_building_threats, unallocated_unit_threats);

    if (target.threats.length <= 0) {
      continue;
    }

    // Now that we're done allocating threats, the radius is allowed to shrink.
    target.r = BASE_TARGET_RADIUS * Math.cbrt(target.threats.length);
    output.push(target);
  }

  while (unallocated_building_threats[0].length > 0) {
    const building_threat = unallocated_building_threats[0].pop() as RangerBotThreat;

    const threat_location: MapLocation = {
      'x': building_threat.location.x,
      'y': building_threat.location.y,
    }
    const new_target: RangerBotTarget = {
      'location': threat_location,
      'r': BASE_TARGET_RADIUS,
      'threats': [building_threat],
      'units': [],
      'is_air': false,
      'is_invisible': building_threat.is_invisible,
    };

    _AllocateTargets(new_target, unallocated_building_threats, unallocated_unit_threats);
    output.push(new_target);
  }

  while (unallocated_unit_threats[0].length > 0) {
    const unit_threat = unallocated_unit_threats[0].pop() as RangerBotThreat;

    const threat_location: MapLocation = {
      'x': unit_threat.location.x,
      'y': unit_threat.location.y,
    }
    const new_target: RangerBotTarget = {
      'location': threat_location,
      'r': BASE_TARGET_RADIUS,
      'threats': [unit_threat],
      'units': [],
      'is_air': unit_threat.is_air,
      'is_invisible': unit_threat.is_invisible,
    }

    _AllocateTargets(new_target, unallocated_building_threats, unallocated_unit_threats);
    output.push(new_target);
  }

  return output;
}

function _AllocateTargets(target: RangerBotTarget, unallocated_building_threats: RangerBotThreat[][], unallocated_unit_threats: RangerBotThreat[][]): void {
  let done = false;
  while (!done) {
    const buildings_done = (() => {
      if (target.is_air) {
        return true;
      } else {
        return _GlomThreats(target, unallocated_building_threats);
      }
    })();
    const units_done = _GlomThreats(target, unallocated_unit_threats);
    done = (buildings_done && units_done);
    const new_radius = BASE_TARGET_RADIUS * Math.cbrt(target.threats.length);
    if (new_radius > target.r) {
      target.r = new_radius;
      done = false;
    }

    let total_x = 0;
    let total_y = 0;
    for (let i=0; i<target.threats.length; i++) {
      total_x += target.threats[i].location.x;
      total_y += target.threats[i].location.y;
    }
    const new_x = total_x / target.threats.length;
    const new_y = total_y / target.threats.length;

    if (Math.abs(new_x - target.location.x) > TARGET_RESET_THRESHOLD || Math.abs(new_y - target.location.y) > TARGET_RESET_THRESHOLD) {
      target.location.x = new_x;
      target.location.y = new_y;
      delete target['ground_distance'];
      delete target['active_castle'];
      delete target['base_priority'];
    } else {
      const distance = Math.sqrt((new_x - target.location.x)**2 + (new_y - target.location.y)**2);
      if (distance > TARGET_RESET_THRESHOLD) {
        target.location.x = new_x;
        target.location.y = new_y;
        delete target['ground_distance'];
        delete target['active_castle'];
        delete target['base_priority'];
      }
    }
  }
}

function _GlomThreats(target: RangerBotTarget, threats: RangerBotThreat[][]): boolean {
  const new_threats: RangerBotThreat[] = [];
  let done = true;
  while (threats[0].length > 0) {
    const threat = threats[0].pop() as RangerBotThreat;

    if (target.is_air != threat.is_air) {
      new_threats.push(threat);
      continue;
    } else if (target.is_invisible != threat.is_invisible) {
      new_threats.push(threat);
      continue;
    }

    const air_distance = Math.sqrt((target.location.x - threat.location.x)**2 + (target.location.y - threat.location.y)**2);
    if (air_distance > target.r) {
      new_threats.push(threat);
      continue;
    } else if (threat.is_air) {
      target.threats.push(threat);
      done = false;
      continue;
    }

    const ground_distance = SafeGroundDistance(threat.location, target.location);
    if (isNaN(ground_distance)) {
      if (DEBUG) {
        console.log('Error: missing SafeGroundDistance for _GlomThreats');
      }
      new_threats.push(threat);
      continue;
    }
    if (ground_distance > target.r) {
      new_threats.push(threat);
    } else {
      target.threats.push(threat);
      done = false;
    }
  }
  threats[0] = new_threats;
  return done;
}

export { UpdateTargets };
