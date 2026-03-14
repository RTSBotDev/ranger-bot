import { DataHub } from '../data_hub';
import { CASTLE_COST, HOUSE_COST, WOLF_DEN_COST, BARRACKS_COST, FORGE_COST,
  ARMORY_COST, MAX_BARRACKS, MAX_FORGES } from '../constants';
import { StartExpansionWhenReady } from '../construction/start_expansion_when_ready';
import { BuildHouse, BuildWolfDen, BuildBarracks, BuildForge, BuildArmory } from '../build';
import { BuildTowers } from '../construction/build_towers';
import { WolvesAreObsolete } from '../utils';

interface NextBuildOrderStepKwargs {
  data_hub: DataHub;
}

function NextBuildOrderStep({ data_hub }: NextBuildOrderStepKwargs): void {
  let already_reserved_castle_gold = false;
  const castle_builders = data_hub.castle_builders as LwgUnit[];
  const viable_gold_mines = data_hub.viable_gold_mines as CachedGoldMine[];

  if (data_hub.NeedReplacementExpansion()) {
    // Once to compensate for ReserveGoldForBuilders, twice to expedite it.
    data_hub.spendable_gold += 2 * CASTLE_COST;
    if (castle_builders.length <= 0) {
      StartExpansionWhenReady({ data_hub: data_hub });
    }
    data_hub.spendable_gold -= 2 * CASTLE_COST;
    already_reserved_castle_gold = true;
  }

  if (data_hub.active_mining_bases < 1 && viable_gold_mines.length > 0) {
    if (castle_builders.length <= 0) {
      StartExpansionWhenReady({ data_hub: data_hub });
    }
    if (!already_reserved_castle_gold) {
      data_hub.spendable_gold -= CASTLE_COST;
      already_reserved_castle_gold = true;
    }
  }

  if (!scope.player.buildings.house || scope.player.buildings.house <= 0) {
    if (_NeedFirstHouse(data_hub) && data_hub.spendable_gold >= HOUSE_COST) {
      BuildHouse({ data_hub: data_hub });
    }
    return;
  }

  if (BuildTowers({ data_hub: data_hub })) {
    return;
  }

  if (WolvesAreObsolete()) {
    if (data_hub.my_barracks.length < 1) {
      if (data_hub.spendable_gold >= BARRACKS_COST) {
        BuildBarracks({ data_hub: data_hub });
      }
      return;
    }
  } else {
    if (data_hub.my_wolf_dens.length < 2) {
      if (data_hub.spendable_gold >= WOLF_DEN_COST) {
        BuildWolfDen({ data_hub: data_hub });
      }
      return;
    }
  }

  if (data_hub.active_mining_bases < 2 && viable_gold_mines.length > 0) {
    if (castle_builders.length <= 0) {
      StartExpansionWhenReady({ data_hub: data_hub });
    }
    if (!already_reserved_castle_gold) {
      data_hub.spendable_gold -= CASTLE_COST;
      already_reserved_castle_gold = true;
    }
  }

  const rax_on_2_base = WolvesAreObsolete() ? 3 : 1;
  if (data_hub.my_barracks.length < rax_on_2_base) {
    if (data_hub.spendable_gold >= BARRACKS_COST) {
      BuildBarracks({ data_hub: data_hub });
    }
    return;
  }

  if (data_hub.active_mining_bases < 3 && viable_gold_mines.length > 0) {
    if (castle_builders.length <= 0) {
      StartExpansionWhenReady({ data_hub: data_hub });
    }
    if (!already_reserved_castle_gold) {
      data_hub.spendable_gold -= CASTLE_COST;
      already_reserved_castle_gold = true;
    }
  }

  const rax_on_3_base = WolvesAreObsolete() ? 4 : 3;
  if (data_hub.my_barracks.length < rax_on_3_base) {
    if (data_hub.spendable_gold >= BARRACKS_COST) {
      BuildBarracks({ data_hub: data_hub });
    }
    return;
  }

  if (data_hub.my_forges.length < 1) {
    if (data_hub.spendable_gold >= FORGE_COST) {
      BuildForge({ data_hub: data_hub });
    }
    return;
  }

  if (data_hub.my_armories.length < 1) {
    if (data_hub.spendable_gold >= ARMORY_COST) {
      BuildArmory({ data_hub: data_hub });
    }
    return;
  }

  scope.ranger_bot.player_caches[data_hub.player_cache_key].build_towers = true;

  if (data_hub.active_mining_bases < 4 && viable_gold_mines.length > 0) {
    if (castle_builders.length <= 0) {
      StartExpansionWhenReady({ data_hub: data_hub });
    }
    if (!already_reserved_castle_gold) {
      data_hub.spendable_gold -= CASTLE_COST;
      already_reserved_castle_gold = true;
    }
  }

  if (data_hub.my_barracks.length < MAX_BARRACKS &&
      data_hub.my_barracks.every((b) => b.isUnderConstruction || b.queue[0])) {
    if (data_hub.spendable_gold >= BARRACKS_COST) {
      BuildBarracks({ data_hub: data_hub });
    }
    return;
  }

  if (data_hub.my_forges.length < MAX_FORGES) {
    if (data_hub.spendable_gold >= FORGE_COST) {
      BuildForge({ data_hub: data_hub });
    }
    return;
  }

  if (data_hub.my_barracks.length < MAX_BARRACKS) {
    if (data_hub.spendable_gold >= BARRACKS_COST) {
      BuildBarracks({ data_hub: data_hub });
    }
    return;
  }

  if (data_hub.active_mining_bases < 5 && viable_gold_mines.length > 0) {
    if (castle_builders.length <= 0) {
      StartExpansionWhenReady({ data_hub: data_hub });
    }
    if (!already_reserved_castle_gold) {
      data_hub.spendable_gold -= CASTLE_COST;
      already_reserved_castle_gold = true;
    }
  }
}

function _NeedFirstHouse(data_hub: DataHub): boolean {
  if (scope.getCurrentGameTimeInSec() < 40) {
    return false;
  }
  // Buildings being constructed don't show up in scope.player.buildings
  if (data_hub.my_houses.length > 0) {
    return false;
  }
  if (data_hub.house_builders && data_hub.house_builders.length > 0) {
    return false;
  }
  return true;
}

export { NextBuildOrderStep };
