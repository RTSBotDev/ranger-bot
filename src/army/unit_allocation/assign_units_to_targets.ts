import { DataHub } from '../../data_hub';
import { UnitAssigner } from './unit_assigner';
import { MIN_THREAT_RESPONSE, MAX_THREAT_RESPONSE } from '../../constants';

interface AssignUnitsToTargetsKwargs {
  data_hub: DataHub;
  army_strength: number;
}

function AssignUnitsToTargets({ data_hub, army_strength }: AssignUnitsToTargetsKwargs): void {
  let fighting_units = data_hub.my_fighting_units.map((u) => u);
  const urgent_distance = data_hub.map.rush_distance / 3;

  let scout_targets = [];
  let passive_targets = [];
  let active_targets = [];
  let urgent_targets = [];
  for (let i=0; i<data_hub.targets.length; i++) {
    const target = data_hub.targets[i];

    if ((target.dps as number) > 0 && (target.hp as number) > 0) {
      const threat_distance = (() => {
        if (isNaN(target.ground_distance as number)) {
          return target.air_distance as number;
        } else {
          return target.ground_distance as number;
        }
      })() as number; // TS you are trying my patience
      const danger_factor = 0 == army_strength ? 1 : Math.min((target.strength as number) / army_strength, 1);
      const respond_distance = (1 + danger_factor) * urgent_distance;
      if (threat_distance < respond_distance) {
        urgent_targets.push(target);
      } else {
        active_targets.push(target);
      }
    } else if ((target.hp as number) > 0) {
      passive_targets.push(target);
    } else {
      scout_targets.push(target);
    }
  }
  fighting_units = fighting_units.filter((u) => !data_hub.busy_units[u.id]);

  // First defend
  if (urgent_targets.length > 0) {
    urgent_targets = urgent_targets.sort((a, b) => (a.priority as number) - (b.priority as number));

    fighting_units = _ReAssign({
      fighting_units: fighting_units,
      to_targets: urgent_targets,
      from_targets: [passive_targets, active_targets, scout_targets],
      max_response: true,
      just_one: false,
    });
  }
  // then scout
  if (active_targets.length > 0) {
    active_targets = active_targets.sort((a, b) => (a.priority as number) - (b.priority as number));

    fighting_units = _ReAssign({
      fighting_units: fighting_units,
      to_targets: active_targets,
      from_targets: [passive_targets, scout_targets],
      max_response: false,
      just_one: true, // keep an eye on all enemy armies
    });
  }
  if (scout_targets.length > 0) {
    scout_targets = scout_targets.sort((a, b) => (a.priority as number) - (b.priority as number));

    fighting_units = _ReAssign({
      fighting_units: fighting_units,
      to_targets: scout_targets,
      from_targets: [passive_targets],
      max_response: false,
      just_one: true,
    });
  }
  // attack last
  if (active_targets.length > 0) {
    fighting_units = _ReAssign({
      fighting_units: fighting_units,
      to_targets: active_targets,
      from_targets: [passive_targets],
      max_response: true,
      just_one: false,
    });
  }
  if (passive_targets.length > 0) {
    passive_targets = passive_targets.sort((a, b) => (a.priority as number) - (b.priority as number));

    fighting_units = _ReAssign({
      fighting_units: fighting_units,
      to_targets: passive_targets,
      from_targets: [],
      max_response: true,
      just_one: false,
    });
  }

  if (0 == fighting_units.length) {
    return;
  }
  // If we still have unassigned units at this point, that means we're
  // attacking every enemy position we know about, with what we expect to be
  // overwhelming force. So it shouldn't matter too much where we allocate the
  // rest of our units, just throw them at the highest priority target.
  let all_threats = urgent_targets.concat(active_targets).concat(passive_targets);
  all_threats = all_threats.sort((a, b) => (a.priority as number) - (b.priority as number));

  const assigner = new UnitAssigner(fighting_units, true);
  assigner.Assign({
    targets_list: all_threats,
    response_threshold: Infinity,
    dps_boost: Infinity,
    just_one: true, // In case we're in a hide-and-seek scenario
  });
  assigner.Assign({
    targets_list: all_threats,
    response_threshold: Infinity,
    dps_boost: Infinity,
    just_one: false,
  });
}

interface _ReAssignKwargs {
  fighting_units: LwgUnit[];
  to_targets: RangerBotTarget[];
  from_targets: RangerBotTarget[][];
  max_response: boolean;
  just_one: boolean;
}

function _ReAssign({ fighting_units, to_targets, from_targets, max_response, just_one }: _ReAssignKwargs): LwgUnit[] {
  const assigner = new UnitAssigner(fighting_units, false);

  let satisfied = assigner.Assign({
    targets_list: to_targets,
    response_threshold: MIN_THREAT_RESPONSE,
    dps_boost: 0,
    just_one: just_one,
  });
  while (!satisfied && from_targets.length > 0) {
    const other_targets = from_targets.shift() as RangerBotTarget[];

    const more_units = _DeAssign(other_targets);
    assigner.AddUnits(more_units);
    satisfied = assigner.Assign({
      targets_list: to_targets,
      response_threshold: MIN_THREAT_RESPONSE,
      dps_boost: 0,
      just_one: just_one,
    });
  }

  if (max_response) {
    satisfied = assigner.Assign({
      targets_list: to_targets,
      response_threshold: MAX_THREAT_RESPONSE,
      dps_boost: 0,
      just_one: just_one,
    });
    while (!satisfied && from_targets.length > 0) {
      const other_targets = from_targets.shift() as RangerBotTarget[];

      const more_units = _DeAssign(other_targets);
      assigner.AddUnits(more_units);
      satisfied = assigner.Assign({
        targets_list: to_targets,
        response_threshold: MAX_THREAT_RESPONSE,
        dps_boost: 0,
        just_one: just_one,
      });
    }
  }

  return assigner.my_fighting_units;
}

function _DeAssign(targets: RangerBotTarget[]): LwgUnit[] {
  let output: LwgUnit[] = [];

  for (let i=0; i<targets.length; i++) {
    const target = targets[i];

    output = output.concat(target.units);
    target.units = [];
  }

  return output;
}

export { AssignUnitsToTargets };
