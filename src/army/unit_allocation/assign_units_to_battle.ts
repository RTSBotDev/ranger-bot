import { UnitAssigner } from './unit_assigner';
import { MIN_THREAT_RESPONSE, MAX_THREAT_RESPONSE } from '../../constants';

function AssignUnitsToBattle(battle: RangerBotBattle): void {
  let all_units_in_battle: LwgUnit[] = [];
  for (let i=0; i<battle.squads.length; i++) {
    const squad = battle.squads[i];

    all_units_in_battle = all_units_in_battle.concat(squad.units);
  }

  const assigner = new UnitAssigner(all_units_in_battle, true);
  assigner.Assign({
    targets_list: battle.targets,
    response_threshold: MIN_THREAT_RESPONSE,
    dps_boost: 0,
    just_one: false,
  });
  assigner.Assign({
    targets_list: battle.targets,
    response_threshold: MAX_THREAT_RESPONSE,
    dps_boost: 0,
    just_one: false,
  });
  assigner.Assign({
    targets_list: battle.targets,
    response_threshold: Infinity,
    dps_boost: Infinity,
    just_one: false,
  });
}

export { AssignUnitsToBattle };
