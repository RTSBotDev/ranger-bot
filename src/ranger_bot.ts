import { ChatGlhf } from './chatting';
import { DataHub } from './data_hub';
import { PrintExpansionData } from './map_analysis/print_expansion_data';
import { ManageStates } from './manage_states';
import { MacroBot } from './macro_bot';
import { ArmyBot } from './army_bot';
import { MicroUnits } from './micro_units';
import { DEBUG } from './constants';

interface RangerBotConstructor {
  team_cache_key: string;
  player_cache_key: string;
}

class RangerBot {
  team_cache_key: string;
  player_cache_key: string;
  game_time: number;
  begin_at: number;

  data_hub?: DataHub;
  macro_bot?: MacroBot;
  army_bot?: ArmyBot;

  constructor({ team_cache_key, player_cache_key }: RangerBotConstructor) {
    this.team_cache_key = team_cache_key;
    this.player_cache_key = player_cache_key;
    this.game_time = scope.getCurrentGameTimeInSec();
    this.begin_at = Date.now();
  }

  Step(): void {
    if (DEBUG) {
      console.log('\nscope.getCurrentGameTimeInSec(): ' + this.game_time);
    }

    ChatGlhf({game_time: this.game_time});

    this.data_hub = new DataHub({
      team_cache_key: this.team_cache_key,
      player_cache_key: this.player_cache_key,
    });

    if (DEBUG && !scope.ranger_bot.map_printed) {
      PrintExpansionData({ expansions: this.data_hub.map.expansions });
      scope.ranger_bot.map_printed = true;
    }

    ManageStates({ data_hub: this.data_hub });

    this.macro_bot = new MacroBot({ data_hub: this.data_hub });
    this.macro_bot.Step();

    this.army_bot = new ArmyBot({ data_hub: this.data_hub });
    this.army_bot.Step();

    MicroUnits({ data_hub: this.data_hub });

    this.Save();

    if (DEBUG) {
      const tick_sec: number = (Date.now() - this.begin_at) / 1000;
      console.log('\ntick_sec: ' + tick_sec);
    }
  }

  Save(): void {
    if (!this.data_hub || !this.army_bot) {
      throw new Error('Save called out of order');
    }

    this.data_hub.Save();
    this.army_bot.Save();
  }
}

export { RangerBot };
