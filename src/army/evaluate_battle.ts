import { RETREAT_RADIUS, ATTACK_THRESHOLD, AGGRO_ATTACK_THRESHOLD,
  RETREAT_THRESHOLD, AGGRO_RETREAT_THRESHOLD } from '../constants';
import { SafeGroundDistance } from '../ground_distance';

function EvaluateBattle(battle: RangerBotBattle, aggro_mode: boolean): string {
  /*
  Attack if you're stronger, retreat if you're weaker. Duh.

  Except we don't want our army to waffle, so we only attack
  if we're significantly stronger, specifically ATTACK_THRESHOLD
  stronger. Once we're attacking we don't retreat until we're
  RETREAT_THRESHOLD weaker. Great, makes sense.

  Except our army still waffles, because when we attack we move closer,
  which brings our army into range of more enemy troops, thereby increasing
  the number of enemy forces considered to be included in the battle. So now
  we only attack when our army is ATTACK_THRESHOLD stronger than all enemy
  units within ATTACK_RADIUS, and we don't retreat unless/until we're
  RETREAT_THRESHOLD weaker than enemy units within RETREAT_RADIUS.

  Note that the property of "fighting" belongs to the target object.
  This is mostly for convenience, since targets already persist between ticks.

  Generalizing to a battle with many squads and targets, we say the battle is
  "fighting" if more than half the targets which are within RETREAT_RADIUS of
  at least one squad are already fighting. Similarly the battle as a whole
  should retreat if all squads combined are RETREAT_THRESHOLD weaker than the
  combined targets which are within RETREAT_RADIUS of at least one squad.

  But the battle as a whole doesn't attack unless the combined squads are
  ATTACK_THRESHOLD stronger than all targets within ATTACK_RADIUS of at least
  one squad.
  */
  let friendly_dps = 0;
  let friendly_hp = 0;
  for (let i=0; i<battle.squads.length; i++) {
    const squad = battle.squads[i];

    friendly_dps += (squad.dps as number);
    friendly_hp += (squad.hp as number);
  }
  battle.friendly_strength = friendly_hp * friendly_dps;

  let attacking_numerator = 0;
  let attacking_denominator = 0;
  let retreat_dps = 0;
  let retreat_hp = 0;

  let attack_dps = 0;
  let attack_hp = 0;

  const close_targets = [];

  for (let i=0; i<battle.targets.length; i++) {
    const target = battle.targets[i];

    const is_close = battle.squads.some((squad) => {
      const air_distance = Math.sqrt((target.location.x - squad.location.x)**2 + (target.location.y - squad.location.y)**2);
      if (air_distance > RETREAT_RADIUS) {
        return false;
      }
      if (target.is_air || squad.is_air) {
        return air_distance <= RETREAT_RADIUS;
      }
      const ground_distance = SafeGroundDistance(target.location, squad.location);
      if (isNaN(ground_distance)) {
        return air_distance <= RETREAT_RADIUS;
      }
      return ground_distance <= RETREAT_RADIUS;
    });

    if (is_close) {
      close_targets.push(target);
      attacking_denominator ++;
      if (target.attacking) {
        attacking_numerator ++;
      }
    }

    // The battle includes all threats within ATTACK_RADIUS of any squad.
    attack_dps += (target.dps as number);
    attack_hp += (target.hp as number);
    if (is_close) {
      retreat_dps += (target.dps as number);
      retreat_hp += (target.hp as number);
    }
  }

  if (attacking_denominator <= 0) {
    battle.attacking = false;
  } else {
    battle.attacking = Math.round(attacking_numerator / attacking_denominator) >= 1;
  }
  battle.attack_strength = attack_dps * attack_hp;
  battle.retreat_strength = retreat_dps * retreat_hp;
  battle.attack_ratio = battle.friendly_strength / battle.attack_strength;
  battle.retreat_ratio = battle.friendly_strength / battle.retreat_strength;

  const defending = battle.targets.some((t) => t.active_castle && (t.active_castle.ranger_bot.mining_data as MiningData).conscripted);

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
  const output = (() => {
    if (battle.attack_ratio > attack_threshold) {
      return 'fight';
    } else if (battle.retreat_ratio > retreat_threshold) {
      if (battle.attacking) {
        return 'fight';
      } else if (defending) {
        return 'defend';
      } else {
        return 'retreat';
      }
    } else {
      if (defending) {
        return 'defend';
      } else {
        return 'retreat';
      }
    }
  })();

  return output;
}

export { EvaluateBattle };
