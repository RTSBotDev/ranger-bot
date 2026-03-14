import { DataHub } from '../data_hub';

interface FilterViableGoldMinesKwargs {
  data_hub: DataHub;
}

function FilterViableGoldMines({ data_hub }: FilterViableGoldMinesKwargs): CachedGoldMine[] {
  const gold_mines = data_hub.gold_mines as CachedGoldMine[];
  
  return gold_mines.filter((gold_mine) => {
    if (gold_mine.gold <= 0 || gold_mine.castle) {
      return false;
    }

    // TODO: make sure gold_mine.castle gets populated, then remove this
    for (let i=0; i<data_hub.friendly_buildings.length; i++) {
      const friendly_castle: LwgBuilding = data_hub.friendly_buildings[i];
      if (friendly_castle.type.name != 'Castle' || !friendly_castle.ranger_bot.mining_data) {
        continue;
      }

      for (let j=0; j<friendly_castle.ranger_bot.mining_data.mines_data.length; j++) {
        const active_mine_data: ActiveMineData = friendly_castle.ranger_bot.mining_data.mines_data[j];

        if (active_mine_data.gold_mine_id == gold_mine.id) {
          return false;
        }
      }

      // TODO: extend this for non-RangerBot allies
    }

    return true;
  });
}

export { FilterViableGoldMines };
