interface AnalyzeTeamsKwargs {
  player_cache_key: string;
}

function AnalyzeTeams({ player_cache_key }: AnalyzeTeamsKwargs): RangerBotTeams {
  if (scope.ranger_bot.player_caches === undefined) {
    throw new Error('AnalyzeTeams called out of order'); // hush TS
  }
    
  if (scope.ranger_bot.player_caches[player_cache_key].teams === undefined) {
    const my_id: number = scope.getMyPlayerNumber();
    const my_team_id: number = scope.getMyTeamNumber();
    const my_start = ConfigureStartLocation(my_id);
    const new_my: RangerBotTeamsMy = {
      'id': my_id,
      'team_id': my_team_id,
      'start': my_start,
    };

    let allies: number[] = [];
    let enemies: number[] = [];
    let new_players: PlayersLookup = {};
    const player_ids: number[] = scope.getArrayOfPlayerNumbers();
    for (let i=0; i<player_ids.length; i++) {
      const player_id: number = player_ids[i];

      if (player_id == my_id || player_id == 0) {
        continue;
      }
      const team_id: number = scope.getTeamNumber(player_id);
      const is_ally: boolean = (team_id == my_team_id);
      if (is_ally) {
        allies.push(player_id);
      } else {
        enemies.push(player_id);
      }
      const start_location = ConfigureStartLocation(player_id);
      const new_player: PlayerData = {
        'team_id': team_id,
        'is_ally': is_ally,
        'start_location': start_location,
      };
      new_players[player_id] = new_player;
    }

    const new_teams: RangerBotTeams = {
      'my': new_my,
      'players': new_players,
      'allies': allies,
      'enemies': enemies,
    };
    scope.ranger_bot.player_caches[player_cache_key].teams = new_teams;
  }

  return scope.ranger_bot.player_caches[player_cache_key].teams;
}

const CONFIGURED_START_LOCATIONS: ConfiguredStartLocationsConfig = {
  '2vs2 Cloud Kingdom': {
    1: { 'x': 103, 'y': 8 },
    2: { 'x': 115, 'y': 33 },
    3: { 'x': 19, 'y': 114 },
    4: { 'x': 7, 'y': 89 },
  },
};

function ConfigureStartLocation(player_id: number): MapLocation {
  const raw_start_location = scope.getStartLocationForPlayerNumber(player_id);
  if (raw_start_location) {
    return raw_start_location;
  }

  const map_name = game.data.name;
  if (!map_name) {
    console.log(game);
    throw new Error('Cannot find map name for ConfigureStartLocation');
  }

  // const my_id = scope.getMyPlayerNumber();
  // const my_castle = scope.getBuildings({ player: my_id })[0].unit;
  // console.log('player_id: ' + my_id + ', x: ' + my_castle.x + ', y: ' + my_castle.y);

  const start_locations_config = CONFIGURED_START_LOCATIONS[map_name];
  if (!start_locations_config) {
    console.log(game);
    console.log(game.start_locations); // TODO maybe this works sometimes?
    throw new Error('No start locations configured for "' + map_name + '"');
  }
  const configured_start_location = start_locations_config[player_id];
  if (!configured_start_location) {
    console.log(game);
    console.log('map_name: ' + map_name + ', player_id: ' + player_id);
    console.log(start_locations_config);
    throw new Error('No start location configured for player ' + player_id + ' on "' + map_name + '"');
  } else {
    return configured_start_location;
  }
}

export { AnalyzeTeams, ConfigureStartLocation };
