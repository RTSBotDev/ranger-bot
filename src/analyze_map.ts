import { PathableLocations } from './map_analysis/pathable_locations';
import { RushDistance } from './map_analysis/rush_distance';
import { AnalyzeGoldMines } from './map_analysis/analyze_gold_mines'
import { IdentifyStartingCastle, IdentifyStartingExpansion } from './map_analysis/identify_start'
import { ScoreExpansions } from './map_analysis/score_expansions'
import { CASTLE_WIDTH, CASTLE_HEIGHT } from './constants';

interface AnalyzeMapKwargs {
  player_cache_key: string;
  teams: RangerBotTeams;
}

function AnalyzeMap({ player_cache_key, teams }: AnalyzeMapKwargs): PlayerMapData {
  if (scope.ranger_bot.player_caches === undefined) {
    throw new Error('AnalyzeMap called out of order'); // hush TS
  }

  // It's okay for pathable_locations to be on the global cache
  // because positionIsPathable doesn't respect player vision anyway.
  if (scope.ranger_bot.pathable_locations === undefined) {
    scope.ranger_bot.pathable_locations = PathableLocations();
  }

  if (scope.ranger_bot.player_caches[player_cache_key].rush_distance === undefined) {
    scope.ranger_bot.player_caches[player_cache_key].rush_distance = RushDistance({ teams: teams });
  }

  if (scope.ranger_bot.player_caches[player_cache_key].expansions === undefined) {
    const expansions = AnalyzeGoldMines(teams);
    const starting_castle: LwgBuilding = IdentifyStartingCastle({ teams: teams });
    const starting_expansion: Expansion = IdentifyStartingExpansion({
      expansions: expansions,
      starting_castle: starting_castle,
    });

    _PopulateStartingCastleCache(starting_castle, starting_expansion);

    const player_expansions: PlayerExpansion[] = ScoreExpansions({
      expansions: structuredClone(expansions),
      starting_expansion: structuredClone(starting_expansion),
      teams: teams,
    });

    scope.ranger_bot.player_caches[player_cache_key].expansions = player_expansions;
  }

  const map_data: PlayerMapData = {
    'pathable_locations': scope.ranger_bot.pathable_locations,
    'rush_distance': scope.ranger_bot.player_caches[player_cache_key].rush_distance,
    'expansions': scope.ranger_bot.player_caches[player_cache_key].expansions,
  };
  return map_data;
}

function _PopulateStartingCastleCache(starting_castle: LwgBuilding, starting_expansion: Expansion): void {
  if (!starting_castle.ranger_bot) {
    const dx: number = (CASTLE_WIDTH - 1) / 2;
    const dy = (CASTLE_HEIGHT - 1) / 2;
    const center: MapLocation = {
      'x': starting_castle.x + dx,
      'y': starting_castle.y + dy,
    };

    const new_building_cache: RangerBotBuildingCache = {
      'center': center,
    };
    starting_castle.ranger_bot = new_building_cache;
  }

  if (!starting_castle.ranger_bot.mining_data) {
    const placement: CastlePlacement | undefined = starting_expansion.castle_placements.find((pl) => {
      return starting_castle.x == pl.castle_location.x && starting_castle.y == pl.castle_location.y;
    });
    if (placement === undefined) {
      console.log(starting_castle);
      console.log(starting_expansion);
      throw new Error('Misplaced starting castle');
    }

    const active_mines_data: ActiveMineData[] = placement.mines_data.map((md) => {
      return {
        'gold_mine_id': md.gold_mine_id,
        'midpoint': md.midpoint,
        'worker_paths': md.worker_paths,
        'workers': [],
      };
    });
    starting_castle.ranger_bot.mining_data = {
      'mines_data': active_mines_data,
      'tower_location': placement.tower_location,
    };
  }
}

export { AnalyzeMap };
