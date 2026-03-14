
interface GetFieldValueKwargs {
  piece_name: string;
  field_name: string;
}

function GetNumberFieldValue({ piece_name, field_name }: GetFieldValueKwargs): number {
  const raw: any = scope.getTypeFieldValue(piece_name, field_name);
  if (typeof(raw) == 'number') {
    return raw;
  } else {
    throw new Error('"' + field_name + '" of "' + piece_name + '" is not a number');
  }
}

function GetStringFieldValue({ piece_name, field_name }: GetFieldValueKwargs): string {
  const raw: any = scope.getTypeFieldValue(piece_name, field_name);
  if (typeof(raw) == 'string') {
    return raw;
  } else {
    throw new Error('"' + field_name + '" of "' + piece_name + '" is not a string');
  }
}

interface DrawRectangleKwargs {
  corner: MapLocation;
  width: number;
  height: number;
}

function DrawRectangle({ corner, width, height }: DrawRectangleKwargs): MapLocation[] {
  let output: MapLocation[] = [];

  for (let dx=0; dx<width; dx++) {
    const x = corner.x + dx;

    // y axis is inverted
    const ceiling: MapLocation = {'x': x, 'y': corner.y};
    output.push(ceiling);
    const floor: MapLocation = {'x': x, 'y': corner.y + height - 1}
    output.push(floor);
  }
  for (let dy=1; dy<(height-1); dy++) {
    const y = corner.y + dy;

    const left_wall: MapLocation = {'x': corner.x, 'y': y};
    output.push(left_wall);
    const right_wall: MapLocation = {'x': corner.x + width - 1, 'y': y};
    output.push(right_wall);
  }

  return output;
}

function GetGoldMines(): LwgGoldMine[] {
  return scope.getBuildings({type: 'Goldmine'})
    .map((g) => g.unit as unknown as LwgGoldMine);
}

function WolvesAreObsolete(): boolean {
  if (scope.player.upgrades.upgattack && scope.player.upgrades.upgattack > 0) {
    return true;
  }
  if (scope.player.upgrades.upgarmor && scope.player.upgrades.upgarmor > 0) {
    return true;
  }
  return false;
}

function AssignMiner(worker: LwgUnit, assigned_mine: ActiveMineData): void {
  if (!assigned_mine.gold_mine) {
    console.log(assigned_mine);
    throw new Error('Missing gold mine for assigned mine');
  }
  const gold_mine: CachedGoldMine = assigned_mine.gold_mine;
  if (!gold_mine.castle) {
    console.log(gold_mine);
    throw new Error('Missing castle for assigned gold mine');
  }
  const assigned_castle: LwgBuilding = gold_mine.castle;
  
  assigned_mine.workers.push(worker);
  worker.ranger_bot = {
    'job': 'mine',
    'mine': gold_mine,
    'castle': assigned_castle,
  };

  scope.order('Move', [{'unit': worker}], assigned_mine.midpoint);
}

export { GetNumberFieldValue, DrawRectangle, GetGoldMines, AssignMiner,
  WolvesAreObsolete, GetStringFieldValue};
