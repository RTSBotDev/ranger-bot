interface GlhfKwargs {
  game_time: number;
}

function ChatGlhf({ game_time }: GlhfKwargs): void {
  if (5 < game_time && !scope.ranger_bot.glhf) {
    scope.chatMsg('Ranger Bot: Good Luck, Have Fun!');
    scope.ranger_bot.glhf = true;
  }
}

export { ChatGlhf };
