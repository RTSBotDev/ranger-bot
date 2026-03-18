import { DataHub } from '../data_hub';
import { AllocateAvailableWorkerClosestToBuilding } from '../allocate_worker';

interface AssignRepairersKwargs {
  data_hub: DataHub;
}

function AssignRepairers({ data_hub }: AssignRepairersKwargs): void {
  const builders = data_hub.builders as LwgUnit[];
  const repairers = data_hub.repairers as LwgUnit[];
  const needs_repair: {[building_id: string]: { building: LwgBuilding, repairers: LwgUnit[] }} = {};

  for (let i=0; i<data_hub.my_buildings.length; i++) {
    const my_building: LwgBuilding = data_hub.my_buildings[i];

    if (!my_building.isUnderConstruction && my_building.hp >= my_building.type.hp) {
      continue;
    }

    needs_repair[String(my_building.id)] = {
      'building': my_building,
      'repairers': [],
    };
  }

  for (let i=0; i<builders.length; i++) {
    const builder: LwgUnit = builders[i];

    if (!builder.ranger_bot.target_building) {
      continue;
    }
    if (!needs_repair[String(builder.ranger_bot.target_building.id)]) {
      continue;
    }

    needs_repair[String(builder.ranger_bot.target_building.id)].repairers.push(builder);
  }

  for (let i=0; i<repairers.length; i++) {
    const repairer: LwgUnit = repairers[i];

    if (!repairer.ranger_bot.target_building) {
      continue;
    }
    if (!needs_repair[String(repairer.ranger_bot.target_building.id)]) {
      continue;
    }

    needs_repair[String(repairer.ranger_bot.target_building.id)].repairers.push(repairer);
  }

  for (const [_id, data] of Object.entries(needs_repair)) {
    const my_building: LwgBuilding = data.building;

    let repairers_needed: number = my_building.type.maxUnitsToRepair - data.repairers.length;
    if (repairers_needed <= 0) {
      continue;
    }

    repairers_needed = Math.min(repairers_needed, 3);

    for (let n=0; n<repairers_needed; n++) {
      const new_repairer: LwgUnit | undefined = AllocateAvailableWorkerClosestToBuilding({
        building: my_building,
        active_mines: data_hub.active_mines as ActiveMineData[],
        idle_workers: data_hub.idle_workers as LwgUnit[],
      });
      if (!new_repairer) {
        continue;
      }
      AssignWorkerToRepair(new_repairer, my_building);
      repairers.push(new_repairer);
    }
  }
}

function AssignWorkerToRepair(worker: LwgUnit, building: LwgBuilding): void {
  worker.ranger_bot = {
    'job': 'repair',
    'target_building': building,
  };
  scope.order('Move', [{'unit': worker}], building.ranger_bot.center);
}

export { AssignRepairers, AssignWorkerToRepair };
