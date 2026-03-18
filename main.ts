import { RangerBot } from './src/ranger_bot';

try {
  if (scope.ranger_bot === undefined) {
    scope['ranger_bot'] = {
      'team_caches': {},
      'player_caches': {},
      'map_printed': false,
    };
  }

  if (scope.ranger_bot.player_caches === undefined) {
    throw new Error('someone messed with scope.ranger_bot'); // hush TS
  }

  const player_number: number = scope.getMyPlayerNumber();
  const player_cache_key: string = 'player_' + player_number;
  if (scope.ranger_bot.player_caches[player_cache_key] === undefined) {
    scope.ranger_bot.player_caches[player_cache_key] = {};
  }

  const team_number: number = scope.getTeamNumber(player_number);
  const team_cache_key: string = 'team_' + team_number;
  if (scope.ranger_bot.team_caches[team_cache_key] === undefined) {
    scope.ranger_bot.team_caches[team_cache_key] = {};
  }

  const ranger_bot = new RangerBot({
    debug: true,
    player_cache_key: player_cache_key,
    team_cache_key: team_cache_key,
  });
  ranger_bot.Step();
} catch (err: unknown) {
  if (err instanceof Error) {
    console.log(err);
  }
}
