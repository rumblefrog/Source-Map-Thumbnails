const spawn = require('child_process').spawn
    , config = require('./config.json')
    , ip = require('ip')
    , rcon = require('srcds-rcon')
    , log = require('winston')
    , glob = require('glob-promise')
    , resemble = require('resemblejs')
    , path = require('path')
    , fs = require('fs')

log.addColors({ error: "red", warning: "yellow", info: "green", verbose: "white", debug: "blue" });

log.remove(log.transports.Console);

log.add(log.transports.Console, { level: config.debug_level, prettyPrint: true, colorize: true, timestamp: true });

let game_dir = config.game_directory.endsWith("/") ? config.game_directory : config.game_directory + "/"

let maps = [];

const list = {};

let index = 0;

let end = false;

glob('maps/*.bsp')
  .then((files) => {
    maps = files;

    if (maps.length <= 0) {
      log.error('Maps directory empty, load some maps first!');
      process.exit(0);
    }

    log.info(`Queued ${maps.length} maps`);
  })
  .catch((err) => {
    log.error('Failed to load maps directory, terminating')
    process.exit(1);
  })

const RP = Math.random().toString(36).substring(2);

const game = spawn(config.game_binary_location, [
  `-game`, config.game,
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
        else {
          log.debug('map/status failed');
          reject();
        }
      })

  }).catch(err => reject(err));
}

function attemptScreenshot() {
  if (end) return;
  log.debug('Attempting to screenshot');
  Promise.race([
    new Promise((madeit, tooslow) => {
      prepGame()
        .then(() => conn.command('sv_cheats 1'))
        .then(() => conn.command('cl_drawhud 0'))
        .then(() => conn.command('spec_mode'))
        .then(() => conn.command('jpeg_quality 100'))
        .then(() => getNodes())
        .then((count) => screenshot(count))
        .then((o) => {
          if (o && o.times && o.index == index) {
            madeit();
            log.info(`Screenshotted ${getMapName(index)} with ${o.times} spectator nodes`);
            if (index + 1 <= maps.length - 1)
              switchMap(++index);
            else {
              end = true;
              organize();
            }
          }
        })
        .catch((e) => {})
    }),
    new Promise((resolve, reject) => {
      setTimeout(reject, 5000);
    })
  ]).then(() => {}).catch(() => {
    if (!end) {
      log.debug('Retrying screenshot');
      setTimeout(attemptScreenshot, 10000)
    }
  });
}

function screenshot(times) {
  return new Promise((resolve, reject) => {
    let cm = index;
    let command = '';

    for (var i = 1; i <= times; i++)
      command += 'jpeg;wait 30;spec_next;';

    conn.command(command)
      .then(() => {
        setTimeout(() => {
          resolve({'times':times, 'index':cm});
        }, (times * 800))
      })
      .catch(() => {});
  })
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getNodes() {
  try {
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
  } catch(e) {
    log.debug('getNodes got lost');
    // Nothing, wait for main timeout
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
                setTimeout(attemptScreenshot, 20000);
              })
              .catch((err) => {
                log.warn(`Failed to switch map. Retrying.`);
                setTimeout(() => {
                  switchMap(n);
                }, 5000)
            })
          } else {
            conn.command(`changelevel ${getMapName(n)}`, 1000)
             .then(() => {
               log.info(`Switching to ${getMapName(n)}`);
               setTimeout(attemptScreenshot, 20000);
             })
             .catch((err) => {
               log.warn(`Failed to switch map. Retrying.`);
               setTimeout(() => {
                 switchMap(n);
               }, 7000)
             });
          }
        })
    }),
    new Promise((resolve, reject) => {
      setTimeout(reject, 5000);
    })
  ]).then(() => {}).catch(() => switchMap(n));
}

async function organize() {

  log.debug('organize');

  const ss = await glob(`${game_dir}screenshots/*.jpg`);

  ss.forEach((s) => {

      s = path.basename(s);

      let map = s.substring(0, s.length - 8);

      if (list.hasOwnProperty(map))
          list[map].push(s);
      else
          list[map] = [s];
  })

  if (config.remove_dupe)
    removeDupe();
  else
    migrate();
}

async function removeDupe() {
  log.debug('removeDupe');
  let f1, f2, c = 0, d = [];
  for (var key in list) {
    if (list[key].length < 2) continue;
    for (var i = 0; i < list[key].length; i++) {
      for (var j = i; j < list[key].length; j++) {
        if (i != j) {
          f1 = fs.readFileSync(`${game_dir}screenshots/${list[key][i]}`);
          f2 = fs.readFileSync(`${game_dir}screenshots/${list[key][j]}`);
          resemble(f1)
            .compareTo(f2)
            .onComplete((data) => {
              if (data.misMatchPercentage < 5) {
                c++;
                log.debug(`${list[key][i]} is duplicate`);
                list[key].splice(i, 1);
                d.push(`${game_dir}screenshots/${list[key][i]}`);
              }
            })
        }
      }
    }
  }
  d.forEach(dupe => fs.unlinkSync(dupe));
  migrate();
}

async function migrate() {
  log.debug('migrate');
  for (var key in list) {
    let c = 1;

    list[key].forEach(f => fs.renameSync(`${game_dir}screenshots/${f}`, `out/${key}-${c++}.jpg`))
  }

  fs.writeFileSync('out.json', JSON.stringify(list))

  log.info(`Processed ${maps.length} maps. Exiting.`);
  process.exit(0);
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

// process.on('unhandledRejection', r => {});
