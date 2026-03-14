import { DataHub } from '../data_hub';
import { WolvesAreObsolete } from '../utils';
import { ARCHER_SUPPLY, WOLF_SUPPLY, WORKER_SUPPLY, WOLF_BUILD_TIME,
  WORKER_BUILD_TIME, HOUSE_BUILD_TIME, ARCHER_COST, WOLF_COST,
  WORKER_COST, ARCHER_BUILD_TIME, SPEED_FACTOR } from '../constants';

interface SurveyProductionKwargs {
  data_hub: DataHub;
}

function SurveyProduction({ data_hub }: SurveyProductionKwargs): void {
  for (let i=0; i<data_hub.my_buildings.length; i++) {
    const my_building: LwgBuilding = data_hub.my_buildings[i];

    if (my_building.isUnderConstruction && my_building.type.supplyProvided) {
      data_hub.supply_under_construction += my_building.type.supplyProvided;
    }

    _SurveyMeleeVsRanged(my_building, data_hub);
    _SurveySupply(my_building, data_hub);
    _SurveySpending(my_building, data_hub);
  }
}

function _SurveyMeleeVsRanged(my_building: LwgBuilding, data_hub: DataHub): void {
  if (!my_building.queue) {
    return;
  }

  for (let i=0; i<5; i++) {
    const queued_unit = my_building.queue[i];
    if (!queued_unit) {
      continue;
    }

    if (queued_unit.id_string == 'soldier') {
      data_hub.count_melee ++;
    } else if (queued_unit.id_string == 'archer') {
      data_hub.count_ranged ++;
    } else if (queued_unit.id_string == 'wolf') {
      data_hub.count_melee ++;
    } else if (queued_unit.id_string == 'worker') {
    } else if (queued_unit.isUpgrade) {
    } else {
      console.log('\nERROR: Unhandled id_string: ' + queued_unit.id_string);
    }
  }
}

function _SurveySupply(my_building: LwgBuilding, data_hub: DataHub): void {
  const unit_supply: number = (() => {
    if (my_building.type.name == 'House' || my_building.type.name == 'Forge' ||
        my_building.type.name == 'Armory' || my_building.type.name == 'Watchtower' ||
        my_building.type.name == 'Snake Charmer') {
      return 0;
    } else if (my_building.queue && my_building.queue[0]) {
      return my_building.queue[0].supply;
    } else if (my_building.type.name == 'Barracks') {
      return ARCHER_SUPPLY;
    } else if (my_building.type.name == 'Wolves Den') {
      if (WolvesAreObsolete()) {
        return 0;
      } else {
        return WOLF_SUPPLY;
      }
    } else if (my_building.type.name == 'Castle') {
      if (data_hub.workers_needed > 0 && data_hub.worker_supply_reserved >= WORKER_SUPPLY) {
        // wrong when seconds_left <= HOUSE_BUILD_TIME but I don't care
        data_hub.worker_supply_reserved -= WORKER_SUPPLY;
        return WORKER_SUPPLY;
      } else {
        return 0;
      }
    } else {
      console.log('\nERROR: Unhandled name for _SurveySupply: ' + my_building.type.name);
      return 0;
    }
  })();

  if (unit_supply <= 0) {
    return;
  }
  data_hub.units_supply_producing += unit_supply;

  const seconds_left: number = (() => {
    if (my_building.type.name == 'House' || my_building.type.name == 'Forge' ||
        my_building.type.name == 'Armory' || my_building.type.name == 'Watchtower' ||
        my_building.type.name == 'Snake Charmer') {
      return 0;
    } else if (my_building.queue && my_building.queue[0]) {
      if (my_building.ranger_bot.queue_finish_time) {
        return my_building.ranger_bot.queue_finish_time - scope.getCurrentGameTimeInSec();
      } else {
        console.log(my_building);
        console.log('ERROR: Missing queue_finish_time for _SurveySupply');
        return WORKER_BUILD_TIME;
      }
    } else if (my_building.type.name == 'Barracks') {
      return ARCHER_BUILD_TIME;
    } else if (my_building.type.name == 'Wolves Den') {
      if (WolvesAreObsolete()) {
        return 0;
      } else {
        return WOLF_BUILD_TIME;
      }
    } else if (my_building.type.name == 'Castle') {
      if (data_hub.workers_needed > 0) {
        return WORKER_BUILD_TIME;
      } else {
        return 0;
      }
    } else {
      console.log('\nERROR: Unhandled name for _SurveySupply: ' + my_building.type.name);
      return 0;
    }
  })();

  if (seconds_left <= HOUSE_BUILD_TIME) {
    data_hub.units_supply_producing += unit_supply;
  }
}

function _SurveySpending(my_building: LwgBuilding, data_hub: DataHub): void {
  if (_BuildOrderExceptionApplies(data_hub)) {
    return;
  }

  const unit_cost: number = (() => {
    if (my_building.type.name == 'House' || my_building.type.name == 'Forge' ||
        my_building.type.name == 'Armory' || my_building.type.name == 'Watchtower' ||
        my_building.type.name == 'Snake Charmer') {
      return 0;
    } else if (my_building.queue && my_building.queue[0]) {
      return my_building.queue[0].cost;
    } else if (my_building.type.name == 'Barracks') {
      return ARCHER_COST;
    } else if (my_building.type.name == 'Wolves Den') {
      if (WolvesAreObsolete()) {
        return 0;
      } else {
        return WOLF_COST;
      }
    } else if (my_building.type.name == 'Castle') {
      if (data_hub.workers_needed > 0) {
        return WORKER_COST;
      } else {
        return 0;
      }
    } else {
      console.log('\nERROR: Unhandled name for _SurveySupply: ' + my_building.type.name);
      return 0;
    }
  })();

  if (unit_cost <= 0) {
    return;
  }

  const build_time: number = (() => {
    if (my_building.type.name == 'House' || my_building.type.name == 'Forge' ||
        my_building.type.name == 'Armory' || my_building.type.name == 'Watchtower' ||
        my_building.type.name == 'Snake Charmer') {
      return 0;
    } else if (my_building.queue && my_building.queue[0]) {
      return my_building.queue[0].buildTime / SPEED_FACTOR;
    } else if (my_building.type.name == 'Barracks') {
      return ARCHER_BUILD_TIME;
    } else if (my_building.type.name == 'Wolves Den') {
      if (WolvesAreObsolete()) {
        return 0;
      } else {
        return WOLF_BUILD_TIME;
      }
    } else if (my_building.type.name == 'Castle') {
      if (data_hub.workers_needed > 0) {
        return WORKER_BUILD_TIME;
      } else {
        return 0;
      }
    } else {
      console.log('\nERROR: Unhandled name for _SurveySupply: ' + my_building.type.name);
      return 0;
    }
  })();

  const cost_per_min = unit_cost * 60 / build_time;
  data_hub.gold_spend_per_min += cost_per_min;
}

function _BuildOrderExceptionApplies(data_hub: DataHub): boolean {
  if (WolvesAreObsolete()) {
    return false;
  } else if (data_hub.active_mining_bases > 1) {
    return false;
  } else if ((data_hub.viable_gold_mines as CachedGoldMine[]).length < 1) {
    return false;
  } else if (!scope.player.buildings.house) {
    return false;
  } else if (2 != scope.player.buildings.house) {
    return false;
  } else if (!scope.player.buildings.wolvesden) {
    return false;
  } else if (2 != scope.player.buildings.wolvesden) {
    return false;
  } else if (scope.getMaxSupply() - scope.getCurrentSupply() > 1) {
    return false
  } else {
    return true;
  }
}

export { SurveyProduction };
