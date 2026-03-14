import { LAZY_ORDER_DISTANCE } from '../constants';

function MicroCombatUnit(unit: LwgUnit): void {
  if (unit.ranger_bot.command == 'fight') {
    _LazyCombatOrder(unit, 'AMove');
  } else if (unit.ranger_bot.command == 'retreat') {
    _LazyCombatOrder(unit, 'Move');
  } else if (unit.ranger_bot.command == 'defend') {
    _LazyCombatOrder(unit, 'AMove');
  } else if (!unit.ranger_bot.command) {
    return;
  } else {
    console.log('\nERROR: Unhandled unit command: ' + unit.ranger_bot.command);
  }
}

function _LazyCombatOrder(unit: LwgUnit, order: string): void {
  if (!unit.ranger_bot.command_at) {
    console.log(unit);
    console.log('\nERROR: command_at is missing');
    return;
  }

  if (unit.order.name != order) {
    scope.order(order, [{'unit': unit}], unit.ranger_bot.command_at);
    return;
  }

  if (!unit.target) {
    scope.order(order, [{'unit': unit}], unit.ranger_bot.command_at);
    return;
  }

  if (!unit.target.x || !unit.target.y) {
    console.log(unit);
    throw new Error('Unexpected value for target in _LazyCombatOrder');
  }

  const distance = Math.sqrt((unit.target.x - unit.ranger_bot.command_at.x)**2 + (unit.target.y - unit.ranger_bot.command_at.y)**2);
  if (distance <= LAZY_ORDER_DISTANCE) {
    return;
  }

  scope.order(order, [{'unit': unit}], unit.ranger_bot.command_at);
}

export { MicroCombatUnit };
