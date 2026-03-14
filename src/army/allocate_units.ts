import { DataHub } from '../data_hub';
import { AssignUnitsToBattle } from './unit_allocation/assign_units_to_battle';
import { AssignUnitsToTargets } from './unit_allocation/assign_units_to_targets';

interface ManageSquadKwargs {
  data_hub: DataHub;
  battles: RangerBotBattle[];
}

function AllocateUnits({ data_hub, battles }: ManageSquadKwargs): void {
  data_hub.busy_units = _ExcludeBusyUnits(data_hub.targets, battles);
  _AllocateUnitsInBattle(battles);
  AssignUnitsToTargets({ data_hub: data_hub });
  _UpdateCommands(data_hub.targets)
}

function _ExcludeBusyUnits(targets: RangerBotTarget[], battles: RangerBotBattle[]): RangerBotBusyUnits {
  // Units tend to get stuck in protracted chains of battles and never get where they're going
  const busy_units: RangerBotBusyUnits = {};

  for (let i=0; i<battles.length; i++) {
    const battle = battles[i];

    for (let j=0; j<battle.squads.length; j++) {
      const squad = battle.squads[j];

      for (let k=0; k<squad.units.length; k++) {
        const unit = squad.units[k];

        busy_units[unit.id] = true;
      }
    }
  }
  for (let i=0; i<targets.length; i++) {
    const target = targets[i];

    target.units = target.units.filter((u) => !busy_units[u.id]);
  }

  return busy_units;
}

function _UpdateCommands(targets: RangerBotTarget[]): void {
  for (let i=0; i<targets.length; i++) {
    const target = targets[i];

    for (let j=0; j<target.units.length; j++) {
      const unit = target.units[j];

      if (undefined === unit.ranger_bot.command) {
        unit.ranger_bot.command = 'fight';
      }
      if ('fight' == unit.ranger_bot.command && undefined === unit.ranger_bot.command_at) {
        unit.ranger_bot.command_at = {'x': target.location.x, 'y': target.location.y};
      }
    }
  }
}

function _AllocateUnitsInBattle(battles: RangerBotBattle[]): void {
  for (let i=0; i<battles.length; i++) {
    const battle = battles[i];

    AssignUnitsToBattle(battle);
  }
}

export { AllocateUnits };
