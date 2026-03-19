import { DataHub } from '../data_hub';
import { ATTACK_RADIUS, RETREAT_RADIUS, AGGRO_ATTACK_THRESHOLD,
  ATTACK_THRESHOLD, AGGRO_RETREAT_THRESHOLD, RETREAT_THRESHOLD, DEBUG } from '../constants';
import { SafeGroundDistance, GetClosestActiveCastleToLocation } from '../ground_distance';

interface ManageSquadKwargs {
  data_hub: DataHub;
  battle: RangerBotBattle;
  squad: RangerBotSquad;
  aggro_mode: boolean;
}

function ManageSquad({ data_hub, battle, squad, aggro_mode }: ManageSquadKwargs): void {
  /*
  If the battle is winning, all squads should fight, even if they're losing locally.
  If the battle is losing, some squads could still fight, if they're winning locally.
  */

  squad.command = battle.command as string;

  if (squad.command == 'fight' || squad.command == 'defend') {
    _CommandUnitsToAttack(squad, battle);
    return;
  } else if (squad.command != 'retreat') {
    if (DEBUG) {
      console.log('Error: Unhandled squad command: ' + squad.command);
    }
    return;
  }

  let retreat_dps = 0;
  let retreat_hp = 0;

  let attack_dps = 0;
  let attack_hp = 0;

  for (let i=0; i<battle.targets.length; i++) {
    const target = battle.targets[i];

    const distance = (() => {
      const air_distance = Math.sqrt((target.location.x - squad.location.x)**2 + (target.location.y - squad.location.y)**2);
      if (target.is_air || squad.is_air) {
        return air_distance;
      }
      const ground_distance = SafeGroundDistance(target.location, squad.location);
      if (isNaN(ground_distance)) {
        return air_distance;
      }
      return ground_distance;
    })();

    if (distance > ATTACK_RADIUS) {
      continue;
    }

    attack_dps += (target.dps as number);
    attack_hp += (target.hp as number);
    if (distance < RETREAT_RADIUS) {
      retreat_dps += (target.dps as number);
      retreat_hp += (target.hp as number);
    }
  }

  squad.attack_strength = attack_dps * attack_hp;
  squad.retreat_strength = retreat_dps * retreat_hp;
  squad.attack_ratio = (squad.strength as number) / (battle.attack_strength as number);
  squad.retreat_ratio = (squad.strength as number) / (squad.retreat_strength as number);

  const attack_threshold = (() => {
    if (aggro_mode) {
      return AGGRO_ATTACK_THRESHOLD;
    } else {
      return ATTACK_THRESHOLD;
    }
  })();
  const retreat_threshold = (() => {
    if (aggro_mode) {
      return AGGRO_RETREAT_THRESHOLD;
    } else {
      return RETREAT_THRESHOLD;
    }
  })();
  squad.command = (() => {
    if (squad.attack_ratio > attack_threshold) {
      return 'fight';
    } else if (squad.retreat_ratio > retreat_threshold) {
      if (squad.attacking) {
        return 'fight';
      } else {
        return 'retreat';
      }
    } else {
      return 'retreat';
    }
  })();

  if (squad.command == 'fight') {
    _CommandUnitsToAttack(squad, battle);
  } else if (squad.command == 'retreat') {
    _CommandUnitsToRetreat(squad, data_hub);
  } else if (DEBUG) {
    console.log('Error: Unhandled squad command: ' + squad.command);
  }
}

function _CommandUnitsToAttack(squad: RangerBotSquad, battle: RangerBotBattle): void {
  let shortest_distance = Infinity;
  let closest_target: RangerBotTarget | undefined = undefined;
  for (let i=0; i<battle.targets.length; i++) {
    const target = battle.targets[i];

    const new_distance = Math.sqrt((squad.location.x - target.location.x)**2 + (squad.location.y - target.location.y)**2);
    if (new_distance < shortest_distance) {
      shortest_distance = new_distance;
      closest_target = target;
    }
  }

  squad.attack_at = {
    'x': (closest_target as RangerBotTarget).location.x,
    'y': (closest_target as RangerBotTarget).location.y,
  };

  for (let i=0; i<squad.units.length; i++) {
    const unit = squad.units[i];

    unit.ranger_bot.command = squad.command as string; // could be defend
    unit.ranger_bot.command_at = squad.attack_at;
  }
}

function _CommandUnitsToRetreat(squad: RangerBotSquad, data_hub: DataHub): void {
  const active_castle = GetClosestActiveCastleToLocation({
    map_location: squad.location,
    active_castles: data_hub.active_castles as LwgBuilding[],
    with_workers: false,
  });
  if (!active_castle) {
    if (DEBUG) {
      console.log('Error: No active castles to retreat to in _CommandUnitsToRetreat');
    }
    // TODO
    return;
  }

  // TODO: Should this calculation be cached on MiningData?
  const mining_data = active_castle.ranger_bot.mining_data as MiningData;
  let total_x = 0;
  let total_y = 0;
  for (let i=0; i<mining_data.mines_data.length; i++) {
    const active_mine = mining_data.mines_data[i];

    total_x += active_mine.midpoint.x;
    total_y += active_mine.midpoint.y;
  }
  const retreat_point: MapLocation = {
    'x': total_x / mining_data.mines_data.length,
    'y': total_y / mining_data.mines_data.length,
  };
  squad.retreat_at = retreat_point;

  for (let i=0; i<squad.units.length; i++) {
    const unit = squad.units[i];

    unit.ranger_bot.command = 'retreat';
    unit.ranger_bot.command_at = squad.retreat_at;
  }
}

export { ManageSquad };
