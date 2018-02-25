const spawn = require('child_process').spawn
    , config = require('./config.json')
    , rcon = require('rcon')
    , log = require('winston')
    , chokidar = require('chokidar')
    , path = require('path')

log.addColors({ error: "red", warning: "yellow", info: "green", verbose: "white", debug: "blue" });

log.remove(log.transports.Console);

log.add(log.transports.Console, { level: config.debug_level, prettyPrint: true, colorize: true, timestamp: true });

const maps = [];

let index = 0;

glob('maps/*.bsp', (err, files) => {
  if (err) {
    log.error('Failed to load maps directory, terminating')
    process.exit(1);
  }

  files.forEach(file => maps.push(path.basename(file, '.bsp')));
});

const RP = Math.random().toString(36).substring(2);

const game = spawn(config.game_binary_location, [
  `-game`, config.game,
  '-novid',
  '-usercon',
  `+map`, config.starting_map,
  `+rcon_password`, RP,
  ... [].concat(... config.launch_options.map(o => o.split(' ')))
]);

log.info('Launching game ...');

const conn = new rcon('127.0.0.1', 27015, RP);

conn.on('auth', () => {
  log.info('Successfully connected to game');
})

conn.on('error', (err) => {

  log.warn('Failed to connect, retrying in 30 seconds')

  setTimeout(() => {
    conn.connect();
  }, 30000);

})

conn.connect();

const watcher = chokidar.watch(config.screenshot_directory);

watcher.on('add', (path) => {
  log.info(`Screenshotted ${maps[index]}`)
})

game.on('close', (code) => {
  log.info('Game has exited, terminating script');
  process.exit(0);
});
