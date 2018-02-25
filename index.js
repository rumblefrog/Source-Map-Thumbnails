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

setTimeout(attemptRconConnect, 120000);

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
  conn.command('status')
    .then(() => {
      processWindows.focusWindow(game.pid);
      setTimeout(() => {
        robotjs.keyTap('enter');
        setTimeout(() => {
          robotjs.keyTap('enter');
          setTimeout(() => {
            robotjs.keyTap('2');
            return conn.command('cl_drawhud 0');
          }, 500)
        }, 500)
      }, 500)
    })
    .then(() => {
      return getNodes();
    })
    .then((count) => {
      return new Promise((resolve, reject) => {
        let i = 1;
        const iter = setInterval(() => {
          if (i >= count) {
            clearInterval(iter);
            resolve(count);
          } else {
            i++;
            conn.command('jpeg')
              .then(() => conn.command('spec_next'));
          }
        }, 100);
      });
    })
    .then((count) => {
      log.info(`Screenshotted ${getMapName(index)} in ${count} spectator nodes`);
    })
    .catch((err) => {
      log.debug(err);
      log.warn('Failed to take screenshot, retrying in 5 seconds');

      setTimeout(attemptScreenshot, 5000);
    })
}

function getNodes() {
  return new Promise((resolve, reject) => {
    const pos = [];
    const iter = setInterval(() => {
      conn.command('spec_pos').them((p) => {
        if (pos.includes(p)) {
          clearInterval(iter);
          resolve(pos.length);
        } else
          pos.push(p);
      })
    }, 100);
  });
}

function switchMap(n) {
  checkFileExists(maps[n])
    .then((exist) => {
      if (!exist) {
        copyToMaps(n)
         .then(() => {
           conn.command(`map ${getMapName(n)}`)
            .then(() => {
              log.info(`Switching to ${getMapName(n)}`);
              setTimeout(attemptScreenshot, 10000);
            })
            .catch((err) => {
              log.error('Failed to switch map. Exiting.');
              process.exit(1);
            });
         })
         .catch((err) => {
           log.error(`Failed to copy map: ${err}. Exiting.`);
           process.exit(1);
         })
      } else {
        conn.command(`map ${getMapName(n)}`)
          .then(() => {
            log.info(`Switching to ${getMapName(n)}`);
            setTimeout(attemptScreenshot, 10000);
          })
         .catch((err) => {
           log.error('Failed to switch map. Exiting.');
           process.exit(1);
         });
      }
    });
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
    fs.access(filepath, fs.F_OK, error => {
      resolve(!error);
    });
  });
}
