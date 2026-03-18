import { ArmorFactor, CalculateDps } from '../../unit_stats';
import { SafeGroundDistance } from '../../ground_distance';

interface UnitAssignerAssignKwargs {
  targets_list: RangerBotTarget[];
  response_threshold: number;
  dps_boost: number;
  just_one: boolean;
}

class UnitAssigner {
  my_fighting_units: LwgUnit[];
  lazy: boolean;

  constructor(my_fighting_units: LwgUnit[], lazy: boolean) {
    this.my_fighting_units = my_fighting_units;
    this.lazy = lazy;
  }

  AddUnits(new_units: LwgUnit[]): void {
    this.my_fighting_units = this.my_fighting_units.concat(new_units);
  }

  Assign({ targets_list, response_threshold, dps_boost, just_one }: UnitAssignerAssignKwargs): boolean {
    if (targets_list.length <= 0 && just_one) {
      return false;
    } else if (targets_list.length <= 0) {
      return true;
    }
    if (this.my_fighting_units.length <= 0) {
      return false;
    }

    let output = true;
    for (let i=0; i<targets_list.length; i++) {
      const target = targets_list[i];

      if (just_one && target.units.length > 0) {
        continue;
      }

      let hp = 0;
      let dps = 0;
      for (let j=0; j<target.units.length; j++) {
        const unit = target.units[j];

        if (unit.ranger_bot.conscripted) {
          continue;
        }

        const effective_hp = unit.hp * ArmorFactor(unit.type.armor);
        hp += effective_hp;
        dps += CalculateDps(unit);
        dps += dps_boost;
      }

      if ((hp * dps) > ((target.strength as number) * response_threshold)) {
        continue;
      }
      if (this.my_fighting_units.length <= 0) {
        return false;
      }

      const useful_units = (() => {
        if (target.is_air) {
          return this.my_fighting_units.filter((u) => u.type.canAttackFlying);
        } else {
          return this.my_fighting_units;
        }
      })();

      let with_data: UnitWithDistances[] = useful_units.map((unit) => {
        const air_distance = (() => {
          if (this.lazy) {
            return 0;
          } else {
            return Math.sqrt((target.location.x - unit.pos.x)**2 + (target.location.y - unit.pos.y)**2);
          }
        })();
        
        return {
          'unit': unit,
          'air_distance': air_distance,
        };
      });
      if (!this.lazy) {
        with_data = with_data.sort((a, b) => a.air_distance - b.air_distance);
      }

      let keep_looping = true;
      while (keep_looping && (hp * dps) <= ((target.strength as number) * response_threshold)) {
        if (with_data.length <= 0) {
          return false;
        }
        
        let closest: UnitWithDistances | undefined = undefined;
        if (this.lazy) {
          closest = with_data[0];
        } else {
          let shortest_distance: number = NaN;
          for (let j=0; j<with_data.length; j++) {
            const data = with_data[j];
            const unit = data.unit;

            if (isNaN(shortest_distance)) {
              closest = data;

              if (undefined === data.ground_distance) {
                data['ground_distance'] = SafeGroundDistance(target.location, unit.pos);
              }
              if (isNaN(data.ground_distance)) {
                console.log('ERROR: Missing SafeGroundDistance for AssignUnitsToTargets 1');
                shortest_distance = data.air_distance;
              } else {
                shortest_distance = data.ground_distance;
              }
            } else if (data.air_distance >= shortest_distance) {
            } else {
              if (undefined === data.ground_distance) {
                data['ground_distance'] = SafeGroundDistance(target.location, unit.pos);
              }
              if (isNaN(data.ground_distance)) {
                console.log('ERROR: Missing SafeGroundDistance for AssignUnitsToTargets 2');
              } else if (data.ground_distance < shortest_distance) {
                closest = data;
                shortest_distance = data.ground_distance;
              }
            }
          }
        }

        if (!closest) {
          // can't find path to target
          output = false;
          keep_looping = false;
          continue;
        }

        const closest_unit = closest.unit;
        with_data = with_data.filter((d) => d.unit.id != closest_unit.id);
        this.my_fighting_units = this.my_fighting_units.filter((u) => u.id != closest_unit.id);
        target.units.push(closest_unit);

        if (just_one) {
          keep_looping = false;
          continue;
        }

        const effective_hp = closest_unit.hp * ArmorFactor(closest_unit.type.armor);
        hp += effective_hp;
        dps += CalculateDps(closest_unit);
      }
    }

    return output;
  }
}

export { UnitAssigner };
