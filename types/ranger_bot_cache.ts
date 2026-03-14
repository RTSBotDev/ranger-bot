interface ExpansionData {
  castle_location: MapLocation;
  midpoint: MapLocation;
  worker_paths: boolean[][];
  tower_location: MapLocation;
}

interface RangerBotGoldMine {
  center: MapLocation;
  exclusion_zone?: boolean[][];
  perimeter?: boolean[][];
  viable_castle_locations?: number[][];
  expansion_data?: ExpansionData[];
  _worker_paths?: boolean[][];
  _castle_location?: MapLocation;
}

interface RangerBotTeamCaches {
  [team_cache_key: string]: RangerBotTeamCache;
}

interface RangerBotPlayerCaches {
  [player_cache_key: string]: RangerBotPlayerCache;
}

interface RangerBotCache {
  glhf?: boolean;
  team_caches: RangerBotTeamCaches;
  player_caches: RangerBotPlayerCaches;
  pathable_locations?: boolean[][];
  expansions?: Expansion[];
  map_printed: boolean;
}
