interface LwgPieceType {
  id_string: string;
  name: string;
  hp: number;
  armor: number;
  vision: number;
  maxUnitsToRepair: number;
  supplyProvided: number | undefined;
  flying?: boolean;
  canAttackFlying?: boolean;
  range: number;
}

interface BuildQueue {
  name: string;
  id_string: string;
  supply: number;
  buildTime: number;
  cost: number;
  isUpgrade: boolean;
}

interface LwgOrder {
  name: string;
  unitType?: LwgPieceType;
}

interface LwgPiece {
  id: number;
  type: LwgPieceType;
  hp: number;
  order: LwgOrder;
  owner: LwgPlayer;
  targetUnit?: LwgPiece;
  isAlive?: boolean;
  target?: any;
}

interface LwgBuilding extends LwgPiece {
  x: number;
  y: number;
  isUnderConstruction: boolean;
  ranger_bot: RangerBotBuildingCache;
  buildTicksLeft: number;
  queue: BuildQueue[];
}

interface LwgGoldMine extends LwgPiece {
  x: number;
  y: number;
  gold: number;
  ranger_bot?: RangerBotGoldMine;
}

interface LwgUnit extends LwgPiece {
  pos: MapLocation;
  ranger_bot: RangerBotUnitCache;
  carriedGoldAmount: number | undefined;
}

interface LwgBuildingWrapper {
  unit: LwgBuilding;
}

interface LwgUnitWrapper {
  unit: LwgUnit;
}

interface LwgPiecesQuery {
  player?: number;
  type?: string;
}

interface LwgPlayerUpgrades {
  upgattack?: number;
  upgarmor?: number;
  upgrange?: number;
}

interface LwgPlayerBuildingCounts {
  house?: number;
}

interface LwgPlayer {
  number: number;
  gold: number;
  supplyCap: number;
  upgrades: LwgPlayerUpgrades;
  buildings: LwgPlayerBuildingCounts;
}

interface LwgOrderIdiosyncrasy {
  unit: LwgUnitWrapper | LwgBuildingWrapper | { 'unit': LwgGoldMine };
}

interface LwgScope {
  ranger_bot: RangerBotCache;

  player: LwgPlayer;

  getCurrentGameTimeInSec(): number;
  chatMsg(msg: string): void;
  getMyPlayerNumber(): number;
  getMyTeamNumber(): number;
  getStartLocationForPlayerNumber(player_id: number): MapLocation;
  getArrayOfPlayerNumbers(): number[];
  getTeamNumber(player_id: number): number;
  getTypeFieldValue(piece_name: string, field_name: string): number | string;
  getBuildings(params?: LwgPiecesQuery): LwgBuildingWrapper[];
  getUnits(params?: LwgPiecesQuery): LwgUnitWrapper[];
  getHeightLevel(x: number, y: number): number;
  getMapWidth(): number;
  getMapHeight(): number;
  positionIsPathable(x: number, y: number): boolean;
  fieldIsRamp(x: number, y: number): boolean;
  getMaxSupply(): number;
  getCurrentSupply(): number;
  order(command: string, units: LwgUnitWrapper[] | LwgBuildingWrapper[], target?: LwgOrderIdiosyncrasy | MapLocation, shift?: boolean): void;
  getGold(): number;
}

var scope: LwgScope;
