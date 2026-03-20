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

### Main Features

###### Macro

RangerBot eventually expands to 5 active mining bases and maxes out at 150 supply. When an active mining base drops below 1000 gold, it attempts to establish a replacement. It transfers workers, researches upgrades, and rarely gets supply blocked. Except for the opening. It opens 2 den 2 house and deliberately stays blocked at 30 supply until it establishes its 2nd base.

###### Army Movement

RangerBot attacks when it's army is stronger, and retreats when its army is weaker. It actively defends its own workers, and attacks undefended enemy workers. When attacked in multiple locations, it splits its army proportionally in order to defend all threats.

###### Scouting

RangerBot periodically checks for enemy expansions. It remembers where enemy units were after it loses vision of them, and attempts to track their movements.

###### Recovery

RangerBot repairs buildings, resumes construction when the worker is killed, rebuilds lost workers, and replaces destroyed buildings.

### Known Issues

###### Teams

This release of RangerBot was designed primarily for 1v1 games on standard maps. If you give it a team mate, it may bug out, even if that team mate is another RangerBot. However it can handle playing against multiple opponents, and may even win.

###### Maps

RangerBot cannot handle island maps. It also doesn't do well on fast money maps. Some maps like RockyMountain and Village of Guards have specific features which cause the script to crash.

###### Strategies

In general, RangerBot is good at absorbing aggression and punishing greed, but it tends to fall behind against standard macro builds. It does not micro outside of attacking or moving towards a location, and can be abused by kiting or luring it into a choke. It is not aware of projectiles and struggles against catapults and units on higher ground that it has not seen. RangerBot often fails against unorthodox strategies like tower rushing and 1 base air.

###### Browsers

In theory, any browser that supports [LittleWarGame](https://www.littlewargame.com/) should also support RangerBot. However, I did most of my testing in Chrome. So if you run into any issues, switching to that browser may help.

### Future Plans

RangerBot currently doesn't use real ground distances. It uses air distance as a proxy. This can cause it to place castles incorrectly, expand to bases in the wrong order, and move it units erratically. So that will be the next major feature I work on, and release as version `0.2.0`. The primarily hurdle to implementing ground distances is performance. Calculating ground pathing takes a lot of CPU time, and calculating too many in the same game tick can cause lag. After that, I plan to go back and make it more resilient against early game cheeses.
