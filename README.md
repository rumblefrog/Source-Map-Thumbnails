Source-Map-Thumbnails
===

[![Dependency Status][david-image]][david-url]

[david-image]: http://img.shields.io/david/RumbleFrog/Source-Map-Thumbnails.svg?style=flat-square
[david-url]: https://david-dm.org/RumbleFrog/Source-Map-Thumbnails


Automate the creation of thumbnail within source games

Installation
---

```sh
git clone git@github.com:RumbleFrog/Source-Map-Thumbnails.git
```

- Tested so far in TF2 only!

Quickstart
---

1. Disable Multi-Core In-Game
2. Run `yarn` to fetch dependencies
3. Change `config.json.example` to `config.json` and update the config, as well as adding any launch options you want
4. Change `list.json.example` to `list.json` and update it with the maps you wish to render
5. Drop the maps you wish to create thumbnails for in the maps folder of the game directory
6. Launch via `yarn start`, it will launch your game and start the process, all the screenshots will be in the game&#39;s `screenshots` folder
7. You may optionally do `yarn run organize` with `remove_dupe` option in config to migrate &amp; remove duplicates from the screenshots folder

Disclaimers
---

- Rendering of maps is way more efficient if the game window is focused at all time to allow Windows to devote more resources to it
- The loading of maps are much faster on SSD compared to mechanical drives
- Although it&#39;s a functional code, it&#39;s a proof of concept, and the RCON dependency is highly unstable
- You can tune the quality by appending `-w`, `-h` to the desired values (TF2 will most likely crash with anything beyond 1080p)
- You will most likely get tons of duplicate images, due to RCON dependency keep losing packets
  - You may resolve this by enabling `remove_dupe` in config and running `yarn run organize`

Special Thanks
---

- Nephyrin - Brought up the idea of listen server
- KliPPy - Help point me in the right direction of listen server RCON
- Makamoto - Corrected me on `cl_drawhud` and therefore removing platform specific code
- Pelipoika - Answering my screenshot scaling question
- Ron - Emotion support and suggestions

License
---

[![License][license-image]][license-url]

[license-image]: https://img.shields.io/github/license/RumbleFrog/Source-Map-Thumbnails.svg
[license-url]: LICENSE
