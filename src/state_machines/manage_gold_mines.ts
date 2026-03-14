
interface ManageGoldMinesKwargs {
  gold_mines: CachedGoldMine[];
}

function ManageGoldMines({ gold_mines }: ManageGoldMinesKwargs): void {
  for (let i=0; i<gold_mines.length; i++) {
    const gold_mine = gold_mines[i];

    if (gold_mine.tower && !gold_mine.tower.isAlive && gold_mine.tower.hp <= 0) {
      delete gold_mine['tower'];
    }

    if (gold_mine.castle && !gold_mine.castle.isAlive && gold_mine.castle.hp <= 0) {
      delete gold_mine['castle'];
    }
  }
}

export { ManageGoldMines };
