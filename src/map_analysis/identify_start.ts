import { DEBUG } from '../constants';

interface IdentifyStartingCastleKwargs {
  teams: RangerBotTeams;
}

function IdentifyStartingCastle({ teams }: IdentifyStartingCastleKwargs): LwgBuilding {
  const my_castles: LwgBuilding[] = scope.getBuildings({ player: teams.my.id, type: 'Castle' })
    .map((c) => c.unit);
  if (my_castles.length != 1) {
    if (DEBUG) {
      console.log(my_castles);
    }
    throw new Error('wrong number of castles for IdentifyStartingExpansion');
  }
  const starting_castle: LwgBuilding = my_castles[0];
  if (starting_castle.x != teams.my.start.x || starting_castle.y != teams.my.start.y) {
    if (DEBUG) {
      console.log(teams);
      console.log(starting_castle);
    }
    throw new Error("dude where's my castle?");
  }
  return starting_castle;
}

interface IdentifyStartingExpansionKwargs {
  expansions: Expansion[];
  starting_castle: LwgBuilding;
}

function IdentifyStartingExpansion({ expansions, starting_castle }: IdentifyStartingExpansionKwargs): Expansion {
  const output: Expansion | undefined = expansions.find((expansion) => {
    return expansion.castle_placements.some((placement) => {
      return starting_castle.x == placement.castle_location.x && starting_castle.y == placement.castle_location.y;
    });
  });

  if (!output) {
    if (DEBUG) {
      console.log(expansions);
      console.log(starting_castle);
    }
    throw new Error('IdentifyStartingExpansion failed');
  }
  return output;
}

export { IdentifyStartingCastle, IdentifyStartingExpansion };
