import { GetNumberFieldValue } from './utils';
import { SPEED_FACTOR } from './constants';

function CalculateDps(piece: LwgPiece): number {
  // console.log(piece.owner);
  // TODO: account for upgrades
  const dmg = GetNumberFieldValue({ piece_name: piece.type.id_string, field_name: 'dmg' });
  const attack_cooldown = GetNumberFieldValue({ piece_name: piece.type.id_string, field_name: 'weaponCooldown' });
  const attack_speed = SPEED_FACTOR / attack_cooldown;
  return dmg * attack_speed;
}

function CalculateArmor(piece: LwgPiece): number {
  // console.log(piece.owner);
  // TODO: account for upgrades
  return piece.type.armor;
}

function CalculateRange(piece: LwgPiece): number {
  if ('archer' == piece.type.id_string && piece.owner.upgrades.upgrange && 1 >= piece.owner.upgrades.upgrange) {
    return piece.type.range + 1;
  } else {
    return piece.type.range;
  }
}

function ArmorFactor(armor: number): number {
  // Rough approximation assuming all attacks deal 13 damage.
  return 13 / (13 - armor);
}

export { CalculateDps, CalculateArmor, CalculateRange, ArmorFactor };
