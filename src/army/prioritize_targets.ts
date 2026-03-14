import { DataHub } from '../data_hub';
import { GetClosestActiveCastleToLocationData } from '../ground_distance';
import { WORKER_DISRESPECT } from '../constants';
import { ArmorFactor } from '../unit_stats';

interface PrioritizeTargetsKwargs {
  data_hub: DataHub;
}

function PrioritizeTargets({ data_hub }: PrioritizeTargetsKwargs): void {
  for (let i=0; i<data_hub.targets.length; i++) {
    const target = data_hub.targets[i];

    _CalculateTargetStrength(target);

    if (!target.ground_distance || !target.active_castle || !target.base_priority) {
      const ground_data = GetClosestActiveCastleToLocationData({
        map_location: target.location,
        active_castles: data_hub.active_castles as LwgBuilding[],
        with_workers: false,
      });
      const ground_distance = ground_data.ground_distance;
      const active_castle = ground_data.active_castle
      const data_is_valid = !isNaN(ground_distance) && !!active_castle
      if (data_is_valid) {
        target.ground_distance = ground_distance;
        target.active_castle = active_castle;
        target.base_priority = ground_distance;
      } else {
        target.base_priority = Math.sqrt(scope.getMapWidth()**2 + scope.getMapHeight()**2);
      }
    }

    target.priority = target.base_priority;

    // Not just about air units, also want to prioritize threats to production
    const air_distances = data_hub.my_buildings.map((b) => {
      return Math.sqrt((target.location.x - b.x)**2 + (target.location.y - b.y)**2);
    });
    target.air_distance = Math.min(...air_distances);
    target.priority += (target.air_distance / 2);
  }
}

function _CalculateTargetStrength(target: RangerBotTarget): void {
  let target_dps = 0;
  let target_hp = 0;

  for (let i=0; i<target.threats.length; i++) {
    const threat = target.threats[i];

    const effective_hp = threat.hp * ArmorFactor(threat.armor);
    if (threat.type == 'worker') {
      target_dps += (threat.dps * WORKER_DISRESPECT);
      target_hp += (effective_hp * WORKER_DISRESPECT);
    } else if (threat.type == 'airship') {
      target_hp += effective_hp;
    } else if (threat.dps <= 0) {
    } else {
      target_dps += threat.dps;
      target_hp += effective_hp;
    }
  }

  target.dps = target_dps;
  target.hp = target_hp;
  target.strength = target.dps * target.hp;
}

export { PrioritizeTargets };
