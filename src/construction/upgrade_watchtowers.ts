import { DataHub } from '../data_hub';
import { WATCHTOWER_DETECTION_COST } from '../constants';

interface UpgradeWatchtowersKwargs {
  data_hub: DataHub;
}

function UpgradeWatchtowers({ data_hub }: UpgradeWatchtowersKwargs): boolean {
  if (!scope.ranger_bot.player_caches[data_hub.player_cache_key].build_towers) {
    return false;
  }
  if (0 == data_hub.my_watchtowers.length) {
    return false;
  }

  for (let i=0; i<data_hub.my_watchtowers.length; i++) {
    const tower = data_hub.my_watchtowers[i];

    if (tower.isUnderConstruction) {
      continue;
    }
    if (tower.queue && tower.queue[0] && 'watchtower2' == tower.queue[0].id_string) {
      continue;
    }
    console.log(tower);

    if (data_hub.spendable_gold < WATCHTOWER_DETECTION_COST) {
      return true;
    }

    scope.order('Research Detection', [{'unit': tower}]);
    data_hub.spendable_gold -= WATCHTOWER_DETECTION_COST;
  }

  return false;
}

export { UpgradeWatchtowers };
