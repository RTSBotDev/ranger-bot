import { DataHub } from './data_hub';
import { ManageGoldMines } from './state_machines/manage_gold_mines';
import { ManageMiners } from './state_machines/manage_miners';
import { ManageBuilders } from './state_machines/manage_builders';
import { ManageRepairers } from './state_machines/manage_repairers';
import { FilterViableGoldMines } from './state_machines/filter_viable_gold_mines';
import { ManageActiveCastles } from './state_machines/manage_active_castles';
import { GetWorkableMines } from './state_machines/get_workable_mines';
import { ManageActiveCastleCache } from './state_machines/manage_active_castle_cache';

interface ManageStatesKwargs {
  data_hub: DataHub;
}

function ManageStates({ data_hub }: ManageStatesKwargs): void {
  const gold_mines = data_hub.gold_mines as CachedGoldMine[];
  ManageGoldMines({ gold_mines: gold_mines });

  data_hub.miners = data_hub.my_workers.filter((w) => w.ranger_bot.job == 'mine');
  ManageMiners({ miners: data_hub.miners });
  data_hub.miners = data_hub.miners.filter((m) => m.ranger_bot.job == 'mine');

  data_hub.builders = data_hub.my_workers.filter((w) => w.ranger_bot.job == 'build');
  ManageBuilders({ builders: data_hub.builders });
  data_hub.builders = data_hub.builders.filter((b) => b.ranger_bot.job == 'build');
  data_hub.house_builders = data_hub.builders.filter((b) => b.ranger_bot.order == 'Build House');
  data_hub.wolf_den_builders = data_hub.builders.filter((b) => b.ranger_bot.order == 'Build Wolves Den');
  data_hub.castle_builders = data_hub.builders.filter((b) => b.ranger_bot.order == 'Build Castle');
  data_hub.barracks_builders = data_hub.builders.filter((b) => b.ranger_bot.order == 'Build Barracks');
  data_hub.tower_builders = data_hub.builders.filter((b) => b.ranger_bot.order == 'Build Watchtower');
  data_hub.armory_builders = data_hub.builders.filter((b) => b.ranger_bot.order == 'Build Armory');
  data_hub.forge_builders = data_hub.builders.filter((b) => b.ranger_bot.order == 'Build Forge');
  data_hub.traveling_house_builders = data_hub.house_builders.filter((b) => !b.ranger_bot.target_building);
  data_hub.traveling_wolf_den_builders = data_hub.wolf_den_builders.filter((b) => !b.ranger_bot.target_building);
  data_hub.traveling_barracks_builders = data_hub.barracks_builders.filter((b) => !b.ranger_bot.target_building);
  data_hub.traveling_tower_builders = data_hub.tower_builders.filter((b) => !b.ranger_bot.target_building);
  data_hub.traveling_armory_builders = data_hub.armory_builders.filter((b) => !b.ranger_bot.target_building);
  data_hub.traveling_forge_builders = data_hub.forge_builders.filter((b) => !b.ranger_bot.target_building);

  data_hub.repairers = data_hub.my_workers.filter((w) => w.ranger_bot.job == 'repair');
  ManageRepairers({ repairers: data_hub.repairers });
  data_hub.repairers = data_hub.repairers.filter((r) => r.ranger_bot.job == 'repair');

  // needs to be after ManageBuilders because that can populate gold_mine.castle
  data_hub.viable_gold_mines = FilterViableGoldMines({ data_hub: data_hub });

  data_hub.active_castles = ManageActiveCastles({ data_hub: data_hub });

  // needs to be after ManageActiveCastles because it uses active_castles
  GetWorkableMines({ data_hub: data_hub });

  // needs to be after ManageActiveCastles because it uses active_castles and active_mining_bases
  ManageActiveCastleCache({
    player_cache_key: data_hub.player_cache_key,
    active_mining_bases: data_hub.active_mining_bases,
    active_castles: data_hub.active_castles,
  });

  // needs to be after ManageMiners, ManageBuilders, ManageRepairers, and ManageActiveCastles
  // because they can create idle workers
  data_hub.idle_workers = data_hub.my_workers.filter((u) => !u.ranger_bot.job);
}

export { ManageStates };
