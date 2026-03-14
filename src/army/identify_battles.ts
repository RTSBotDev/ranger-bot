import { DataHub } from '../data_hub';
import { ATTACK_RADIUS } from '../constants';
import { SafeGroundDistance } from '../ground_distance';

interface IdentifyBattlesKwargs {
  data_hub: DataHub;
  squads: RangerBotSquad[];
}

function IdentifyBattles({ data_hub, squads }: IdentifyBattlesKwargs): RangerBotBattle[] {
  // Battles are graphs (nodes and edges) where squads are only connected to
  // targets, and targets are only connected to squads.
  const unassigned_targets = [data_hub.targets.filter((t) => (t.hp as number) > 0)];
  const unassigned_squads = [squads.map((s) => s)];
  let output: RangerBotBattle[] = [];

  while (unassigned_squads[0].length > 0) {
    const squad = unassigned_squads[0].pop() as RangerBotSquad;
    const battle: RangerBotBattle = {
      'squads': [squad],
      'targets': [],
    };
    _GraphBattle(battle, unassigned_squads, unassigned_targets);
    output.push(battle);
  }

  output = output.filter((b) => b.squads.length > 0 && b.targets.length > 0);
  return output;
}

function _GraphBattle(battle: RangerBotBattle, unassigned_squads: RangerBotSquad[][], unassigned_targets: RangerBotTarget[][]): void {
  // Just because S1 and S2 are both within ATTACK_RADIUS of T1,
  // doesn't mean they're within ATTACK_RADIUS of each other.
  while (true) {
    const new_targets = _GlomBattleTargets(battle.squads, unassigned_targets);
    if (new_targets.length <= 0) {
      return;
    }
    battle.targets = battle.targets.concat(new_targets);

    const new_squads = _GlomBattleSquads(battle.targets, unassigned_squads);
    if (new_squads.length <= 0) {
      return;
    }
    battle.squads = battle.squads.concat(new_squads);
  }
}

function _GlomBattleTargets(battle_squads: RangerBotSquad[], unassigned_targets: RangerBotTarget[][]): RangerBotTarget[] {
  const remaining_targets: RangerBotTarget[] = [];
  const output: RangerBotTarget[] = [];

  for (let i=0; i<unassigned_targets[0].length; i++) {
    const new_target = unassigned_targets[0][i];

    const is_close = battle_squads.some((squad) => {
      const air_distance = Math.sqrt((squad.location.x - new_target.location.x)**2 + (squad.location.y - new_target.location.y)**2);
      if (air_distance > ATTACK_RADIUS) {
        return false;
      }
      if (new_target.is_air || squad.is_air) {
        return air_distance <= ATTACK_RADIUS;
      }
      const ground_distance = SafeGroundDistance(squad.location, new_target.location);
      if (isNaN(ground_distance)) {
        return air_distance <= ATTACK_RADIUS;
      }
      return ground_distance <= ATTACK_RADIUS;
    });

    if (is_close) {
      output.push(new_target);
    } else {
      remaining_targets.push(new_target);
    }
  }

  unassigned_targets[0] = remaining_targets;
  return output;
}

function _GlomBattleSquads(battle_targets: RangerBotTarget[], unassigned_squads: RangerBotSquad[][]): RangerBotSquad[] {
  const remaining_squads: RangerBotSquad[] = [];
  const output: RangerBotSquad[] = [];

  for (let i=0; i<unassigned_squads[0].length; i++) {
    const new_squad = unassigned_squads[0][i];

    const is_close = battle_targets.some((target) => {
      const air_distance = Math.sqrt((target.location.x - new_squad.location.x)**2 + (target.location.y - new_squad.location.y)**2);
      if (air_distance > ATTACK_RADIUS) {
        return false;
      }
      if (new_squad.is_air || target.is_air) {
        return air_distance <= ATTACK_RADIUS;
      }
      const ground_distance = SafeGroundDistance(target.location, new_squad.location);
      if (isNaN(ground_distance)) {
        return air_distance <= ATTACK_RADIUS;
      }
      return ground_distance <= ATTACK_RADIUS;
    });
    if (is_close) {
      output.push(new_squad);
    } else {
      remaining_squads.push(new_squad);
    }
  }

  unassigned_squads[0] = remaining_squads;
  return output;
}

export { IdentifyBattles };
