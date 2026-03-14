import { CalculateDps, ArmorFactor } from '../unit_stats';

function CalculateSquadStrength(squad: RangerBotSquad): void {
  let squad_dps = 0;
  let squad_hp = 0;
  let attacking_numerator = 0;
  let attacking_denominator = 0;
  for (let i=0; i<squad.units.length; i++) {
    const unit = squad.units[i];

    if (unit.ranger_bot.conscripted) {
      // Including conscripts could mess with AssignUnitsToTargets,
      // causing too few units to be assigned to a threat.
      continue;
    }

    squad_dps += CalculateDps(unit);
    const effective_hp = unit.hp * ArmorFactor(unit.type.armor);
    squad_hp += effective_hp;

    attacking_denominator ++;
    if (unit.ranger_bot.attacking) {
      attacking_numerator ++;
    }
  }

  squad.dps = squad_dps;
  squad.hp = squad_hp;
  squad.strength = squad.dps * squad.hp;
  squad.attacking = (() => {
    if (attacking_denominator <= 0) {
      return false;
    } else {
      return Math.round(attacking_numerator / attacking_denominator) >= 1;
    }
  })();
}

export { CalculateSquadStrength };
