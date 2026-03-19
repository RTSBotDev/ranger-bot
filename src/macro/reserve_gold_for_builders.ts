import { DataHub } from '../data_hub';
import { CASTLE_COST, DEBUG } from '../constants';

interface ReserveGoldForBuildersKwargs {
  data_hub: DataHub;
}

function ReserveGoldForBuilders({ data_hub }: ReserveGoldForBuildersKwargs): void {
  const builders = data_hub.builders as LwgUnit[];

  for (let i=0; i<builders.length; i++) {
    const builder: LwgUnit = builders[i];

    if (!builder.ranger_bot.target_building && builder.ranger_bot.order != builder.order.name) {
      if (builder.ranger_bot.reserve === undefined) {
        if (DEBUG) {
          console.log(builder);
          console.log('Error: Missing reserve for ReserveGoldForBuilders');
        }
        continue;
      }
      data_hub.spendable_gold -= builder.ranger_bot.reserve;
    }
  }

  if (data_hub.NeedReplacementExpansion()) {
    data_hub.spendable_gold -= CASTLE_COST;
  }
}

export { ReserveGoldForBuilders };
