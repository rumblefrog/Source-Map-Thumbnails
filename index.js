const spawn = require('child_process').spawn
    , config = require('./config.json')
    , ip = require('ip')
    , rcon = require('rcon')
    , log = require('winston')
    , chokidar = require('chokidar')
    , glob = require('glob')
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
  '-windowed',
  '-noborder',
  '-novid',
  '-usercon',
  `+map`, config.starting_map,
  `+rcon_password`, RP,
  ... [].concat(... config.launch_options.map(o => o.split(' ')))
]);

log.info(`Session RCON Password: ${RP}`)
log.info('Launching game ...');
log.info('Allowing up to 120 seconds before connection attempt');

const conn = new rcon(ip.address(), 27015, RP);

conn.on('auth', () => {
  log.info('Successfully connected to game, switching to first map ...');

  conn.send(`map ${maps[index]}`);
})

conn.on('error', (err) => {

  log.debug(err);
  log.warn('Failed to connect, retrying in 30 seconds')

  setTimeout(() => {
    conn.connect();
  }, 30000);

})

setInterval(() => {
  conn.connect();
}, 120000);

const watcher = chokidar.watch(config.screenshot_directory);

watcher.on('add', (path) => {
  log.info(`Screenshotted ${maps[index]}`)
})

game.on('close', (code) => {
  log.info('Game has exited, terminating script');
  process.exit(0);
});
