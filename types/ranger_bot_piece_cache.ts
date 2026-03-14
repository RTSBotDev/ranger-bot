interface ActiveMineData {
  gold_mine_id: number;
  midpoint: MapLocation;
  worker_paths: boolean[][];
  workers: LwgUnit[];
  gold_mine?: CachedGoldMine;
}

interface MiningData {
  mines_data: ActiveMineData[];
  tower_location: MapLocation;
  closest_time?: number;
  conscripted?: boolean;
}

interface RangerBotPieceCache {

}

interface RangerBotBuildingCache extends RangerBotPieceCache {
  center: MapLocation;
  mining_data?: MiningData;
  tower?: LwgBuilding;
  queue_finish_time?: number;
}

interface RangerBotUnitCache extends RangerBotPieceCache {
  job?: string;
  target_building?: LwgBuilding;
  castle?: LwgBuilding;
  order?: string;
  mine?: CachedGoldMine;
  active_mines?: ActiveMineData[];
  reserve?: number;
  building_type?: string;
  exclude_worker_paths?: boolean;
  cost?: number;
  target_location?: MapLocation;
  expansion?: PlayerExpansion;
  placement?: PlayerCastlePlacement;
  command_at?: MapLocation;
  command?: string;
  conscripted?: boolean;
  attacking?: boolean;
}
