import { GetGoldMines } from '../utils';
import { CASTLE_WIDTH, CASTLE_HEIGHT, TOWER_WIDTH, TOWER_HEIGHT, MINE_WIDTH, MINE_HEIGHT } from '../constants';
import { ConfigureStartLocation } from '../analyze_teams';

function PrintExpansionData(expansions: Expansion[]): void {
  // console.log(expansions);

  const map: string[][] = [];
  const map_width: number = scope.getMapWidth();
  const map_height: number = scope.getMapHeight();

  for (let x=0; x<=map_width; x++) {
    map[x] = [];
    for (let y=0; y<=map_height; y++) {
      map[x][y] = ' ';
    }
  }

  const raw_gold_mines: LwgGoldMine[] = GetGoldMines();
  for (let i=0; i<raw_gold_mines.length; i++) {
    const raw_mine: LwgGoldMine = raw_gold_mines[i];
    const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

    for (const [raw_x, y_list] of Object.entries(mine_cache.exclusion_zone as boolean[][])) {
      const x = Number(raw_x);
      if (isNaN(x) || x < 0 || x > map_width) {
        continue;
      }

      for (const raw_y in y_list) {
        const y = Number(raw_y);
        if (isNaN(y) || y < 0 || y > map_height) {
          continue;
        }

        map[x][y] = 'X';
      }
    }

    for (const [raw_x, y_list] of Object.entries(mine_cache.perimeter as boolean[][])) {
      const x = Number(raw_x);
      if (isNaN(x) || x < 0 || x > map_width) {
        continue;
      }

      for (const raw_y in y_list) {
        const y = Number(raw_y);
        if (isNaN(y) || y < 0 || y > map_height) {
          continue;
        }

        map[x][y] = 'P';
      }
    }
  }

  for (let i=0; i<expansions.length; i++) {
    const expansion: Expansion = expansions[i];
    const castle_placement: CastlePlacement = expansion.castle_placements[0];

    for (let j=0; j<castle_placement.mines_data.length; j++) {
      const mine_data: CastleMineData = castle_placement.mines_data[j];

      for (const [raw_x, y_list] of Object.entries(mine_data.worker_paths)) {
        const x = Number(raw_x);
        if (isNaN(x) || x < 0 || x > map_width) {
          continue;
        }

        for (const raw_y in y_list) {
          const y = Number(raw_y);
          if (isNaN(y) || y < 0 || y > map_height) {
            continue;
          }

          map[x][y] = 'W';
        }
      }
    }

    for (let dx=0; dx<CASTLE_WIDTH; dx++) {
      const cx = castle_placement.castle_location.x + dx;

      for (let dy=0; dy<CASTLE_HEIGHT; dy++) {
        const cy = castle_placement.castle_location.y + dy;

        map[cx][cy] = 'C';
      }
    }

    for (let dx=0; dx<TOWER_WIDTH; dx++) {
      const tx = castle_placement.tower_location.x + dx;

      for (let dy=0; dy<TOWER_HEIGHT; dy++) {
        const ty = castle_placement.tower_location.y + dy;

        map[tx][ty] = 'T';
      }
    }
  }

  for (let i=0; i<raw_gold_mines.length; i++) {
    const raw_mine: LwgGoldMine = raw_gold_mines[i];
    const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

    for (const [raw_x, y_list] of Object.entries(mine_cache.viable_castle_locations as number[][])) {
      const x = Number(raw_x);
      if (isNaN(x) || x < 0 || x > map_width) {
        continue;
      }

      for (const raw_y in y_list) {
        const y = Number(raw_y);
        if (isNaN(y) || y < 0 || y > map_height) {
          continue;
        }

        map[x][y] = 'V';
      }
    }
  }

  for (let i=0; i<expansions.length; i++) {
    const expansion: Expansion = expansions[i];
    
    for (let j=0; j<expansion.castle_placements.length; j++) {
      const castle_placement: CastlePlacement = expansion.castle_placements[j];

      map[castle_placement.castle_location.x][castle_placement.castle_location.y] = 'E';
    }
  }

  for (let x=0; x<=map_width; x++) {
    for (let y=0; y<=map_height; y++) {
      if (scope.fieldIsRamp(x, y)) {
        map[x][y] = 'R';
      } else if (!scope.positionIsPathable(x, y)) {
        map[x][y] = '#';
      }
    }
  }

  // Needs to go after positionIsPathable because start locations won't be pathable
  const players: number[] = scope.getArrayOfPlayerNumbers();
  for (let i=0; i<players.length; i++) {
    const player_id = players[i];
    const start_location = ConfigureStartLocation(player_id);

    for (let dx=0; dx<CASTLE_WIDTH; dx++) {
      const x = start_location.x + dx;

      for (let dy=0; dy<CASTLE_HEIGHT; dy++) {
        const y = start_location.y + dy;

        map[x][y] = String(player_id);
      }
    }
  }

  for (let i=0; i<raw_gold_mines.length; i++) {
    const raw_mine: LwgGoldMine = raw_gold_mines[i];

    for (let dx=0; dx<MINE_WIDTH; dx++) {
      const x = raw_mine.x + dx;

      for (let dy=0; dy<MINE_HEIGHT; dy++) {
        const y = raw_mine.y + dy;

        map[x][y] = '$';
      }
    }
  }

  let printable_map = '';
  for (const [raw_x, y_list] of Object.entries(map)) {
    const x = Number(raw_x);
    if (isNaN(x) || x < 0 || x > map_width) {
      continue;
    }

    printable_map += '\n';

    for (const [raw_y, char] of Object.entries(y_list)) {
      const y = Number(raw_y);
      if (isNaN(y) || y < 0 || y > map_height) {
        continue;
      }

      printable_map += char;
    }
  }
  console.log(printable_map);
}

export { PrintExpansionData };
