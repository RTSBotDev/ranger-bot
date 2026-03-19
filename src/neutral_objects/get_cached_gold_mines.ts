import { GetGoldMines } from '../utils';
import { DEBUG } from '../constants';

interface GetCachedGoldMinesKwargs {
  team_cache_key: string;
}

function GetCachedGoldMines({ team_cache_key }: GetCachedGoldMinesKwargs): CachedGoldMine[] {
  // This is to avoid cheating, see UpdateNeutralBuildings
  if (scope.ranger_bot.team_caches === undefined) {
    throw new Error('DataHub#_GetGoldMines called out of order'); // hush TS
  }

  if (scope.ranger_bot.team_caches[team_cache_key].gold_mines === undefined) {
    let new_gold_mines: CachedGoldMine[] = [];

    const raw_gold_mines: LwgGoldMine[] = GetGoldMines();
    for (let i:number=0; i<raw_gold_mines.length; i++) {
      const raw_mine: LwgGoldMine = raw_gold_mines[i];

      const raw_cache: RangerBotGoldMine | undefined = raw_mine.ranger_bot;
      if (raw_cache === undefined) {
        if (DEBUG) {
          console.log(raw_gold_mines);
        }
        throw new Error('no cache for gold mine ' + raw_mine.id);
      }

      const exclusion_zone: boolean[][] | undefined = raw_cache.exclusion_zone;
      if (exclusion_zone === undefined) {
        if (DEBUG) {
          console.log(raw_gold_mines);
        }
        throw new Error('no exclusion_zone for gold mine ' + raw_mine.id);
      }

      const perimeter: boolean[][] | undefined = raw_cache.perimeter;
      if (perimeter === undefined) {
        if (DEBUG) {
          console.log(raw_gold_mines);
        }
        throw new Error('no perimeter for gold mine ' + raw_mine.id);
      }

      const viable_castle_locations: number[][] | undefined = raw_cache.viable_castle_locations;
      if (viable_castle_locations === undefined) {
        if (DEBUG) {
          console.log(raw_gold_mines);
        }
        throw new Error('no viable_castle_locations for gold mine ' + raw_mine.id);
      }

      const expansion_data: ExpansionData[] | undefined = raw_cache.expansion_data;
      if (expansion_data === undefined) {
        if (DEBUG) {
          console.log(raw_gold_mines);
        }
        throw new Error('no expansion_data for gold mine ' + raw_mine.id);
      }

      const new_gold_mine: CachedGoldMine = {
        'x': raw_mine.x,
        'y': raw_mine.y,
        'id': raw_mine.id,
        'gold': raw_mine.gold,
        'center': raw_cache.center,
        'type': {'id_string': raw_mine.type.id_string},
        'exclusion_zone': exclusion_zone,
        'perimeter': perimeter,
        'viable_castle_locations': viable_castle_locations,
        'expansion_data': expansion_data,
      };
      new_gold_mines.push(new_gold_mine);
    }

    scope.ranger_bot.team_caches[team_cache_key].gold_mines = new_gold_mines;
  }

  return scope.ranger_bot.team_caches[team_cache_key].gold_mines as CachedGoldMine[];
}

export { GetCachedGoldMines };
