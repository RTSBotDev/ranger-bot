interface MapLocation {
  x: number;
  y: number;
}

interface ConfiguredStartLocationsConfig {
  [map_name: string]: StartingLocations;
}

interface StartingLocations {
  [player_id: number]: MapLocation;
}
