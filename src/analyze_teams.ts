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
    const my_start: MapLocation = ConfigureStartLocation(my_team_id);
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
      const start_location: MapLocation = ConfigureStartLocation(player_id);
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

function ConfigureStartLocation(player_id: number): MapLocation {
  const raw_start_location: MapLocation = scope.getStartLocationForPlayerNumber(player_id);
  if (raw_start_location) {
    return raw_start_location;
  }

  // TODO
  const map_name: string = '';

  throw new Error('Map "' + map_name + '"" not supported, no start location for player ' + player_id);
}

export { AnalyzeTeams, ConfigureStartLocation };
