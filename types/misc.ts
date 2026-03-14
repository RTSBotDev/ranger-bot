interface UnitWithDistances {
  unit: LwgUnit;
  air_distance: number;
  ground_distance?: number;
}

interface UnitSelection {
  order: string;
  cost: number;
  supply: number;
  build_time: number;
}
