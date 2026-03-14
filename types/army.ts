interface TeamThreatsCache {
  buildings: RangerBotThreat[];
  units: RangerBotThreat[];
}

interface RangerBotThreat {
  owner_id: number;
  utid: string; // Unique Threat ID
  name: string;
  type: string;
  location: MapLocation;
  hp: number;
  armor: number;
  dps: number;
  range: number;
  is_air: boolean;
  cleared: boolean;
}

interface RangerBotTarget {
  location: MapLocation;
  r: number;
  threats: RangerBotThreat[];
  units: LwgUnit[];
  is_air: boolean;
  ground_distance?: number;
  active_castle?: LwgBuilding;
  base_priority?: number;
  priority?: number;
  air_distance?: number;
  dps?: number;
  hp?: number;
  strength?: number;
  attacking?: boolean;
}

interface RangerBotSquad {
  location: MapLocation;
  r: number;
  units: LwgUnit[];
  is_air: boolean;
  command?: string;
  attack_at?: MapLocation;
  dps?: number;
  hp?: number;
  strength?: number;
  attacking?: boolean;
  attack_strength?: number;
  retreat_strength?: number;
  attack_ratio?: number;
  retreat_ratio?: number;
  retreat_at?: MapLocation;
}

interface RangerBotBattle {
  squads: RangerBotSquad[];
  targets: RangerBotTarget[];
  command?: string;
  attack_strength?: number;
  retreat_strength?: number;
  attack_ratio?: number;
  retreat_ratio?: number;
  friendly_strength?: number;
  attacking?: boolean;
}

interface RangerBotBusyUnits {
  [unit_id: number]: boolean;
}
