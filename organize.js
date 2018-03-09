const config = require('./config.json')
    , log = require('winston')
    , glob = require('glob-promise')
    , resemble = require('resemblejs')
    , fs = require('fs')
    , path = require('path')

log.addColors({ error: "red", warning: "yellow", info: "green", verbose: "white", debug: "blue" });

log.remove(log.transports.Console);

log.add(log.transports.Console, { level: config.debug_level, prettyPrint: true, colorize: true, timestamp: true });

let game_dir = config.game_directory.endsWith("/") ? config.game_directory : config.game_directory + "/"

const list = {};

organize();

async function organize() {

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
  let f1, f2, d = [], promises = [], processed = 0;
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
                log.debug(`${list[key][i]} is duplicate`);
                d.push(`${game_dir}screenshots/${list[key][i]}`);
                list[key].splice(i, 1);
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

  let processed = 0;

  for (var key in list) {
    let c = 1;

    console.log(list[key]);

    list[key].forEach((f) => {
        fs.renameSync(`${game_dir}screenshots/${f}`, `out/${key}-${c++}.jpg`);
        processed++;
    })
  }

  fs.writeFileSync('out.json', JSON.stringify(list, null, 4))

  log.info(`Migrated ${processed} maps. Exiting.`);
  process.exit(0);
}

function checkFileExists(filepath){
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.F_OK, (error) => {
      resolve(!error);
    });
  });
}
