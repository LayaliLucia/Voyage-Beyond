/* Landing-site selection on Mars. The map is real NASA Mars Trek imagery (loaded live in an HTML overlay);
 * if it cannot load, a pixel-art Mars map is drawn instead. Coordinates and elevations are real. */
VB.MARS_SITES = [
    { id: 'jezero', name: 'Jezero Crater', lat: 18.4, lon: 77.5, elev: '-2.6 km', rate: { water: 4, safe: 3, shield: 3, sun: 3, sci: 5 },
      about: 'An ancient lake and river delta. Perseverance landed here in 2021 to hunt for signs of old life.',
      arrival: 'Clay-rich delta soil makes our garden grow better.', mods: { garden: 1.15 } },
    { id: 'gale', name: 'Gale Crater', lat: -5.4, lon: 137.8, elev: '-4.4 km', rate: { water: 3, safe: 4, shield: 4, sun: 4, sci: 5 },
      about: 'Home of Curiosity and 5-km-tall Mount Sharp. Curiosity measured Mars radiation here with its RAD instrument.',
      arrival: 'Deep in the crater, thicker air gives us extra radiation protection.', mods: { dose: 0.85 } },
    { id: 'hellas', name: 'Hellas Planitia', lat: -42.7, lon: 70.0, elev: '-7 km', rate: { water: 2, safe: 4, shield: 5, sun: 2, sci: 3 },
      about: 'A giant impact basin, one of the lowest places on Mars. The air is thicker, which blocks more radiation.',
      arrival: 'The deep basin cuts radiation a lot, but dust storms hurt our solar power.', mods: { dose: 0.75, energyUse: 1.25 } },
    { id: 'phoenix', name: 'Phoenix Plains', lat: 68.2, lon: -125.7, elev: '-4.1 km', rate: { water: 5, safe: 4, shield: 3, sun: 1, sci: 3 },
      about: 'Far north. NASA\'s Phoenix lander dug up shallow water ice here in 2008. Cold, with weak winter sunlight.',
      arrival: 'Plenty of water ice means more oxygen, but the weak sun drains our power.', mods: { o2: 1.3, energyUse: 1.3 } },
    { id: 'olympus', name: 'Olympus Mons Flank', lat: 18.65, lon: -133.8, elev: '+21.9 km (summit)', rate: { water: 1, safe: 1, shield: 1, sun: 5, sci: 4 },
      about: 'The tallest volcano in the solar system, about 22 km high. Steep slopes and very thin air up here.',
      arrival: 'Rough landing! The air is so thin that radiation is much stronger, but the sun is great.', mods: { dose: 1.35, energyUse: 0.8 }, crash: 10 }
];

VB.LandingScene = class extends Phaser.Scene {
    constructor() { super('Landing'); }
    create() {
        this.cameras.main.fadeIn(300, 0, 0, 0);
        VB.ui.space(this, true);
        VB.audio.setMood('mars'); this.sel = null; this.W = 560; this.H = 280;
        VB.ui.text(this, 450, 10, 'CHOOSE THE MARS LANDING SITE', 24, '#ffd23f', { ox: 0.5, stroke: '#000', st: 5 });
        VB.ui.text(this, 450, 40, 'Our outpost needs WATER ICE, a SAFE flat landing, and low ground for RADIATION shielding.', 13, '#dcdcff', { ox: 0.5 });
        this.buildMap();
        this.card = []; this.info = VB.ui.text(this, 600, 62, '', 13, '#fff', { w: 290, ls: 5 });
        this.cardG = this.add.graphics(); VB.ui.box(this.cardG, 596, 62, 294, 330, 0x0d0c22, 0x3a37a8);
        this.cardTxt = VB.ui.text(this, 608, 72, 'Tap a red marker on the map to learn about a landing site.', 14, '#a9a7d8', { w: 270, ls: 6 });
        this.bars = [];
        this.landBtn = VB.ui.button(this, 740, 424, 280, 44, 'LAND HERE', () => this.confirm(), { size: 18, fill: 0x1f8f3a, hi: 0x2fbf52, edge: 0x8fffa8 });
        this.landBtn.setEnabled(false);
        VB.ui.text(this, 20, 372, 'MARS ELEVATION (laser altimeter MOLA): from about -8 km (Hellas basin floor) to +21 km (Olympus Mons summit).', 11, '#a9a7d8', { w: 570 });
        const src = this.mapSrc;
        this.srcTxt = VB.ui.text(this, 20, 396, 'MAP: ' + 'pixel-art Mars (loading NASA Mars Trek imagery...)', 12, '#ff9a3c');
        VB.ui.text(this, 20, 430, 'Weigh the trade-offs: more shielding or more water or more sunlight? Every site has different strengths!', 14, '#ffffff', { w: 540, ls: 5 });
    }
    buildMap() {
        const key = 'marsmap', X = 24, Y = 66;
        if (this.textures.exists(key)) this.textures.remove(key);
        const tex = this.textures.createCanvas(key, this.W, this.H), ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        const small = document.createElement('canvas'); small.width = 280; small.height = 140; this.drawFallback(small.getContext('2d'));
        ctx.drawImage(small, 0, 0, this.W, this.H); tex.refresh();
        this.add.rectangle(X - 4 + (this.W + 8) / 2, Y - 4 + (this.H + 8) / 2, this.W + 8, this.H + 8, 0x9a97ff);
        this.add.image(X, Y, key).setOrigin(0);
        this.mapSrc = 'fallback';
        // Try the real NASA Mars Trek tiles (viking MDIM 2.1 colour mosaic, level 0 = two 256px tiles).
        const base = 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/0/0/';
        let ok = 0;
        [0, 1].forEach(i => {
            const im = new Image(); im.crossOrigin = 'anonymous';
            im.onload = () => {
                if (!this.scene.isActive('Landing')) return;
                ctx.drawImage(im, i * this.W / 2, 0, this.W / 2, this.H); tex.refresh();
                if (++ok === 2) { this.mapSrc = 'trek'; this.srcTxt && this.srcTxt.setText('MAP: NASA Mars Trek (live imagery)').setColor('#6fe06f'); }
            };
            im.src = base + i + '.jpg';
        });
        VB.ui.text(this, X + 6, Y + this.H - 16, 'NASA/Mars Trek | Viking MDIM 2.1', 10, '#ffffff', { stroke: '#000', st: 3 });
        this.markers = {};
        VB.MARS_SITES.forEach(site => {
            const mx = X + (site.lon + 180) / 360 * this.W, my = Y + (90 - site.lat) / 180 * this.H;
            const m = this.add.circle(mx, my, 9, 0xff5a5a).setStrokeStyle(3, 0xffffff).setDepth(5).setInteractive({ useHandCursor: true });
            this.tweens.add({ targets: m, scale: 1.25, yoyo: true, repeat: -1, duration: 700 });
            m.on('pointerdown', () => this.choose(site));
            const lbl = VB.ui.text(this, mx, my + 13, site.name.split(' ')[0].toUpperCase(), 9, '#ffffff', { ox: 0.5, stroke: '#000', st: 3, d: 5 });
            this.markers[site.id] = m;
        });
    }
    drawFallback(c) {
        const r = VB.gfx.rng(77), W = 280, H = 140;
        const v = (x, y) => Math.sin(x * 0.11 + 1) * Math.cos(y * 0.15) + Math.sin(x * 0.045 + y * 0.07) * 0.8 + (r() - 0.5) * 0.35;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            let e = v(x, y);
            const lon = x / W * 360 - 180, lat = 90 - y / H * 180;
            e += Math.exp(-(((lon + 120) / 30) ** 2 + ((lat - 10) / 22) ** 2)) * 1.4;       // Tharsis bulge
            e -= Math.exp(-(((lon - 70) / 14) ** 2 + ((lat + 42) / 11) ** 2)) * 2.2;        // Hellas basin
            e -= (lat < -2 && lat > -14 && lon > -85 && lon < -45) ? 0.9 : 0;                // Valles Marineris
            const t = VB.clamp((e + 1.6) / 3.6, 0, 1);
            let R = 90 + t * 130, G = 40 + t * 90, B = 28 + t * 60;
            if (lat > 80 || lat < -82) { R = 240; G = 240; B = 245; }
            c.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`; c.fillRect(x, y, 1, 1);
        }
    }
    choose(s) {
        VB.audio.click(); this.sel = s;
        Object.keys(this.markers).forEach(k => this.markers[k].setFillStyle(k === s.id ? 0xffd23f : 0xff5a5a));
        this.cardTxt.setText(s.name.toUpperCase() + '\n' + Math.abs(s.lat) + (s.lat >= 0 ? ' N' : ' S') + ', ' + Math.abs(s.lon > 180 ? s.lon - 360 : s.lon) + (s.lon >= 0 ? ' E' : ' W') + '   elev ' + s.elev + '\n\n' + s.about).setColor('#ffffff');
        this.bars.forEach(o => o.destroy()); this.bars = [];
        const labels = [['water', 'WATER ICE', 0x58c8ff], ['safe', 'SAFE LANDING', 0x6fe06f], ['shield', 'RADIATION SHIELD', 0xc58bff], ['sun', 'SUNLIGHT', 0xffd23f], ['sci', 'SCIENCE', 0xff9ad5]];
        labels.forEach((l, i) => {
            const y = 282 + i * 22;
            this.bars.push(VB.ui.text(this, 608, y - 2, l[1], 11, '#cfd4e4'));
            const b = VB.ui.bar(this, 740, y, 140, 12, l[2]); b.set(s.rate[l[0]] / 5); this.bars.push(b.g);
        });
        this.landBtn.setEnabled(true);
    }
    confirm() {
        const s = this.sel; if (!s) return;
        const R = s.rate, val = 2 * R.water + 2 * R.safe + 2 * R.shield + R.sun + R.sci;
        const score = VB.clamp(val / 31, 0, 1);
        const S = VB.S;
        S.site = s; S.siteScore = score;
        S.chapter = 'mars'; S.sol = 1; S.ap = 3; S.did = {};
        S.res = { o2: 70, energy: 70, food: 70, shield: Math.round(S.res.shield * 0.5 + 12 + score * 12) };
        S.health = Math.min(100, S.health + 20);
        if (s.crash) S.health = Math.max(20, S.health - s.crash);
        VB.rollAlert(); S.briefed = null; S.marsHello = false;
        VB.audio.win();
        const stars = score >= 0.85 ? 3 : score >= 0.6 ? 2 : 1;
        VB.ui.modal(this, { title: s.name.toUpperCase(), w: 680, h: 330, size: 16,
            body: 'Site score: ' + Math.round(score * 100) + '%  ' + '*'.repeat(stars) + '\n\n' + s.arrival + (s.crash ? '\n\nThe landing was rough: crew health -' + s.crash + '.' : '') + '\n\nThe crew rests on the trip (health +20), but their radiation dose still counts: the 100 mSv limit covers the whole mission!',
            buttons: [{ label: 'BEGIN MARS MISSION', cb: () => VB.go(this, 'Outpost') }] });
    }
};
