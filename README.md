## RangerBot
Computer player for [LittleWarGame](https://www.littlewargame.com/)

#### Usage Guide

1. Download or copy the transpiled javascript file to your machine.

    It's the `dist/compiled.js` file from the repo. It's also attached to each release.
2. Upload the JS file to the website. (This step must be repeated if you refresh the page.)
    1. Click the "Options" button in the upper left hand corner.
    2. Select "Load custom AI".
    3. Select the JS file you downloaded.
3. Start a game vs the computer

    a) Spectate a game between RangerBot and other bots:
    1. Select a map.
    2. Drag yourself to the "Spectators" box.
    3. Make sure there's only 1 ranger bot in the lobby, and that it's on a team by itself. If the computer player has "Custom AI 1" selected from the drop down, it will be controlled by the RangerBot script. Other bots are named things like "Default", "Death AI", and "Hurricane AI".
    4. Select "Start".

    b) Play vs RangerBot:
    1. Select a 2 player map.
    2. Make sure "Custom AI 1" is selected from the drop down next to the computer player.
    3. Select "Start".

#### Supported vs Unsupported Use Cases
RangerBot is designed primarily for 1v1 games on standard maps. If you give it a team mate, it may bug out, even if that team mate is another RangerBot. However it can handle playing against multiple opponents, and may even win if its opponents aren't very strong. It also does not play very well on fast money maps, and sometimes even bugs out, depending on the specific map. It also doesn't do well vs cheeses like tower rushing and 1 base air. There are plans to support all of these features and use cases in the future. I do most of my testing on Chrome, so if you run into any unexpected issues, switching to that browser might help.
