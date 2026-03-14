import { SafeGroundDistance } from '../ground_distance'

interface ScoreExpansionsKwargs {
  expansions: Expansion[];
  starting_expansion: Expansion;
  teams: RangerBotTeams;
}

function ScoreExpansions({ expansions, starting_expansion, teams }: ScoreExpansionsKwargs): PlayerExpansion[] {
  const start: MapLocation = starting_expansion.castle_placements[0].mines_data[0].midpoint;

  return expansions.map((expansion) => {
    const destination: MapLocation = expansion.castle_placements[0].mines_data[0].midpoint;
    let score: number = SafeGroundDistance(start, destination);
    if (isNaN(score)) {
      console.log(start);
      console.log(destination);
      console.log('ERROR: missing my ground distance for ScoreExpansions');
      score = Math.sqrt((start.x - destination.x)**2 + (start.y - destination.y)**2);
    }

    const enemy_start_distances: number[] = [];
    for (let i=0; i<teams.enemies.length; i++) {
      const enemy_id: number = teams.enemies[i];
      const enemy_start: MapLocation = teams.players[enemy_id].start_location;
      let ground_distance: number = SafeGroundDistance(enemy_start, destination);
      if (isNaN(ground_distance)) {
        console.log(enemy_start);
        console.log(destination);
        console.log('ERROR: missing enemy ground distance for ScoreExpansions');
        ground_distance = Math.sqrt((enemy_start.x - destination.x)**2 + (enemy_start.y - destination.y)**2);
      }

      enemy_start_distances.push(ground_distance);
    }
    score -= Math.min(...enemy_start_distances);

    const player_castle_placements: PlayerCastlePlacement[] = expansion.castle_placements.map((placement: CastlePlacement) => {
      const active_mines_data: ActiveMineData[] = placement.mines_data.map((md: CastleMineData) => {
        return {
          'gold_mine_id': md.gold_mine_id,
          'midpoint': structuredClone(md.midpoint),
          'worker_paths': structuredClone(md.worker_paths),
          'workers': [],
        };
      });

      return {
        'castle_location': structuredClone(placement.castle_location),
        'mines_data': active_mines_data,
        'tower_location': structuredClone(placement.tower_location),
        'score': placement.score,
      };
    });

    const new_player_expansion: PlayerExpansion = {
      'castle_placements': player_castle_placements,
      'id': expansion.id,
      'score': score,
    };
    return new_player_expansion;
  }).sort((a: PlayerExpansion, b: PlayerExpansion) => a.score - b.score);
}

export { ScoreExpansions };
