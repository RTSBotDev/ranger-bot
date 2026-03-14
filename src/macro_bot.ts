import { DataHub } from './data_hub';
import { AssignRepairers } from './macro/assign_repairers';
import { AssignIdleWorkers } from './macro/assign_idle_workers';
import { CountWorkersNeeded } from './macro/count_workers_needed';
import { RedistributeMiners } from './macro/redistribute_miners';
import { SurveyProduction } from './macro/survey_production';
import { WORKER_SUPPLY } from './constants';
import { EstimateIncome } from './macro/estimate_income';
import { ReserveGoldForBuilders } from './macro/reserve_gold_for_builders';
import { BuildHouseIfNeeded } from './macro/build_house_if_needed';
import { TrainWorkersIfNeeded } from './macro/train_workers_if_needed';
import { UseBarracks } from './macro/use_barracks';
import { UseWolvesDen } from './macro/use_wolves_den';
import { ResearchUpgrades } from './macro/research_upgrades';
import { NextBuildOrderStep } from './macro/next_build_order_step';

interface MacroBotConstructor {
  data_hub: DataHub;
}

class MacroBot {
  data_hub: DataHub;

  constructor({ data_hub }: MacroBotConstructor) {
    this.data_hub = data_hub;
  }

  Step(): void {
    AssignRepairers({ data_hub: this.data_hub });
    AssignIdleWorkers({ data_hub: this.data_hub });
    this.data_hub.workers_needed = CountWorkersNeeded({ data_hub: this.data_hub });
    this.data_hub.worker_supply_reserved = this.data_hub.workers_needed * WORKER_SUPPLY;
    RedistributeMiners({ data_hub: this.data_hub }); // uses workers_needed
    SurveyProduction({ data_hub: this.data_hub });
    EstimateIncome({ data_hub: this.data_hub });
    ReserveGoldForBuilders({ data_hub: this.data_hub });
    BuildHouseIfNeeded({ data_hub: this.data_hub });
    TrainWorkersIfNeeded({ data_hub: this.data_hub });
    UseBarracks({ data_hub: this.data_hub });
    UseWolvesDen({ data_hub: this.data_hub });
    ResearchUpgrades({ data_hub: this.data_hub });
    NextBuildOrderStep({ data_hub: this.data_hub });
  }
}

export { MacroBot };
