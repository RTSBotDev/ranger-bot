import { GetNumberFieldValue, DrawRectangle } from '../utils';
import { BUILDING_SPACE_BUFFER, CASTLE_WIDTH, CASTLE_HEIGHT } from '../constants';
import { AreBuildable } from '../map_analysis/buildable';
import { DataHub } from '../data_hub';

interface FindSpaceForBuildingKwargs {
  active_castle: LwgBuilding;
  building_type: string;
  data_hub: DataHub;
}

function FindSpaceForBuilding({ active_castle, building_type, data_hub }: FindSpaceForBuildingKwargs): MapLocation | undefined {
  const width = GetNumberFieldValue({ piece_name: building_type, field_name: 'sizeX' });
  const height = GetNumberFieldValue({ piece_name: building_type, field_name: 'sizeY' });

  const local_map: boolean[][] = _SeedLocalMap(active_castle, width, height);
  if (local_map.length <= 0) {
    return undefined;
  }
  const solutions: MapLocation[] = [];
  while (solutions.length <= 0) {
    let new_point = false;

    for (const [raw_x, local_data] of Object.entries(local_map)) {
      const x = Number(raw_x);
      if (isNaN(x)) {
        continue;
      }

      for (const [raw_y, unworked] of Object.entries(local_data)) {
        if (!unworked) {
          continue;
        }
        const y = Number(raw_y);
        if (isNaN(y)) {
          continue;
        }

        const adjacents = [{'x': x-1, 'y': y},
                           {'x': x+1, 'y': y},
                           {'x': x,   'y': y-1},
                           {'x': x,   'y': y+1}];
        for (let i=0; i<adjacents.length; i++) {
          const new_x = adjacents[i].x;
          const new_y = adjacents[i].y;

          if (!scope.positionIsPathable(new_x, new_y)) {
            continue;
          }

          if (local_map[new_x] === undefined) {
            local_map[new_x] = [];
            local_map[new_x][new_y] = true;
            new_point = true;
          } else if (local_map[new_x][new_y] === undefined) {
            local_map[new_x][new_y] = true;
            new_point = true;
          }
        }

        const are_buildable = AreBuildable({
          x_min: x - BUILDING_SPACE_BUFFER,
          x_max: x + width + BUILDING_SPACE_BUFFER - 1,
          y_min: y - BUILDING_SPACE_BUFFER,
          y_max: y + height + BUILDING_SPACE_BUFFER - 1, 
          exclude_worker_paths: true,
          data_hub: data_hub,
        });
        if (are_buildable) {
          solutions.push({'x': x, 'y': y});
        }

        local_map[x][y] = false;
      }
    }

    if (!new_point) {
      break;
    }
  }

  if (solutions.length <= 0) {
    return undefined;
  }

  const dx = (width - 1) / 2;
  const dy = (height - 1) / 2;
  const castle_center: MapLocation = active_castle.ranger_bot.center;
  const by_distance = solutions.map((solution: MapLocation) => {
    const center_x = solution.x + dx;
    const center_y = solution.y + dy;
    const distance = Math.sqrt((castle_center.x - center_x)**2 + (castle_center.y - center_y)**2);

    return {
      'x': solution.x,
      'y': solution.y,
      'distance': distance,
    };
  }).sort((a, b) => a.distance - b.distance);
  const closest = by_distance[0];

  return {'x': closest.x, 'y': closest.y};
}

function _SeedLocalMap(active_castle: LwgBuilding, width: number, height: number): boolean[][] {
  const output: boolean[][] = [];

  for (let dx=(1-width-BUILDING_SPACE_BUFFER); dx<=(CASTLE_WIDTH+1); dx++) {
    const x = active_castle.x + dx;

    if (output[x] === undefined) {
      output[x] = [];
    }

    for (let dy=(1-height-BUILDING_SPACE_BUFFER); dy<=(CASTLE_HEIGHT+1); dy++) {
      const y = active_castle.y + dy;

      output[x][y] = false;
    }
  }

  const upper_left: MapLocation = {
    'x': active_castle.x - width - BUILDING_SPACE_BUFFER,
    'y': active_castle.y - height - BUILDING_SPACE_BUFFER,
  };
  const z = scope.getHeightLevel(active_castle.x, active_castle.y);
  const perimeter: MapLocation[] = DrawRectangle({
    corner: upper_left,
    width: CASTLE_WIDTH + 2*BUILDING_SPACE_BUFFER + width + 1,
    height: CASTLE_WIDTH + 2*BUILDING_SPACE_BUFFER + height + 1,
  }).filter((ml: MapLocation) => {
    const new_z = scope.getHeightLevel(ml.x, ml.y);
    return new_z == z && scope.positionIsPathable(ml.x, ml.y);
  });

  for (let i=0; i<perimeter.length; i++) {
    const location = perimeter[i];

    if (output[location.x] === undefined) {
      output[location.x] = [];
    }

    output[location.x][location.y] = true;
  }

  return output;
}

export { FindSpaceForBuilding };
export const _private = { _SeedLocalMap };
