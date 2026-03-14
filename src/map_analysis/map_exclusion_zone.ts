interface MapExclusionZoneKwargs {
  raw_mine: LwgGoldMine;
}

function MapExclusionZone({ raw_mine }: MapExclusionZoneKwargs): boolean[][] {
  /*
     XXXXXXX
    XXXXXXXXX
   XXXXXXXXXXX
  XXXXXXXXXXXXX
  XXXXXXXXXXXXX
  XXXXX+$$XXXXX
  XXXXX$$$XXXXX
  XXXXX$$$XXXXX
  XXXXXXXXXXXXX
  XXXXXXXXXXXXX
   XXXXXXXXXXX
    XXXXXXXXX
     XXXXXXX
  */
  const RELATIVE_MAP: { [x: string]: number[] } = {
    '-6': [-3, -2, -1, 0, 1, 2, 3],
    '-5': [-4, -3, -2, -1, 0, 1, 2, 3, 4],
    '-4': [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
    '-3': [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6],
    '-2': [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6],
    '-1': [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6],
    '0': [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6],
    '1': [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6],
    '2': [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6],
    '3': [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6],
    '4': [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5],
    '5': [-4, -3, -2, -1, 0, 1, 2, 3, 4],
    '6': [-3, -2, -1, 0, 1, 2, 3],
  };

  let output: boolean[][] = [];
  const mine_cache = raw_mine.ranger_bot as RangerBotGoldMine;

  for (const [raw_x, y_list] of Object.entries(RELATIVE_MAP)) {
    const dx: number = Number(raw_x);
    if (isNaN(dx)) {
      continue;
    }
    const x: number = mine_cache.center.x + Number(raw_x);

    output[x] = [];

    for (let i:number=0; i<y_list.length; i++) {
      const dy: number = Number(y_list[i]);
      if (isNaN(dy)) {
        continue;
      }
      const y: number = mine_cache.center.y + dy;

      output[x][y] = true;
    }
  }

  return output;
}

export { MapExclusionZone };
