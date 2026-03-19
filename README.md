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
    3. Make sure each ranger bot is on its own team. If the computer player has "Custom AI 1" selected from the drop down, it will be controlled by the RangerBot script. Other bots are named things like "Default", "Death AI", and "Hurricane AI".
    4. Select "Start".

    b) Play vs RangerBot:
    1. Select a 2 player map.
    2. Make sure "Custom AI 1" is selected from the drop down next to the computer player.
    3. Select "Start".

#### Known Issues and Unsupported Use Cases

###### Teams

RangerBot is designed primarily for 1v1 games on standard maps. If you give it a team mate, it may bug out, even if that team mate is another RangerBot. However it can handle playing against multiple opponents, and may even win.

###### Maps

RangerBot cannot handle island maps, it will bug out. If there is an expansion that can only be accessed by destroying a neutral building, it will immediately crash when the game loads. It also doesn't handle fast money maps very well.

###### Strategies

RangerBot does pretty well against normal 1 base all ins like 2 rax and 2 den, but it fails against the really cheesy stuff like tower rushing and 1 base air.

###### Browsers

In theory, any browser that supports [LittleWarGame](https://www.littlewargame.com/) shoould also support RangerBot. However, I do most of my testing in Chrome. So if you run into any issues, switching to that browser may help.

#### Future Plans

RangerBot currently doesn't use real ground distances. It uses air distance as a proxy instead. This is primarily due to performance issues. That will be the next major feature I work on, and release as version `0.2.0`. After that, I intend to go back and make it more resilient against early game cheeses.
