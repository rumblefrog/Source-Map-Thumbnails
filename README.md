# Source Map Thumbnails

Automate the creation of thumbnail within source games

### Quickstart

1. Clone repository
2. Run `yarn` to fetch dependencies
3. Modify `config.json` and update the paths, as well as adding any launch options you want
4. Drop the maps you wish to create thumbnails for in the `maps/` folder of **this** directory
5. Start `index.js`, it will launch your game and start the process, all the screenshots will be in the game's `screenshots` folder

Note: It's recommended not to interact with the computer while this is running, as it relies on keypress & mouse click simulation
