interface RangerBotTeamsMy {
  id: number,
  team_id: number,
  start: MapLocation,
}

interface PlayerData {
  team_id: number;
  is_ally: boolean;
  start_location: MapLocation;
}

interface PlayersLookup {
  [player_id: number]: PlayerData;
}

interface RangerBotTeams {
  my: RangerBotTeamsMy;
  players: PlayersLookup;
  allies: number[];
  enemies: number[];
}

interface PlayerCastlePlacement {
  castle_location: MapLocation;
  mines_data: ActiveMineData[];
  tower_location: MapLocation;
  score: number;
}

interface PlayerExpansion extends Expansion {
  castle_placements: PlayerCastlePlacement[];
  id: number;
  score: number;
}

interface PlayerMapData {
  pathable_locations: boolean[][];
  rush_distance: number;
  expansions: PlayerExpansion[];
}

interface RangerBotPlayerCache {
  teams?: RangerBotTeams;
  gold_mines?: CachedGoldMine[];
  neutral_buildings?: CachedNeutralBuilding[];
  rush_distance?: number;
  expansions?: PlayerExpansion[];
  active_mining_bases?: number;
  active_castle_ids?: number[];
  build_towers?: boolean;
  aggro_mode?: boolean;
}
