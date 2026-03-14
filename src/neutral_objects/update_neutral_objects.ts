import { DataHub } from '../data_hub';
import { GetGoldMines } from '../utils';

interface UpdateNeutralObjectsKwargs {
  data_hub: DataHub;
}

function UpdateNeutralObjects({ data_hub }: UpdateNeutralObjectsKwargs): void {
  // getBuildings is idiosyncratic in terms of what it will show you.
  // getUnits will only return what you or your allies can see.
  // getBuildings will also return all neutral buildings on the map, including gold mines.
  // That is good and makes sense, but the problem is the hp and gold values are always updated.
  // So for example you can know how much gold an enemy has left in their main without scouting.
  const raw_gold_mines: LwgGoldMine[] = GetGoldMines();
  let raw_neutral_buildings: LwgBuilding[] = scope.getBuildings({player: 0}).map((b: LwgBuildingWrapper) => b.unit);
  raw_neutral_buildings = raw_neutral_buildings.filter((b: LwgBuilding) => b.type.id_string != 'goldmine');

  for (let i:number=0; i<data_hub.gold_mines.length; i++) {
    const gold_mine: CachedGoldMine = data_hub.gold_mines[i];

    if (!data_hub.LocationIsVisible(gold_mine.center)) {
      continue;
    }

    for (let j:number=0; j<raw_gold_mines.length; j++) {
      const raw_mine: LwgGoldMine = raw_gold_mines[j];

      if (raw_mine.x != gold_mine.x || raw_mine.y != gold_mine.y) {
        continue;
      }

      gold_mine.gold = raw_mine.gold;
      break;
    }
  }

  for (let i:number=0; i<data_hub.neutral_buildings.length; i++) {
    const neutral_building: CachedNeutralBuilding = data_hub.neutral_buildings[i];

    if (!data_hub.LocationIsVisible(neutral_building.center)) {
      continue;
    }

    for (let j:number=0; j<raw_neutral_buildings.length; j++) {
      const raw_neutral_building: LwgBuilding = raw_neutral_buildings[j];

      if (raw_neutral_building.x != neutral_building.x || raw_neutral_building.y != neutral_building.y) {
        continue;
      }

      neutral_building.hp = raw_neutral_building.hp;
      break;
    }
  }
  data_hub.neutral_buildings = data_hub.neutral_buildings.filter((b) => b.hp > 0);
}

export { UpdateNeutralObjects };
