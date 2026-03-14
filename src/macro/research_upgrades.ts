import { DataHub } from '../data_hub';
import { ARCHER_RANGE_COST, MAX_ATTACK_UPGRADE_LEVEL, MAX_ARMOR_UPGRADE_LEVEL } from '../constants';

interface ResearchUpgradesKwargs {
  data_hub: DataHub;
}

function ResearchUpgrades({ data_hub }: ResearchUpgradesKwargs): void {
  _ResearchArcherRange(data_hub);

  if (data_hub.AttackUpgradeLevel() < MAX_ATTACK_UPGRADE_LEVEL) {
    _ResearchForgeUpgrade({
      data_hub: data_hub,
      upgrade_order: 'Attack Upgrade',
      upgrade_cost: data_hub.AttackUpgradeCost(),
    });
  }

  if (data_hub.ArmorUpgradeLevel() < MAX_ARMOR_UPGRADE_LEVEL) {
    _ResearchForgeUpgrade({
      data_hub: data_hub,
      upgrade_order: 'Armor Upgrade',
      upgrade_cost: data_hub.ArmorUpgradeCost(),
    });
  }
}

function _ResearchArcherRange(data_hub: DataHub): void {
  if (data_hub.my_armories.length <= 0) {
    return;
  }
  if (scope.player.upgrades.upgrange && scope.player.upgrades.upgrange >= 1) {
    return;
  }

  for (let i=0; i<data_hub.my_armories.length; i++) {
    const armory: LwgBuilding = data_hub.my_armories[i];

    if (armory.isUnderConstruction) {
      continue;
    }

    for (let j=0; j<5; j++) {
      const order = armory.queue[j];

      if (!order) {
        continue;
      }

      if (order.name == 'Archer Range') {
        return;
      }
    }
  }

  const available_armories = data_hub.my_armories.filter((a) => !a.isUnderConstruction && !a.queue[0]);
  if (available_armories.length <= 0) {
    return;
  }

  if (data_hub.spendable_gold >= ARCHER_RANGE_COST) {
    scope.order('Research Archer Range', [{'unit': available_armories[0]}]);
  }

  data_hub.spendable_gold -= ARCHER_RANGE_COST;
}

interface ForgeUpgradeKwargs {
  data_hub: DataHub;
  upgrade_order: string;
  upgrade_cost: number;
}

function _ResearchForgeUpgrade({ data_hub, upgrade_order, upgrade_cost }: ForgeUpgradeKwargs): void {
  // Technically there can be race conditions here if 2 forges are idle at the same time.
  // But worst case scenario it issues an invalid command to the 2nd forge for 1 tick.
  for (let i=0; i<data_hub.my_forges.length; i++) {
    const forge: LwgBuilding = data_hub.my_forges[i];

    if (forge.queue[0]) {
      continue;
    }

    if (data_hub.spendable_gold >= upgrade_cost) {
      scope.order(upgrade_order, [{'unit': forge}]);
    }

    data_hub.spendable_gold -= upgrade_cost;
  }
}

export { ResearchUpgrades };
