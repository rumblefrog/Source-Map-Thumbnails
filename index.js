const spawn = require('child_process').spawn
    , config = require('./config.json')
    , ip = require('ip')
    , rcon = require('srcds-rcon')
    , log = require('winston')
    , glob = require('glob')
    , path = require('path')
    , fs = require('fs')

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
log.info('Allowing up to 80 seconds before connection attempt');

const conn = rcon({
  address: ip.address(),
  password: RP
});

setTimeout(attemptRconConnect, 80000);

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

function prepGame() {
  return new Promise((resolve, reject) => {
    log.debug('Sent status command');

    conn.command('status')
      .then((status) => {
        const m = status.match(/map\s+:\s([A-z0-9]+)/i)[1];
        const cstate = status.match(/#.* +([0-9]+) +"(.+)" +(STEAM_[0-9]:[0-9]:[0-9]+|\[U:[0-9]:[0-9]+\]) +([0-9:]+) +([0-9]+) +([0-9]+) +([a-zA-Z]+).* +([A-z0-9.:]+)/i)[7];

        if (m == getMapName(index) && cstate == 'active')
          setTimeout(resolve, 1000);
        else
          reject();
      })

  }).catch(err => reject(err));
}

function attemptScreenshot() {
  log.debug('Attempting to screenshot');
  Promise.race([
    new Promise((madeit, tooslow) => {
      prepGame()
        .then(() => conn.command('sv_cheats 1'))
        .then(() => conn.command('cl_drawhud 0'))
        .then(() => conn.command('spec_mode'))
        .then(() => getNodes())
        .then(count => screenshot(count))
        .then((times) => {
          madeit();
          log.info(`Screenshotted ${getMapName(index)} with ${times} spectator nodes`);
          if (index + 1 <= maps.length - 1)
            switchMap(++index);
          else {
            log.info(`Processed ${maps.length} maps. Exiting.`);
            process.exit(0);
          }
        })
        .catch(() => {})
    }),
    new Promise((resolve, reject) => {
      setTimeout(reject, 5000);
    })
  ]).then(() => {}).catch(() => {
    log.debug('Retrying screenshot');
    setTimeout(attemptScreenshot, 5000)
  });
}

async function screenshot(times) {
  for (var i = 1; i <= times; i++) {
    await conn.command('jpeg;spec_next');
    await timeout(200);
  }
  return times;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getNodes() {
  let going = true;
  const pos = [];
  while (going) {
    let p = await conn.command('spec_pos;spec_next');
    if (pos.includes(p)) {
      going = false;
      return pos.length;
    } else
      pos.push(p);
    await timeout(200);
  }
}

function switchMap(n) {
  log.debug('switchMap');
  Promise.race([
    new Promise((resolve, reject) => {
      checkFileExists(maps[n])
        .then((exist) => {
          resolve();
          if (!exist) {
            copyToMaps(n)
              .then(() => conn.command(`changelevel ${getMapName(n)}`, 1000))
              .then(() => {
                log.info(`Switching to ${getMapName(n)}`);
                setTimeout(attemptScreenshot, 10000);
              })
              .catch((err) => {
                log.warn(`Failed to switch map. Retrying.`);
                setTimeout(() => {
                  switchMap(n);
                }, 3000)
            })
          } else {
            conn.command(`changelevel ${getMapName(n)}`, 1000)
             .then(() => {
               log.info(`Switching to ${getMapName(n)}`);
               setTimeout(attemptScreenshot, 10000);
             })
             .catch((err) => {
               log.warn(`Failed to switch map. Retrying.`);
               setTimeout(() => {
                 switchMap(n);
               }, 3000)
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

process.on('unhandledRejection', r => {});
