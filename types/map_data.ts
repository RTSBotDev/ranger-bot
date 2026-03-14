interface CastleMineData {
  gold_mine_id: number;
  midpoint: MapLocation;
  worker_paths: boolean[][];
}

interface CastlePlacement {
  castle_location: MapLocation;
  mines_data: CastleMineData[];
  tower_location: MapLocation;
  score: number;
}

// a cluster of gold mines close enough to be mined from a single castle
interface Expansion {
  castle_placements: CastlePlacement[];
  id: number;
}
