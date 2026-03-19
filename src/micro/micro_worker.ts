import { MicroCombatUnit } from './micro_combat_unit';
import { GetGoldMines, GetNumberFieldValue } from '../utils';
import { AreBuildable } from '../map_analysis/buildable';
import { SelectCastlePlacement } from '../construction/select_castle_placement';
import { DataHub } from '../data_hub';
import { DEBUG } from '../constants';

function MicroWorker(worker: LwgUnit, data_hub: DataHub): void {
  if (worker.ranger_bot.conscripted) {
    MicroCombatUnit(worker);
  } else if (worker.ranger_bot.job == 'build') {
    _MicroBuilder(worker, data_hub);
  } else if (worker.ranger_bot.job == 'mine') {
    _MicroMiner(worker)
  } else if (worker.ranger_bot.job == 'repair') {
    _MicroRepairer(worker)
  } else if (!worker.ranger_bot.job) {
    // TODO: means idle worker, should only be possible when the whole map is mined out
  } else if (DEBUG) {
    console.log('Error: Unhandled Worker Job: ' + worker.ranger_bot.job);
  }
}

function _MicroBuilder(builder: LwgUnit, data_hub: DataHub): void {
  if (builder.order.name == 'Repair') {
    return;
  } else if (!_TargetLocationBuildable(builder, data_hub)) {
    if (builder.ranger_bot.order == 'Build Castle') {
      _FindNewCastleLocation(builder);
      return;
    }

    builder.ranger_bot = {};
    scope.order('Stop', [{'unit': builder}]);
    return;
  } else if (builder.order.name.slice(0, 6) == 'Build ') {
    return;
  } else if (builder.order.name == 'Stop' || builder.order.name == 'Mine') {
    if (!_TryToBuild(builder)) {
      scope.order('Move', [{'unit': builder}], builder.ranger_bot.target_location);
    }
  } else if (builder.order.name == 'Move') {
    _TryToBuild(builder);
  } else if (DEBUG) {
    console.log('Error: Unhandled Builder Order: ' + builder.order.name);
  }
}

function _TargetLocationBuildable(builder: LwgUnit, data_hub: DataHub): boolean {
  if (!builder.ranger_bot.building_type || !builder.ranger_bot.target_location ||
      builder.ranger_bot.exclude_worker_paths === undefined) {
    if (DEBUG) {
      console.log(builder);
    }
    throw new Error('Missing data for _TargetLocationBuildable');
  }

  const width = GetNumberFieldValue({ piece_name: builder.ranger_bot.building_type, field_name: 'sizeX' });
  const height = GetNumberFieldValue({ piece_name: builder.ranger_bot.building_type, field_name: 'sizeY' });

  return AreBuildable({
    x_min: builder.ranger_bot.target_location.x,
    x_max: builder.ranger_bot.target_location.x + width - 1,
    y_min: builder.ranger_bot.target_location.y,
    y_max: builder.ranger_bot.target_location.y + height - 1,
    exclude_worker_paths: builder.ranger_bot.exclude_worker_paths,
    data_hub: data_hub,
  });
}

function _TryToBuild(builder: LwgUnit): boolean {
  if (!builder.ranger_bot.cost || !builder.ranger_bot.order || !builder.ranger_bot.target_location) {
    if (DEBUG) {
      console.log(builder);
    }
    throw new Error('Missing data for _TryToBuild');
  }

  if (builder.ranger_bot.target_building) {
    scope.order('Repair', [{'unit': builder}], builder.ranger_bot.target_building);
    return true;
  } else if (scope.getGold() >= builder.ranger_bot.cost) {
    scope.order(builder.ranger_bot.order, [{'unit': builder}], builder.ranger_bot.target_location);
    return true;
  } else {
    return false;
  }
}

function _FindNewCastleLocation(castle_builder: LwgUnit): void {
  if (!castle_builder.ranger_bot.expansion) {
    if (DEBUG) {
      console.log(castle_builder);
    }
    throw new Error('Missing data for _FindNewCastleLocation');
  }

  const castle_placement: PlayerCastlePlacement | undefined = SelectCastlePlacement({
    player_expansion: castle_builder.ranger_bot.expansion,
  });
  if (!castle_placement) {
    if (DEBUG) {
      console.log(castle_builder);
      console.log('Error: Missing castle_placement for _FindNewCastleLocation');
    }
    castle_builder.ranger_bot = {};
    scope.order('Stop', [{'unit': castle_builder}]);
    return;
  }

  castle_builder.ranger_bot.placement = castle_placement;
  castle_builder.ranger_bot.target_location = castle_placement.castle_location;

  if (!_TryToBuild(castle_builder)) {
    scope.order('Move', [{'unit': castle_builder}], castle_builder.ranger_bot.target_location);
  }
}

function _MicroMiner(miner: LwgUnit): void {
  if (!miner.ranger_bot.castle || !miner.ranger_bot.mine) {
    if (DEBUG) {
      console.log(miner);
    }
    throw new Error('Missing data for _MicroMiner');
  }

  if (!miner.ranger_bot.castle.isAlive && miner.ranger_bot.castle.hp <= 0) {
    miner.ranger_bot = {};
    scope.order('Stop', [{'unit': miner}]);
  } else if (miner.ranger_bot.castle.isUnderConstruction &&
      miner.carriedGoldAmount && miner.carriedGoldAmount > 0) {
    scope.order('Move', [{'unit': miner}], miner.ranger_bot.castle);
  } else if (miner.order.name == 'Mine') {
    return;
  } else if (miner.order.name == 'Stop' || miner.order.name == 'Move' || miner.order.name == 'AMove') {
    const real_mine: LwgGoldMine = _GetRealMine(miner.ranger_bot.mine);
    scope.order('Mine', [{'unit': miner}], {'unit': {'unit': real_mine}});
  } else if (miner.order.name == 'Repair') { // Timing issue?
    const real_mine: LwgGoldMine = _GetRealMine(miner.ranger_bot.mine);
    scope.order('Mine', [{'unit': miner}], {'unit': {'unit': real_mine}}, true);
  } else if (DEBUG) {
    console.log('Error: Unhandled Miner Order: ' + miner.order.name);
  }
}

function _GetRealMine(mine: CachedGoldMine): LwgGoldMine {
  const raw_gold_mines: LwgGoldMine[] = GetGoldMines();
  for (let i=0; i<raw_gold_mines.length; i++) {
    const real_gold_mine: LwgGoldMine = raw_gold_mines[i];

    if (real_gold_mine.id == mine.id) {
      return real_gold_mine;
    }
  }

  if (DEBUG) {
    console.log(mine);
    console.log(raw_gold_mines);
  }
  throw new Error('Missing real gold mine id ' + mine.id);
}

function _MicroRepairer(repairer: LwgUnit): void {
  if (!repairer.ranger_bot.target_building) {
    if (DEBUG) {
      console.log(repairer);
    }
    throw new Error('ERROR: Missing target_building for _MicroRepairer');
  }

  if (repairer.order.name == 'Repair') {
    return;
  } else if (repairer.order.name == 'Move' || repairer.order.name == 'Stop' || repairer.order.name == 'AMove') {
    scope.order('Repair', [{'unit': repairer}], {'unit': {'unit': repairer.ranger_bot.target_building}});
  } else if (repairer.order.name == 'Mine') {
    scope.order('Repair', [{'unit': repairer}], {'unit': {'unit': repairer.ranger_bot.target_building}});
  } else if (DEBUG) {
    console.log('Error: Unhandled Repairer Order: ' + repairer.order.name);
  }
}

export { MicroWorker };
