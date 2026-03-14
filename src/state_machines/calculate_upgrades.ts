import { DataHub } from '../data_hub';
import { GetStringFieldValue, GetNumberFieldValue } from '../utils';

interface CalculateUpgradeLevelKwargs {
  data_hub: DataHub;
  upgrade_type: keyof LwgPlayerUpgrades;
}

function CalculateUpgradeLevel({ data_hub, upgrade_type }: CalculateUpgradeLevelKwargs): number {
  // TODO: is there a way to get this from the API?
  let output = scope.player.upgrades[upgrade_type] as number | undefined;
  if (!output) {
    output = 0;
  }
  const name_for_type = GetStringFieldValue({ piece_name: upgrade_type, field_name: 'name' });
  for (let i=0; i<data_hub.my_forges.length; i++) {
    const forge: LwgBuilding = data_hub.my_forges[i];

    if (forge.isUnderConstruction) {
      continue;
    }

    for (let j=0; j<5; j++) {
      const order = forge.queue[j];

      if (!order) {
        continue;
      }

      if (order.name == name_for_type) {
        output ++;
      }
    }
  }

  return output;
}

interface CalculateUpgradeCostKwargs {
  upgrade_type: keyof LwgPlayerUpgrades;
  upgrade_level: number;
}

function CalculateUpgradeCost({ upgrade_type, upgrade_level }: CalculateUpgradeCostKwargs): number {
  // TODO: is there a way to get this from the API?
  const base_cost = GetNumberFieldValue({ piece_name: upgrade_type, field_name: 'cost' });
  const effects_fields: any = scope.getTypeFieldValue(upgrade_type, 'effectsFields');
  if (!Array.isArray(effects_fields)) {
    console.log(effects_fields);
    throw new Error('Wrong type of effects_fields for CalculateUpgradeCost');
  }
  const cost_index: number = effects_fields.indexOf('cost');
  const effects_modifications: any = scope.getTypeFieldValue(upgrade_type, 'effectsModifications');
  if (!Array.isArray(effects_modifications)) {
    console.log(effects_modifications);
    throw new Error('Wrong type of effects_modifications for CalculateUpgradeCost');
  }
  const increment_cost = effects_modifications[cost_index];

  return base_cost + increment_cost*upgrade_level;
}

export { CalculateUpgradeLevel, CalculateUpgradeCost };
