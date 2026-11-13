/* Offline reference snapshot used when the live NASA APIs cannot be reached.
 *
 * source: "reference"  -> hand-compiled well-known events (values are approximate).
 * source: "nasa-api"   -> written by `node scripts/fetch-nasa-data.mjs` from the real APIs.
 *
 * Run the script once before deploying to replace this with fresh, real NASA data.
 */
window.VB = window.VB || {};
VB.snapshot = {
    source: 'reference',
    generated: '2026-11-13',
    cmes: [
        { id: 'REF-2003-10-28', time: '2003-10-28T11:10Z', src: 'S16E08', speed: 2100, type: 'R', half: 90, approx: true,
          note: 'Halloween storms of 2003. A huge X-class flare launched a very fast CME.' },
        { id: 'REF-2012-07-23', time: '2012-07-23T02:30Z', src: 'far side', speed: 2500, type: 'R', half: 60, approx: true,
          note: 'Missed Earth by about nine days! Seen by STEREO-A. It could have been a Carrington-class storm.' },
        { id: 'REF-2024-05-08', time: '2024-05-08T05:36Z', src: 'S17W17', speed: 1000, type: 'O', half: 90, approx: true,
          note: 'Part of the May 2024 storm sequence that caused auroras far from the poles.' },
        { id: 'REF-EXAMPLE-SLOW', time: 'typical example', src: 'N10E20', speed: 450, type: 'S', half: 35, approx: true,
          note: 'A typical slow CME. Slow ones take 3 to 4 days to cross the Sun-Earth gap.' },
        { id: 'REF-EXAMPLE-COMMON', time: 'typical example', src: 'S05W30', speed: 750, type: 'C', half: 50, approx: true,
          note: 'A common-speed CME, the kind forecasters see every week or so.' }
    ],
    flares: [
        { id: 'REF-2024-05-14', time: '2024-05-14', cls: 'X8.7', src: 'S18E12', approx: true },
        { id: 'REF-2024-05-11', time: '2024-05-11', cls: 'X5.8', src: 'S09E08', approx: true }
    ],
    osdr: [
        { title: 'Veggie plant growth on the ISS (red romaine lettuce, zinnias)', id: null,
          note: 'Astronauts grew and ate lettuce in 2015 and bloomed zinnias in 2016 using red + blue LED light.' },
        { title: 'Plant Habitat-04: chile peppers grown on the ISS', id: null,
          note: 'Hatch chile peppers were grown and harvested on the ISS in 2021.' },
        { title: 'Space radiation and living cells (ground experiments)', id: null,
          note: 'Scientists fire iron and other heavy ions at cells and plants to see how cosmic rays cause damage.' }
    ],
    /* Real measured radiation levels (dose equivalent, millisieverts per day). */
    radiation: [
        { label: 'Earth (average, ground level)', msvDay: 0.0066, src: 'about 2.4 mSv per year' },
        { label: 'International Space Station', msvDay: 0.5, src: 'typical, ISS crew dosimetry' },
        { label: 'Mars surface (Gale Crater)', msvDay: 0.67, src: 'Curiosity RAD, Hassler et al. 2014' },
        { label: 'Moon surface (far side)', msvDay: 1.37, src: "Chang'e-4 LND, Zhang et al. 2020" }
    ]
};
