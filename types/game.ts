// Ideally all objects would be accessed through the scope.
// But sometimes that's not possible.

interface LWGame {
  data: LWGameData;
  start_locations: MapLocation[]; // This is a guess
}

interface LWGameData {
  name?: string;
}

var game: LWGame;
