
interface ManageRepairersKwargs {
  repairers: LwgUnit[];
}

function ManageRepairers({ repairers }: ManageRepairersKwargs): void {
  for (let i=0; i<repairers.length; i++) {
    const repairer: LwgUnit = repairers[i];
    const target_building = repairer.ranger_bot.target_building as LwgBuilding;

    if (!target_building.isUnderConstruction && target_building.hp >= target_building.type.hp) {
      repairer.ranger_bot = {};
    } else if (!target_building.isAlive && target_building.hp <= 0) {
      repairer.ranger_bot = {};
    }
  }
}

export { ManageRepairers };
