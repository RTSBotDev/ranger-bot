import { DataHub } from '../data_hub';

interface ManageBattleStatusKwargs {
  data_hub: DataHub;
  battles: RangerBotBattle[];
  squads: RangerBotSquad[];
}

function ManageBattleStatus({ data_hub, battles, squads }: ManageBattleStatusKwargs): void {
  for (let i=0; i<data_hub.targets.length; i++) {
    const target = data_hub.targets[i];

    target.attacking = false;
  }
  for (let i=0; i<battles.length; i++) {
    const battle = battles[i];

    const battle_is_attacking = (() => {
      if (battle.command == 'fight' || battle.command == 'defend') {
        return true;
      } else if (battle.command == 'retreat') {
        return false;
      } else {
        console.log('ERROR: Unhandled battle command: ' + battle.command);
        return false;
      }
    })();

    for (let j=0; j<battle.targets.length; j++) {
      const target = battle.targets[j];

      target.attacking = battle_is_attacking;
    }
  }

  for (let i=0; i<squads.length; i++) {
    const squad = squads[i];

    const squad_is_attacking = (() => {
      if (squad.command == 'fight' || squad.command == 'defend') {
        return true;
      } else if (squad.command == 'retreat') {
        return false;
      } else if (squad.command === undefined) {
        return false; // not part of any battles
      } else {
        console.log('ERROR: Unhandled squad command: ' + squad.command);
        return false;
      }
    })();

    for (let j=0; j<squad.units.length; j++) {
      const unit = squad.units[j];

      if (unit.ranger_bot.conscripted) {
        continue;
      }

      unit.ranger_bot.attacking = squad_is_attacking;
    }
  }
}

export { ManageBattleStatus };
