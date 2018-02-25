const spawn = require('child_process').spawn
    , config = require('./config.json')
    , ip = require('ip')
    , rcon = require('srcds-rcon')
    , log = require('winston')
    , glob = require('glob')
    , path = require('path')
    , fs = require('fs')
    , processWindows = require('node-process-windows')
    , robotjs = require('robotjs')

log.addColors({ error: "red", warning: "yellow", info: "green", verbose: "white", debug: "blue" });

log.remove(log.transports.Console);

log.add(log.transports.Console, { level: config.debug_level, prettyPrint: true, colorize: true, timestamp: true });

let game_dir = config.game_directory.endsWith("/") ? "" : "/"

let maps = [];

let index = 0;

glob('maps/*.bsp', (err, files) => {
  if (err) {
    log.error('Failed to load maps directory, terminating')
    process.exit(1);
  }

  maps = files;

  if (maps.length <= 0) {
    log.error('Maps directory empty, load some maps first!');
    process.exit(0);
  }

  log.info(`Queued ${maps.length} maps`);
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

const conn = rcon({
  address: ip.address(),
  password: RP
});

setTimeout(attemptRconConnect, 60000); //Switch back to 120

game.on('close', (code) => {
  log.info('Game has exited, terminating script');
  process.exit(0);
});

function attemptRconConnect() {
  conn.connect()
    .then(() => {
      log.info('Successfully connected to game, switching to first map ...');

      switchMap(index);
    })
    .catch((err) => {
      log.debug(err);
      log.warn('Failed to connect, retrying in 30 seconds')

      setTimeout(attemptRconConnect, 30000);
    });
}

function attemptScreenshot() {
  log.debug('Attempting to screenshot');
  Promise.race([
    new Promise((madeit, tooslow) => {
      conn.command('status')
        .then((status) => {
          const m = status.match(/map\s+:\s([A-z0-9]+)/)[1];
          log.debug(m, getMapName(index));
          if (m == getMapName(index)) {
            return new Promise((resolve, reject) => {
              processWindows.focusWindow(game.pid);
              setTimeout(() => {
                robotjs.keyTap('enter');
                setTimeout(() => {
                  robotjs.keyTap('enter');
                  setTimeout(() => {
                    robotjs.keyTap('2');
                    resolve();
                  }, 500)
                }, 500)
              });
            })
          } else
            tooslow();
        })
        .then(() => conn.command('sv_cheats 1'))
        .then(() => conn.command('cl_drawhud 0'))
        .then(() => getNodes())
        .then((count) => {
          madeit();
          return repeat(screenshot, count);
        })
        .then((count) => {
          log.info(`Screenshotted ${getMapName(index)} with ${count} spectator nodes`);
          if (index + 1 <= maps.length - 1)
            switchMap(++index);
        })
        .catch((err) => {})
    }),
    new Promise((resolve, reject) => {
      setTimeout(reject, 5000);
    })
  ]).then(() => {}).catch(() => setTimeout(attemptScreenshot, 5000));
}

function repeat(func, times) {
  var promise = Promise.resolve(times);
  while (times-- > 0) promise = promise.then(func);
  return promise;
}

function screenshot() {
    return conn.command('jpeg;spec_next');
}

function getNodes() {
  return new Promise((resolve, reject) => {
    const pos = [];
    const iter = setInterval(() => {
      conn.command('spec_pos;spec_next').then((p) => {
        if (pos.includes(p)) {
          clearInterval(iter);
          resolve(pos.length);
        } else {
          pos.push(p);
        }
      }).catch((err) => {});
    }, 50);
  });
}

function switchMap(n) {
  Promise.race([
    new Promise((resolve, reject) => {
      checkFileExists(maps[n])
        .then((exist) => {
          resolve();
          if (!exist) {
            copyToMaps(n)
              .then(() => conn.command(`map ${getMapName(n)}`))
              .then(() => {
                log.info(`Switching to ${getMapName(n)}`);
                setTimeout(attemptScreenshot, 5000);
              })
              .catch((err) => {
                log.error(`Failed to switch map. Exiting.`);
                process.exit(1);
            })
          } else {
            conn.command(`map ${getMapName(n)}`)
              .then(() => {
                log.info(`Switching to ${getMapName(n)}`);
                setTimeout(attemptScreenshot, 5000);
              })
             .catch((err) => {
               log.error('Failed to switch map. Exiting.');
               process.exit(1);
             });
          }
        })
    }),
    new Promise((resolve, reject) => {
      setTimeout(reject, 5000);
    })
  ]).then(() => {}).catch(() => switchMap(n));
}

function copyToMaps(n) {
  return new Promise((resolve, reject) => {
    fs.copyFile(map[n], `${game_dir}maps/${getMapName(n)}.bsp`, (err) => {
      if (err) return reject(err);
      else resolve();
    })
  });
}

function getMapName(n) {
  return path.basename(maps[n], '.bsp');
}

function checkFileExists(filepath){
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.F_OK, (error) => {
      resolve(!error);
    });
  });
}
