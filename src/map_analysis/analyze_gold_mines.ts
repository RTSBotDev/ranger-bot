import { MapExclusionZone } from './map_exclusion_zone';
import { MapGoldMinePerimeter } from './map_gold_mine_perimeter';
import { CalculateViableCastleLocations } from './calculate_viable_castle_locations';
import { SelectCastleLocations } from './select_castle_locations';
import { GetGoldMines } from '../utils';
import { MINE_WIDTH, MINE_HEIGHT } from '../constants';

function AnalyzeGoldMines(teams: RangerBotTeams): Expansion[] {
  if (scope.ranger_bot.expansions === undefined) {
    const raw_gold_mines: LwgGoldMine[] = GetGoldMines();

    const center_offset_x: number = (MINE_WIDTH - 1) / 2;
    const center_offset_y: number = (MINE_HEIGHT - 1) / 2;
    for (let i:number=0; i<raw_gold_mines.length; i++) {
      const raw_mine: LwgGoldMine = raw_gold_mines[i];

      if (raw_mine.ranger_bot === undefined) {
        const center: MapLocation = {
          'x': raw_mine.x + center_offset_x,
          'y': raw_mine.y + center_offset_y,
        };

        raw_mine.ranger_bot = {'center': center};
      }
    }

    for (let i:number=0; i<raw_gold_mines.length; i++) {
      const raw_mine: LwgGoldMine = raw_gold_mines[i];
      const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

      if (mine_cache.exclusion_zone === undefined) {
        mine_cache.exclusion_zone = MapExclusionZone({ raw_mine: raw_mine });
      }
    }

    for (let i:number=0; i<raw_gold_mines.length; i++) {
      const raw_mine: LwgGoldMine = raw_gold_mines[i];
      const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

      if (mine_cache.perimeter === undefined) {
        mine_cache.perimeter = MapGoldMinePerimeter({
          raw_mine: raw_mine,
          raw_gold_mines: raw_gold_mines,
          teams: teams,
        });
      }
    }

    for (let i:number=0; i<raw_gold_mines.length; i++) {
      const raw_mine: LwgGoldMine = raw_gold_mines[i];
      const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

      if (mine_cache.viable_castle_locations === undefined) {
        mine_cache.viable_castle_locations = CalculateViableCastleLocations({
          raw_mine: raw_mine,
          raw_gold_mines: raw_gold_mines,
          teams: teams,
        });
      }
    }

    const new_expansions: Expansion[] = SelectCastleLocations({
      raw_gold_mines: raw_gold_mines,
      teams: teams,
    });
    scope.ranger_bot.expansions = new_expansions;
  }

  return scope.ranger_bot.expansions;
}

export { AnalyzeGoldMines };
