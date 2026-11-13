# Voyage Beyond

A 2D pixel-art, story-driven space survival game for ages 7-12, built with **Phaser 3 + JavaScript + HTML + CSS**.
You join a crew of astronauts, keep an outpost alive on **the Moon**, pick a landing site, then survive on **Mars**.
Every sol you balance **oxygen, power, food and radiation protection** using six mini-games built on real NASA data.

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

# Where to play 
You can play Voyage Beyond in either of the following ways: 
1) Vercel: https://voyage-beyond.vercel.app/
2) Github Pages: https://layalilucia.github.io/Voyage-Beyond/

## Music and sound

The soundtrack is an **original score written for this game in the style of cinematic space films**: big pipe-organ chords, a slow repeating organ arpeggio, string swells, a deep drone, a soft piano motif and, during solar-storm drills, a ticking clock. It is synthesised live with WebAudio (`src/audio.js`), so there are no audio files and no licences to worry about. It has four moods: **menu** (awe and hope), **Moon** (slow and lonely), **Mars** (vast and steady) and **storm** (tense, fast arpeggio).

Browsers only allow sound after a first click or tap, so music starts when the player presses PLAY. The **SOUND ON/OFF** button (bottom-right) or the **M** key mutes it, and the choice is remembered. Music pauses automatically when the tab is hidden.

## About the NASA data (please read)

* **DONKI** (`api.nasa.gov/DONKI/CME` and `/FLR`) and **OSDR** (`osdr.nasa.gov/osdr/data/search`) are called live from the player's browser, cached for 6 hours in `localStorage`.
* **Mars Trek**: the landing map tries to load the real Viking MDIM 2.1 tiles from `trek.nasa.gov`. If the browser cannot load them (offline, or the server does not allow cross-origin canvas use), a pixel-art Mars map is used and labelled as such. The site coordinates/elevations are real either way.
* **Offline fallback:** if a live call fails, the game uses `data/snapshot.js` and labels it **OFFLINE REFERENCE DATA**. The snapshot that ships in this zip is *hand-compiled from well-known events with approximate values* (marked `approx`). 
* Dose rates used (real measurements): Moon surface about 1.37 mSv/day (Chang'e-4 LND), Mars surface about 0.67 mSv/day (Curiosity RAD), ISS about 0.5, Earth about 0.0066. Game numbers are scaled (1 sol = about 2 weeks) and simplified for learning; they are not mission-planning figures.

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
