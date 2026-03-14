import { DataHub } from './data_hub';
import { ConstructBuilding } from './construction/construct_building';

interface BuildKwargs {
  data_hub: DataHub;
}

function BuildHouse({ data_hub }: BuildKwargs): void {
  const traveling_house_builders = data_hub.traveling_house_builders as LwgUnit[];
  if (traveling_house_builders.length > 0) {
    return undefined;
  }
  const new_house_builder: LwgUnit | undefined = ConstructBuilding({
    building_type: 'house',
    build_order: 'Build House',
    data_hub: data_hub,
  });
  if (new_house_builder) {
    traveling_house_builders.push(new_house_builder);
  }
}

function BuildWolfDen({ data_hub }: BuildKwargs): void {
  const traveling_wolf_den_builders = data_hub.traveling_wolf_den_builders as LwgUnit[];
  if (traveling_wolf_den_builders.length > 0) {
    return undefined;
  }
  const new_wolf_den_builder: LwgUnit | undefined = ConstructBuilding({
    building_type: 'wolvesden',
    build_order: 'Build Wolves Den',
    data_hub: data_hub,
  });
  if (new_wolf_den_builder) {
    traveling_wolf_den_builders.push(new_wolf_den_builder);
  }
}

function BuildBarracks({ data_hub }: BuildKwargs): void {
  const traveling_barracks_builders = data_hub.traveling_barracks_builders as LwgUnit[];
  if (traveling_barracks_builders.length > 0) {
    return undefined;
  }
  const new_barracks_builder: LwgUnit | undefined = ConstructBuilding({
    building_type: 'barracks',
    build_order: 'Build Barracks',
    data_hub: data_hub,
  });
  if (new_barracks_builder) {
    traveling_barracks_builders.push(new_barracks_builder);
  }
}

function BuildArmory({ data_hub }: BuildKwargs): void {
  const traveling_armory_builders = data_hub.traveling_armory_builders as LwgUnit[];
  if (traveling_armory_builders.length > 0) {
    return undefined;
  }
  const new_armory_builder: LwgUnit | undefined = ConstructBuilding({
    building_type: 'armory',
    build_order: 'Build Armory',
    data_hub: data_hub,
  });
  if (new_armory_builder) {
    traveling_armory_builders.push(new_armory_builder);
  }
}

function BuildForge({ data_hub }: BuildKwargs): void {
  const traveling_forge_builders = data_hub.traveling_forge_builders as LwgUnit[];
  if (traveling_forge_builders.length > 0) {
    return undefined;
  }
  const new_forge_builder: LwgUnit | undefined = ConstructBuilding({
    building_type: 'forge',
    build_order: 'Build Forge',
    data_hub: data_hub,
  });
  if (new_forge_builder) {
    traveling_forge_builders.push(new_forge_builder);
  }
}

export { BuildHouse, BuildWolfDen, BuildBarracks, BuildArmory, BuildForge };
