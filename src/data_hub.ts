import { AnalyzeTeams } from './analyze_teams';
import { LocationIsVisible } from './location_is_visible';
import { AnalyzeMap } from './analyze_map';
import { CalculateUpgradeLevel, CalculateUpgradeCost } from './state_machines/calculate_upgrades';
import { GetCachedGoldMines } from './neutral_objects/get_cached_gold_mines';
import { GetNeutralBuildings } from './neutral_objects/get_neutral_buildings';
import { UpdatePieceCaches } from './state_machines/update_piece_caches';
import { UpdateNeutralObjects } from './neutral_objects/update_neutral_objects';
import { GetNumberFieldValue } from './utils';

interface DataHubConstructor {
  team_cache_key: string;
  player_cache_key: string;
}

class DataHub {
  team_cache_key: string;
  player_cache_key: string;

  teams: RangerBotTeams;
  map: PlayerMapData;
  gold_mines: CachedGoldMine[];
  neutral_buildings: CachedNeutralBuilding[];
  threats: TeamThreatsCache;
  targets: RangerBotTarget[];
  busy_units: RangerBotBusyUnits;

  my_buildings: LwgBuilding[];
  my_units: LwgUnit[];
  my_castles: LwgBuilding[];
  my_castles_under_construction: LwgBuilding[];
  my_houses: LwgBuilding[];
  my_barracks: LwgBuilding[];
  my_wolf_dens: LwgBuilding[];
  my_watchtowers: LwgBuilding[];
  my_forges: LwgBuilding[];
  my_armories: LwgBuilding[];
  my_snake_charmers: LwgBuilding[];
  my_workers: LwgUnit[];
  my_wolves: LwgUnit[];
  my_snakes: LwgUnit[];
  my_archers: LwgUnit[];
  my_soldiers: LwgUnit[];
  my_fighting_units: LwgUnit[];
  friendly_buildings: LwgBuilding[];
  friendly_units: LwgUnit[];

  spendable_gold: number;
  units_supply_producing: number;
  supply_under_construction: number;
  workers_needed: number;
  worker_supply_reserved: number;
  active_mining_bases: number;
  gross_gold_per_min: number;
  gold_spend_per_min: number;
  net_gold_per_sec: number;
  available_supply: number;
  count_melee: number;
  count_ranged: number;
  
  miners?: LwgUnit[];
  repairers?: LwgUnit[];
  idle_workers?: LwgUnit[];
  builders?: LwgUnit[];
  house_builders?: LwgUnit[];
  wolf_den_builders?: LwgUnit[];
  castle_builders?: LwgUnit[];
  barracks_builders?: LwgUnit[];
  tower_builders?: LwgUnit[];
  armory_builders?: LwgUnit[];
  forge_builders?: LwgUnit[];
  snake_charmer_builders?: LwgUnit[];
  traveling_house_builders?: LwgUnit[];
  traveling_wolf_den_builders?: LwgUnit[];
  traveling_barracks_builders?: LwgUnit[];
  traveling_tower_builders?: LwgUnit[];
  traveling_armory_builders?: LwgUnit[];
  traveling_forge_builders?: LwgUnit[];
  traveling_snake_charmer_builders?: LwgUnit[];

  viable_gold_mines?: CachedGoldMine[];
  active_castles?: LwgBuilding[];
  active_mines?: ActiveMineData[];
  workable_mines?: ActiveMineData[];

  _attack_upgrade_level?: number;
  _armor_upgrade_level?: number;
  _attack_upgrade_cost?: number;
  _armor_upgrade_cost?: number;
  _tower_cost?: number;

  constructor({ team_cache_key, player_cache_key }: DataHubConstructor) {
    this.team_cache_key = team_cache_key;
    this.player_cache_key = player_cache_key;

    this.teams = AnalyzeTeams({ player_cache_key: player_cache_key });
    this.map = AnalyzeMap({ player_cache_key: this.player_cache_key, teams: this.teams });
    this.gold_mines = GetCachedGoldMines({ team_cache_key: this.team_cache_key });
    this.neutral_buildings = GetNeutralBuildings({
      team_cache_key: this.team_cache_key,
      teams: this.teams,
    });
    this.threats = {
      'buildings': [],
      'units': [],
    };
    this.targets = [];
    this.busy_units = {};

    this.my_buildings = scope.getBuildings({ player: this.teams.my.id }).map((v) => v.unit);
    this.my_units = scope.getUnits({ player: this.teams.my.id }).map((v) => v.unit);
    this.my_castles = scope.getBuildings({ player: this.teams.my.id, type: 'Castle' }).map((v) => v.unit);
    this.my_castles_under_construction = this.my_castles.filter((c) => c.isUnderConstruction);
    this.my_houses = scope.getBuildings({ player: this.teams.my.id, type: 'House' }).map((v) => v.unit)
    this.my_barracks = scope.getBuildings({ player: this.teams.my.id, type: 'Barracks' }).map((v) => v.unit);
    this.my_wolf_dens = scope.getBuildings({ player: this.teams.my.id, type: 'Wolves Den' }).map((v) => v.unit);
    this.my_watchtowers = scope.getBuildings({ player: this.teams.my.id, type: 'Watchtower' }).map((v) => v.unit);
    this.my_forges = scope.getBuildings({ player: this.teams.my.id, type: 'Forge' }).map((v) => v.unit);
    this.my_armories = scope.getBuildings({ player: this.teams.my.id, type: 'Armory' }).map((v) => v.unit);
    this.my_snake_charmers = scope.getBuildings({ player: this.teams.my.id, type: 'Snake Charmer' }).map((v) => v.unit);
    this.my_workers = scope.getUnits({ player: this.teams.my.id, type: 'Worker' }).map((v) => v.unit);
    this.my_wolves = scope.getUnits({ player: this.teams.my.id, type: 'Wolf' }).map((v) => v.unit);
    this.my_snakes = scope.getUnits({ player: this.teams.my.id, type: 'Snake' }).map((v) => v.unit);
    this.my_archers = scope.getUnits({ player: this.teams.my.id, type: 'Archer' }).map((v) => v.unit);
    this.my_soldiers = scope.getUnits({ player: this.teams.my.id, type: 'Soldier' }).map((v) => v.unit);
    this.my_fighting_units = this.my_wolves.concat(this.my_archers).concat(this.my_soldiers).concat(this.my_snakes);

    this.spendable_gold = scope.player.gold + 0; // not sure if + 0 is necessary but I don't want to mutate scope.player.gold
    this.units_supply_producing = 0;
    this.supply_under_construction = 0;
    this.workers_needed = 0;
    this.worker_supply_reserved = 0;
    this.active_mining_bases = 0;
    this.gross_gold_per_min = 0;
    this.gold_spend_per_min = 0;
    this.net_gold_per_sec = 0;
    this.available_supply = scope.getMaxSupply() - scope.getCurrentSupply();
    this.count_melee = this.my_wolves.length + this.my_soldiers.length;
    this.count_ranged = this.my_archers.length + this.my_snakes.length;

    this.friendly_buildings = this.my_buildings.map((b) => b);
    for (let i:number=0; i<this.teams.allies.length; i++) {
      const ally_id: number = this.teams.allies[i];

      const ally_buildings: LwgBuilding[] = scope.getBuildings({ player: ally_id }).map((v: LwgBuildingWrapper) => v.unit);
      this.friendly_buildings = this.friendly_buildings.concat(ally_buildings);
    }
    this.friendly_units = this.my_units.map((u) => u);
    for (let i:number=0; i<this.teams.allies.length; i++) {
      const ally_id: number = this.teams.allies[i];

      const ally_units: LwgUnit[] = scope.getUnits({ player: ally_id }).map((v: LwgUnitWrapper) => v.unit);
      this.friendly_units = this.friendly_units.concat(ally_units);
    }

    // UpdateNeutralBuildings uses LocationIsVisible which needs building.ranger_bot.center from UpdatePieceCaches
    UpdatePieceCaches({ data_hub: this });
    UpdateNeutralObjects({ data_hub: this });
  }

  Save(): void {
    if (scope.ranger_bot.team_caches === undefined || this.gold_mines === undefined || this.neutral_buildings === undefined) {
      throw new Error('DataHub#Save called out of order'); // hush TS
    } else {
      scope.ranger_bot.team_caches[this.team_cache_key].gold_mines = this.gold_mines;
      scope.ranger_bot.team_caches[this.team_cache_key].neutral_buildings = this.neutral_buildings;
    }
  }

  LocationIsVisible(map_location: MapLocation): boolean {
    if (this.friendly_buildings === undefined || this.friendly_units === undefined) {
      throw new Error('DataHub#_LocationIsVisible called out of order'); // hush TS
    }

    return LocationIsVisible({
      map_location: map_location,
      friendly_buildings: this.friendly_buildings,
      friendly_units: this.friendly_units,
    });
  }

  NeedReplacementExpansion(): boolean {
    if (!this.viable_gold_mines) {
      throw new Error('Missing viable_gold_mines for NeedReplacementExpansion');
    }
    const active_mining_bases = scope.ranger_bot.player_caches[this.player_cache_key].active_mining_bases;
    if (!active_mining_bases) {
      throw new Error('Missing active_mining_bases for NeedReplacementExpansion');
    }

    if (this.viable_gold_mines.length <= 0) {
      return false;
    }
    return (this.active_mining_bases < active_mining_bases);
  }

  AttackUpgradeLevel(): number {
    if (this._attack_upgrade_level === undefined) {
      this._attack_upgrade_level = CalculateUpgradeLevel({
        data_hub: this,
        upgrade_type: 'upgattack',
      });
    }
    return this._attack_upgrade_level;
  }

  ArmorUpgradeLevel(): number {
    if (this._armor_upgrade_level === undefined) {
      this._armor_upgrade_level = CalculateUpgradeLevel({
        data_hub: this,
        upgrade_type: 'upgarmor',
      });
    }
    return this._armor_upgrade_level;
  }

  AttackUpgradeCost(): number {
    if (!this._attack_upgrade_cost) {
      this._attack_upgrade_cost = CalculateUpgradeCost({
        upgrade_type: 'upgattack',
        upgrade_level: this.AttackUpgradeLevel(),
      });
    }
    return this._attack_upgrade_cost;
  }

  ArmorUpgradeCost(): number {
    if (!this._armor_upgrade_cost) {
      this._armor_upgrade_cost = CalculateUpgradeCost({
        upgrade_type: 'upgarmor',
        upgrade_level: this.ArmorUpgradeLevel(),
      });
    }
    return this._armor_upgrade_cost;
  }

  TowerCost(): number {
    if (!this._tower_cost) {
      // TODO: is there a way to get this from the API?
      const base_cost = GetNumberFieldValue({ piece_name: 'watchtower', field_name: 'cost' });
      const increment_cost = GetNumberFieldValue({ piece_name: 'watchtower', field_name: 'costIncrease' });
      this._tower_cost = base_cost + increment_cost*this.my_watchtowers.length;
    } 
    return this._tower_cost;
  }
}

export { DataHub };
