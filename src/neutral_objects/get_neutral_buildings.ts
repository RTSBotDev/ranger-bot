import { GetNumberFieldValue } from '../utils';
import { CalculateArmor } from '../unit_stats';

interface GetNeutralBuildingsKwargs {
  team_cache_key: string;
  teams: RangerBotTeams;
}

function GetNeutralBuildings({ team_cache_key, teams }: GetNeutralBuildingsKwargs): CachedNeutralBuilding[] {
  // This is to avoid cheating, see UpdateNeutralBuildings
  if (scope.ranger_bot.team_caches === undefined) {
    throw new Error('DataHub#_GetNeutralBuildings called out of order'); // hush TS
  }

  if (scope.ranger_bot.team_caches[team_cache_key].neutral_buildings === undefined) {
    let new_neutral_buildings: CachedNeutralBuilding[] = [];

    const raw_neutral_buildings: LwgBuilding[] = scope.getBuildings({player: 0}).map((b: LwgBuildingWrapper) => b.unit);
    for (let i:number=0; i<raw_neutral_buildings.length; i++) {
      const neutral_building: LwgBuilding = raw_neutral_buildings[i];
      if (neutral_building.type.id_string == 'goldmine') {
        continue;
      }
      if (neutral_building.type.id_string == 'castle' &&
          neutral_building.x == teams.my.start.x &&
          neutral_building.y == teams.my.start.y) {
        continue; // Weird phantom neutral castle
      }

      const neutral_building_width: number = GetNumberFieldValue({
        piece_name: neutral_building.type.id_string,
        field_name: 'sizeX',
      });
      const center_offset_x: number = (neutral_building_width - 1) / 2;
      const neutral_building_height: number = GetNumberFieldValue({
        piece_name: neutral_building.type.id_string,
        field_name: 'sizeY',
      });
      const center_offset_y: number = (neutral_building_height - 1) / 2;
      const center: MapLocation = {
        'x': neutral_building.x + center_offset_x,
        'y': neutral_building.y + center_offset_y,
      };
      const new_neutral_building: CachedNeutralBuilding = {
        'id': neutral_building.id,
        'x': neutral_building.x,
        'y': neutral_building.y,
        'type': neutral_building.type.id_string,
        'name': neutral_building.type.name,
        'hp': neutral_building.hp,
        'armor': CalculateArmor(neutral_building),
        'center': center,
      };
      new_neutral_buildings.push(new_neutral_building);
    }

    scope.ranger_bot.team_caches[team_cache_key].neutral_buildings = new_neutral_buildings;
  }

  return scope.ranger_bot.team_caches[team_cache_key].neutral_buildings as CachedNeutralBuilding[];
}

export { GetNeutralBuildings };
