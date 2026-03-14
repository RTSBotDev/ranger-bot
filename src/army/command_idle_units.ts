
function CommandIdleUnits(my_fighting_units: LwgUnit[]): void {
  const mid_x = Math.floor(scope.getMapWidth() / 2);
  const mid_y = Math.floor(scope.getMapHeight() / 2);

  for (let i=0; i<my_fighting_units.length; i++) {
    const fighting_unit: LwgUnit = my_fighting_units[i];

    if (fighting_unit.ranger_bot.command && fighting_unit.ranger_bot.command_at) {
      continue;
    }
    if (fighting_unit.ranger_bot.command && !fighting_unit.ranger_bot.command_at) {
      console.log(fighting_unit);
      throw new Error('Missing command_at for CommandIdleUnits');
    }
    if (!fighting_unit.ranger_bot.command && fighting_unit.ranger_bot.command_at) {
      console.log(fighting_unit);
      throw new Error('Missing command for CommandIdleUnits');
    }

    const center_distance = Math.sqrt((fighting_unit.pos.x - mid_x)**2 + (fighting_unit.pos.y - mid_y)**2);
    if (center_distance < 6) {
      continue;
    }

    fighting_unit.ranger_bot.command = 'fight';
    fighting_unit.ranger_bot.command_at = {'x': mid_x, 'y': mid_y};
  }
}

export { CommandIdleUnits };
