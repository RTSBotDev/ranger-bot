import { DataHub } from '../data_hub';
import { MINE_SCOUT_INTERVAL, CASTLE_WIDTH, CASTLE_HEIGHT, THREAT_DECAY } from '../constants';
import { CalculateDps, CalculateArmor, CalculateRange } from '../unit_stats';
import { GetNumberFieldValue } from '../utils';

interface UpdateThreatsKwargs {
  data_hub: DataHub;
}

function UpdateThreats({ data_hub }: UpdateThreatsKwargs): TeamThreatsCache {
  if (scope.ranger_bot.team_caches[data_hub.team_cache_key].threats_last_updated_at &&
      (scope.ranger_bot.team_caches[data_hub.team_cache_key].threats_last_updated_at as number) >= scope.getCurrentGameTimeInSec()) {
    // If 2 or more ranger bots are on the same team
    return scope.ranger_bot.team_caches[data_hub.team_cache_key].threats as TeamThreatsCache;
  }

  if (undefined === scope.ranger_bot.team_caches[data_hub.team_cache_key].threats) {
    _SeedThreats(data_hub);
  }
  let threats = scope.ranger_bot.team_caches[data_hub.team_cache_key].threats as TeamThreatsCache;
  
  threats = _ScoutGoldMines(data_hub, threats);

  if (0 >= threats.buildings.length && 0 >= threats.units.length) {
    threats = _LookEverywhere(threats);
  }

  threats = _RollOverUnitThreats(data_hub, threats);
  threats = _QueryBuildingThreats(data_hub, threats);

  scope.ranger_bot.team_caches[data_hub.team_cache_key].threats = threats;
  scope.ranger_bot.team_caches[data_hub.team_cache_key].threats_last_updated_at = scope.getCurrentGameTimeInSec();
  return threats;
}

function _SeedThreats(data_hub: DataHub): void {
  const new_threats: TeamThreatsCache = {
    'buildings': [],
    'units': [],
  };

  for (let i=0; i<data_hub.teams.enemies.length; i++) {
    const enemy_id: number = data_hub.teams.enemies[i];

    const enemy_start: MapLocation = data_hub.teams.players[enemy_id].start_location;

    new_threats.units.push({
      'owner_id': enemy_id,
      'utid': 'seed-' + String(enemy_id),
      'name': 'Start',
      'type': 'castle',
      'location': enemy_start,
      'hp': 1,
      'armor': 0,
      'dps': 1,
      'range': 0,
      'is_air': false,
      'cleared': false,
    });
  }

  scope.ranger_bot.team_caches[data_hub.team_cache_key].threats = new_threats;
}

function _ScoutGoldMines(data_hub: DataHub, threats: TeamThreatsCache): TeamThreatsCache {
  const dx = (CASTLE_WIDTH - 1) / 2;
  const dy = (CASTLE_HEIGHT - 1) / 2;

  for (let i=0; i<data_hub.gold_mines.length; i++) {
    const gold_mine: CachedGoldMine = data_hub.gold_mines[i];

    if (0 >= gold_mine.gold || gold_mine.castle || gold_mine.tower) {
      continue;
    }
    if (undefined === gold_mine.last_scouted_at) {
      gold_mine.last_scouted_at = scope.getCurrentGameTimeInSec();
      continue;
    }
    const time_since_scouted = scope.getCurrentGameTimeInSec() - gold_mine.last_scouted_at;
    if (time_since_scouted < MINE_SCOUT_INTERVAL) {
      continue;
    }
    if (undefined === gold_mine.scouting_threats) {
      gold_mine.scouting_threats = [];
    }
    gold_mine.scouting_threats = gold_mine.scouting_threats.filter((t) => !t.cleared);
    if (0 < gold_mine.scouting_threats.length) {
      continue;
    }

    // Why not use gold_mine.viable_castle_locations instead?
    // Our opponent might have chosen a poor placement for their castle.
    for (const [raw_x, y_list] of Object.entries(gold_mine.perimeter)) {
      const x = Number(raw_x);
      if (isNaN(x)) {
        continue;
      }

      for (const raw_y in y_list) {
        const y = Number(raw_y);
        if (isNaN(y)) {
          continue;
        }

        const new_threat: RangerBotThreat = {
          'owner_id': -1,
          'utid': 'scout_mine-' + String(gold_mine.id) + '-' + String(x + dx) + '-' + String(y + dy),
          'name': 'Scout Mine',
          'type': 'worker',
          'location': {'x': x + dx, 'y': y + dy},
          'hp': 0,
          'armor': 0,
          'dps': 0,
          'range': 0,
          'is_air': false,
          'cleared': false,
        };
        gold_mine.scouting_threats.push(new_threat);
        // Add these into the old stack so they'll be immediately cleared if they're within vision
        threats.units.push(new_threat);
      }
    }

    gold_mine.last_scouted_at = scope.getCurrentGameTimeInSec();
  }

  return threats;
}

function _LookEverywhere(threats: TeamThreatsCache): TeamThreatsCache {
  const map_width = scope.getMapWidth();
  const map_height = scope.getMapHeight();

  for (let x=0; x<=map_width; x++) {
    for (let y=0; y<=map_height; y++) {
      if (!scope.positionIsPathable(x, y)) {
        continue;
      }
      if (scope.fieldIsRamp(x, y)) {
        continue;
      }

      // Add these into the old stack so they'll be immediately cleared if they're within vision
      threats.units.push({
        'owner_id': -1,
        'utid': 'hide_and_seek-' + String(x) + '-' + String(y),
        'name': 'Hide and Seek',
        'type': 'worker',
        'location': {'x': x, 'y': y},
        'hp': 0,
        'armor': 0,
        'dps': 0,
        'range': 0,
        'is_air': false,
        'cleared': false,
      });
    }
  }

  return threats;
}

function _RollOverUnitThreats(data_hub: DataHub, threats: TeamThreatsCache): TeamThreatsCache {
  const all_units = scope.getUnits().map((v) => v.unit);
  const new_unit_threats = [];
  const new_unit_ids: {[unit_id: string]: boolean} = {};
  for (let i=0; i<all_units.length; i++) {
    const unit: LwgUnit = all_units[i];

    // console.log('unit.owner.number: ' + unit.owner.number);

    if (unit.owner.number == scope.getMyPlayerNumber()) {
      continue;
    }
    if (unit.owner.number != 0 && data_hub.teams.players[unit.owner.number].is_ally) {
      continue;
    }
    if (unit.owner.number == 0) {
      // TODO: remove this after implementing manual unit targeting
      continue;
    }
    
    new_unit_threats.push({
      'owner_id': unit.owner.number,
      'utid': String(unit.id),
      'name': unit.type.name,
      'type': unit.type.id_string,
      'location': unit.pos,
      'hp': unit.hp,
      'armor': CalculateArmor(unit),
      'dps': CalculateDps(unit),
      'range': CalculateRange(unit),
      'is_air': !!unit.type.flying,
      'cleared': false,
    });

    new_unit_ids[String(unit.id)] = true;
  }

  // Enemy buildings, once spotted, will still be returned by scope.getBuildings,
  // even after we've lost vision. So we only want to roll over threats.units
  // from the previous tick.

  for (let i=0; i<threats.units.length; i++) {
    const old_threat: RangerBotThreat = threats.units[i];

    if (new_unit_ids[old_threat.utid]) {
      old_threat.cleared = true;
      continue;
    }
    if (data_hub.LocationIsVisible(old_threat.location)) {
      old_threat.cleared = true;
      continue;
    }

    old_threat.hp = old_threat.hp *= THREAT_DECAY;
    old_threat.dps = old_threat.dps *= THREAT_DECAY;

    new_unit_threats.push(old_threat);
  }

  threats['units'] = new_unit_threats;
  return threats;
}

function _QueryBuildingThreats(data_hub: DataHub, threats: TeamThreatsCache): TeamThreatsCache {
  const all_buildings: LwgBuilding[] = scope.getBuildings().map((b) => b.unit);
  const new_building_threats: RangerBotThreat[] = [];

  for (let i=0; i<all_buildings.length; i++) {
    const building: LwgBuilding = all_buildings[i];

    // console.log('building.owner.number: ' + building.owner.number);

    if (building.owner.number == scope.getMyPlayerNumber()) {
      continue;
    }
    if (building.owner.number == 0) {
      continue; // would be cheating, see UpdateNeutralBuildings
    }
    if (data_hub.teams.players[building.owner.number].is_ally) {
      continue;
    }

    const width = GetNumberFieldValue({ piece_name: building.type.id_string, field_name: 'sizeX' });
    const height = GetNumberFieldValue({ piece_name: building.type.id_string, field_name: 'sizeY' });
    const dx = (width - 1) / 2;
    const dy = (height - 1) / 2;

    const dps: number = (() => {
      if (building.isUnderConstruction) {
        return 0;
      } else {
        return CalculateDps(building);
      }
    })();

    new_building_threats.push({
      'owner_id': building.owner.number,
      'utid': String(building.id),
      'name': building.type.name,
      'type': building.type.id_string,
      'location': {
        'x': building.x + dx,
        'y': building.y + dy,
      },
      'hp': building.hp,
      'armor': CalculateArmor(building),
      'dps': dps,
      'range': CalculateRange(building),
      'is_air': false,
      'cleared': false,
    });
  }

  // for (let i=0; i<data_hub.neutral_buildings.length; i++) {
  //   const neutral_building: CachedNeutralBuilding = data_hub.neutral_buildings[i];

  //   new_building_threats.push({
  //     'owner_id': 0,
  //     'utid': String(neutral_building.id),
  //     'name': neutral_building.name,
  //     'type': neutral_building.type,
  //     'location': neutral_building.center,
  //     'hp': neutral_building.hp,
  //     'armor': neutral_building.armor,
  //     'dps': 0,
  //     'range': 0,
  //     'is_air': false,
  //     'cleared': false,
  //   });
  // }

  threats['buildings'] = new_building_threats;
  return threats;
}

export { UpdateThreats };
