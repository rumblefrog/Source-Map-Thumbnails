const spawn = require('child_process').spawn
    , config = require('./config.json')
    , rcon = require('rcon')
    , log = require('winston')

log.addColors({ error: "red", warning: "yellow", info: "green", verbose: "white", debug: "blue" });

log.remove(log.transports.Console);

log.add(log.transports.Console, { level: config.debug_level, prettyPrint: true, colorize: true, timestamp: true });

const RP = Math.random().toString(36).substring(2);

const game = spawn(config.game_binary_location, [
  `-game ${config.game}`,
  '-novid',
  '-usercon',
  `+map ${config.starting_map}`,
  `+rcon_password ${RP}`,
  ... config.launch_options
]);

game.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

game.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
