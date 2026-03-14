import { DataHub } from '../data_hub';
import { HOUSE_COST } from '../constants';
import { BuildHouse } from '../build';

interface BuildHouseIfNeededKwargs {
  data_hub: DataHub;
}

function BuildHouseIfNeeded({ data_hub }: BuildHouseIfNeededKwargs): void {
  if (scope.getMaxSupply() + data_hub.supply_under_construction >= scope.player.supplyCap) {
    return;
  }

  const house_builders = data_hub.house_builders as LwgUnit[];
  const available_supply = _CalculateAvailableSupply(house_builders, data_hub);
  if (data_hub.units_supply_producing <= available_supply) {
    return;
  }

  if (HOUSE_COST > data_hub.spendable_gold) {
    // Reserve gold for house, even if we don't have enough yet.
    data_hub.spendable_gold -= HOUSE_COST;
    return;
  }
  data_hub.spendable_gold -= HOUSE_COST;

  BuildHouse({ data_hub: data_hub });
}

function _CalculateAvailableSupply(house_builders: LwgUnit[], data_hub: DataHub): number {
  let output = scope.getMaxSupply() - scope.getCurrentSupply() + data_hub.supply_under_construction;

  for (let i=0; i<house_builders.length; i++) {
    const house_builder: LwgUnit = house_builders[i];
    // While the builder is walking to the build location, the order has a name like "Build House", and includes a unitType key.
    // Once the building is thrown down, the order name changes to "Repair". This is accounted for in the Buildings Survey.
    if (house_builder.order && house_builder.order.unitType && house_builder.order.unitType.supplyProvided) {
      output += house_builder.order.unitType.supplyProvided;
    }
  }

  return output;
}

export { BuildHouseIfNeeded };
