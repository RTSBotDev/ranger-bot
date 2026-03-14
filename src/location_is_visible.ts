interface LocationIsVisibleKwargs {
  map_location: MapLocation;
  friendly_buildings: LwgBuilding[];
  friendly_units: LwgUnit[];
}

function LocationIsVisible({ map_location, friendly_buildings, friendly_units }: LocationIsVisibleKwargs): boolean {
  const z: number = scope.getHeightLevel(map_location.x, map_location.y);

  for (let i:number=0; i<friendly_buildings.length; i++) {
    const friendly_building: LwgBuilding = friendly_buildings[i];

    if (scope.getHeightLevel(friendly_building.x, friendly_building.y) < z) {
      continue;
    }

    // Hush TS ranger_bot's not undefined
    const building_data: RangerBotBuildingCache = friendly_building.ranger_bot as RangerBotBuildingCache;

    const distance: number = Math.sqrt((map_location.x - building_data.center.x)**2 + (map_location.y - building_data.center.y)**2);
    if (distance <= friendly_building.type.vision) {
      return true;
    }
  }

  for (let i:number=0; i<friendly_units.length; i++) {
    const friendly_unit: LwgUnit = friendly_units[i];

    if (scope.getHeightLevel(friendly_unit.pos.x, friendly_unit.pos.y) < z) {
      continue;
    }

    const distance = Math.sqrt((map_location.x - friendly_unit.pos.x)**2 + (map_location.y - friendly_unit.pos.y)**2);
    if (distance <= friendly_unit.type.vision) {
      return true;
    }
  }

  return false;
}

export { LocationIsVisible };
