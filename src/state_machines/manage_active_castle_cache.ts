import { DEBUG } from '../constants';

interface ManageActiveCastleCacheKwargs {
  player_cache_key: string;
  active_mining_bases: number;
  active_castles: LwgBuilding[];
}

function ManageActiveCastleCache({ player_cache_key, active_mining_bases, active_castles }: ManageActiveCastleCacheKwargs): void {
  _ManageActiveMiningBasesCache(player_cache_key, active_mining_bases);
  _ManageActiveCastleCache(player_cache_key, active_castles);
}

function _ManageActiveMiningBasesCache(player_cache_key: string, active_mining_bases: number): void {
  if (!scope.ranger_bot.player_caches[player_cache_key].active_mining_bases) {
    scope.ranger_bot.player_caches[player_cache_key].active_mining_bases = active_mining_bases;
  } else {
    scope.ranger_bot.player_caches[player_cache_key].active_mining_bases = Math.max(
      scope.ranger_bot.player_caches[player_cache_key].active_mining_bases,
      active_mining_bases);
  }
}

function _ManageActiveCastleCache(player_cache_key: string, active_castles: LwgBuilding[]): void {
  const new_active_castle_ids = active_castles.map((ac) => ac.id).sort();

  if (!scope.ranger_bot.player_caches[player_cache_key].active_castle_ids) {
    scope.ranger_bot.player_caches[player_cache_key].active_castle_ids = new_active_castle_ids;
    return;
  }
  const old_active_castle_ids = scope.ranger_bot.player_caches[player_cache_key].active_castle_ids;

  const cache_invalid = (() => {
    if (new_active_castle_ids.length != old_active_castle_ids.length) {
      return true;
    }

    for (let i=0; i<new_active_castle_ids.length; i++) {
      // JS doesn't care what you think is necessary
      const new_id = new_active_castle_ids[i];
      const old_id = old_active_castle_ids[i];
      if (new_id != old_id) {
        return true;
      }
    }

    return false;
  })();

  if (cache_invalid) {
    if (DEBUG) {
      console.log('ERROR: cache_invalid');
    }
    // TODO
    // for (let i=0; i<scope.ranger_bot.targets.length; i++) {
    //   const target = scope.ranger_bot.targets[i];
    //   target.ground_distance = false;
    //   target.active_castle = false;
    //   target.base_priority = false;
    // }
  }

  scope.ranger_bot.player_caches[player_cache_key].active_castle_ids = new_active_castle_ids;
}

export { ManageActiveCastleCache };
