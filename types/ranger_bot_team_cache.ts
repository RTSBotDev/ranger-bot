interface CachedType {
  id_string: string;
}

interface CachedGoldMine {
  x: number;
  y: number;
  id: number;
  gold: number;
  center: MapLocation;
  type: CachedType;
  exclusion_zone: boolean[][];
  perimeter: boolean[][];
  viable_castle_locations: number[][];
  expansion_data: ExpansionData[];
  castle?: LwgBuilding;
  tower?: LwgBuilding;
  last_scouted_at?: number;
  scouting_threats?: RangerBotThreat[];
}

interface CachedNeutralBuilding {
  id: number;
  x: number;
  y: number;
  type: string;
  name: string;
  hp: number;
  armor: number;
  center: MapLocation;
}

interface RangerBotTeamCache {
  gold_mines?: CachedGoldMine[];
  neutral_buildings?: CachedNeutralBuilding[];
  threats?: TeamThreatsCache;
  threats_last_updated_at?: number;
  targets?: RangerBotTarget[];
  targets_last_updated_at?: number;
}
