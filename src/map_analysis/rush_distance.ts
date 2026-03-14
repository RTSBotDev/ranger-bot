import { SafeGroundDistance } from '../ground_distance';

interface RushDistanceKwargs {
  teams: RangerBotTeams;
}

function RushDistance({ teams }: RushDistanceKwargs): number {
  const enemy_start_distances: number[] = teams.enemies.map((enemy_id: number) => {
    const enemy_start: MapLocation = teams.players[enemy_id].start_location;
    const ground_distance: number = SafeGroundDistance(teams.my.start, enemy_start);
    if (isNaN(ground_distance)) {
      console.log('\nERROR: missing SafeGroundDistance for RushDistance');
      return Math.sqrt((teams.my.start.x - enemy_start.x)**2 + (teams.my.start.y - enemy_start.y)**2);
    } else {
      return ground_distance;
    }
  });

  return Math.min(...enemy_start_distances);
}

export { RushDistance };
