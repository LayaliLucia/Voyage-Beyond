# Voyage Beyond

A 2D pixel-art, story-driven space survival game for ages 7-12, built with **Phaser 3 + JavaScript + HTML + CSS**.
You join a crew of astronauts, keep an outpost alive on **the Moon**, pick a landing site, then survive on **Mars**.
Every sol you balance **oxygen, power, food and radiation protection** using six mini-games built on real NASA data.

## Run it

It is a static site. No build step.

* **VS Code:** open this folder, install the *Live Server* extension, right-click `index.html` -> *Open with Live Server*.
* **Or:** `npm start` (runs `npx serve .`), or `python3 -m http.server` and open http://localhost:8000
* Opening `index.html` by double-click mostly works, but live NASA calls and fonts behave best over `http://`.

## Deploy to GitHub + Vercel

```bash
git init
git add .
git commit -m "Voyage Beyond"
git branch -M main
git remote add origin https://github.com/<you>/voyage-beyond.git
git push -u origin main
```

Then on https://vercel.com/new import the repo. Framework preset **Other**, no build command, output directory = root (`./`). Done.

## How to play

1. Pick a crew role (Commander / Engineer / Life Scientist); each has a small perk.
2. Each **sol** (about two weeks of mission time, game-scaled) you get **3 actions**, then press **END SOL**.
3. The crew uses oxygen, power and food every sol, and radiation dose builds up. Keep **health > 0** and **dose < 100 mSv** for **3 sols on the Moon and 3 on Mars** (about 10-15 minutes in total).

The Moon outpost and the Mars outpost use **different mini-games**:

| Job | Moon outpost | Mars outpost | NASA data behind it |
|---|---|---|---|
| Oxygen | **Regolith Refinery**: catch oxygen, dodge dust | **MOXIE Reactor**: hold/release to keep the reactor in a moving temperature band | LCROSS water ice; Perseverance MOXIE |
| Power | **Solar Array**: track the Sun, wipe off dust | **Rover Cleaner**: drive a rover over dusty panels, dodge dust devils | Spirit / Opportunity / InSight dust records |
| Food | **Tend Garden**: keep plants in the water/light green zone | **Water Loop**: rotate pipes so recycled water reaches the plants | **OSDR** space biology; ISS water recycling (ECLSS) |
| Shield | **Shield Lab**: design a layered shield, then test the beam | **Regolith Wall**: time the crane to stack soil bags over the habitat | **RadLab / NSRL** research; Curiosity RAD dose rates |
| Storm | **Storm Watch**: calculate CME arrival hours, shelter drill | **Siren Watch**: place the arrival on a timeline, repeat the airlock code | **DONKI** live CME + flare data |
| Landing (Moon to Mars) | Choose among 5 real Mars sites on a map | | **Mars Trek** imagery, real lat/lon/elevation |
| Crew Chat | Rest and learn facts (includes Canadian Space Agency facts) | same | |

## Music and sound

The soundtrack is an **original score written for this game in the style of cinematic space films**: big pipe-organ chords, a slow repeating organ arpeggio, string swells, a deep drone, a soft piano motif and, during solar-storm drills, a ticking clock. It is synthesised live with WebAudio (`src/audio.js`), so there are no audio files and no licences to worry about. It has four moods: **menu** (awe and hope), **Moon** (slow and lonely), **Mars** (vast and steady) and **storm** (tense, fast arpeggio).

It does **not** contain any music from *Interstellar*, *Project Hail Mary* or any other film. Those soundtracks are copyrighted, so they cannot legally be published on a public site such as Vercel without a licence. If you have rights to a track, see below.

Browsers only allow sound after a first click or tap, so music starts when the player presses PLAY. The **SOUND ON/OFF** button (bottom-right) or the **M** key mutes it, and the choice is remembered. Music pauses automatically when the tab is hidden.

### Using your own licensed music (optional)

1. Copy your files (mp3, ogg or wav) into `assets/music/`.
2. Open `data/music-config.js` and list them, for example:
   ```js
   VB.musicFiles = { menu: 'assets/music/menu.mp3', moon: 'assets/music/moon.mp3', mars: 'assets/music/mars.mp3', storm: 'assets/music/storm.mp3' };
   ```
3. The game loops each track and cross-fades between moods. Any mood you leave out keeps the built-in score. If a file cannot be loaded, the game logs a warning and falls back to the built-in score.

## About the NASA data (please read)

* **DONKI** (`api.nasa.gov/DONKI/CME` and `/FLR`) and **OSDR** (`osdr.nasa.gov/osdr/data/search`) are called live from the player's browser, cached for 6 hours in `localStorage`.
* The default key is `DEMO_KEY` (rate-limited per IP). Get a free key at https://api.nasa.gov and either append `?nasa_key=YOURKEY` to the URL or change the default in `src/nasa.js`.
* **Mars Trek**: the landing map tries to load the real Viking MDIM 2.1 tiles from `trek.nasa.gov`. If the browser cannot load them (offline, or the server does not allow cross-origin canvas use), a pixel-art Mars map is used and labelled as such. The site coordinates/elevations are real either way.
* **Offline fallback:** if a live call fails, the game uses `data/snapshot.js` and labels it **OFFLINE REFERENCE DATA**. The snapshot that ships in this zip is *hand-compiled from well-known events with approximate values* (marked `approx`). **Run `node scripts/fetch-nasa-data.mjs` once before deploying** (needs internet, Node 18+) to replace it with genuine API data (`NASA_API_KEY=... npm run fetch-data`).
* Dose rates used (real measurements): Moon surface about 1.37 mSv/day (Chang'e-4 LND), Mars surface about 0.67 mSv/day (Curiosity RAD), ISS about 0.5, Earth about 0.0066. Game numbers are scaled (1 sol = about 2 weeks) and simplified for learning; they are not mission-planning figures.
* **Honest note:** the environment that built this project could not reach NASA's servers, so the live API calls (DONKI, OSDR, Mars Trek) were written from NASA's public API docs but **not tested against the live servers**. The game is fully playable on fallback data. OSDR's response format is parsed defensively; if it ever differs, the game falls back to the reference studies. After deploying, open the title screen: it shows `LIVE NASA DONKI DATA` in green when DONKI works.

## Project layout

```
index.html  style.css  vercel.json
assets/        spacebg.png, fonts/BlockBlueprint.ttf, portraits/ (Warped Portraits)
vendor/        phaser.min.js (local copy, so the game works offline)
data/          snapshot.js (offline NASA reference data), music-config.js (optional own music)
scripts/       fetch-nasa-data.mjs  (refresh the snapshot from NASA)
src/
  core.js      rules: resources, chapters, dose, storms, scoring
  nasa.js      live DONKI / OSDR loading with fallback
  sprites.js   all pixel art generated in code
  ui.js        buttons, bars, dialogue box, mini-game intro/result cards
  audio.js     original generated score + sound effects (M = mute), optional licensed-track override
  scenes/      boot, title, intro, outpost, landing, ending
               Moon games: garden, solar, oxygen, shield, storm
               Mars games: marsgames.js (MOXIE reactor, rover cleaner, water loop, regolith wall, siren watch)
```

## Tweaking the game

* Difficulty: `VB.CHAPTERS` in `src/core.js` (sols per chapter, consumption per sol, alert sols) and the `0.7 / 0.8 / 0.85` shield factors in `VB.endSol`.
* Mini-game lengths: the `this.dur` values at the top of each scene (`src/scenes/marsgames.js` holds the five Mars games).
* Add characters: drop portraits in `assets/portraits/` and add an entry to `VB.CREW`.

See `CREDITS.md` for art/font/library licences. Check the BlockBlueprint font licence before publishing.
