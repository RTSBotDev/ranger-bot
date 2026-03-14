
interface ManageMinersKwargs {
  miners: LwgUnit[];
}

function ManageMiners({ miners }: ManageMinersKwargs): void {
  for (let i=0; i<miners.length; i++) {
    const miner: LwgUnit = miners[i];
    const castle = miner.ranger_bot.castle as LwgBuilding;

    if (!castle.isAlive && castle.hp <= 0) {
      miner.ranger_bot = {};
    }
  }
}

export { ManageMiners };
