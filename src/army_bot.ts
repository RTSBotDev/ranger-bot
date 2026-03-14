import { DataHub } from './data_hub';
import { AGGRO_START_GAP, AGGRO_STOP_GAP } from './constants';
import { UpdateThreats } from './army/update_threats';
import { UpdateTargets } from './army/update_targets';
import { PrioritizeTargets } from './army/prioritize_targets';
import { FormSquads } from './army/form_squads';
import { ConscriptWorkers } from './army/conscript_workers';
import { IdentifyBattles } from './army/identify_battles';
import { CalculateSquadStrength } from './army/calculate_squad_strength';
import { EvaluateBattle } from './army/evaluate_battle';
import { ManageSquad } from './army/manage_squad';
import { ManageBattleStatus } from './army/manage_battle_status';
import { AllocateUnits } from './army/allocate_units';
import { CommandIdleUnits } from './army/command_idle_units';

interface ArmyBotConstructor {
  data_hub: DataHub;
}

class ArmyBot {
  data_hub: DataHub;

  constructor({ data_hub }: ArmyBotConstructor) {
    this.data_hub = data_hub;
  }

  Step(): void {
    this._ResetUnitOrders();

    this.data_hub.threats = UpdateThreats({ data_hub: this.data_hub });
    this.data_hub.targets = UpdateTargets({ data_hub: this.data_hub });
    PrioritizeTargets({ data_hub: this.data_hub });

    let squads = FormSquads({ data_hub: this.data_hub });
    const conscripted_squads = ConscriptWorkers({ data_hub: this.data_hub });
    squads = squads.concat(conscripted_squads);
    for (let i=0; i<squads.length; i++) {
      const squad = squads[i];
      CalculateSquadStrength(squad);
    }

    const battles = IdentifyBattles({
      data_hub: this.data_hub,
      squads: squads,
    });
    for (let i=0; i<battles.length; i++) {
      const battle = battles[i];
      this._ManageBattle(battle);
    }

    ManageBattleStatus({
      data_hub: this.data_hub,
      battles: battles,
      squads: squads,
    });
    AllocateUnits({
      data_hub: this.data_hub,
      battles: battles,
    });
    CommandIdleUnits(this.data_hub.my_fighting_units);
  }

  Save(): void {
    // Micro can update targets
    const new_targets = [];
    for (let i=0; i<this.data_hub.targets.length; i++) {
      const old_target = this.data_hub.targets[i];

      const new_target: RangerBotTarget = {
        'location': old_target.location,
        'r': old_target.r,
        'threats': [],
        'units': old_target.units,
        'is_air': old_target.is_air,
      };

      if (undefined !== old_target.ground_distance && !isNaN(old_target.ground_distance)) {
        new_target['ground_distance'] = old_target.ground_distance;
      }
      if (undefined !== old_target.active_castle) {
        new_target['active_castle'] = old_target.active_castle;
      }
      if (undefined !== old_target.base_priority && !isNaN(old_target.base_priority)) {
        new_target['base_priority'] = old_target.base_priority;
      }
      if (undefined !== old_target.attacking) {
        new_target['attacking'] = !!old_target.attacking;
      }

      new_targets.push(new_target);
    }
    scope.ranger_bot.team_caches[this.data_hub.team_cache_key].targets = new_targets;
  }

  _ResetUnitOrders(): void {
    for (let i=0; i<this.data_hub.my_units.length; i++) {
      const my_unit = this.data_hub.my_units[i];
      const lwg_cache = my_unit.ranger_bot;

      delete lwg_cache['command'];
      delete lwg_cache['command_at'];
    }
  }

  _ManageBattle(battle: RangerBotBattle): void {
    /*
              T2
       T1    /
      /  \  /
    S1    S2

    S1 and S2 are squads, T1 and T2 are threats.

    Case 1: T1 > S1 and T1 > S2 but S1 + S2 > T1 + T2
    Ie T1 is large, T2 is tiny, both S1 and S2 are medium.
    Both S1 and S2 should fight.

    Case 2: S1 + S2 < T1 + T2 but S1 > T1
    Ie S1 is large, S2 is tiny, both T1 and T2 are medium.
    S2 should run immediatly, but S1 should fight with T1 until T2 arrives, then also run.
    */
    const aggro_mode = this._ManageAggroMode();
    battle.command = EvaluateBattle(battle, aggro_mode);

    for (let i=0; i<battle.squads.length; i++) {
      const squad = battle.squads[i];

      ManageSquad({
        data_hub: this.data_hub,
        battle: battle,
        squad: squad,
        aggro_mode: aggro_mode,
      });
    }
  }

  _ManageAggroMode(): boolean {
    // Once we're maxed out, we want to pick fights aggressively,
    // even if that means taking trades that are a little bit bad.
    if (scope.getMaxSupply() >= scope.player.supplyCap &&
      (scope.getCurrentSupply() - AGGRO_START_GAP) >= scope.player.supplyCap) {
      scope.ranger_bot.player_caches[this.data_hub.player_cache_key].aggro_mode = true;
    } else if (!!scope.ranger_bot.player_caches[this.data_hub.player_cache_key].aggro_mode &&
        (scope.getCurrentSupply() - AGGRO_STOP_GAP) >= scope.player.supplyCap) {
      scope.ranger_bot.player_caches[this.data_hub.player_cache_key].aggro_mode = false;
    }
    return !!scope.ranger_bot.player_caches[this.data_hub.player_cache_key].aggro_mode;
  }
}

export { ArmyBot };
