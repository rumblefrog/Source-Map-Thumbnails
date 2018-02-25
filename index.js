const spawn = require('child_process').spawn
    , config = require('config.json')
    , rcon = require('rcon')
    , log = require('winston')

log.addColors({ error: "red", warning: "yellow", info: "green", verbose: "white", debug: "blue" });

log.remove(log.transports.Console);

log.add(log.transports.Console, { level: config.settings.debug_level, prettyPrint: true, colorize: true, timestamp: true });

const game = spawn(config.game_binary_location, [[
  '-usercon',
  `+rcon_password ${Math.random().toString(36).substring(2)}`
], ... config.launch_options])
