import { DataHub } from '../data_hub';
import { GetNumberFieldValue } from '../utils';

interface UpdatePieceCachesKwargs {
  data_hub: DataHub;
}

function UpdatePieceCaches({ data_hub }: UpdatePieceCachesKwargs): void {
  for (let i:number=0; i<data_hub.friendly_buildings.length; i++) {
    const friendly_building: LwgBuilding = data_hub.friendly_buildings[i];

    if (friendly_building.ranger_bot === undefined) {
      const friendly_building_width: number = GetNumberFieldValue({
        piece_name: friendly_building.type.id_string,
        field_name: 'sizeX',
      });
      const friendly_building_height: number = GetNumberFieldValue({
        piece_name: friendly_building.type.id_string,
        field_name: 'sizeY',
      });
      const dx: number = (friendly_building_width - 1) / 2;
      const dy = (friendly_building_height - 1) / 2;
      const center: MapLocation = {
        'x': friendly_building.x + dx,
        'y': friendly_building.y + dy,
      };

      const new_building_cache: RangerBotBuildingCache = {
        'center': center,
      };
      friendly_building.ranger_bot = new_building_cache;
    }

    if (friendly_building.ranger_bot.mining_data) {
      _AssociateMiningData(friendly_building, data_hub.gold_mines);
    }
  }
  
  for (let i:number=0; i<data_hub.friendly_units.length; i++) {
    const friendly_unit: LwgUnit = data_hub.friendly_units[i];
    if (friendly_unit.ranger_bot === undefined) {
      const new_unit_cache: RangerBotUnitCache = {};
      friendly_unit.ranger_bot = new_unit_cache;
    }
  }

  for (let i=0; i<data_hub.map.expansions.length; i++) {
    const expansion: PlayerExpansion = data_hub.map.expansions[i];

    for (let j=0; j<expansion.castle_placements.length; j++) {
      const placement: PlayerCastlePlacement = expansion.castle_placements[j];

      for (let k=0; k<placement.mines_data.length; k++) {
        const active_mine: ActiveMineData = placement.mines_data[k];

        if (!active_mine.gold_mine) {
          const new_mine: CachedGoldMine | undefined = data_hub.gold_mines
            .find((mine) => mine.id == active_mine.gold_mine_id);
          if (!new_mine) {
            console.log(active_mine);
            console.log(data_hub.gold_mines);
            throw new Error('Missing gold mine for _UpdatePieceCaches');
          }
          active_mine.gold_mine = new_mine;
        }
      }
    }
  }
}

function _AssociateMiningData(friendly_castle: LwgBuilding, gold_mines: CachedGoldMine[]): void {
  const mining_data = friendly_castle.ranger_bot.mining_data as MiningData;

  for (let i=0; i<mining_data.mines_data.length; i++) {
    const active_mine: ActiveMineData = mining_data.mines_data[i];

    if (!active_mine.gold_mine) {
      const new_mine: CachedGoldMine | undefined = gold_mines
        .find((mine) => mine.id == active_mine.gold_mine_id);
      if (!new_mine) {
        console.log(active_mine);
        console.log(gold_mines);
        throw new Error('Missing gold mine for _AssociateMiningData');
      }
      active_mine.gold_mine = new_mine;

      if (!new_mine.castle) {
        new_mine.castle = friendly_castle;
      }
    }
  }
}

export { UpdatePieceCaches };
