import { GetNumberFieldValue, DrawRectangle } from './utils';

function SafeGroundDistance(p1: MapLocation, p2: MapLocation): number {
  // TODO
  if (p1.x == p2.x && p1.y == p2.y) {
    return 0;
  }

  return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
}

function GroundDistanceBetweenBuildings(building_1: LwgBuilding | LwgGoldMine, building_2: LwgBuilding | LwgGoldMine): number {
  const building_1_width: number = GetNumberFieldValue({
    piece_name: building_1.type.id_string,
    field_name: 'sizeX',
  });
  const building_1_height: number = GetNumberFieldValue({
    piece_name: building_1.type.id_string,
    field_name: 'sizeY',
  });
  const outside_corner_1: MapLocation = {'x': building_1.x - 1, 'y': building_1.y - 1};
  let perimeter_1: MapLocation[] = DrawRectangle({
    corner: outside_corner_1,
    width: building_1_width + 2,
    height: building_1_height + 2,
  });
  perimeter_1 = perimeter_1.filter((loc: MapLocation) => {
    return scope.positionIsPathable(loc.x, loc.y);
  });
  if (perimeter_1.length <= 0) {
    return NaN;
  }

  const building_2_width: number = GetNumberFieldValue({
    piece_name: building_2.type.id_string,
    field_name: 'sizeX',
  });
  const building_2_height: number = GetNumberFieldValue({
    piece_name: building_2.type.id_string,
    field_name: 'sizeY',
  });
  const outside_corner_2: MapLocation = {'x': building_2.x - 1, 'y': building_2.y - 1};
  let perimeter_2: MapLocation[] = DrawRectangle({
    corner: outside_corner_2,
    width: building_2_width + 2,
    height: building_2_height + 2,
  });
  perimeter_2 = perimeter_2.filter((loc: MapLocation) => {
    return scope.positionIsPathable(loc.x, loc.y);
  });
  if (perimeter_2.length <= 0) {
    return NaN;
  }

  let pairs: { loc_1: MapLocation, loc_2: MapLocation, air_distance: number }[] = [];
  for (let i=0; i<perimeter_1.length; i++) {
    const loc_1: MapLocation = perimeter_1[i];

    for (let j=0; j<perimeter_2.length; j++) {
      const loc_2: MapLocation = perimeter_2[j];

      const air_distance: number = Math.sqrt((loc_1.x - loc_2.x)**2 + (loc_1.y - loc_2.y)**2);
      pairs.push({
        'loc_1': loc_1,
        'loc_2': loc_2,
        'air_distance': air_distance,
      });
    }
  }

  let output: number = NaN;
  for (let i=0; i<pairs.length; i++) {
    const pair = pairs[i];

    if (isNaN(output)) {
      const ground_distance: number = SafeGroundDistance(pair.loc_1, pair.loc_2);
      if (!isNaN(ground_distance)) {
        output = ground_distance;
      }
    } else if (pair.air_distance < output) {
      const ground_distance: number = SafeGroundDistance(pair.loc_1, pair.loc_2);
      if (!isNaN(ground_distance) && ground_distance < output) {
        output = ground_distance;
      }
    }
  }

  return output;
}

interface GetClosestActiveCastleToLocationKwargs {
  map_location: MapLocation,
  active_castles: LwgBuilding[],
  with_workers: boolean,
}

function GetShortestGroundDistanceToActiveCastle({ map_location, active_castles, with_workers }: GetClosestActiveCastleToLocationKwargs): number {
  const ac_data: ClosestActiveCastleData = GetClosestActiveCastleToLocationData({
    map_location: map_location,
    active_castles: active_castles,
    with_workers: with_workers,
  });

  return ac_data.ground_distance;
}

function GetClosestActiveCastleToLocation({ map_location, active_castles, with_workers }: GetClosestActiveCastleToLocationKwargs): LwgBuilding | undefined {
  const ac_data: ClosestActiveCastleData = GetClosestActiveCastleToLocationData({
    map_location: map_location,
    active_castles: active_castles,
    with_workers: with_workers,
  });

  return ac_data.active_castle;
}

interface ClosestActiveCastleData {
  active_castle: LwgBuilding | undefined;
  ground_distance: number;
}

function GetClosestActiveCastleToLocationData({ map_location, active_castles, with_workers }: GetClosestActiveCastleToLocationKwargs): ClosestActiveCastleData {
  // TODO: rework this to use the ObjectWithLocation pattern
  const useful_castles: LwgBuilding[] = (() => {
    if (with_workers) {
      return active_castles.filter((ac) => {
        const mines_data = (ac.ranger_bot.mining_data as MiningData).mines_data as ActiveMineData[];
        return mines_data.some((md) => md.workers.length > 0);
      });
    } else {
      return active_castles;
    }
  })();

  if (useful_castles.length <= 0) {
    return { 'active_castle': undefined, 'ground_distance': NaN};
  }
  const with_air_distances = useful_castles.map((ac) => {
    const mines_data = (ac.ranger_bot.mining_data as MiningData).mines_data as ActiveMineData[];
    const air_distances: number[] = [];
    const locations = mines_data.map((md) => {
      const air_distance = Math.sqrt((md.midpoint.x - map_location.x)**2 + (md.midpoint.y - map_location.y)**2);
      air_distances.push(air_distance);
      return {
        'midpoint': md.midpoint,
        'air_distance': air_distance,
      };
    });
    return {
      'active_castle': ac,
      'locations': locations.sort((a, b) => a.air_distance - b.air_distance),
      'min_air_distance': Math.min(...air_distances),
    };
  }).sort((a, b) => a.min_air_distance - b.min_air_distance);

  let shortest_distance: number = NaN;
  let closest_active_castle: LwgBuilding | undefined;
  for (let i=0; i<with_air_distances.length; i++) {
    const data = with_air_distances[i];

    if (!isNaN(shortest_distance) && data.min_air_distance >= shortest_distance) {
      continue;
    }

    for (let j=0; j<data.locations.length; j++) {
      const location = data.locations[j];

      if (isNaN(shortest_distance)) {
        const ground_distance = SafeGroundDistance(map_location, location.midpoint);
        if (isNaN(ground_distance)) {
          continue;
        }
        shortest_distance = ground_distance;
        closest_active_castle = data.active_castle;
      } else if (location.air_distance < shortest_distance) {
        const ground_distance = SafeGroundDistance(map_location, location.midpoint);
        if (isNaN(ground_distance) || ground_distance >= shortest_distance) {
          continue;
        }
        shortest_distance = ground_distance;
        closest_active_castle = data.active_castle;
      }
    }
  }

  return {'active_castle': closest_active_castle, 'ground_distance': shortest_distance};
}

function GetClosestUnitToLocation(map_location: MapLocation, units: LwgUnit[]): LwgUnit | undefined {
  if (units.length <= 0) {
    return undefined;
  }

  const stuff: ObjectWithLocation[] = units.map((unit) => {
    return {
      'original': unit,
      'location': unit.pos,
    };
  });

  const response = _GetClosestToLocation(map_location, stuff);
  if (response) {
    return response.original;
  } else {
    return undefined;
  }
}

function GetClosestActiveMineToLocation(map_location: MapLocation, active_mines: ActiveMineData[]): ActiveMineData | undefined {
  if (active_mines.length <= 0) {
    return undefined;
  }

  const stuff: ObjectWithLocation[] = active_mines.map((active_mine) => {
    return {
      'original': active_mine,
      'location': active_mine.midpoint,
    };
  });

  const response = _GetClosestToLocation(map_location, stuff);
  if (response) {
    return response.original;
  } else {
    return undefined;
  }
}

function GetClosestUnitToBuilding(building: LwgBuilding, units: LwgUnit[]): LwgUnit | undefined {
  if (units.length <= 0) {
    return undefined;
  }

  const stuff: ObjectWithLocation[] = units.map((unit) => {
    return {
      'original': unit,
      'location': unit.pos,
    };
  });

  const response = _GetClosestToBuilding(building, stuff);
  if (response) {
    return response.original;
  } else {
    return undefined;
  }
}

function GetClosestActiveMineToBuilding(building: LwgBuilding, active_mines: ActiveMineData[]): ActiveMineData | undefined {
  if (active_mines.length <= 0) {
    return undefined;
  }

  const stuff: ObjectWithLocation[] = active_mines.map((active_mine) => {
    return {
      'original': active_mine,
      'location': active_mine.midpoint,
    };
  });

  const response = _GetClosestToBuilding(building, stuff);
  if (response) {
    return response.original;
  } else {
    return undefined;
  }
}

interface ObjectWithLocation {
  original: any;
  location: MapLocation;
}

function _GetClosestToBuilding(building: LwgBuilding, stuff: ObjectWithLocation[]): ObjectWithLocation | undefined {
  const building_width: number = GetNumberFieldValue({
    piece_name: building.type.id_string,
    field_name: 'sizeX',
  });
  const building_height: number = GetNumberFieldValue({
    piece_name: building.type.id_string,
    field_name: 'sizeY',
  });
  const outside_corner: MapLocation = {'x': building.x - 1, 'y': building.y - 1};
  const perimeter: MapLocation[] = DrawRectangle({
    corner: outside_corner,
    width: building_width + 2,
    height: building_height + 2,
  }).filter((loc: MapLocation) => {
    return scope.positionIsPathable(loc.x, loc.y);
  });
  if (perimeter.length <= 0) {
    return undefined;
  }

  let pairs: { per_loc: MapLocation, thing: ObjectWithLocation, air_distance: number }[] = [];
  for (let i=0; i<perimeter.length; i++) {
    const perimeter_location: MapLocation = perimeter[i];

    for (let j=0; j<stuff.length; j++) {
      const thing: ObjectWithLocation = stuff[j];

      const air_distance = Math.sqrt((perimeter_location.x - thing.location.x)**2 +
                                     (perimeter_location.y - thing.location.y)**2);
      pairs.push({
        'per_loc': perimeter_location,
        'thing': thing,
        'air_distance': air_distance,
      });
    }
  }
  pairs = pairs.sort((a, b) => a.air_distance - b.air_distance);

  let output: ObjectWithLocation | undefined;
  let closest_distance: number = NaN;
  for (let i=0; i<pairs.length; i++) {
    const pair = pairs[i];

    if (isNaN(closest_distance)) {
      const ground_distance: number = SafeGroundDistance(pair.per_loc, pair.thing.location);
      if (isNaN(ground_distance)) {
        console.log('\nERROR: missing SafeGroundDistance for _GetClosestToBuilding 1');
        continue;
      }
      closest_distance = ground_distance;
      output = pair.thing;
    } else if (pair.air_distance < closest_distance) {
      const ground_distance: number = SafeGroundDistance(pair.per_loc, pair.thing.location);
      if (isNaN(ground_distance)) {
        console.log('\nERROR: missing SafeGroundDistance for _GetClosestToBuilding 2');
        continue;
      }
      if (ground_distance < closest_distance) {
        closest_distance = ground_distance;
        output = pair.thing;
      }
    }
  }

  if (!output) {
    console.log(building);
    console.log(stuff);
    console.log(pairs);
    throw new Error('No ground paths for _GetClosestToBuilding');
  }

  return output;
}

function _GetClosestToLocation(map_location: MapLocation, stuff: ObjectWithLocation[]): ObjectWithLocation | undefined {
  const with_air_distance = stuff.map((thing: ObjectWithLocation) => {
    const air_distance = Math.sqrt((map_location.x - thing.location.x)**2 +
                                   (map_location.y - thing.location.y)**2);

    return {
      'thing': thing,
      'air_distance': air_distance,
    };
  }).sort((a, b) => a.air_distance - b.air_distance);

  let output: ObjectWithLocation | undefined;
  let closest_distance: number = NaN;
  for (let i=0; i<with_air_distance.length; i++) {
    const data = with_air_distance[i];

    if (isNaN(closest_distance)) {
      const ground_distance: number = SafeGroundDistance(map_location, data.thing.location);
      if (isNaN(ground_distance)) {
        console.log('\nERROR: missing SafeGroundDistance for _GetClosestToLocation 1');
        continue;
      }
      closest_distance = ground_distance;
      output = data.thing;
    } else if (data.air_distance < closest_distance) {
      const ground_distance: number = SafeGroundDistance(map_location, data.thing.location);
      if (isNaN(ground_distance)) {
        console.log('\nERROR: missing SafeGroundDistance for _GetClosestToLocation 2');
        continue;
      }
      if (ground_distance < closest_distance) {
        closest_distance = ground_distance;
        output = data.thing;
      }
    }
  }

  if (!output) {
    console.log(map_location);
    console.log(stuff);
    console.log(with_air_distance);
    throw new Error('No ground paths for _GetClosestToLocation');
  }

  return output;
}

export { SafeGroundDistance, GroundDistanceBetweenBuildings,
  GetShortestGroundDistanceToActiveCastle, GetClosestActiveCastleToLocation,
  GetClosestActiveCastleToLocationData, GetClosestActiveMineToBuilding,
  GetClosestUnitToBuilding, GetClosestActiveMineToLocation,
  GetClosestUnitToLocation };
