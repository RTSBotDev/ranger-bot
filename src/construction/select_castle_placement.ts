
import { AreBuildable } from '../map_analysis/buildable';
import { CASTLE_WIDTH, CASTLE_HEIGHT } from '../constants';

interface SelectCastlePlacementKwargs {
  player_expansion: PlayerExpansion;
}

function SelectCastlePlacement({ player_expansion }: SelectCastlePlacementKwargs): PlayerCastlePlacement | undefined {
  let prev_score: number = NaN; // TODO: remove (or sort player_expansion.castle_placements)

  for (let i=0; i<player_expansion.castle_placements.length; i++) {
    const placement: PlayerCastlePlacement = player_expansion.castle_placements[i];
    if (isNaN(prev_score)) {
      prev_score = placement.score;
    } else if (prev_score > placement.score) {
      console.log(player_expansion);
      throw new Error('Disordered castle_placements for SelectCastlePlacement');
    } else {
      prev_score = placement.score;
    }

    const are_builiable = AreBuildable({
      x_min: placement.castle_location.x,
      x_max: placement.castle_location.x + CASTLE_WIDTH - 1,
      y_min: placement.castle_location.y,
      y_max: placement.castle_location.y + CASTLE_HEIGHT - 1, 
      exclude_worker_paths: false,
    });
    if (are_builiable) {
      return placement;
    }
  }

  return undefined;
}

export { SelectCastlePlacement };
