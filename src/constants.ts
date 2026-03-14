import { GetNumberFieldValue } from './utils';

export const SPEED_FACTOR: number = 20;
export const WORKERS_PER_CASTLE: number = 12;
export const MAX_WORKERS: number = 50;
export const PRE_QUEUE_BUFFER: number = 7;
export const BUILDING_SPACE_BUFFER: number = 2;
export const NEAR_MAX_SUPPLY: number = 10;
export const MAX_MINING_DISTANCE: number = 6;

interface GoldPerMinConstant { // TODO: do I really need an interface for this?
  [num_workers: string]: number;
}

export const GOLD_PER_MIN: GoldPerMinConstant = {
  '0':  0,
  '1':  63,
  '2':  126,
  '3':  188,
  '4':  236,
  '5':  280,
  '6':  312,
  '7':  343,
  '8':  374,
  '9':  404,
  '10': 435,
  '11': 466,
  '12': 497,
  '13': 503,
};
export const REPLACEMENT_BASE_THRESHOLD: number = 1000;
export const MAX_FORGES: number = 3;
export const MAX_BARRACKS: number = 10;
export const BASE_TARGET_RADIUS: number = 3;
export const MIN_THREAT_RESPONSE: number = 0.2;
export const MAX_THREAT_RESPONSE: number = 5;
export const ATTACK_RADIUS: number = 19; // > 2 * RETREAT_RADIUS
export const RETREAT_RADIUS: number = 9; // most units have vision 8
export const ATTACK_THRESHOLD: number = 1.25;
export const RETREAT_THRESHOLD: number = 0.95;
export const AGGRO_ATTACK_THRESHOLD: number = 0.5; // attack when maxed out
export const AGGRO_RETREAT_THRESHOLD: number = 0.25;
export const LAZY_ORDER_DISTANCE: number = 2;
export const CONSCRIPTION_DISTANCE: number = 10;
export const CALM_DOWN_DISTANCE: number = 13;
export const THREAT_DECAY: number = 0.993;
export const MINE_SCOUT_INTERVAL: number = 180;
export const AGGRO_START_GAP: number = 2;
export const AGGRO_STOP_GAP: number = 20;
export const TARGET_RESET_THRESHOLD: number = 0.01;
export const PASSIVE_THREAT_FACTOR: number = 13;
export const SCOUT_RADIUS: number = 20;
export const SCOUTS: number = 4;
export const WORKER_DISRESPECT: number = 0.8;

export const CASTLE_WIDTH: number = GetNumberFieldValue({ piece_name: 'castle', field_name: 'sizeX' });
export const CASTLE_HEIGHT: number = GetNumberFieldValue({ piece_name: 'castle', field_name: 'sizeY' });
export const MINE_WIDTH: number = GetNumberFieldValue({ piece_name: 'goldmine', field_name: 'sizeX' });
export const MINE_HEIGHT: number = GetNumberFieldValue({ piece_name: 'goldmine', field_name: 'sizeY' });
export const TOWER_WIDTH: number = GetNumberFieldValue({ piece_name: 'watchtower', field_name: 'sizeX' });
export const TOWER_HEIGHT: number = GetNumberFieldValue({ piece_name: 'watchtower', field_name: 'sizeY' });
export const CASTLE_COST: number = GetNumberFieldValue({ piece_name: 'castle', field_name: 'cost' });
export const HOUSE_COST: number = GetNumberFieldValue({ piece_name: 'house', field_name: 'cost' });
export const WOLF_DEN_COST: number = GetNumberFieldValue({ piece_name: 'wolvesden', field_name: 'cost' });
export const SNAKE_CHARMER_COST: number = GetNumberFieldValue({ piece_name: 'snakecharmer', field_name: 'cost' });
export const BARRACKS_COST: number = GetNumberFieldValue({ piece_name: 'barracks', field_name: 'cost' });
export const ARMORY_COST: number = GetNumberFieldValue({ piece_name: 'armory', field_name: 'cost' });
export const FORGE_COST: number = GetNumberFieldValue({ piece_name: 'forge', field_name: 'cost' });
export const WORKER_COST: number = GetNumberFieldValue({ piece_name: 'worker', field_name: 'cost' });
export const WOLF_COST: number = GetNumberFieldValue({ piece_name: 'wolf', field_name: 'cost' });
export const SNAKE_COST: number = GetNumberFieldValue({ piece_name: 'snake', field_name: 'cost' });
export const ARCHER_COST: number = GetNumberFieldValue({ piece_name: 'archer', field_name: 'cost' });
export const SOLDIER_COST: number = GetNumberFieldValue({ piece_name: 'soldier', field_name: 'cost' });
export const ARCHER_RANGE_COST: number = GetNumberFieldValue({ piece_name: 'upgrange', field_name: 'cost' });
export const WORKER_SUPPLY: number = GetNumberFieldValue({ piece_name: 'worker', field_name: 'supply' });
export const WOLF_SUPPLY: number = GetNumberFieldValue({ piece_name: 'wolf', field_name: 'supply' });
export const SNAKE_SUPPLY: number = GetNumberFieldValue({ piece_name: 'snake', field_name: 'supply' });
export const ARCHER_SUPPLY: number = GetNumberFieldValue({ piece_name: 'archer', field_name: 'supply' });
export const SOLDIER_SUPPLY: number = GetNumberFieldValue({ piece_name: 'soldier', field_name: 'supply' });
export const HOUSE_BUILD_TIME: number = Math.floor(GetNumberFieldValue({ piece_name: 'house', field_name: 'buildTime' }) / SPEED_FACTOR);
export const WORKER_BUILD_TIME: number = Math.floor(GetNumberFieldValue({ piece_name: 'worker', field_name: 'buildTime' }) / SPEED_FACTOR);
export const WOLF_BUILD_TIME: number = Math.floor(GetNumberFieldValue({ piece_name: 'wolf', field_name: 'buildTime' }) / SPEED_FACTOR);
export const SNAKE_BUILD_TIME: number = Math.floor(GetNumberFieldValue({ piece_name: 'snake', field_name: 'buildTime' }) / SPEED_FACTOR);
export const ARCHER_BUILD_TIME: number = Math.floor(GetNumberFieldValue({ piece_name: 'archer', field_name: 'buildTime' }) / SPEED_FACTOR);
export const SOLDIER_BUILD_TIME: number = Math.floor(GetNumberFieldValue({ piece_name: 'soldier', field_name: 'buildTime' }) / SPEED_FACTOR);
export const WORKER_SPEED: number = GetNumberFieldValue({ piece_name: 'worker', field_name: 'movementSpeed' }) * SPEED_FACTOR;
export const MAX_ATTACK_UPGRADE_LEVEL: number = GetNumberFieldValue({ piece_name: 'upgattack', field_name: 'maxLevel' });
export const MAX_ARMOR_UPGRADE_LEVEL: number = GetNumberFieldValue({ piece_name: 'upgarmor', field_name: 'maxLevel' });
