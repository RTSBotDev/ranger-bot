import { AssignWorkerToRepair } from '../macro/assign_repairers';

interface ManageBuildersKwargs {
  builders: LwgUnit[];
}

function ManageBuilders({ builders }: ManageBuildersKwargs): void {
  for (let i=0; i<builders.length; i++) {
    const builder: LwgUnit = builders[i];

    if (builder.order.name == 'Repair' && !builder.ranger_bot.target_building) {
      builder.ranger_bot.target_building = builder.targetUnit as LwgBuilding;

      if (builder.ranger_bot.order == 'Build Watchtower') {
        _AttachTower(builder);
      } else if (builder.ranger_bot.order == 'Build Castle') {
        _AttachCastle(builder);
      }
    }

    _DealocateIfFinishedOrDestroyed(builder);
  }
}

function _AttachTower(builder: LwgUnit): void {
  const target_tower = builder.ranger_bot.target_building as LwgBuilding;

  if (builder.ranger_bot.castle) {
    builder.ranger_bot.castle.ranger_bot.tower = target_tower;
  }

  const active_mines = builder.ranger_bot.active_mines as ActiveMineData[];
  for (let i=0; i<active_mines.length; i++) {
    const active_mine: ActiveMineData = active_mines[i];
    if (!active_mine.gold_mine) {
      console.log(builder.ranger_bot);
      throw new Error('Missing gold mine for _AttachTower');
    }

    active_mine.gold_mine.tower = target_tower;
  }
}

function _AttachCastle(builder: LwgUnit): void {
  if (!builder.ranger_bot.placement) {
    console.log(builder.ranger_bot);
    throw new Error('Missing castle placement on castle builder for _AttachCastle');
  }
  const target_castle = builder.ranger_bot.target_building as LwgBuilding;

  target_castle.ranger_bot.mining_data = {
    'mines_data': builder.ranger_bot.placement.mines_data,
    'tower_location': builder.ranger_bot.placement.tower_location,
  };

  for (let i=0; i<builder.ranger_bot.placement.mines_data.length; i++) {
    const active_mine: ActiveMineData = builder.ranger_bot.placement.mines_data[i];
    if (!active_mine.gold_mine) {
      console.log(active_mine);
      throw new Error('Missing gold_mine for _AttachCastle');
    }

    active_mine.gold_mine.castle = target_castle;
  }
}

function _DealocateIfFinishedOrDestroyed(builder: LwgUnit): void {
  if (!builder.ranger_bot.target_building) {
    return;
  }
  const target_building = builder.ranger_bot.target_building as LwgBuilding;

  if (!target_building.isUnderConstruction) {
    if (target_building.hp >= target_building.type.hp) {
      builder.ranger_bot = {};
    } else {
      AssignWorkerToRepair(builder, target_building);
    }
  } else if (!target_building.isAlive && target_building.hp <= 0){
    builder.ranger_bot = {};
  }
}

export { ManageBuilders };
